'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

const fallbackSlides = [
  {
    id: 1,
    title: "Pilar Bangsa Digital Office",
    subtitle: "Wadah Transformasi & Kolaborasi Mahasiswa Universitas",
    description: "Mewujudkan tata kelola organisasi yang modern, transparan, dan akuntabel berbasis sistem digital terpadu.",
    image_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    badge: "Transformasi Digital",
    accent_color: "#E31837" // Merah
  }
]

function getCleanImageUrl(url: string, defaultImg: string) {
  if (!url) return defaultImg
  if (url.includes('drive.google.com')) {
    const match = url.match(/id=([^&]+)/) || url.match(/d\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return `/api/drive/image?id=${match[1]}`
    }
  }
  return url
}

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [slides, setSlides] = useState<any[]>(fallbackSlides)

  const supabase = createClient()

  useEffect(() => {
    async function fetchBanners() {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('id', { ascending: true })

      if (!error && data && data.length > 0) {
        setSlides(data)
      }
    }

    fetchBanners()
  }, [])

  useEffect(() => {
    if (isPaused || slides.length <= 1) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [isPaused, slides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  if (!slides || slides.length === 0) return null;

  return (
    <div 
      className="relative w-full h-[550px] md:h-[650px] overflow-hidden rounded-3xl shadow-2xl bg-black group my-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 bg-black/60 z-10" />
          <img
            src={getCleanImageUrl(slide.image_url, fallbackSlides[0].image_url)}
            alt={slide.title}
            className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out group-hover:scale-100"
          />

          {/* Content */}
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 md:p-12 text-white">
            <div className="max-w-4xl text-center space-y-6">
              {/* Badge */}
              <div className="inline-block px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold tracking-wider uppercase bg-white/10 backdrop-blur-md border border-white/20 shadow-lg"
                   style={{ borderLeft: `4px solid ${slide.accent_color}` }}>
                {slide.badge}
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-extrabold tracking-tight leading-tight drop-shadow-md">
                {slide.title}
              </h2>

              {/* Subtitle */}
              <p className="text-base sm:text-xl md:text-2xl font-medium text-gray-200 drop-shadow">
                {slide.subtitle}
              </p>

              {/* Description */}
              <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto line-clamp-3">
                {slide.description}
              </p>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap gap-4 justify-center">
                <Link
                  href="/program-kerja"
                  className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Lihat Program Kerja
                </Link>
                <Link
                  href="/tentang-kami"
                  className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/30 text-white font-semibold rounded-full hover:bg-white/20 transition-colors shadow-lg"
                >
                  Pelajari Lebih Lanjut
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 rounded-full bg-black/30 backdrop-blur-sm text-white/70 hover:text-white border border-white/10 hover:border-white/30 transition-all opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} className="md:w-8 md:h-8" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 rounded-full bg-black/30 backdrop-blur-sm text-white/70 hover:text-white border border-white/10 hover:border-white/30 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
            aria-label="Next slide"
          >
            <ChevronRight size={24} className="md:w-8 md:h-8" />
          </button>
        </>
      )}

      {/* Navigation Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide 
                  ? 'w-8 h-2.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' 
                  : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 z-30">
          <div 
            className="h-full bg-white transition-all duration-[4000ms] ease-linear"
            style={{ 
              width: isPaused ? '100%' : currentSlide === 0 && !isPaused ? '0%' : '100%',
              transition: isPaused ? 'none' : 'width 4000ms linear'
            }}
          />
        </div>
      )}
    </div>
  )
}
