import { redirect } from 'next/navigation';
import {
  getAuthenticatedDashboardContext,
  getSelectedPeriodForDashboard,
} from '@/lib/periods/server';
import { canManagePeriodsRole } from '@/lib/periods/utils';
import {
  getClosingSummaryAction,
  getPeriodAuditLogsAction,
} from './actions';
import PeriodeClient from './PeriodeClient';

export const dynamic = 'force-dynamic';

export default async function PeriodePage() {
  const ctx = await getAuthenticatedDashboardContext().catch(() => null);
  if (!ctx) {
    redirect('/login');
  }

  if (!canManagePeriodsRole(ctx.role)) {
    redirect(`/dashboard/${ctx.role}`);
  }

  const [{ activePeriod, selectedPeriod, periods, schemaReady }, summaryRes, logsRes] =
    await Promise.all([
      getSelectedPeriodForDashboard(),
      getClosingSummaryAction(),
      getPeriodAuditLogsAction(),
    ]);

  return (
    <PeriodeClient
      periods={periods}
      activePeriod={activePeriod}
      selectedPeriod={selectedPeriod}
      schemaReady={schemaReady}
      closingSummary={summaryRes.data || null}
      auditLogs={logsRes.logs}
      actorRole={ctx.role}
    />
  );
}
