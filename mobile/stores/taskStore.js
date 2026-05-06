import { create } from 'zustand';
import { saveTasks, loadTasks } from '../lib/storage';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export const useTaskStore = create((set, get) => ({
  tasks: [],
  loaded: false,

  hydrate: async () => {
    const tasks = await loadTasks();
    set({ tasks, loaded: true });
  },

  addTask: async (taskData) => {
    const task = {
      id: generateId(),
      title: taskData.title,
      description: taskData.description || '',
      estimatedMinutes: taskData.estimatedMinutes,
      dueDate: taskData.dueDate,
      priority: taskData.priority || 'normal',
      steps: taskData.steps.map((s, i) => ({
        id: generateId(),
        title: typeof s === 'string' ? s : s.title,
        notes: typeof s === 'string' ? '' : (s.notes || ''),
        estimatedMinutes: typeof s === 'string' ? null : (s.minutes ? parseInt(s.minutes, 10) : null),
        order: i,
        completed: false,
      })),
      completed: false,
      flemmeActive: false,
      flemmeActivatedAt: null,
      flemmeCallCount: 0,
      createdAt: new Date().toISOString(),
      xp: 0,
    };
    const tasks = [...get().tasks, task];
    set({ tasks });
    await saveTasks(tasks);
    return task;
  },

  updateTask: async (taskId, taskData) => {
    const existing = get().tasks.find((t) => t.id === taskId);
    if (!existing) return;

    const updatedSteps = taskData.steps.map((s, i) => {
      const existingStep = existing.steps[i];
      return {
        id: existingStep?.id || generateId(),
        title: typeof s === 'string' ? s : s.title,
        notes: typeof s === 'string' ? (existingStep?.notes || '') : (s.notes || existingStep?.notes || ''),
        estimatedMinutes: typeof s === 'string' ? (existingStep?.estimatedMinutes || null) : (s.minutes ? parseInt(s.minutes, 10) : null),
        order: i,
        completed: existingStep?.completed || false,
      };
    });

    const tasks = get().tasks.map((t) =>
      t.id !== taskId ? t : {
        ...t,
        title: taskData.title,
        description: taskData.description || '',
        estimatedMinutes: taskData.estimatedMinutes,
        dueDate: taskData.dueDate,
        priority: taskData.priority || t.priority,
        steps: updatedSteps,
      }
    );
    set({ tasks });
    await saveTasks(tasks);
  },

  completeStep: async (taskId, stepId) => {
    const tasks = get().tasks.map((t) => {
      if (t.id !== taskId) return t;
      const steps = t.steps.map((s) =>
        s.id === stepId ? { ...s, completed: true } : s
      );
      const allDone = steps.every((s) => s.completed);
      return { ...t, steps, completed: allDone, xp: t.xp + 10 };
    });
    set({ tasks });
    await saveTasks(tasks);
  },

  uncompleteStep: async (taskId, stepId) => {
    const tasks = get().tasks.map((t) => {
      if (t.id !== taskId) return t;
      const steps = t.steps.map((s) =>
        s.id === stepId ? { ...s, completed: false } : s
      );
      return { ...t, steps, completed: false, xp: Math.max(0, t.xp - 10) };
    });
    set({ tasks });
    await saveTasks(tasks);
  },

  updateStepNotes: async (taskId, stepId, notes) => {
    const tasks = get().tasks.map((t) => {
      if (t.id !== taskId) return t;
      return { ...t, steps: t.steps.map((s) => s.id === stepId ? { ...s, notes } : s) };
    });
    set({ tasks });
    await saveTasks(tasks);
  },

  completeTask: async (taskId) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId
        ? { ...t, completed: true, flemmeActive: false, completedAt: new Date().toISOString(), xp: t.xp + 50 }
        : t
    );
    set({ tasks });
    await saveTasks(tasks);
  },

  uncompleteTask: async (taskId) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId
        ? { ...t, completed: false, flemmeActive: false, completedAt: null, xp: Math.max(0, t.xp - 50) }
        : t
    );
    set({ tasks });
    await saveTasks(tasks);
  },

  activateFlemme: async (taskId) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId
        ? { ...t, flemmeActive: true, flemmeActivatedAt: t.flemmeActivatedAt || new Date().toISOString() }
        : t
    );
    set({ tasks });
    await saveTasks(tasks);
  },

  incrementFlemmeCall: async (taskId) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId ? { ...t, flemmeCallCount: (t.flemmeCallCount || 0) + 1 } : t
    );
    set({ tasks });
    await saveTasks(tasks);
  },

  deleteTask: async (taskId) => {
    const tasks = get().tasks.filter((t) => t.id !== taskId);
    set({ tasks });
    await saveTasks(tasks);
  },

  getTotalXP: () => get().tasks.reduce((sum, t) => sum + (t.xp || 0), 0),
  getCompletedCount: () => get().tasks.filter((t) => t.completed).length,
  getPendingOverdue: () => {
    const now = new Date();
    return get().tasks.filter((t) => !t.completed && new Date(t.dueDate) < now);
  },

  getStreak: () => {
    const completed = get().tasks
      .filter((t) => t.completed && t.completedAt)
      .map((t) => {
        const d = new Date(t.completedAt);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      });
    if (completed.length === 0) return 0;
    const unique = [...new Set(completed)].sort().reverse();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < unique.length; i++) {
      const ref = new Date(today);
      ref.setDate(ref.getDate() - i);
      const key = `${ref.getFullYear()}-${ref.getMonth()}-${ref.getDate()}`;
      if (unique.includes(key)) streak++;
      else break;
    }
    return streak;
  },

  getWeekHistory: () => {
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const count = get().tasks.filter((t) => {
        if (!t.completed || !t.completedAt) return false;
        const c = new Date(t.completedAt);
        return `${c.getFullYear()}-${c.getMonth()}-${c.getDate()}` === key;
      }).length;
      history.push({ day: d.toLocaleDateString('fr-FR', { weekday: 'short' }), count });
    }
    return history;
  },
}));
