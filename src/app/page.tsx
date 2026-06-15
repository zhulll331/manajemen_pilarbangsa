import { login } from './actions'
import Image from 'next/image'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  const error = searchParams?.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[var(--color-primary)] p-8 text-center flex flex-col items-center justify-center">
          <div className="bg-white p-3 rounded-full mb-4 shadow-md w-24 h-24 flex items-center justify-center relative overflow-hidden">
            <Image 
              src="/logo_pilar.svg" 
              alt="Logo Pilar Bangsa" 
              fill
              className="object-contain p-2"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Pilar Digital Office</h1>
          <p className="text-white/80">Silakan login untuk mengakses sistem</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form className="space-y-4" action={login}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                Email
              </label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all text-gray-900"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all text-gray-900"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-medium py-2.5 rounded-xl transition-colors mt-6"
            >
              Masuk
            </button>
          </form>
        </div>
        
        <div className="bg-gray-50 p-4 text-center text-sm text-gray-500 border-t border-gray-100">
          UKM Pilar Bangsa &copy; 2026
        </div>
      </div>
    </div>
  )
}
