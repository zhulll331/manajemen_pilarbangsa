'use client'

import { Suspense, useTransition, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { login } from '../actions'
import { Loader2 } from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [isPending, startTransition] = useTransition()
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLocalError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await login(formData)
      } catch (err: unknown) {
        const errorObj = err as { digest?: string; message?: string }
        if (errorObj?.digest?.includes('NEXT_REDIRECT') || errorObj?.message?.includes('NEXT_REDIRECT')) {
          throw err
        }
        console.error('Login error:', err)
        setLocalError('Terjadi kesalahan saat masuk. Silakan coba lagi.')
      }
    })
  }

  const displayError = localError || error

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-[var(--color-primary)] p-8 text-center flex flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="bg-white p-3 rounded-full shadow-md w-20 h-20 flex items-center justify-center relative overflow-hidden">
            <Image 
              src="/logo_pilar.svg" 
              alt="Logo Pilar Bangsa" 
              fill
              className="object-contain p-2"
              priority
            />
          </div>
          <div className="bg-white p-3 rounded-full shadow-md w-20 h-20 flex items-center justify-center relative overflow-hidden">
            <Image 
              src="/logo_untag.svg" 
              alt="Logo Universitas" 
              fill
              className="object-contain p-2"
              priority
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Pilar Digital Office</h1>
        <p className="text-white/80">Silakan login untuk mengakses sistem</p>
      </div>
      
      <div className="p-8">
        {displayError && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
            <span>{displayError}</span>
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              disabled={isPending}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="email@pilarbangsa.org"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              disabled={isPending}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-all duration-200 mt-6 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </button>
        </form>
      </div>
      
      <div className="bg-gray-50 p-4 text-center text-sm text-gray-500 border-t border-gray-100">
        UKM Pilar Bangsa &copy; 2026
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin mb-2" />
          <p className="text-sm text-gray-500">Memuat formulir...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
