"use client";

import { Bell, Search, User, Menu } from "lucide-react";

export function Header({ role = "ketua", name = "Pengguna", onMenuClick }: { role?: string, name?: string, onMenuClick?: () => void }) {
  // Capitalize first letter of role
  const roleName = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <header className="h-16 md:h-20 bg-white border-b border-gray-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-3">
        <button 
          className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" 
          onClick={onMenuClick}
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-800">Dashboard {roleName}</h1>
          <p className="text-xs md:text-sm text-gray-500 hidden sm:block">Selamat datang kembali, {name}!</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari sesuatu..." 
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent w-64"
          />
        </div>

        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
          <div className="w-10 h-10 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-white">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-700">{name}</p>
            <p className="text-xs text-gray-500 text-right">{roleName}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
