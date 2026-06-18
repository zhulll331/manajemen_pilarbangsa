"use client";

import { useRef, useState } from "react";
import { Upload, Download, AlertTriangle, FileText, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx";

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<void>;
  templateHeaders: string[];
  title?: string;
}

export function ImportCSVModal({
  isOpen,
  onClose,
  onImport,
  templateHeaders,
  title = "Import Data CSV",
}: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      templateHeaders.reduce((acc, header) => ({ ...acc, [header as string]: "" }), {})
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    
    const wscols = templateHeaders.map(() => ({ wch: 20 }));
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `template_${title.replace(/\s+/g, '_').toLowerCase()}.xlsx`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    setSuccessMsg("");
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const handleImport = () => {
    if (!file) {
      setErrorMsg("Pilih file Excel/CSV terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const plainData = JSON.parse(JSON.stringify(jsonData));

        if (plainData.length === 0) {
          setErrorMsg("File kosong atau format tidak sesuai.");
          setIsLoading(false);
          return;
        }

        await onImport(plainData);
        setSuccessMsg(`Berhasil mengimpor ${plainData.length} baris data!`);
        setTimeout(() => {
          onClose();
          setFile(null);
          setSuccessMsg("");
        }, 2000);
      } catch (error: any) {
        setErrorMsg(error.message || "Gagal memproses file. Pastikan format sesuai template.");
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setErrorMsg("Gagal membaca file.");
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title.replace("CSV", "Excel")}</h3>
        <p className="text-sm text-gray-500 mb-6">
          Impor data secara massal menggunakan file Excel (.xlsx) atau CSV. Pastikan kolom sesuai dengan template yang disediakan.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
            <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-green-700">{successMsg}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-center">
            <div className="flex justify-center mb-3">
              <FileText size={32} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {file ? file.name : "Unggah file Excel/CSV Anda di sini"}
            </p>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Pilih File
            </button>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-[var(--color-primary)] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
          >
            <Download size={16} />
            Unduh Template Excel
          </button>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleImport}
            disabled={isLoading || !file}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? "Memproses..." : (
              <>
                <Upload size={18} />
                Import Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
