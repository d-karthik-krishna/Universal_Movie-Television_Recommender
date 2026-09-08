'use client'

import React, { useState, useEffect } from 'react'
import { MessageSquare, Star, X } from 'lucide-react'
import { submitRating, getRating } from '@/lib/services/feedback'
import { useRouter } from 'next/navigation'

import { useWatched } from '../providers/watched-provider'

interface FeedbackModalProps {
  tmdbId: number
  mediaType: string
}

export function FeedbackModal({ tmdbId, mediaType }: FeedbackModalProps) {
  const { isWatched } = useWatched()
  const watched = isWatched(tmdbId)
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [reviewText, setReviewText] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      const loadExisting = async () => {
        setFetching(true)
        try {
          const data = await getRating(tmdbId, mediaType)
          if (data.rating) setRating(data.rating)
          if (data.review) setReviewText(data.review)
        } catch (e) {
          // ignore
        } finally {
          setFetching(false)
        }
      }
      loadExisting()
    }
  }, [isOpen, tmdbId, mediaType])

  const handleSubmit = async () => {
    if (rating === 0) return
    setLoading(true)
    try {
      await submitRating(tmdbId, mediaType, rating, reviewText)
      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
      }, 1500)
    } catch (error) {
      if ((error as Error).message.includes('Not authenticated')) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!watched) {
    return (
      <button
        disabled
        title="Watch this first to give feedback."
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary/50 px-4 py-3 text-sm font-semibold text-muted-foreground opacity-70 cursor-not-allowed"
      >
        <MessageSquare className="h-5 w-5" />
        <span>Feedback 🔒</span>
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/80"
      >
        <MessageSquare className="h-5 w-5" />
        <span>Give Feedback</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="mb-4 text-xl font-bold text-foreground">Feedback</h3>
            
            {fetching ? (
              <div className="py-8 text-center text-muted-foreground animate-pulse">Loading...</div>
            ) : success ? (
              <div className="py-8 text-center text-green-500 font-semibold flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                Feedback submitted!
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= (hoverRating || rating)
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    What did you think?
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your thoughts about this movie/series..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-32 resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || rating === 0}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
