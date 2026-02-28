import { Suspense } from 'react'
import SignInContent from '@/components/layouts/auth/sign-in/sign-in-content'

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6ecef2]"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}