import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  ownerUserId: string;
  isOwner: boolean;
}

interface WorkspaceState {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
  setWorkspaces: (workspaces: WorkspaceSummary[]) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      activeWorkspaceId: null,
      setWorkspaces: (workspaces) =>
        set((state) => {
          const stillValid = workspaces.some((item) => item.id === state.activeWorkspaceId);
          return {
            workspaces,
            activeWorkspaceId: stillValid
              ? state.activeWorkspaceId
              : workspaces[0]?.id || null,
          };
        }),
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
      clearWorkspace: () => set({ workspaces: [], activeWorkspaceId: null }),
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
        workspaces: state.workspaces,
      }),
    }
  )
);
