import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@laflemme_user';

const DEFAULTS = {
  phone: '',
  backendUrl: 'http://192.168.1.1:8000',
  focusMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  autoFlemme: false,
  onboardingDone: false,
};

export const useUserStore = create((set, get) => ({
  ...DEFAULTS,
  loaded: false,

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) set({ ...DEFAULTS, ...JSON.parse(raw), loaded: true });
    else set({ ...DEFAULTS, loaded: true });
  },

  save: async (data) => {
    const next = { ...get(), ...data };
    set(next);
    const { loaded, ...toSave } = next;
    await AsyncStorage.setItem(KEY, JSON.stringify(toSave));
  },
}));
