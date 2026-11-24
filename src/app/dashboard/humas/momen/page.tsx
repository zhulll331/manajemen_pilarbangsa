import { redirect } from 'next/navigation';
import { getDashboardMomentPhotos } from '@/lib/momentPhotos';
import {
  getAuthenticatedDashboardContext,
  getSelectedPeriodForDashboard,
} from '@/lib/periods/server';
import MomenClient from './MomenClient';

export default async function MomenPilarBangsaPage() {
  const ctx = await getAuthenticatedDashboardContext().catch(() => null);
  if (!ctx) {
    redirect('/login');
  }

  const canAccess = ctx.role === 'humas' || ctx.role === 'ketua';
  if (!canAccess) {
    redirect(`/dashboard/${ctx.role}`);
  }

  const { selectedPeriod, isLocked, schemaReady } =
    await getSelectedPeriodForDashboard();
  const { photos, tableReady } = await getDashboardMomentPhotos(
    schemaReady ? selectedPeriod.id : null
  );

  return (
    <MomenClient
      initialPhotos={photos}
      isLocked={isLocked}
      periodId={selectedPeriod.id}
      periodCode={selectedPeriod.code}
      tableReady={tableReady}
    />
  );
}
