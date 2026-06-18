"use client";

import { useState } from "react";
import { User, Shield, Mail, Save, AlertCircle, CheckCircle } from "lucide-react";
import { updateProfile } from "./actions";

interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

export default function ProfilClient({ profile }: { profile: ProfileData }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const roleName = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    const formData = new FormData(e.currentTarget);
    try {
      await updateProfile(formData);
      setMessage({ text: "Profil berhasil diperbarui!", type: "success" });
    } catch (error: any) {
      setMessage({ text: error.message || "Gagal memperbarui profil.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-blue-100 text-[var(--color-primary)]">
          <User size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Profil Saya</h1>
          <p className="text-sm text-gray-500">Kelola informasi akun dan identitas Anda</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Banner */}
        <div className="h-32 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"></div>
        
        <div className="px-8 pb-8 relative">
          {/* Avatar Area */}
          <div className="absolute -top-16 left-8">
            <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
              <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <User size={64} />
              </div>
            </div>
          </div>

          <div className="pt-20">
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message.type === 'success' ? <CheckCircle size={20} className="mt-0.5" /> : <AlertCircle size={20} className="mt-0.5" />}
                <p className="font-medium">{message.text}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Informasi Akun (Readonly) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Informasi Akun</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      Email Login
                    </label>
                    <input 
                      type="text" 
                      value={profile.email} 
                      disabled 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400">Email tidak dapat diubah.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Shield size={16} className="text-gray-400" />
                      Hak Akses (Role)
                    </label>
                    <input 
                      type="text" 
                      value={roleName} 
                      disabled 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                {/* Profil Pengguna (Editable) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Data Pribadi</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Nama Lengkap
                    </label>
                    <input 
                      type="text" 
                      name="full_name"
                      defaultValue={profile.full_name || ""} 
                      placeholder="Masukkan nama lengkap Anda..."
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Menyimpan..." : (
                    <>
                      <Save size={18} />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
