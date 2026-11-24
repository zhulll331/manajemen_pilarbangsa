import { NextResponse } from 'next/server';
import {
  getAuthenticatedDashboardContext,
  getSelectedPeriodForDashboard,
} from '@/lib/periods/server';

export async function GET() {
  try {
    await getAuthenticatedDashboardContext();
    const { selectedPeriod, activePeriod, isLocked, schemaReady } =
      await getSelectedPeriodForDashboard();

    return NextResponse.json(
      {
        selectedPeriodId: selectedPeriod.id,
        selectedPeriodCode: selectedPeriod.code,
        activePeriodId: activePeriod.id,
        activePeriodCode: activePeriod.code,
        isLocked,
        schemaReady,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
