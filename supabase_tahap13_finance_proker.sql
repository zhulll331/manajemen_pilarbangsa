-- =========================================================================
-- Tahap 13: Menambahkan relasi program_id ke finance_transactions
-- =========================================================================

-- Menambahkan kolom program_id ke finance_transactions yang merelasikan tabel programs
ALTER TABLE public.finance_transactions 
ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL;

-- Notify pgrst to reload the schema to clear any cache and allow joining
NOTIFY pgrst, 'reload schema';
