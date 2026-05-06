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

  deleteStep: async (taskId, stepId) => {
    const tasks = get().tasks.map((t) => {
      if (t.id !== taskId) return t;
      const steps = t.steps.filter((s) => s.id !== stepId);
      return { ...t, steps };
    });
    set({ tasks });
    await saveTasks(tasks);
  },

  clearAllTasks: async () => {
    set({ tasks: [] });
    await saveTasks([]);
  },

  seedDemoData: async () => {
    const now = new Date();
    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
    const daysAgo = (n) => { const d = new Date(now); d.setDate(d.getDate() - n); return d.toISOString(); };
    const daysFromNow = (n) => { const d = new Date(now); d.setDate(d.getDate() + n); return d.toISOString(); };
    const hoursAgo = (n) => { const d = new Date(now); d.setHours(d.getHours() - n); return d.toISOString(); };

    const mkStep = (title, minutes, done = false, i = 0) => ({
      id: uid(), title, notes: '', estimatedMinutes: minutes, order: i, completed: done,
    });

    const mkDone = (title, desc, priority, stepDefs, completedAt, estMin) => ({
      id: uid(), title, description: desc, estimatedMinutes: estMin, dueDate: completedAt,
      priority, steps: stepDefs.map((s, i) => mkStep(s.t, s.m, true, i)),
      completed: true, flemmeActive: false, flemmeActivatedAt: null, flemmeCallCount: 0,
      createdAt: completedAt, completedAt,
      xp: stepDefs.length * 10 + 50,
    });

    const mkPending = (title, desc, priority, stepDefs, dueDate, estMin, doneCnt = 0, flemme = false) => ({
      id: uid(), title, description: desc, estimatedMinutes: estMin, dueDate, priority,
      steps: stepDefs.map((s, i) => mkStep(s.t, s.m, i < doneCnt, i)),
      completed: false, flemmeActive: flemme,
      flemmeActivatedAt: flemme ? hoursAgo(2) : null, flemmeCallCount: flemme ? 3 : 0,
      createdAt: daysAgo(7), xp: doneCnt * 10,
    });

    const tasks = [
      mkDone('Réviser le cours d\'algo', 'Arbres, graphes, tri rapide', 'high',
        [{ t: 'Revoir les arbres binaires', m: 30 }, { t: 'S\'exercer sur les graphes', m: 45 }, { t: 'Faire les exercices du cours', m: 60 }],
        daysAgo(4), 135),
      mkDone('Préparer la soutenance', 'Slides + répétition du discours', 'high',
        [{ t: 'Faire le plan', m: 20 }, { t: 'Créer les slides', m: 60 }, { t: 'Répéter', m: 30 }, { t: 'Tester le matériel', m: 15 }],
        daysAgo(3), 125),
      mkDone('Rendre le rapport de stage', 'Rapport final complet', 'normal',
        [{ t: 'Rédiger l\'introduction', m: 30 }, { t: 'Compléter les parties techniques', m: 90 }, { t: 'Relire et corriger', m: 30 }],
        daysAgo(2), 150),
      mkDone('Finir le TP Python', 'Classes et héritage', 'normal',
        [{ t: 'Implémenter la classe de base', m: 45 }, { t: 'Ajouter les sous-classes', m: 30 }, { t: 'Écrire les tests', m: 30 }],
        daysAgo(1), 105),
      mkDone('Corriger les bugs du projet', 'Sprint de correction avant démo', 'high',
        [{ t: 'Identifier tous les bugs', m: 20 }, { t: 'Corriger le bug de navigation', m: 40 }, { t: 'Tester sur Android et iOS', m: 30 }],
        daysAgo(0), 90),
      mkDone('Mettre à jour le README', 'Documentation du projet hackathon', 'low',
        [{ t: 'Décrire les fonctionnalités', m: 20 }, { t: 'Ajouter les instructions d\'installation', m: 15 }],
        daysAgo(0), 35),
      mkPending('Préparer l\'exam de maths', 'Analyse, algèbre linéaire et probabilités', 'high',
        [{ t: 'Réviser les intégrales', m: 45 }, { t: 'Revoir les matrices', m: 40 }, { t: 'Exercices de proba', m: 50 }, { t: 'Corriger les annales', m: 60 }],
        daysFromNow(1), 195, 2),
      mkPending('Refactor le module auth', 'Nettoyer le code et améliorer la sécurité', 'normal',
        [{ t: 'Analyser le code existant', m: 30 }, { t: 'Extraire les fonctions utilitaires', m: 45 }, { t: 'Mettre à jour les tests', m: 30 }],
        daysFromNow(3), 105, 1),
      mkPending('Écrire les tests unitaires', 'Couverture de 80% minimum', 'normal',
        [{ t: 'Tests du store Zustand', m: 40 }, { t: 'Tests des composants UI', m: 50 }, { t: 'Tests des fonctions utilitaires', m: 30 }],
        daysFromNow(5), 120, 0),
      mkPending('Préparer la démo du hackathon', 'Présentation live de l\'app en 5 minutes', 'high',
        [{ t: 'Écrire le script de démo', m: 20 }, { t: 'Tester le scénario complet', m: 30 }, { t: 'Répéter la présentation', m: 20 }],
        hoursAgo(1), 70, 0, true),
    ];

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
