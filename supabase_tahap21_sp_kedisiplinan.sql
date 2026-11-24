-- =========================================================================
-- TAHAP 21: SISTEM REKAP ABSENSI 3 BULANAN, SP 1 & SP 2 (KEDISIPLINAN)
-- Jalankan script ini di Supabase SQL Editor secara berurutan (idempoten).
-- =========================================================================

-- 1. Tambah kolom pelacakan SP 1 & SP 2 pada tabel members
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS warning_level TEXT NOT NULL DEFAULT 'none'
    CHECK (warning_level IN ('none', 'sp1', 'sp2')),
  ADD COLUMN IF NOT EXISTS sp1_issued_at DATE,
  ADD COLUMN IF NOT EXISTS sp1_note TEXT,
  ADD COLUMN IF NOT EXISTS sp2_issued_at DATE,
  ADD COLUMN IF NOT EXISTS sp2_note TEXT;

CREATE INDEX IF NOT EXISTS idx_members_period_warning_level
  ON public.members(period_id, warning_level);

-- 2. Tabel log audit kedisiplinan per periode
CREATE TABLE IF NOT EXISTS public.member_disciplinary_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE RESTRICT
    DEFAULT public.fn_get_active_period_id(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('sp1_issued', 'sp1_revoked', 'sp2_dismissed')),
  quarter_label TEXT,
  alpa_count INTEGER NOT NULL DEFAULT 0,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('auto_recap', 'manual', 'ai_import')),
  note TEXT,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  actor_role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_member_disciplinary_logs_period_id
  ON public.member_disciplinary_logs(period_id);

CREATE INDEX IF NOT EXISTS idx_member_disciplinary_logs_member_id
  ON public.member_disciplinary_logs(member_id);

-- 3. Row Level Security untuk tabel log kedisiplinan
ALTER TABLE public.member_disciplinary_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read disciplinary logs" ON public.member_disciplinary_logs;
CREATE POLICY "Authenticated can read disciplinary logs"
  ON public.member_disciplinary_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Managers can insert disciplinary logs" ON public.member_disciplinary_logs;
CREATE POLICY "Managers can insert disciplinary logs"
  ON public.member_disciplinary_logs FOR INSERT
  WITH CHECK (public.is_period_manager());

-- 4. Trigger proteksi kunci permanen periode (konsisten dengan Tahap 20)
DO $$
BEGIN
  IF to_regprocedure('public.fn_block_mutation_on_locked_period()') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_member_disciplinary_logs_lock_period ON public.member_disciplinary_logs;
    CREATE TRIGGER trg_member_disciplinary_logs_lock_period
      BEFORE INSERT OR UPDATE OR DELETE ON public.member_disciplinary_logs
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_block_mutation_on_locked_period();
  END IF;
END $$;
