"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useAds } from "./ad-provider"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface AdSlotProps {
  slotId: string
  width: number
  height: number
  className?: string
  refreshInterval?: number // in seconds
  fallback?: React.ReactNode
}

export function AdSlot({ 
  slotId, 
  width, 
  height, 
  className,
  refreshInterval = 30,
  fallback
}: AdSlotProps) {
  const { getBannersForSlot, trackImpression, trackClick, isLoading, isOffline } = useAds()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const impressionTracked = useRef<Set<string>>(new Set())

  const banners = getBannersForSlot(slotId)
  const currentBanner = banners[currentIndex]

  // Track impression when banner becomes visible
  useEffect(() => {
    if (!currentBanner || !isVisible) return

    const key = `${currentBanner.id}-${currentIndex}`
    if (impressionTracked.current.has(key)) return

    // Find campaign for this banner
    const campaign = banners.find(b => b.id === currentBanner.id)
    if (campaign) {
      // We need to get the campaign from context - simplified for now
      trackImpression(slotId, currentBanner.id, slotId)
      impressionTracked.current.add(key)
    }
  }, [currentBanner, isVisible, currentIndex, banners, slotId, trackImpression])

  // Intersection observer for visibility tracking
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.5 }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Rotate banners
  useEffect(() => {
    if (banners.length <= 1 || !isVisible) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [banners.length, refreshInterval, isVisible])

  const handleClick = useCallback(() => {
    if (!currentBanner) return
    trackClick(slotId, currentBanner.id, slotId)
  }, [currentBanner, slotId, trackClick])

  if (isLoading) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "animate-pulse bg-muted rounded",
          className
        )}
        style={{ width, height }}
      />
    )
  }

  if (!currentBanner) {
    if (fallback) {
      return <>{fallback}</>
    }
    return (
      <div 
        ref={containerRef}
        className={cn(
          "flex items-center justify-center bg-muted/50 rounded border border-dashed text-xs text-muted-foreground",
          className
        )}
        style={{ width, height }}
      >
        Ad Space Available
      </div>
    )
  }

  const content = (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded transition-opacity duration-300",
        isOffline && "opacity-90",
        className
      )}
      style={{ width, height }}
    >
      {currentBanner.image_url && (
        <Image
          src={currentBanner.image_url}
          alt={currentBanner.alt_text || currentBanner.name}
          fill
          className="object-cover"
          sizes={`${width}px`}
          priority={currentIndex === 0}
        />
      )}
      {isOffline && (
        <div className="absolute bottom-1 right-1 rounded bg-background/80 px-1 py-0.5 text-[10px] text-muted-foreground">
          Cached
        </div>
      )}
      {banners.length > 1 && (
        <div className="absolute bottom-1 left-1 flex gap-1">
          {banners.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1 w-1 rounded-full",
                idx === currentIndex ? "bg-white" : "bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )

  if (currentBanner.target_url) {
    return (
      <a 
        href={currentBanner.target_url} 
        target="_blank" 
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className="block"
      >
        {content}
      </a>
    )
  }

  return content
}
