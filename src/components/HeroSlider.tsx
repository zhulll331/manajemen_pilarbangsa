'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

const defaultSlides = [
  {
    id: 1,
    title: "Pilar Bangsa Digital Office",
    subtitle: "Wadah Transformasi & Kolaborasi Mahasiswa Universitas",
    description: "Mewujudkan tata kelola organisasi yang modern, transparan, dan akuntabel berbasis sistem digital terpadu sesuai Misi ke-2 Kepengurusan 2026/2027.",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    badge: "Transformasi Digital",
    accentColor: "#E31837" // Merah
  },
  {
    id: 2,
    title: "Tri Dharma Perguruan Tinggi",
    subtitle: "Pilar Pembelajaran, Penelitian, dan Pengabdian",
    description: "Bersama membangun bangsa melalui riset inovatif dan pengabdian masyarakat yang berkelanjutan dan tepat sasaran.",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    badge: "Inovasi & Riset",
    accentColor: "#008000" // Hijau
  },
  {
    id: 3,
    title: "Berlandaskan Trisakti Sukarno",
    subtitle: "Berdaulat, Berdikari, dan Berkepribadian",
    description: "Membentuk karakter kepemimpinan mahasiswa yang berakar pada budaya bangsa dan berdaya saing global.",
    image: "https://images.unsplash.com/photo-1517486808906-697b691ed59b?auto=format&fit=crop&w=1200&q=80",
    badge: "Kepemimpinan",
    accentColor: "#FFD700" // Kuning
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
  const [slides, setSlides] = useState(defaultSlides)

  const supabase = createClient()

  useEffect(() => {
    async function fetchBanners() {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('id', { ascending: true })

      if (!error && data && data.length > 0) {
        const liveSlides = defaultSlides.map((defSlide) => {
          const found = data.find((b: any) => b.id === defSlide.id)
          if (found) {
            return {
              ...defSlide,
              title: found.title || defSlide.title,
              subtitle: found.subtitle || defSlide.subtitle,
              description: found.description || defSlide.description,
              image: getCleanImageUrl(found.image_url, defSlide.image),
              badge: found.badge || defSlide.badge,
              accentColor: found.accent_color || defSlide.accentColor
            }
          }
          return defSlide
        })
        setSlides(liveSlides)
      }
    }

    fetchBanners()
  }, [])

  useEffect(() => {
    if (isPaused) return

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
            src={slide.image}
            alt={slide.title}
            className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out group-hover:scale-100"
          />

          {/* Content */}
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 md:p-12 text-white">
            <div className="max-w-4xl text-center space-y-6">
              {/* Badge */}
              <div className="inline-block px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold tracking-wider uppercase bg-white/10 backdrop-blur-md border border-white/20 shadow-lg"
                   style={{ borderLeft: `4px solid ${slide.accentColor}` }}>
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
                <a
                  href="#tentang"
                  className="px-8 py-3 rounded-xl font-bold text-black bg-white hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Pelajari Lebih Lanjut
                </a>
                <a
                  href="/program-kerja"
                  className="px-8 py-3 rounded-xl font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Program Kerja
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Manual Navigation Buttons */}
      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-xl"
      >
        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-xl"
      >
        <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
      </button>

      {/* Indicator Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex space-x-3">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-500 ${
              index === currentSlide 
                ? 'bg-white scale-125 shadow-lg shadow-white/50' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
