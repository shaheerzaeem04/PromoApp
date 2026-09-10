export function publicSpinSegments(campaign: any, queryResponse?: any): any[] {
  const fromQuery = queryResponse?.data?.data;
  if (Array.isArray(fromQuery) && fromQuery.length > 0) return fromQuery;
  if (Array.isArray(campaign?.spinWheelSegments) && campaign.spinWheelSegments.length > 0) {
    return campaign.spinWheelSegments;
  }
  return [];
}

export function mapWheelSegments(segments: any[]) {
  return segments.map((segment) => ({
    id: segment.id,
    label: segment.label,
    color: segment.color || '#6366f1',
    rewardType: segment.rewardType || 'BONUS_ENTRIES',
  }));
}
