import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { projectService } from '@/services/project.service';
import { Project, ProjectType } from '@/types';

interface ProjectStoreState {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

interface ProjectStore extends ProjectStoreState {
  // Getters
  getSelectedProject: () => Project | null;
  getProjectById: (_id: string) => Project | null;
  getProjectsByType: (_type: ProjectType) => Project[];

  // Actions
  fetchProjects: () => Promise<void>;
  selectProject: (_project: Project | null) => void;
  clearSelectedProject: () => void;
}

const useProjectStore = create<ProjectStore>()(
  persist(
    immer((set, get) => ({
      // --- STATE ---
      projects: [],
      selectedProject: null,
      isLoading: false,
      error: null,

      // --- GETTERS ---
      getSelectedProject: () => {
        return get().selectedProject;
      },

      getProjectById: (id: string) => {
        return get().projects.find(p => p.id === id || p._id === id) || null;
      },

      getProjectsByType: (type: ProjectType) => {
        return get().projects.filter(p => p.type === type);
      },

      // --- ACTIONS ---
      fetchProjects: async () => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await projectService.getProjects();
          set(state => {
            state.projects = response.data.projects.map((p: any) => ({
              ...p,
              id: p._id || p.id,
            }));
            state.isLoading = false;
          });
        } catch (error) {
          set(state => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch projects';
            state.isLoading = false;
          });
          throw error;
        }
      },

      selectProject: (project: Project | null) => {
        set(state => {
          state.selectedProject = project;
        });
      },

      clearSelectedProject: () => {
        set(state => {
          state.selectedProject = null;
        });
      },
    })),
    {
      name: 'project-store',
      partialize: (state) => ({
        selectedProject: state.selectedProject,
      }),
    }
  )
);

export default useProjectStore;

