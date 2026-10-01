export type MissionNotification = {
  id: number; audience: 'admin' | 'driver'; driverId: number | null; missionId: number;
  kind: 'assigned' | 'accepted' | 'arrived'; title: string; message: string;
  createdAtUtc: string; readAtUtc: string | null;
};
export function unseenUnread(items: MissionNotification[], seen: Set<number>): MissionNotification[] {
  return items.filter(item => !item.readAtUtc && !seen.has(item.id)).sort((a, b) => a.id - b.id);
}
export function workflowLabel(dispatch: { status: string | number; acceptedAtUtc?: string | null; arrivedAtUtc?: string | null }): string {
  if (['3', 'completed'].includes(String(dispatch.status).toLowerCase())) return 'تکمیل شده';
  if (['4', 'cancelled'].includes(String(dispatch.status).toLowerCase())) return 'لغو شده';
  if (dispatch.arrivedAtUtc) return 'رسیده به مقصد';
  if (dispatch.acceptedAtUtc) return ['2', 'started', 'inprogress', 'in_progress'].includes(String(dispatch.status).toLowerCase()) ? 'در حال حرکت' : 'پذیرفته شده';
  if (['2', 'started', 'inprogress', 'in_progress'].includes(String(dispatch.status).toLowerCase())) return 'در حال حرکت';
  return 'در انتظار پذیرش راننده';
}

export function missionNextAction(dispatch: { status: string | number; acceptedAtUtc?: string | null; arrivedAtUtc?: string | null }): 'accept' | 'start' | 'arrive' | 'complete' | null {
  const status = String(dispatch.status).toLowerCase();
  if (['1', 'assigned'].includes(status)) return dispatch.acceptedAtUtc ? 'start' : 'accept';
  if (['2', 'started', 'inprogress', 'in_progress'].includes(status)) return dispatch.arrivedAtUtc ? 'complete' : 'arrive';
  return null;
}
