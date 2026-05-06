import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../stores/userStore';
import { createFlemmeContact } from '../lib/flemme';

const STEPS = [
  {
    emoji: '💀',
    title: 'Bienvenue dans\nLa Flemme',
    body: 'L\'app qui combat ta procrastination.\nPas avec de la motivation.\nAvec de la pression.',
    cta: 'Commencer',
  },
  {
    emoji: '📋',
    title: 'Définis tes tâches',
    body: 'Crée une tâche, découpe-la en étapes concrètes, fixe une deadline.\nChaque étape accomplie = XP + mini-challenge.',
    cta: 'Suivant',
  },
  {
    emoji: '⏱',
    title: 'Travaille en cycles',
    body: 'Lance un cycle focus de 25 min.\nPause de 5 min.\nTon cerveau tourne à plein régime.',
    cta: 'Suivant',
  },
  {
    emoji: '😤',
    title: 'La Flemme te surveille',
    body: 'Si tu rates ta deadline, La Flemme t\'appelle en boucle.\nElle ne s\'arrête pas tant que la tâche n\'est pas finie.',
    cta: 'Suivant',
  },
  {
    emoji: '📞',
    title: 'Configure La Flemme',
    body: 'Entre ton numéro pour recevoir ses appels.',
    cta: null,
    isPhoneStep: true,
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [contactDone, setContactDone] = useState(false);
  const { save } = useUserStore();

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = async () => {
    if (current.isPhoneStep) {
      if (!phone.trim()) {
        Alert.alert('Numéro requis', 'Entre ton numéro pour que La Flemme puisse t\'appeler.');
        return;
      }
      await save({ phone: phone.trim(), onboardingDone: true });
      router.replace('/');
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleSkip = async () => {
    await save({ onboardingDone: true });
    router.replace('/');
  };

  const handleCreateContact = async () => {
    const ok = await createFlemmeContact();
    if (ok) setContactDone(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dotsRow}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>
      <View style={styles.content}>
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>

        {current.isPhoneStep && (
          <View style={styles.phoneSection}>
            <TextInput
              style={styles.input}
              placeholder="+33 6 XX XX XX XX"
              placeholderTextColor="#555"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={[styles.contactBtn, contactDone && styles.contactBtnDone]}
                onPress={handleCreateContact}
              >
                <Text style={styles.contactBtnText}>
                  {contactDone ? '✅ Contact La Flemme créé' : ' Créer le contact La Flemme'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.mainBtn} onPress={handleNext}>
          <Text style={styles.mainBtnText}>{current.cta || (isLast ? 'C\'est parti 🚀' : 'Suivant')}</Text>
        </TouchableOpacity>
        {step < STEPS.length - 1 && (
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        )}
        {current.isPhoneStep && (
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Configurer plus tard</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0f3460' },
  dotActive: { backgroundColor: '#e94560', width: 24 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emoji: { fontSize: 72, marginBottom: 24 },
  title: { fontSize: 30, fontWeight: '900', color: '#eee', textAlign: 'center', lineHeight: 36, marginBottom: 16 },
  body: { fontSize: 16, color: '#8888aa', textAlign: 'center', lineHeight: 26 },
  phoneSection: { width: '100%', marginTop: 24, gap: 12 },
  input: {
    backgroundColor: '#1a1a2e', color: '#eee', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    borderWidth: 1, borderColor: '#0f3460',
  },
  contactBtn: { backgroundColor: '#b71c1c', borderRadius: 12, padding: 14, alignItems: 'center' },
  contactBtnDone: { backgroundColor: '#1a3a1a' },
  contactBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  actions: { paddingHorizontal: 32, paddingBottom: 40, gap: 12 },
  mainBtn: { backgroundColor: '#e94560', borderRadius: 14, padding: 18, alignItems: 'center' },
  mainBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: '#555', fontSize: 14 },
});
