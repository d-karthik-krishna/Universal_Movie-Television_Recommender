'use client'

import { Search, User, Menu, X, Tv, Film } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { SITE_NAME } from '@/lib/constants'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Explore' },
  { href: '/search', label: 'Search' },
]

import { ThemeToggle } from '@/components/theme-toggle'
import { logoutUser } from '@/lib/services/auth'
import { searchContent } from '@/lib/services/content'

interface NavbarProps {
  initialUser?: any
}

export function Navbar({ initialUser }: NavbarProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await logoutUser()
    window.location.href = '/'
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await searchContent(searchQuery.trim())
        const results = res.results?.filter((r: any) => r.media_type !== 'person').slice(0, 8) || []
        setSuggestions(results)
        setShowDropdown(true)
        setSelectedIndex(-1)
      } catch (e) {
        console.error(e)
      } finally {
        setIsSearching(false)
      }
    }, 400) // 400ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      const selected = suggestions[selectedIndex]
      navigateToContent(selected)
      return
    }
    
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
      setSearchQuery('')
      setShowDropdown(false)
    }
  }

  const navigateToContent = (item: any) => {
    router.push(`/movie/${item.id}?type=${item.media_type || 'movie'}`)
    setShowSearch(false)
    setSearchQuery('')
    setShowDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <img src="/logo.png?v=4" alt="Logo" className="h-8 w-8 object-cover rounded-md" />
          <span className="text-xl font-bold tracking-tight text-foreground sm:inline-block">CineSphere</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-110 hover:text-primary hover:[text-shadow:0_0_12px_currentColor] inline-block"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {/* Search */}
          {showSearch ? (
            <div ref={searchContainerRef} className="relative flex items-center">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (searchQuery.trim() && suggestions.length > 0) setShowDropdown(true)
                  }}
                  placeholder="Search..."
                  className="w-40 md:w-64 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  autoFocus
                />
                <button type="button" onClick={() => { setShowSearch(false); setSearchQuery(''); setShowDropdown(false) }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </form>
              
              {/* Autocomplete Dropdown */}
              {showDropdown && searchQuery.trim() !== '' && (
                <div className="absolute top-full mt-2 w-[calc(100%-1.5rem)] md:w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-lg py-2">
                  {isSearching && suggestions.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground text-center animate-pulse">Searching...</div>
                  ) : suggestions.length > 0 ? (
                    <div className="flex flex-col">
                      {suggestions.map((item, idx) => (
                        <div
                          key={`${item.media_type}-${item.id}`}
                          onClick={() => navigateToContent(item)}
                          className={`flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors ${
                            idx === selectedIndex ? 'bg-secondary' : 'hover:bg-muted'
                          }`}
                        >
                          {/* Poster */}
                          <div className="relative h-12 w-8 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                            {item.poster_path ? (
                              <Image 
                                src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} 
                                alt={item.title || item.name || 'Poster'} 
                                fill 
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                <Film className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          
                          {/* Details */}
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate text-sm font-semibold">{item.title || item.name}</span>
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                              <span>
                                {item.release_date ? item.release_date.substring(0, 4) : item.first_air_date ? item.first_air_date.substring(0, 4) : 'N/A'}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                              <div className="flex items-center gap-1">
                                {item.media_type === 'tv' ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                                <span className="uppercase">{item.media_type === 'tv' ? 'Series' : 'Movie'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                      No movies or series found.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          {initialUser ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold transition-colors hover:bg-primary/90"
              >
                {initialUser.username[0].toUpperCase()}
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-popover shadow-md py-1">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-semibold">{initialUser.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{initialUser.email}</p>
                  </div>
                  <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-muted">My Profile</Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted">Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Sign In
            </Link>
          )}

          <button
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
            aria-label="Menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-background px-4 py-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
