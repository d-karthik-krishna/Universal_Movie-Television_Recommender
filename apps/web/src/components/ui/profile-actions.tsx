'use client'

import { Share, Download, Link as LinkIcon, Check, X, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { API_URL } from '@/lib/constants'
import { QRCodeSVG } from 'qrcode.react'

export function ProfileActions({ username, display_name }: { username: string, display_name: string, watchedData?: any[], avatar_url?: string, bio?: string }) {
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/user/${username}` : ''

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const nativeShare = async () => {
    try {
      await navigator.share({
        title: `CineSphere Profile - ${display_name || username}`,
        url: profileUrl,
      })
    } catch (err) {
      console.error('Error sharing', err)
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Fetch fresh data from the public API endpoint
      const res = await fetch(`${API_URL}/api/v1/user/public/${username}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch latest watch history')
      const data = await res.json()
      const freshWatchedData = data.watched || []

      const doc = new jsPDF()
      
      // Header
      doc.setFontSize(22)
      doc.text('MY WATCH HISTORY', 14, 20)
      
      doc.setFontSize(12)
      doc.text(`Profile: ${display_name || username}`, 14, 30)
      
      // Summary
      const favoritesCount = freshWatchedData.filter((i: any) => i.is_favorite).length
      const moviesCount = freshWatchedData.filter((i: any) => i.media_type === 'movie').length
      const seriesCount = freshWatchedData.filter((i: any) => i.media_type === 'tv').length
      
      const ratedItems = freshWatchedData.filter((i: any) => i.user_rating !== null)
      const avgRating = ratedItems.length > 0 
        ? (ratedItems.reduce((acc: number, curr: any) => acc + curr.user_rating, 0) / ratedItems.length).toFixed(1) 
        : 'N/A'

      doc.setFontSize(10)
      doc.text(`Total Watched: ${freshWatchedData.length}`, 14, 45)
      doc.text(`Favorites: ${favoritesCount}`, 14, 52)
      doc.text(`Movies: ${moviesCount}`, 14, 59)
      doc.text(`Series: ${seriesCount}`, 14, 66)
      doc.text(`Average Rating: ${avgRating}/5`, 14, 73)
      
      // Table
      const tableData = freshWatchedData.map((item: any) => {
        const type = item.media_type === 'tv' ? 'Series' : 'Movie'
        const title = item.title || item.name || 'Unknown'
        
        let progressStr = ''
        if (type === 'Series') {
           if (item.progress && Object.keys(item.progress).length > 0) {
              const numSeasons = item.number_of_seasons || 0
              const progressSeasonsCount = Object.keys(item.progress).length
              const allWatched = Object.values(item.progress).every((s: any) => s.watched_all)
              
              if (allWatched && (numSeasons === 0 || progressSeasonsCount === numSeasons)) {
                 progressStr = ' — Fully Watched ✓'
              } else {
                 const totalEps = Object.values(item.progress).reduce((acc: number, s: any) => {
                    return acc + (s.watched_all ? (s.total_episodes || 0) : (s.watched_episodes?.length || 0))
                 }, 0)
                 progressStr = ` — ${totalEps} episodes watched`
              }
           }
        }
        
        const rating = item.user_rating ? `${item.user_rating}/5` : '-'
        const favorite = item.is_favorite ? 'Yes' : '-'
        
        return [
          title + progressStr,
          type,
          item.year || '-',
          rating,
          favorite
        ]
      })
      
      autoTable(doc, {
        startY: 85,
        head: [['Movie/Series', 'Type', 'Year', 'Rating', 'Favorite']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40] }
      })
      
      doc.save(`${username}_watch_history.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to download watch history. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  // Fallback for SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
        <button className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary">
          <LinkIcon className="h-4 w-4" />
          Share Profile
        </button>
        <button className="flex items-center gap-2 rounded-full border border-border bg-primary/10 text-primary px-4 py-2 text-sm font-semibold transition-colors hover:bg-primary/20">
          <Download className="h-4 w-4" />
          Download Watch History
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
        <button 
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary"
        >
          <LinkIcon className="h-4 w-4" />
          Share Profile
        </button>
        
        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 rounded-full border border-border bg-primary/10 text-primary px-4 py-2 text-sm font-semibold transition-colors hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isDownloading ? 'Generating...' : 'Download Watch History'}
        </button>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-border shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowShareModal(false)} 
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground bg-secondary/50 rounded-full p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="p-8 text-center">
              <h3 className="text-xl font-bold mb-6">Share Your Profile</h3>
              
              <div className="bg-white p-4 rounded-2xl inline-block mx-auto mb-6 shadow-sm">
                <QRCodeSVG value={profileUrl} size={180} level="M" />
              </div>
              
              <p className="text-sm text-muted-foreground mb-8 px-4">
                Scan this QR code or use the links below to share your CineSphere profile.
              </p>
              
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={copyLink} 
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
                >
                   {copied ? <Check className="h-4 w-4 text-green-500" /> : <LinkIcon className="h-4 w-4" />}
                   {copied ? 'Copied!' : 'Copy Link'}
                </button>
                
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button 
                    onClick={nativeShare} 
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold transition-colors hover:opacity-90 shadow-sm"
                  >
                     <Share className="h-4 w-4" />
                     Share
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
