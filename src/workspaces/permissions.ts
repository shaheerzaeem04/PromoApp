export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';

/** Mirrors backend winners.manage: OWNER and ADMIN only. */
export function canManageWinners(role?: WorkspaceRole | string | null): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}
