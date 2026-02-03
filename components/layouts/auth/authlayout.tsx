import { AuthLayoutProps } from '@/types/auth/auth-layout/types'
import React from 'react'

const AuthLayout: React.FC<AuthLayoutProps> = ({children}) => {
  return (
    <div>
      AuthLayout
        {children}
    </div>
  )
}

export default AuthLayout