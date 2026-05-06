import { Platform, Alert } from 'react-native';

export const FLEMME_PHONE = '+33700000000';

export async function createFlemmeContact() {
  if (Platform.OS === 'web') {
    Alert.alert('Info', 'La création de contact n\'est disponible que sur mobile (Expo Go).');
    return false;
  }
  try {
    const Contacts = await import('expo-contacts');
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Accorde l\'accès aux contacts pour que La Flemme puisse t\'appeler.');
      return false;
    }
    const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
    const exists = data.some(
      (c) => c.phoneNumbers?.some((p) => p.number?.replace(/\s/g, '') === FLEMME_PHONE.replace(/\s/g, ''))
    );
    if (!exists) {
      await Contacts.addContactAsync({
        [Contacts.Fields.FirstName]: 'La Flemme',
        [Contacts.Fields.LastName]: '😤',
        [Contacts.Fields.PhoneNumbers]: [{ label: 'mobile', number: FLEMME_PHONE }],
      });
    }
    return true;
  } catch (e) {
    Alert.alert('Erreur', 'Impossible de créer le contact: ' + e.message);
    return false;
  }
}

export async function startFlemmeLoop(taskId, userPhone, backendUrl) {
  try {
    const res = await fetch(`${backendUrl}/flemme/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, user_phone: userPhone, interval_minutes: 2 }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function stopFlemmeLoop(taskId, backendUrl) {
  try {
    await fetch(`${backendUrl}/flemme/stop/${taskId}`, { method: 'DELETE' });
  } catch {}
}
