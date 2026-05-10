import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'erp-employee-time-tracker';

function toIsoString(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
}

function safeSecondsBetween(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
}

function normalizeActivity(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const status = String(raw.status ?? raw.state ?? '').toLowerCase();
  const startTime = toIsoString(raw.startTime ?? raw.start_time ?? raw.startedAt ?? raw.started_at);
  const projectId =
    raw.projectId ??
    raw.project_id ??
    (raw.project && typeof raw.project === 'object' ? raw.project.id : null) ??
    raw.project ??
    '';
  const lineIdRaw = raw.lineId ?? raw.line_id ?? null;
  const id = raw.id ?? raw.line_id ?? raw.activityId ?? raw.activity_id ?? `activity-${projectId || 'unknown'}`;

  if (!startTime || !projectId) return null;

  const lineId = lineIdRaw != null && lineIdRaw !== '' ? String(lineIdRaw) : String(id);

  return {
    id: String(id),
    lineId,
    projectId: String(projectId),
    description: String(raw.description ?? raw.taskDescription ?? raw.note ?? raw.notes ?? ''),
    startTime,
    status: status || 'running',
  };
}

export const useTimeTrackerStore = create(
  persist(
    (set, get) => ({
      activeActivity: null,
      history: [],

      start: ({ projectId, description = '', lineId = null, startTime: startTimeOverride = null } = {}) => {
        const existing = get().activeActivity;
        if (existing?.status === 'running') return existing;

        const resolvedStart = startTimeOverride ? toIsoString(startTimeOverride) : new Date().toISOString();
        const resolvedLineId = lineId != null && lineId !== '' ? String(lineId) : null;
        const next = {
          id: resolvedLineId || `tt-${Date.now()}`,
          lineId: resolvedLineId,
          projectId: String(projectId),
          description: String(description || ''),
          startTime: resolvedStart || new Date().toISOString(),
          status: 'running',
        };

        set({ activeActivity: next });
        return next;
      },

      stop: () => {
        const active = get().activeActivity;
        if (!active) return null;

        const endTime = new Date().toISOString();
        const duration = safeSecondsBetween(active.startTime, endTime);
        const finished = {
          ...active,
          status: 'stopped',
          endTime,
          duration,
        };

        set((state) => ({
          activeActivity: null,
          history: [finished, ...(Array.isArray(state.history) ? state.history : [])].slice(0, 100),
        }));

        return finished;
      },

      clearActive: () => set({ activeActivity: null }),

      /**
       * Sync running timer from GET /api/hr/time-trackers/today/ payload (`lines` with `status: running`).
       * Clears local active when the server has no running line.
       */
      syncFromTodayPayload: (payload) => {
        if (!payload || typeof payload !== 'object') return null;
        const lines = Array.isArray(payload.lines) ? payload.lines : [];
        const runningLine = lines.find((l) => String(l?.status ?? '').toLowerCase() === 'running');

        if (runningLine) {
          const normalized = normalizeActivity({
            ...runningLine,
            project_id: runningLine.project?.id ?? runningLine.project_id,
          });
          if (normalized) {
            const current = get().activeActivity;
            if (
              current?.status === 'running' &&
              current.lineId &&
              normalized.lineId &&
              String(current.lineId) === String(normalized.lineId)
            ) {
              return current;
            }
            set({ activeActivity: normalized });
            return normalized;
          }
          return null;
        }

        const current = get().activeActivity;
        if (current?.status === 'running') {
          set({ activeActivity: null });
        }
        return null;
      },

      syncFromActivities: (activities) => {
        const list = Array.isArray(activities) ? activities : [];
        const running = list.map(normalizeActivity).find((a) => a?.status === 'running');
        if (!running) return null;

        const current = get().activeActivity;
        if (current?.status === 'running' && String(current.id) === String(running.id)) return current;

        set({ activeActivity: running });
        return running;
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (state) => ({
        activeActivity: state.activeActivity,
        history: state.history,
      }),
    }
  )
);

