import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_KEY = '@laflemme_tasks';

export async function saveTasks(tasks) {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export async function loadTasks() {
  const raw = await AsyncStorage.getItem(TASKS_KEY);
  return raw ? JSON.parse(raw) : [];
}
