import { 
  collection, 
  addDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../../config'

export interface TestimonialFormData {
  name: string
  about: string
  review: string
  rating: number
  imageFile?: File | null
}

export interface TestimonialData {
  id?: string
  name: string
  about: string
  review: string
  rating: number
  imageUrl?: string
  imagePublicId?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Timestamp
  updatedAt?: Timestamp
}

class TestimonialService {
  private collectionName = 'testimonials'
  private cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  /**
   * Upload image to Cloudinary via server API
   */
  private async uploadToCloudinary(file: File): Promise<{ secure_url: string; public_id: string }> {
    if (!this.cloudName) {
      throw new Error('Cloudinary configuration is missing')
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Use server-side API route for secure upload
      const response = await fetch('/api/cloudinary/testimonials/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await response.json()
      return {
        secure_url: data.secure_url,
        public_id: data.public_id
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      throw new Error('Failed to upload image. Please try again.')
    }
  }

  /**
   * Submit a new testimonial
   */
  async submitTestimonial(data: TestimonialFormData): Promise<TestimonialData> {
    try {
      let imageData = null

      // Upload image to Cloudinary if provided via server API
      if (data.imageFile) {
        imageData = await this.uploadToCloudinary(data.imageFile)
      }

      // Prepare testimonial data for Firebase
      const testimonialData: Omit<TestimonialData, 'id'> = {
        name: data.name.trim(),
        about: data.about.trim(),
        review: data.review.trim(),
        rating: data.rating,
        status: 'pending', // New testimonials require admin approval
        createdAt: serverTimestamp() as Timestamp,
        ...(imageData && {
          imageUrl: imageData.secure_url,
          imagePublicId: imageData.public_id
        })
      }

      // Save to Firebase
      const docRef = await addDoc(collection(db, this.collectionName), testimonialData)

      return {
        id: docRef.id,
        ...testimonialData
      }

    } catch (error) {
      console.error('Error submitting testimonial:', error)
      throw error
    }
  }

  /**
   * Validate testimonial data before submission
   */
  validateTestimonialData(data: TestimonialFormData): string | null {
    if (!data.name.trim()) {
      return 'Name is required'
    }
    if (!data.about.trim()) {
      return 'Role is required'
    }
    if (!data.review.trim()) {
      return 'Review is required'
    }
    if (data.review.trim().length < 10) {
      return 'Review must be at least 10 characters long'
    }
    if (data.rating < 1 || data.rating > 5) {
      return 'Rating must be between 1 and 5'
    }
    if (data.imageFile) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(data.imageFile.type)) {
        return 'Please upload a valid image file (JPEG, PNG, WebP, or GIF)'
      }
      if (data.imageFile.size > 5 * 1024 * 1024) {
        return 'Image size must be less than 5MB'
      }
    }
    return null
  }
}

// Export a singleton instance
export const testimonialService = new TestimonialService()