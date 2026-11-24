export type PeriodStatus = 'draft' | 'active' | 'locked';

export const PERIOD_COOKIE_NAME = 'pb_selected_period_id';

export interface OrganizationPeriod {
  id: string;
  code: string;
  name: string;
  cabinet_name: string | null;
  theme: string | null;
  start_year: number;
  end_year: number;
  start_date: string;
  end_date: string;
  status: PeriodStatus;
  visi_misi: unknown;
  struktur_pimpinan: unknown;
  locked_at: string | null;
  locked_by: string | null;
  lock_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PeriodAuditLog {
  id: string;
  period_id: string | null;
  actor_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  summary: Record<string, unknown>;
  created_at: string;
}

export interface PeriodClosingSummary {
  period: OrganizationPeriod;
  counts: {
    membersActive: number;
    membersDismissed: number;
    membersTotal: number;
    programsTotal: number;
    agendasTotal: number;
    lettersTotal: number;
    minutesTotal: number;
    transactionsTotal: number;
    momentPhotosTotal: number;
    publicEventsTotal: number;
  };
  financialIncome: number;
  financialExpense: number;
  financialBalance: number;
}

export interface CarryOverOptions {
  members: boolean;
  heroSlides: boolean;
  momentPhotos: boolean;
  visiMisi: boolean;
  strukturPimpinan: boolean;
}

export interface TransitionPeriodPayload {
  newCode: string;
  newName: string;
  cabinetName?: string;
  theme?: string;
  startYear: number;
  endYear: number;
  startDate: string;
  endDate: string;
  lockNotes?: string;
  confirmCode: string;
  carryOver: CarryOverOptions;
}
