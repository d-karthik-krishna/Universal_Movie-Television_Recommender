'use client'

import React, { useRef, useState, useLayoutEffect, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'

interface AccordionItem {
  image: string
  label: string
  link: string
  alt: string
}

interface AccordionGalleryProps {
  items: AccordionItem[]
  defaultIndex?: number
  expandRatio?: number // Not strictly used if we just use flex ratio, but can be used for math
  trigger?: 'hover' | 'click'
  height?: number | string
  gap?: number
  radius?: number
  grayscale?: boolean
  parallax?: number
  tilt?: number
  showLabels?: boolean
}

export function AccordionGallery({
  items,
  defaultIndex = 0,
  expandRatio = 0.52,
  trigger = 'hover',
  height = 460,
  gap = 10,
  radius = 16,
  grayscale = true,
  parallax = 0.5,
  tilt = 8,
  showLabels = true
}: AccordionGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const imgRefs = useRef<(HTMLImageElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState(defaultIndex)
  const router = useRouter()

  const handleInteraction = (index: number) => {
    setActiveIndex(index)
  }

  const handleNavigation = (link: string) => {
    router.push(link)
  }

  useEffect(() => {
    if (!itemRefs.current.length || !imgRefs.current.length) return

    const expandedFlex = Math.max(2, expandRatio * 10)
    
    // Animate widths/flex using GSAP
    itemRefs.current.forEach((el, index) => {
      if (!el) return
      const isExpanded = index === activeIndex

      gsap.to(el, {
        flexGrow: isExpanded ? expandedFlex : 1,
        flexShrink: 1,
        flexBasis: isExpanded ? '50%' : '10%',
        duration: 0.8,
        ease: 'power3.out',
        overwrite: 'auto'
      })

      // Grayscale animation
      if (grayscale) {
        gsap.to(el, {
          filter: isExpanded ? 'grayscale(0%)' : 'grayscale(100%)',
          duration: 0.8,
          ease: 'power3.out',
          overwrite: 'auto'
        })
      }
    })

    // Parallax logic on images
    imgRefs.current.forEach((img, index) => {
      if (!img) return
      const isExpanded = index === activeIndex
      gsap.to(img, {
        x: isExpanded ? '0%' : '-15%',
        scale: isExpanded ? 1.05 : 1.2,
        duration: 0.8,
        ease: 'power3.out',
        overwrite: 'auto'
      })
    })

  }, [activeIndex, expandRatio, grayscale])

  return (
    <div
      ref={containerRef}
      className="flex w-full relative overflow-hidden"
      style={{
        height,
        gap: `${gap}px`,
        borderRadius: `${radius}px`
      }}
    >
      {items.map((item, index) => {
        const isExpanded = index === activeIndex

        return (
          <div
            key={index}
            ref={el => { itemRefs.current[index] = el }}
            className={`relative overflow-hidden cursor-pointer flex-1 group`}
            style={{
              borderRadius: `${radius}px`,
              filter: grayscale && !isExpanded ? 'grayscale(100%)' : 'grayscale(0%)'
            }}
            onMouseEnter={() => trigger === 'hover' && handleInteraction(index)}
            onClick={() => {
              if (trigger === 'click') handleInteraction(index)
              if (isExpanded) handleNavigation(item.link)
            }}
          >
            <div className="absolute inset-0 w-[150%] h-full">
              <img
                ref={el => { imgRefs.current[index] = el }}
                src={item.image}
                alt={item.alt}
                className="w-full h-full object-cover origin-center"
              />
            </div>

            {/* Gradient overlay for text */}
            <div 
              className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0'}`} 
            />

            {showLabels && (
              <div 
                className={`absolute bottom-6 left-6 right-6 transition-all duration-500 delay-100 ${
                  isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
              >
                <h3 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-md">
                  {item.label}
                </h3>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
