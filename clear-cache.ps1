# Script untuk membersihkan semua cache Next.js / Turbopack
# Jalankan setelah mematikan dev server (Ctrl+C)

Write-Host "Membersihkan cache Next.js / Turbopack..." -ForegroundColor Yellow

# Hapus seluruh folder .next
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Folder .next berhasil dihapus" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Folder .next tidak ditemukan" -ForegroundColor Cyan
}

# Hapus node_modules/.cache jika ada
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✅ node_modules/.cache berhasil dihapus" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Semua cache bersih! Sekarang jalankan: npm run dev" -ForegroundColor Green
