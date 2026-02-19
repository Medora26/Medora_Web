import ContactForm from '@/components/layouts/contact/component/contact-form'
import ContactLayout from '@/components/layouts/contact/contact-layout'
import { Label } from '@/components/ui/label'
import { Contact } from 'lucide-react'
import React from 'react'

const page = () => {
  return (
    <ContactLayout>
      <ContactForm/>
    </ContactLayout>
  )
}

export default page