import React, { useState, useEffect } from 'react';
import { HardDrive, Loader2, AlertCircle } from 'lucide-react';

export function StorageWidget() {
  const [quota, setQuota] = useState<{ limit: string, usage: string, usageInDrive: string, usageInDriveTrash: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchQuota() {
      try {
        const res = await fetch('/api/drive/quota');
        if (!res.ok) throw new Error('Gagal memuat');
        const data = await res.json();
        if (data.storageQuota) {
          setQuota(data.storageQuota);
        } else {
          throw new Error('Data tidak valid');
        }
      } catch (err) {
        console.error('StorageWidget error:', err);
        setError('Tidak dapat mengambil info storage');
      } finally {
        setLoading(false);
      }
    }
    fetchQuota();
  }, []);

  if (error) {
    return (
      <div className=\g-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between\>
        <div className=\lex items-center space-x-4\>
          <div className=\w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center\>
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className=\	ext-gray-500 text-sm font-medium\>Sisa Storage (Google Drive)</h3>
            <p className=\	ext-red-500 text-sm font-bold\>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !quota) {
    return (
      <div className=\g-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between\>
        <div className=\lex items-center space-x-4\>
          <div className=\w-12 h-12 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center animate-pulse\>
            <HardDrive size={24} />
          </div>
          <div>
            <h3 className=\	ext-gray-500 text-sm font-medium\>Sisa Storage (Google Drive)</h3>
            <div className=\lex items-center space-x-2 text-gray-400 mt-1\>
              <Loader2 className=\w-4 h-4 animate-spin\ />
              <span className=\	ext-sm\>Menghitung...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const limit = parseInt(quota.limit, 10);
  const usage = parseInt(quota.usage, 10);
  const remaining = Math.max(0, limit - usage);
  const percentage = Math.min(100, Math.round((usage / limit) * 100));

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isWarning = percentage > 85;
  const isDanger = percentage > 95;

  return (
    <div className=\g-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4\>
      <div className=\lex items-center space-x-4\>
        <div className={\w-12 h-12 rounded-xl flex items-center justify-center \\}>
          <HardDrive size={24} />
        </div>
        <div className=\lex-1\>
          <h3 className=\	ext-gray-500 text-sm font-medium mb-1\>Sisa Storage (Google Drive)</h3>
          <div className=\lex items-end justify-between\>
            <p className=\	ext-2xl font-black text-gray-800\>{formatBytes(remaining)}</p>
            <p className=\	ext-xs font-bold text-gray-400 mb-1\>{percentage}% Terpakai</p>
          </div>
        </div>
      </div>
      <div className=\w-full bg-gray-100 rounded-full h-2 overflow-hidden\>
        <div 
          className={\h-2 rounded-full \\} 
          style={{ width: \\%\ }}
        ></div>
      </div>
      <div className=\lex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider\>
        <span>Terpakai: {formatBytes(usage)}</span>
        <span>Total: {formatBytes(limit)}</span>
      </div>
    </div>
  );
}
