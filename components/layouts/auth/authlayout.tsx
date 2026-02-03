import { AuthLayoutImages } from '@/public/images/images'
import { AuthLayoutProps } from '@/types/auth/auth-layout/types'
import Image from 'next/image'
import React from 'react'

const AuthLayout: React.FC<AuthLayoutProps> = ({children}) => {
  return (
    <div>
      <div className="min-h-screen flex ">
        {/* Left Side - Form Area (Full width on small, 1/3 on large) */}
        <div className="hidden lg:flex lg:w-2/3 items-center  justify-center p-0">
        <div className="relative w-full h-full">
          <Image
            alt="Background"
            src={AuthLayoutImages.AuthLayoutImg}
            fill
            className="object-cover rounded-r-4xl"
            priority
            sizes="(max-width: 1024px) 0px, 66vw"
          />
        </div>
      </div>

        {/* Right Side - Image Only (Hidden on small, visible on large) */}
      <div className="w-full lg:w-1/3   p-4 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          {children}
        </div>
      </div>

    
     
    </div>
    </div>
  )
}

export default AuthLayout