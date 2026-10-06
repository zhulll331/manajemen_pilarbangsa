'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { pilarPhotos, type PilarPhoto } from '@/data/pilarPhotos'
import styles from './PilarPhotoMarquee.module.css'

const motionQuery = '(prefers-reduced-motion: reduce)'
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery)
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}
const getMotion = () => window.matchMedia(motionQuery).matches
const getServerMotion = () => false

interface PilarPhotoMarqueeProps {
  photos?: readonly PilarPhoto[]
  speed?: number // Pixels per second; independent of the number of photos.
}

export function PilarPhotoMarquee({ photos = pilarPhotos, speed = 28 }: PilarPhotoMarqueeProps) {
  const stripId = useId()
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<HTMLUListElement>(null)
  const animationRef = useRef<Animation | null>(null)
  const phaseRef = useRef(0)
  const [copies, setCopies] = useState(2)
  const [hovered, setHovered] = useState(false)
  const reducedMotion = useSyncExternalStore(subscribeMotion, getMotion, getServerMotion)
  const pixelsPerSecond = Number.isFinite(speed) && speed > 0 ? speed : 28
  const pauseRef = useRef(hovered)

  useEffect(() => {
    pauseRef.current = hovered
    const animation = animationRef.current
    if (!animation) return
    if (hovered) animation.pause()
    else animation.play()
  }, [hovered])

  useEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    const group = groupRef.current
    if (!viewport || !track || !group || reducedMotion || photos.length === 0) return

    let distance = 0
    let duration = 0
    const stop = () => {
      const animation = animationRef.current
      if (!animation) return
      if (duration && typeof animation.currentTime === 'number') {
        phaseRef.current = (animation.currentTime % duration) / duration
      }
      animation.cancel()
      animationRef.current = null
    }
    const measure = () => {
      // offsetWidth includes the trailing gap and ignores the moving transform.
      const nextDistance = group.offsetWidth
      if (!nextDistance) return
      setCopies(Math.max(2, Math.ceil(viewport.clientWidth / nextDistance) + 2))
      if (distance === nextDistance && animationRef.current) return
      stop()
      distance = nextDistance
      duration = distance / pixelsPerSecond * 1000
      const animation = track.animate(
        [{ transform: 'translateX(0)' }, { transform: `translateX(-${distance}px)` }],
        { duration, iterations: Infinity, easing: 'linear' },
      )
      animation.currentTime = phaseRef.current * duration
      if (pauseRef.current) animation.pause()
      animationRef.current = animation
    }
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(group)
    return () => { observer.disconnect(); stop() }
  }, [photos, pixelsPerSecond, reducedMotion])

  if (photos.length === 0) return null

  return (
    <section className={styles.section} aria-labelledby={`${stripId}-title`}>
      <div className={styles.header}>
        <p className={styles.label}>KEHIDUPAN DI PILAR BANGSA</p>
        <h2 id={`${stripId}-title`} className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">Momen Pilar Bangsa</h2>
        <p className={styles.description}>Belajar, berkolaborasi, dan mengabdi. Setiap langkah menghadirkan cerita bersama Pilar Bangsa.</p>
      </div>

      <div
        id={stripId}
        ref={viewportRef}
        className={styles.viewport}
        role="region"
        aria-label="Dokumentasi foto kegiatan Pilar Bangsa"
        aria-describedby={reducedMotion ? `${stripId}-hint` : undefined}
        tabIndex={reducedMotion ? 0 : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div ref={trackRef} className={styles.track}>
          {Array.from({ length: reducedMotion ? 1 : copies }, (_, copy) => (
            <ul key={copy} ref={copy === 0 ? groupRef : undefined} className={styles.group} aria-hidden={copy > 0 ? true : undefined}>
              {photos.map(photo => (
                <li key={photo.id} className={styles.card} style={{ '--photo-rotation': `${photo.rotation}deg` } as CSSProperties}>
                  <div className={styles.frame}>
                    <div className={styles.photo}>
                      <Image
                        src={photo.src}
                        alt={copy === 0 ? photo.alt : ''}
                        fill
                        loading="eager"
                        // Cover crops a landscape image horizontally: request enough
                        // pixels for its square crop, rather than only its CSS width.
                        sizes={`(max-width: 639px) ${Math.ceil(170 * Math.max(1, photo.src.width / photo.src.height))}px, ${Math.ceil(230 * Math.max(1, photo.src.width / photo.src.height))}px`}
                        style={{ objectFit: 'cover', objectPosition: photo.objectPosition }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className={styles.controls}>
        <Link href="/arsip" className={styles.archive}>Lihat Arsip UKM <ArrowRight size={17} aria-hidden="true" /></Link>
        {reducedMotion && (
          <p id={`${stripId}-hint`} className={styles.hint}>Geser foto atau gunakan tombol panah.</p>
        )}
      </div>
    </section>
  )
}
