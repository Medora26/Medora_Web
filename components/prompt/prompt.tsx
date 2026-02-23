// lib/ai/prompts.ts


export interface FormattedUserData {
  personalInfo: any;
  medicalInfo: any;
  insuranceInfo: any;
  identification: any;
  documentSummary: {
    total: number;
    byType: Record<string, number>;
  };
  accountInfo: {
    email: string;
    username: string;
    onboardingCompleted: boolean;
    onboardingDate: string;
  };
}

export function formatUserDataForPrompt(patientData: any, userData: any): FormattedUserData {
  // Format personal information
  const personalInfo = patientData?.personalInfo ? {
    name: `${patientData.personalInfo.firstName} ${patientData.personalInfo.lastName}`,
    dateOfBirth: patientData.personalInfo.dateOfBirth,
    gender: patientData.personalInfo.gender,
    phone: patientData.personalInfo.phoneNumber,
    emergencyContact: patientData.personalInfo.emergencyContact ? {
      name: patientData.personalInfo.emergencyContact.name,
      relationship: patientData.personalInfo.emergencyContact.relationship,
      phone: patientData.personalInfo.emergencyContact.phoneNumber
    } : null
  } : null;

  // Format medical information
  const medicalInfo = patientData?.medicalInfo ? {
    bloodType: patientData.medicalInfo.bloodType,
    height: patientData.medicalInfo.height,
    weight: patientData.medicalInfo.weight,
    allergies: patientData.medicalInfo.allergies?.length > 0 
      ? patientData.medicalInfo.allergies 
      : ['None reported'],
    currentMedications: patientData.medicalInfo.currentMedications?.map(
      (med: any) => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency
      })
    ) || [],
    chronicConditions: patientData.medicalInfo.chronicConditions?.length > 0
      ? patientData.medicalInfo.chronicConditions
      : ['None'],
    pastSurgeries: patientData.medicalInfo.pastSurgeries?.map(
      (surgery: any) => ({
        name: surgery.name,
        year: surgery.year
      })
    ) || []
  } : null;

  // Format insurance information
  const insuranceInfo = patientData?.insuranceInfo ? {
    provider: patientData.insuranceInfo.providerName,
    policyNumber: patientData.insuranceInfo.policyNumber,
    groupNumber: patientData.insuranceInfo.groupNumber,
    type: patientData.insuranceInfo.insuranceType,
    validUntil: patientData.insuranceInfo.validUntil,
    coverageDetails: patientData.insuranceInfo.coverageDetails
  } : null;

  // Format identification
  const identification = patientData?.identification ? {
    type: patientData.identification.type,
    number: patientData.identification.number,
    issueDate: patientData.identification.issueDate,
    expiryDate: patientData.identification.expiryDate
  } : null;

  // Get document summary
  const documents = patientData?.documents || [];
  const documentSummary = {
    total: documents.length,
    byType: documents.reduce((acc: any, doc: any) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {})
  };

  // Account info
  const accountInfo = {
    email: userData?.email || 'Not available',
    username: userData?.username || 'Not available',
    onboardingCompleted: patientData?.hasCompletedOnboarding || false,
    onboardingDate: patientData?.onboardingCompletedAt || 'Not available'
  };

  return {
    personalInfo,
    medicalInfo,
    insuranceInfo,
    identification,
    documentSummary,
    accountInfo
  };
}

export function createSystemPrompt(formattedData: FormattedUserData): string {
  const {
    personalInfo,
    medicalInfo,
    insuranceInfo,
    identification,
    documentSummary,
    accountInfo
  } = formattedData;

    return `You are MedoraAI, a helpful medical assistant. You have access to this user's medical data.

CRITICAL RULES:
1. ONLY use the provided user data to answer questions. Never invent information.
2. If asked about something not in their profile, politely say you don't have that information.
3. Be concise, clear, and accurate.
4. For medical questions, always include a disclaimer to consult healthcare professionals.
5. Format lists and medications clearly.

Remember: You're helping users understand their own medical data. Be helpful but cautious.
📋 **USER'S COMPLETE PROFILE:**

--- PERSONAL INFORMATION ---
${personalInfo ? JSON.stringify(personalInfo, null, 2) : '⚠️ Not provided'}

--- MEDICAL HISTORY ---
${medicalInfo ? JSON.stringify(medicalInfo, null, 2) : '⚠️ Not provided'}

--- INSURANCE DETAILS ---
${insuranceInfo ? JSON.stringify(insuranceInfo, null, 2) : '⚠️ Not provided'}

--- IDENTIFICATION ---
${identification ? JSON.stringify(identification, null, 2) : '⚠️ Not provided'}

--- DOCUMENTS SUMMARY ---
Total documents: ${documentSummary.total}
Document types: ${JSON.stringify(documentSummary.byType, null, 2)}

--- ACCOUNT INFO ---
Email: ${accountInfo.email}
Username: ${accountInfo.username}
Onboarding completed: ${accountInfo.onboardingCompleted ? '✅ Yes' : '❌ No'}
Onboarding date: ${accountInfo.onboardingDate}

🎯 **CAPABILITIES:**
- Answer questions about personal medical history
- Provide insurance policy details
- List current medications and allergies
- Summarize past surgeries and chronic conditions
- Tell users what documents they have uploaded
- Help users understand their coverage

🚫 **LIMITATIONS:**
- Cannot access documents content directly (only metadata)
- Cannot provide medical diagnoses or treatment advice
- Cannot modify or update user data
- Cannot access data from other users

Remember: Be helpful, accurate, and always respect medical privacy. When in doubt, recommend consulting with a healthcare provider.`;
}