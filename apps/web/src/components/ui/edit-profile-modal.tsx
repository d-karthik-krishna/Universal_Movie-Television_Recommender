'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Loader2, X, Image as ImageIcon } from 'lucide-react'
import { updateUser, uploadAvatar } from '@/lib/services/auth'
import { useRef } from 'react'

interface User {
  display_name?: string
  username?: string
  bio?: string
  avatar_url?: string
}

interface EditProfileModalProps {
  user: User
}

export function EditProfileModal({ user }: EditProfileModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    display_name: user.display_name || '',
    username: user.username || '',
    bio: user.bio || ''
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.')
        return
      }
      setSelectedFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleRemovePhoto = () => {
    setSelectedFile(null)
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      if (!formData.username.trim()) {
        throw new Error('Username is required')
      }

      let currentAvatarUrl = user.avatar_url
      
      // Upload new photo if selected
      if (selectedFile) {
        const updatedUser = await uploadAvatar(selectedFile)
        currentAvatarUrl = updatedUser.avatar_url
      } else if (!avatarPreview) {
        // User removed the photo
        currentAvatarUrl = undefined
      }
      
      await updateUser({
        display_name: formData.display_name.trim() || null,
        username: formData.username.trim(),
        bio: formData.bio.trim() || null,
        avatar_url: !avatarPreview ? null : (selectedFile ? undefined : currentAvatarUrl)
      } as any)
      
      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary"
      >
        <Pencil className="h-4 w-4" />
        Edit Profile ✏️
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
        
        <h2 className="text-2xl font-black mb-6">Edit Profile</h2>
        
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xl font-bold text-primary border border-border">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    Choose Photo
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium">Display Name</label>
            <input
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="Your Name"
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium">Username *</label>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="username"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about your favorite movies..."
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary resize-none"
            />
          </div>
          
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
