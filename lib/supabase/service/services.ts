import { auth } from '@/lib/firebase/config';

export const uploadDocumentToSupabase = async (
  file: File,
  userId: string,
  documentType: string,
  documentNumber: string,
  category: string
) => {
  try {
    // Get current user's Firebase ID token
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const idToken = await currentUser.getIdToken();
    
    // Use the API route instead of direct Supabase client
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('documentNumber', documentNumber);
    formData.append('category', category);
    formData.append('file', file);

    const response = await fetch('/api/documets/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      url: result.url || result.document?.public_url,
      documentId: result.document?.id,
      message: result.message
    };

  } catch (error: any) {
    console.error('Upload error:', error);
    return { success: false, error: error.message };
  }
};

export const savePatientProfileToSupabase = async (data: any) => {
  try {
    // Get Firebase ID token for authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const idToken = await currentUser.getIdToken();
    
    const response = await fetch('/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (!response.ok) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Save profile error:', error);
    return { success: false, error: error.message };
  }
};