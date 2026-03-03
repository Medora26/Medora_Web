'use client'

import React, { useState, useRef, useEffect } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Upload, Star, X, Check, User, Briefcase, MessageSquare, Pencil, Shield } from 'lucide-react'
import { toast } from 'sonner'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TestimonialFormData, testimonialService } from '@/lib/firebase/service/testimonials/service'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function TestimonialsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    about: '',
    review: '',
    rating: 5
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)

  // Refs for animations
  const headerRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const fieldsRef = useRef<(HTMLDivElement | null)[]>([])
  const starRefs = useRef<(HTMLButtonElement | null)[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Create animation timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: formRef.current,
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      }
    })

    // Avatar animation (if exists)
    if (avatarRef.current) {
      tl.fromTo(avatarRef.current,
        { opacity: 0, scale: 0.8, y: -20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.4)' }
      )
    }

    // Header animation
    tl.fromTo(headerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      '-=0.4'
    )

    // Form container animation
    tl.fromTo(formRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.2)' },
      '-=0.4'
    )

    // Fields stagger animation
    tl.fromTo(fieldsRef.current.filter(Boolean),
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' },
      '-=0.2'
    )

    // Stars animation
    tl.fromTo(starRefs.current.filter(Boolean),
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(2)' },
      '-=0.2'
    )

    // Button animation
    tl.fromTo(buttonRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    )

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Handle form submission (uncommented and ready to use)
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Validate form data
  const testimonialData: TestimonialFormData = {
    name: formData.name,
    about: formData.about,
    review: formData.review,
    rating: formData.rating,
    imageFile: imageFile || undefined
  }

  const validationError = testimonialService.validateTestimonialData(testimonialData)
  if (validationError) {
    toast.error(validationError)
    return
  }

  setLoading(true)

  try {
    // Submit testimonial using the service
    const result = await testimonialService.submitTestimonial(testimonialData)
    
    toast.success('Thank you for your feedback!', {
      description: 'Your testimonial has been submitted successfully and will appear on the homepage in seconds!',
      icon: '🎉',
    })
    
    // Reset form
    setFormData({
      name: '',
      about: '',
      review: '',
      rating: 5
    })
    removeImage()
    
    // Show a preview message
    toast.info('Check the homepage to see your testimonial live!', {
      duration: 3000,
    })
    
    // Redirect after successful submission
    setTimeout(() => {
      router.push('/#testimonials')
    }, 2000)
    
  } catch (error: any) {
    console.error('Submission error:', error)
    
    // Handle specific error messages
    let errorMessage = 'Please try again later.'
    
    if (error.message) {
      if (error.message.includes('image')) {
        errorMessage = 'Failed to upload image. Please check file size and format.'
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.'
      } else {
        errorMessage = error.message
      }
    }
    
    toast.error('Failed to submit testimonial', {
      description: errorMessage,
    })
  } finally {
    setLoading(false)
  }
}
  return (
    <div className="min-h-screen  py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
      
       

        {/* Header Section */}
        <div ref={headerRef} className="text-center ">
          <div className="inline-flex items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">
            Terms & Conditions <br/> ("under Development")
          </h1>
          {/* <p className="text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Help us improve Medora by sharing how it has helped you manage your healthcare journey.
          </p> */}
        </div>

      </div>
    </div>
  )
}