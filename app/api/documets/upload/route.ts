import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyFirebaseToken } from '@/lib/auth/auth-helper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Firebase Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    const firebaseUser = await verifyFirebaseToken(idToken);
    
    if (!firebaseUser.valid) {
      return NextResponse.json(
        { error: 'Invalid Firebase token' },
        { status: 401 }
      );
    }

    // 2. Parse form data
    const formData = await request.formData();
    const documentType = formData.get('documentType') as string;
    const documentNumber = formData.get('documentNumber') as string;
    const category = formData.get('category') as string;
    const file = formData.get('file') as File;

    if (!documentType || !documentNumber || !category || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 3. Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and PDF are allowed' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // 4. Create Supabase client WITH the Firebase token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // 5. Get or create patient profile
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('firebase_uid', firebaseUser.uid)
      .single();

    let patientId;
    
    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { data: newProfile, error: createError } = await supabase
        .from('patient_profiles')
        .insert({
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email || `${firebaseUser.uid}@temp.com`,
          first_name: 'New',
          last_name: 'User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Create profile error:', createError);
        return NextResponse.json(
          { error: `Failed to create patient profile: ${createError.message}` },
          { status: 500 }
        );
      }
      patientId = newProfile.id;
    } else if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json(
        { error: `Failed to get patient profile: ${profileError.message}` },
        { status: 500 }
      );
    } else {
      patientId = patientProfile.id;
    }

    // 6. Generate unique file name
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}_${documentNumber.replace(/\s+/g, '_')}.${fileExtension}`;
    const storagePath = `${firebaseUser.uid}/${category}/${fileName}`;

    // 7. Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('patient-documents')
      .upload(storagePath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
        duplex: 'half'
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 8. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('patient-documents')
      .getPublicUrl(storagePath);

    // 9. Save document metadata
    const { data: documentData, error: dbError } = await supabase
      .from('patient_documents')
      .insert({
        patient_id: patientId,
        firebase_uid: firebaseUser.uid,
        document_type: documentType,
        document_number: documentNumber,
        document_category: category,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        public_url: publicUrl,
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up storage if DB save fails
      await supabase.storage
        .from('patient-documents')
        .remove([storagePath]);
      
      return NextResponse.json(
        { error: `Database save failed: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: documentData,
      url: publicUrl,
      message: 'Document uploaded successfully'
    });

  } catch (error: any) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}