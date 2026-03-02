'use client'

import React, { useState, useRef, useEffect } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Upload, Star, X, Check, User, Briefcase, MessageSquare, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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
    setLoading(true)

    try {
      // Simulate submission for now
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success('Thank you for your feedback!', {
        description: 'Your testimonial has been submitted successfully.',
        icon: '🎉',
      })
      
      router.push('/')
    } catch (error) {
      toast.error('Something went wrong', {
        description: 'Please try again later.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen  py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Avatar Upload - Centered at the top */}
        <div ref={avatarRef} className="flex justify-center mb-6">
          <div className="relative group">
            {/* Avatar Circle */}
            <div 
              onClick={triggerFileInput}
              className="relative w-24 h-24 rounded-full cursor-pointer overflow-hidden ring-4 ring-white dark:ring-gray-800 shadow-lg"
            >
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
              
              {/* Hover Overlay with Pencil Icon */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Pencil className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />

            {/* Remove Image Button (only shows when image exists) */}
            {imagePreview && (
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Header Section */}
        <div ref={headerRef} className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">
            Share your experience
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Help us improve Medora by sharing how it has helped you manage your healthcare journey.
          </p>
        </div>

        {/* Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className=" rounded-2xl shadow-sm dark:bg-neutral-950 border p-6 sm:p-8 space-y-6"
        >
          {/* Name Field */}
          <div
            ref={el => { fieldsRef.current[0] = el }}
            className="space-y-1"
          >
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Your name <span className="text-blue-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm  border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-gray-900 dark:text-white placeholder-gray-400"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Profession Field */}
          <div
            ref={el => { fieldsRef.current[1] = el }}
            className="space-y-1"
          >
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Your role <span className="text-blue-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                required
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-transparent border dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-gray-900 dark:text-white placeholder-gray-400"
                placeholder="Patient / Doctor / Healthcare Professional"
              />
            </div>
          </div>

          {/* Review Field */}
          <div
            ref={el => { fieldsRef.current[2] = el }}
            className="space-y-1"
          >
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Your review <span className="text-blue-500">*</span>
            </label>
            <Textarea
              required
              rows={3}
              value={formData.review}
              onChange={(e) => setFormData({ ...formData, review: e.target.value })}
              className="w-full px-3 py-2.5 text-sm dark:bg-neutral-900  rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-gray-900 dark:text-white placeholder-gray-400 resize-none"
              placeholder="Share your experience with Medora..."
            />
          </div>

          {/* Rating Field */}
          <div
            ref={el => { fieldsRef.current[3] = el }}
            className="space-y-2"
          >
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star, index) => (
                <button
                  key={star}
                  ref={el => { starRefs.current[index] = el }}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(null)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= (hoveredStar ?? formData.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                {formData.rating} of 5
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            ref={buttonRef}
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Submit testimonial
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            Your feedback helps us improve Medora for everyone.
          </p>
        </form>
      </div>
    </div>
  )
}