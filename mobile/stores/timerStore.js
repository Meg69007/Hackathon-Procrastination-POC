import { create } from 'zustand';
import { useUserStore } from './userStore';

const getDefaults = () => {
  const { focusMinutes, breakMinutes, longBreakMinutes } = useUserStore.getState();
  return {
    focus: (focusMinutes || 25) * 60,
    break: (breakMinutes || 5) * 60,
    longBreak: (longBreakMinutes || 15) * 60,
  };
};

export const useTimerStore = create((set, get) => ({
  taskId: null,
  phase: 'idle',
  secondsLeft: 25 * 60,
  cycleCount: 0,
  isRunning: false,
  intervalRef: null,

  startSession: (taskId) => {
    const d = getDefaults();
    set({ taskId, phase: 'focus', secondsLeft: d.focus, cycleCount: 0, isRunning: false });
  },

  tick: () => {
    const { secondsLeft, phase, cycleCount } = get();
    if (secondsLeft > 1) { set({ secondsLeft: secondsLeft - 1 }); return; }

    const d = getDefaults();
    if (phase === 'focus') {
      const newCycle = cycleCount + 1;
      const isLong = newCycle % 4 === 0;
      set({ cycleCount: newCycle, phase: isLong ? 'longBreak' : 'break', secondsLeft: isLong ? d.longBreak : d.break, isRunning: false });
    } else {
      set({ phase: 'focus', secondsLeft: d.focus, isRunning: false });
    }
  },

  play: () => {
    if (get().isRunning) return;
    const ref = setInterval(() => get().tick(), 1000);
    set({ isRunning: true, intervalRef: ref });
  },

  pause: () => {
    clearInterval(get().intervalRef);
    set({ isRunning: false, intervalRef: null });
  },

  reset: () => {
    clearInterval(get().intervalRef);
    const d = getDefaults();
    set({ phase: 'focus', secondsLeft: d.focus, isRunning: false, intervalRef: null });
  },

  stop: () => {
    clearInterval(get().intervalRef);
    const d = getDefaults();
    set({ taskId: null, phase: 'idle', secondsLeft: d.focus, cycleCount: 0, isRunning: false, intervalRef: null });
  },
}));
