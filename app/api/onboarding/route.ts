import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyFirebaseToken } from "@/lib/auth/auth-helper"

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
    
    if (!firebaseUser.valid || !firebaseUser.uid) {
      return NextResponse.json(
        { error: 'Invalid Firebase token' },
        { status: 401 }
      );
    }

    const { data: formData } = await request.json();
    
    if (!formData) {
      return NextResponse.json(
        { error: 'Missing form data' },
        { status: 400 }
      );
    }

    // 2. Create Supabase client with Firebase token
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

    // 3. Prepare data for database
    const onboardingData = {
      firebase_uid: firebaseUser.uid,
      email: firebaseUser.email || formData.email || `${firebaseUser.uid}@temp.com`,
      
      // Personal Info
      first_name: formData.personalInfo?.firstName || '',
      last_name: formData.personalInfo?.lastName || '',
      date_of_birth: formData.personalInfo?.dateOfBirth || null,
      gender: formData.personalInfo?.gender || 'prefer-not-to-say',
      phone_number: formData.personalInfo?.phoneNumber || '',
      emergency_contact_name: formData.personalInfo?.emergencyContact?.name || '',
      emergency_contact_relationship: formData.personalInfo?.emergencyContact?.relationship || '',
      emergency_contact_phone: formData.personalInfo?.emergencyContact?.phoneNumber || '',
      
      // Insurance Info
      insurance_provider: formData.insuranceInfo?.providerName || '',
      insurance_policy_number: formData.insuranceInfo?.policyNumber || '',
      insurance_group_number: formData.insuranceInfo?.groupNumber || '',
      insurance_type: formData.insuranceInfo?.insuranceType || 'private',
      insurance_valid_until: formData.insuranceInfo?.validUntil || null,
      insurance_coverage_details: formData.insuranceInfo?.coverageDetails || '',
      
      // Identification
      identification_type: formData.identification?.type || 'national-id',
      identification_number: formData.identification?.number || '',
      identification_issue_date: formData.identification?.issueDate || null,
      identification_expiry_date: formData.identification?.expiryDate || null,
      
      // Medical Info (store as JSON)
      medical_info: {
        bloodType: formData.medicalInfo?.bloodType || 'unknown',
        height: formData.medicalInfo?.height || null,
        weight: formData.medicalInfo?.weight || null,
        allergies: formData.medicalInfo?.allergies || [],
        currentMedications: formData.medicalInfo?.currentMedications || [],
        chronicConditions: formData.medicalInfo?.chronicConditions || [],
        pastSurgeries: formData.medicalInfo?.pastSurgeries || []
      },
      
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 4. Save patient profile
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .upsert(onboardingData, {
        onConflict: 'firebase_uid',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile save error:', profileError);
      return NextResponse.json(
        { error: `Failed to save patient profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // 5. Save medical records if patient profile was created
    const { error: medicalError } = await supabase
      .from('medical_records')
      .upsert({
        patient_id: patientProfile.id,
        blood_type: formData.medicalInfo?.bloodType || 'unknown',
        height_cm: parseFloat(formData.medicalInfo?.height) || null,
        weight_kg: parseFloat(formData.medicalInfo?.weight) || null,
        allergies: formData.medicalInfo?.allergies || [],
        current_medications: formData.medicalInfo?.currentMedications || [],
        chronic_conditions: formData.medicalInfo?.chronicConditions || [],
        past_surgeries: formData.medicalInfo?.pastSurgeries || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (medicalError) {
      console.error('Medical records save error:', medicalError);
      // Don't fail the whole request if medical records fail
    }

    // 6. Link documents to patient profile
    if (formData.documents && formData.documents.length > 0) {
      const documentsToUpdate = formData.documents.map((doc: any) => ({
        patient_id: patientProfile.id,
        document_type: doc.type,
        document_number: doc.number,
        file_name: doc.fileName,
        public_url: doc.url,
        uploaded_at: doc.uploadedAt || new Date().toISOString(),
        firebase_uid: firebaseUser.uid
      }));

      const { error: docsError } = await supabase
        .from('patient_documents')
        .upsert(documentsToUpdate);

      if (docsError) {
        console.error('Documents link error:', docsError);
        // Don't fail the whole request if document linking fails
      }
    }

    return NextResponse.json({
      success: true,
      patientId: patientProfile.id,
      message: 'Onboarding completed successfully'
    });

  } catch (error: any) {
    console.error('Onboarding API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}