<div align="left">

# 🩺 MEDORA  
### Your Digital Health Drive 💾🛡️  

<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZDV5cG1pZWt0d3N2Z3Z1M2p6a3l0Y3N0Y3d0eHZqM2F4b2x6bCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26ufdipQqU2lhNA4g/giphy.gif" width="420"/>

**Secure • Organized • User-Controlled Healthcare Data**

---

## 🏠 Home Page Preview

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="./public/light.png" alt="MEDORA Light Mode" width="400"/>
        <br />
        <em>🌞 Light Theme</em>
      </td>
      <td align="center">
        <img src="./public/dark.png" alt="MEDORA Dark Mode" width="400"/>
        <br />
        <em>🌚 Dark Theme</em>
      </td>
    </tr>
  </table>
</div>

---

</div>

## ✨ About MEDORA

<img align="right" src="https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif" width="260"/>

**MEDORA** is an early-stage medical technology platform designed to simplify how people store and manage their medical data.

Think of MEDORA as a **personal health drive** 📂  
where users can securely store medical records and apply for insurance—all from one platform.

---

## 🚀 Vision

Healthcare data today is scattered, hard to access, and rarely user-controlled.

MEDORA aims to:
- 🔐 **Give users full ownership** of their medical data  
- 📁 **Centralize health records** securely  
- 🛡️ **Simplify insurance access**  
- ⚡ **Make healthcare data usable and accessible**  

---

## 💡 Key Features

<img align="right" src="https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif" width="260"/>

### 📂 **Medical Data Storage**
Upload reports, prescriptions, and medical history like a cloud drive.

### 🔐 **Privacy-First Architecture**
User-controlled access and secure handling of sensitive data.

### 🛡️ **Insurance Integration**
Apply for medical insurance directly from MEDORA.

### 🧾 **Clean Record Organization**
Structured and searchable health records.

### 🌓 **Dark/Light Mode**
Seamless theme switching with persistent user preference.

### 📱 **Responsive Design**
Fully optimized for desktop, tablet, and mobile devices.

### 🔄 **Real-time Updates**
Instant synchronization across all your devices.

---

## 🛠️ Tech Stack

<div align="center">

| **Category** | **Technologies** |
|-------------|------------------|
| **Frontend** | ⚛️ Next.js 15 (App Router) • 📘 TypeScript • 🔄 React 19 |
| **Styling** | 🎨 Tailwind CSS • 🎭 Shadcn/ui • 🎯 Framer Motion • 🧩 Lucide Icons |
| **Authentication** | 🔥 Firebase Auth • 🔐 Email/Password • 📧 OTP • 🟢 Google OAuth |
| **Database** | 📦 Firestore (NoSQL) • 📊 Real-time updates |
| **Storage** | ☁️ Cloudinary • 🖼️ Image optimization • 📄 PDF support |
| **State Management** | 🧠 React Context • 🔄 Custom Hooks |
| **Deployment** | ▲ Vercel • 🌐 Edge Functions |
| **Analytics** | 📈 Google Analytics • 🔍 Error Tracking |

</div>

<div align="center">
  <img src="https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif" width="420"/>
  <br />
  <em>Built with scalability, security, and performance in mind 🚀</em>
</div>

---

## 📂 Directory Breakdown

### 🎯 **`/app` - Next.js App Router**
The core application routes and pages using Next.js 15 App Router.

| Path | Purpose |
|------|---------|
| `(auth)/` | Public authentication pages (sign-in, sign-up, forgot-password) |
| `(onboarding)/` | Protected onboarding flow for new users |
| `(dashboard)/` | Protected dashboard pages for authenticated users |
| `layout.tsx` | Root layout with ThemeProvider and AuthProvider |
| `page.tsx` | Landing page |

---

### 🧩 **`/components` - Reusable UI Components**

| Directory | Purpose |
|----------|---------|
| `ui/` | Shadcn/ui component library (button, card, input, etc.) |
| `layouts/` | Layout wrappers for auth and dashboard sections |
| `shared/` | Cross-cutting components (theme toggle, spinner, error boundary) |

---

### 🧠 **`/context` - React Context Providers**

| File | Purpose |
|------|---------|
| `auth-context.tsx` | Global authentication state and onboarding status |
| `theme-context.tsx` | Dark/light theme management with localStorage persistence |

---

### 🔧 **`/lib` - Utilities & Services**

| Directory | Purpose |
|----------|---------|
| `firebase/` | Firebase configuration and service methods |
| `cloudinary/` | Cloudinary upload utilities |
| `utils/` | Helper functions (date formatting, validation, constants) |

---

### 🖼️ **`/public` - Static Assets**

| Path | Purpose |
|------|---------|
| `dark.png` | Dark mode homepage preview for README |
| `light.png` | Light mode homepage preview for README |
| `logo/` | Brand assets in multiple formats and themes |

---

### 📝 **`/types` - TypeScript Definitions**

| Directory | Purpose |
|----------|---------|
| `auth/` | Authentication-related interfaces and types |
| `user/` | User profile and onboarding data structures |
| `documents/` | Document and upload types |

---

### 🎨 **`/styles` - Global Styles**

| File | Purpose |
|------|---------|
| `globals.css` | Tailwind imports and CSS variables for theming |

---

## 🔐 Environment Variables

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
