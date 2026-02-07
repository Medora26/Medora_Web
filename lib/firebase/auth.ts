import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  UserCredential,
  AuthError,
  onAuthStateChanged,
  User,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail // Added this import
} from "firebase/auth";
import { auth } from "./config";
import { doc, setDoc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "./config";
import { OTPData, AuthUser } from "@/types/auth/auth-layout/types";

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ========== USER DATA MANAGEMENT FUNCTIONS ==========

// Store/Update user data in Firestore
async function storeUserData(
  uid: string,
  email: string,
  username: string,
  emailVerified: boolean = false,
  hasCompletedOnboarding: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("💾 Storing/updating user data for:", email);

    const userData = {
      uid,
      email,
      username,
      emailVerified,
      hasCompletedOnboarding,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
      createdAt: new Date() // Will be updated if already exists
    };

    // Check if user already exists
    const userDocRef = doc(db, "users", uid);
    const existingUser = await getDoc(userDocRef);

    if (existingUser.exists()) {
      // Update existing user
      await updateDoc(userDocRef, {
        lastLoginAt: new Date(),
        updatedAt: new Date(),
        emailVerified
      });
      console.log("✅ User data updated in Firestore");
    } else {
      // Create new user document
      await setDoc(userDocRef, userData);
      console.log("✅ User data created in Firestore");
    }

    return { success: true };
  } catch (error: any) {
    console.error("❌ Error storing user data:", error);
    
    // Check if it's a permission error
    if (error.code === 'permission-denied') {
      console.warn("⚠️ Firestore permission denied for user data.");
    }
    
    return { success: false, error: "Failed to store user data" };
  }
}

// Get user data from Firestore
export async function getUserData(uid: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as AuthUser;
      console.log("📊 Retrieved user data for:", userData.email);
      return { success: true, user: userData };
    } else {
      console.log("⚠️ User data not found in Firestore for uid:", uid);
      return { success: false, error: "User data not found" };
    }
  } catch (error: any) {
    console.error("❌ Error fetching user data:", error);
    return { success: false, error: "Failed to fetch user data" };
  }
}

// Update user onboarding status
export async function updateUserOnboardingStatus(
  uid: string,
  hasCompletedOnboarding: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, {
      hasCompletedOnboarding,
      updatedAt: new Date()
    });
    console.log("✅ User onboarding status updated to:", hasCompletedOnboarding);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error updating onboarding status:", error);
    return { success: false, error: "Failed to update onboarding status" };
  }
}

// ========== EMAIL FUNCTIONS ==========

// Send email function
export async function sendEmailNotification(
  toEmail: string,
  subject: string,
  htmlContent: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 Email Notification:', {
      to: toEmail,
      subject,
      userName
    });
    
    // TODO: Integrate with real email service (EmailJS, SendGrid, etc.)
    // For now, we'll just log it to console
    console.log('📧 Email would be sent to:', toEmail);
    console.log('📧 Subject:', subject);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email notification' };
  }
}

// Send OTP email
async function sendOTPEmail(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const subject = `🔐 Your Medora Login OTP: ${otp}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6ecef2, #4a90e2); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 25px; background: #f9f9f9; }
        .otp-box { 
          display: inline-block; 
          padding: 15px 25px; 
          background: white; 
          border: 2px dashed #6ecef2; 
          border-radius: 10px; 
          font-size: 32px; 
          font-weight: bold; 
          letter-spacing: 10px; 
          color: #333; 
          margin: 20px 0;
        }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Medora Login Verification</h2>
        </div>
        
        <div class="content">
          <p>Hello,</p>
          <p>You're trying to login to your Medora account. Use the following OTP to complete your login:</p>
          
          <div style="text-align: center;">
            <div class="otp-box">${otp}</div>
          </div>
          
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          
          <p>If you didn't request this OTP, please ignore this email.</p>
          
          <p>Best regards,<br>The Medora Security Team</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Medora. All rights reserved.</p>
          <p>This is an automated security message. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmailNotification(email, subject, htmlContent);
}

// ========== OTP MANAGEMENT FUNCTIONS ==========

// Store OTP in Firestore
async function storeOTP(email: string, uid: string, otp: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("💾 Storing OTP in Firestore for:", email);
    
    const otpData: OTPData = {
      code: otp,
      email,
      uid,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };
    
    // Store OTP in Firestore
    await setDoc(doc(db, "otps", email), otpData);
    
    console.log("✅ OTP stored successfully for:", email);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error storing OTP:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    // Check if it's a permission error
    if (error.code === 'permission-denied') {
      console.warn("⚠️ Firestore permission denied. Creating OTP in localStorage instead.");
      
      // Fallback to localStorage for development
      if (typeof window !== 'undefined') {
        const otpData = {
          code: otp,
          email,
          uid,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        };
        localStorage.setItem(`medora_otp_${email}`, JSON.stringify(otpData));
        console.log("✅ OTP stored in localStorage as fallback");
        return { success: true };
      }
    }
    
    return { success: false, error: "Failed to store OTP" };
  }
}

// Verify OTP from Firestore with fallback
async function verifyStoredOTP(email: string, otp: string): Promise<{ success: boolean; uid?: string; error?: string }> {
  try {
    console.log("🔍 Verifying OTP for:", email);
    
    // Try Firestore first
    try {
      const otpDoc = await getDoc(doc(db, "otps", email));
      
      if (otpDoc.exists()) {
        const otpData = otpDoc.data() as OTPData;
        
        // Check expiry
        if (new Date() > new Date(otpData.expiresAt)) {
          await deleteDoc(doc(db, "otps", email));
          return { success: false, error: "OTP has expired" };
        }
        
        // Verify code
        if (otpData.code === otp) {
          await deleteDoc(doc(db, "otps", email));
          console.log("✅ OTP verified from Firestore");
          return { success: true, uid: otpData.uid };
        }
      }
    } catch (firestoreError) {
      console.warn("⚠️ Firestore OTP verification failed, trying localStorage:", firestoreError);
    }
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const storedOTP = localStorage.getItem(`medora_otp_${email}`);
      if (storedOTP) {
        const otpData = JSON.parse(storedOTP);
        
        // Check expiry
        if (new Date() > new Date(otpData.expiresAt)) {
          localStorage.removeItem(`medora_otp_${email}`);
          return { success: false, error: "OTP has expired" };
        }
        
        // Verify code
        if (otpData.code === otp) {
          localStorage.removeItem(`medora_otp_${email}`);
          console.log("✅ OTP verified from localStorage");
          return { success: true, uid: otpData.uid };
        }
      }
    }
    
    return { success: false, error: "Invalid OTP code" };
  } catch (error) {
    console.error("❌ Error verifying OTP:", error);
    return { success: false, error: "Failed to verify OTP" };
  }
}

// ========== UPDATED AUTH FUNCTIONS ==========

// Simple sign up - Creates Firebase Auth user AND stores in Firestore
export async function signUpUser(
  email: string,
  password: string,
  username: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    console.log("📝 Creating Firebase Auth user:", email);
    
    // Create user with email and password
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    console.log("✅ Firebase user created:", userCredential.user.uid);
    
    const user = userCredential.user;
    
    // Update profile with username
    await updateProfile(user, {
      displayName: username,
    });
    
    // Store user data in Firestore
    const storeResult = await storeUserData(
      user.uid,
      user.email!,
      username,
      user.emailVerified,
      false // hasCompletedOnboarding
    );
    
    if (!storeResult.success) {
      console.warn("⚠️ Failed to store user data in Firestore, but auth user was created");
    }
    
    // Send email verification
    try {
      await sendEmailVerification(user);
      console.log("✅ Email verification sent");
    } catch (emailError) {
      console.warn("⚠️ Email verification failed:", emailError);
    }
    
    // Create user data object
    const userData: AuthUser = {
      uid: user.uid,
      email: user.email!,
      username,
      displayName: username,
      createdAt: new Date(),
      hasCompletedOnboarding: false,
      emailVerified: user.emailVerified
    };
    
    // Send welcome email
    await sendEmailNotification(
      user.email!,
      "Welcome to Medora! 🏥",
      `Hello ${username},<br><br>
       Welcome to Medora - Your Personal Medical Document Hub!<br><br>
       
       Your account has been created successfully.<br><br>
       
       <strong>Next Steps:</strong><br>
       1. Verify your email address (check your inbox)<br>
       2. Login with your credentials<br>
       3. Complete your medical profile onboarding<br>
       4. Start managing your documents<br><br>
       
       <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-in" style="
         display: inline-block;
         padding: 12px 24px;
         background: #6ecef2;
         color: white;
         text-decoration: none;
         border-radius: 5px;
         font-weight: bold;
       ">
         Login Now
       </a><br><br>
       
       Best regards,<br>
       The Medora Team`,
      username
    );
    
    console.log("🎉 Signup completed successfully");
    return { success: true, user: userData };
    
  } catch (error: any) {
    console.error("❌ Signup error:", error);
    
    const authError = error as AuthError;
    let errorMessage = "Registration failed. Please try again.";
    
    switch (authError.code) {
      case "auth/email-already-in-use":
        errorMessage = "This email is already registered. Please sign in instead.";
        break;
      case "auth/invalid-email":
        errorMessage = "Please enter a valid email address.";
        break;
      case "auth/weak-password":
        errorMessage = "Password should be at least 6 characters long.";
        break;
    }
    
    return { success: false, error: errorMessage };
  }
}

// Login with OTP
export async function loginWithOTP(
  email: string,
  password: string
): Promise<{ 
  success: boolean; 
  otp?: string;
  error?: string 
}> {
  try {
    console.log("🔐 Starting OTP login for:", email);
    
    // First, verify credentials
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("✅ Credentials verified for user:", user.uid);
    
    // Generate OTP
    const otp = generateOTP();
    console.log("🔢 Generated OTP:", otp);
    
    // Store OTP in Firestore
    const storeResult = await storeOTP(email, user.uid, otp);
    if (!storeResult.success) {
      await signOut(auth);
      return { success: false, error: "Failed to generate OTP" };
    }
    
    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp);
    
    if (!emailResult.success) {
      await signOut(auth);
      return { success: false, error: "Failed to send OTP email" };
    }
    
    console.log("📧 OTP email sent to:", email);
    
    // Sign out user temporarily (they'll sign in after OTP verification)
    await signOut(auth);
    
    return { 
      success: true, 
      otp // Return OTP for development (show in UI)
    };
    
  } catch (error: any) {
    console.error("❌ Login with OTP error:", error);
    
    let errorMessage = "Login failed. Please check your credentials.";
    
    switch (error.code) {
      case "auth/invalid-credential":
        errorMessage = "Invalid email or password.";
        break;
      case "auth/user-not-found":
        errorMessage = "No account found with this email.";
        break;
      case "auth/wrong-password":
        errorMessage = "Incorrect password.";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many attempts. Please try again later.";
        break;
    }
    
    return { success: false, error: errorMessage };
  }
}

// Verify OTP and login - UPDATED to store user data
export async function verifyOTPAndLogin(
  email: string,
  password: string,
  otp: string
): Promise<{ 
  success: boolean; 
  user?: User;
  authUser?: AuthUser;
  needsOnboarding?: boolean;
  error?: string 
}> {
  try {
    console.log("🔍 Verifying OTP for:", email);
    
    // First verify the stored OTP
    const otpResult = await verifyStoredOTP(email, otp);
    
    if (!otpResult.success) {
      console.log("❌ OTP verification failed:", otpResult.error);
      return { success: false, error: otpResult.error };
    }
    
    console.log("✅ OTP verified successfully");
    
    // Now sign in with credentials
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("✅ User signed in:", user.uid);
    
    // Store/update user data in Firestore
    const username = user.displayName || email.split('@')[0];
    await storeUserData(
      user.uid,
      user.email!,
      username,
      user.emailVerified,
      false // Will check onboarding status below
    );
    
    // Check if user has completed onboarding
    const userDoc = await getDoc(doc(db, "patients", user.uid));
    const hasCompletedOnboarding = userDoc.exists();
    
    console.log("📊 Onboarding status:", hasCompletedOnboarding ? "Completed" : "Not completed");
    
    // Get user data from Firestore
    const userDataResult = await getUserData(user.uid);
    
    return {
      success: true,
      user,
      authUser: userDataResult.user,
      needsOnboarding: !hasCompletedOnboarding
    };
    
  } catch (error: any) {
    console.error("❌ OTP verification error:", error);
    
    let errorMessage = "OTP verification failed.";
    
    switch (error.code) {
      case "auth/invalid-credential":
        errorMessage = "Invalid credentials. Please try again.";
        break;
      case "auth/user-disabled":
        errorMessage = "This account has been disabled.";
        break;
    }
    
    return { success: false, error: errorMessage };
  }
}

// Google login - UPDATED to store user data
export async function loginWithGoogle(): Promise<{ 
  success: boolean; 
  user?: User;
  authUser?: AuthUser;
  needsOnboarding?: boolean;
  error?: string 
}> {
  try {
    const provider = new GoogleAuthProvider();
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Store/update user data in Firestore
    const username = user.displayName || user.email!.split('@')[0];
    await storeUserData(
      user.uid,
      user.email!,
      username,
      user.emailVerified,
      false // Will check onboarding status below
    );
    
    // Check if user has completed onboarding
    const userDoc = await getDoc(doc(db, "patients", user.uid));
    const hasCompletedOnboarding = userDoc.exists();
    
    // Get user data from Firestore
    const userDataResult = await getUserData(user.uid);
    
    return {
      success: true,
      user,
      authUser: userDataResult.user,
      needsOnboarding: !hasCompletedOnboarding
    };
    
  } catch (error: any) {
    let errorMessage = "Google sign-in failed. Please try again.";
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = "Sign-in was cancelled.";
    }
    
    return { success: false, error: errorMessage };
  }
}

// Direct email/password login - NEW function
export async function directLogin(
  email: string,
  password: string
): Promise<{ 
  success: boolean; 
  user?: User;
  authUser?: AuthUser;
  needsOnboarding?: boolean;
  error?: string 
}> {
  try {
    console.log("🔐 Direct login for:", email);
    
    // Sign in with credentials
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("✅ User signed in:", user.uid);
    
    // Store/update user data in Firestore
    const username = user.displayName || email.split('@')[0];
    await storeUserData(
      user.uid,
      user.email!,
      username,
      user.emailVerified,
      false // Will check onboarding status below
    );
    
    // Check if user has completed onboarding
    const userDoc = await getDoc(doc(db, "patients", user.uid));
    const hasCompletedOnboarding = userDoc.exists();
    
    console.log("📊 Onboarding status:", hasCompletedOnboarding ? "Completed" : "Not completed");
    
    // Get user data from Firestore
    const userDataResult = await getUserData(user.uid);
    
    return {
      success: true,
      user,
      authUser: userDataResult.user,
      needsOnboarding: !hasCompletedOnboarding
    };
    
  } catch (error: any) {
    console.error("❌ Direct login error:", error);
    
    let errorMessage = "Login failed. Please check your credentials.";
    
    switch (error.code) {
      case "auth/invalid-credential":
        errorMessage = "Invalid email or password.";
        break;
      case "auth/user-not-found":
        errorMessage = "No account found with this email.";
        break;
      case "auth/wrong-password":
        errorMessage = "Incorrect password.";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many attempts. Please try again later.";
        break;
      case "auth/user-disabled":
        errorMessage = "This account has been disabled.";
        break;
    }
    
    return { success: false, error: errorMessage };
  }
}

// Resend OTP
export async function resendOTP(email: string, password: string): Promise<{ 
  success: boolean; 
  otp?: string;
  error?: string 
}> {
  try {
    console.log("🔄 Resending OTP for:", email);
    
    // Re-verify credentials
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Generate new OTP
    const otp = generateOTP();
    console.log("🔢 New OTP generated:", otp);
    
    // Store new OTP
    const storeResult = await storeOTP(email, user.uid, otp);
    if (!storeResult.success) {
      await signOut(auth);
      return { success: false, error: "Failed to generate new OTP" };
    }
    
    // Send new OTP email
    const emailResult = await sendOTPEmail(email, otp);
    
    if (!emailResult.success) {
      await signOut(auth);
      return { success: false, error: "Failed to send OTP email" };
    }
    
    // Sign out again
    await signOut(auth);
    
    return { 
      success: true, 
      otp 
    };
    
  } catch (error: any) {
    console.error("❌ Resend OTP error:", error);
    return { success: false, error: "Failed to resend OTP" };
  }
}

// Password reset function
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("✅ Password reset email sent to:", email);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Password reset error:", error);
    
    let errorMessage = "Failed to send password reset email";
    
    switch (error.code) {
      case "auth/user-not-found":
        errorMessage = "No account found with this email.";
        break;
      case "auth/invalid-email":
        errorMessage = "Please enter a valid email address.";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many attempts. Please try again later.";
        break;
    }
    
    return { success: false, error: errorMessage };
  }
}

// Auth listener with user data
export function setupAuthListener(callback: (user: User | null, authUser?: AuthUser) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Get additional user data from Firestore
      const userDataResult = await getUserData(user.uid);
      callback(user, userDataResult.user);
    } else {
      callback(null);
    }
  });
}

// Sign out
export async function signOutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to sign out." };
  }
}

// Get current user with Firestore data
export async function getCurrentUserWithData(): Promise<{ 
  user: User | null; 
  authUser?: AuthUser 
}> {
  const user = auth.currentUser;
  if (!user) {
    return { user: null };
  }
  
  const userDataResult = await getUserData(user.uid);
  return { 
    user, 
    authUser: userDataResult.user 
  };
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}