import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestPermissions() {
  if (Platform.OS === 'web') return true;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleDeadlineAlert(task) {
  if (Platform.OS === 'web') return;
  try {
    const trigger = new Date(task.dueDate);
    trigger.setMinutes(trigger.getMinutes() - 30);
    if (trigger <= new Date()) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Deadline dans 30 min !',
        body: `"${task.title}" doit être rendu bientôt. La Flemme te guette...`,
        data: { taskId: task.id },
      },
      trigger,
    });
  } catch {}
}

export async function notifyFlemmeActivated(taskName) {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '😤 LA FLEMME ARRIVE',
        body: `Tu n'as pas rendu "${taskName}". La Flemme va t'appeler en boucle.`,
        sound: true,
      },
      trigger: null,
    });
  } catch {}
}

export async function cancelAllNotifications() {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}
