import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../stores/userStore';
import { useTaskStore } from '../stores/taskStore';
import { createFlemmeContact, FLEMME_PHONE } from '../lib/flemme';
import NavBar from '../components/NavBar';

export default function SettingsScreen() {
  const { phone, backendUrl, focusMinutes, breakMinutes, longBreakMinutes, autoFlemme, save, hydrate, loaded } = useUserStore();
  const { seedDemoData, clearAllTasks } = useTaskStore();
  const [lPhone, setLPhone] = useState('');
  const [lUrl, setLUrl] = useState('');
  const [lFocus, setLFocus] = useState('25');
  const [lBreak, setLBreak] = useState('5');
  const [lLong, setLLong] = useState('15');
  const [lAuto, setLAuto] = useState(false);
  const [contactCreated, setContactCreated] = useState(false);

  useEffect(() => {
    if (!loaded) hydrate();
    else {
      setLPhone(phone);
      setLUrl(backendUrl);
      setLFocus(String(focusMinutes || 25));
      setLBreak(String(breakMinutes || 5));
      setLLong(String(longBreakMinutes || 15));
      setLAuto(autoFlemme || false);
    }
  }, [loaded]);

  const handleSave = async () => {
    const focus = parseInt(lFocus, 10);
    const brk = parseInt(lBreak, 10);
    const lng = parseInt(lLong, 10);
    if (isNaN(focus) || focus < 1 || isNaN(brk) || brk < 1 || isNaN(lng) || lng < 1) {
      Alert.alert('Durées invalides', 'Les durées doivent être des nombres positifs.'); return;
    }
    await save({ phone: lPhone.trim(), backendUrl: lUrl.trim(), focusMinutes: focus, breakMinutes: brk, longBreakMinutes: lng, autoFlemme: lAuto });
    Alert.alert('Sauvegardé ✅');
  };

  const handleCreateContact = async () => {
    const ok = await createFlemmeContact();
    if (ok) { setContactCreated(true); Alert.alert('Contact créé', `"La Flemme 😤" est dans tes contacts avec le numéro ${FLEMME_PHONE}.`); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <NavBar />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>⚙️ Paramètres</Text>
          <Section title="PROFIL">
            <Field label="Ton numéro de téléphone">
              <TextInput style={styles.input} placeholder="+33 6 XX XX XX XX" placeholderTextColor="#555"
                value={lPhone} onChangeText={setLPhone} keyboardType="phone-pad" />
            </Field>
          </Section>
          <Section title="CYCLES POMODORO">
            <View style={styles.pomodoroRow}>
              <PomodoroField label="🔥 Focus" hint="min" value={lFocus} onSet={setLFocus} />
              <PomodoroField label="☕ Pause" hint="min" value={lBreak} onSet={setLBreak} />
              <PomodoroField label="🌊 Grande pause" hint="min" value={lLong} onSet={setLLong} />
            </View>
            <Text style={styles.pomodoroHint}>
              Grande pause tous les 4 cycles. Actuellement : {lFocus}m focus / {lBreak}m pause / {lLong}m grande pause.
            </Text>
          </Section>
          <Section title="LA FLEMME">
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Activation automatique</Text>
                <Text style={styles.switchHint}>La Flemme s'active seule à la deadline, sans intervention manuelle</Text>
              </View>
              <Switch value={lAuto} onValueChange={setLAuto} trackColor={{ true: '#e94560' }} thumbColor="#fff" />
            </View>

            {Platform.OS !== 'web' && (
              <TouchableOpacity style={[styles.flemmeBtn, contactCreated && styles.flemmeBtnDone]} onPress={handleCreateContact}>
                <Text style={styles.flemmeBtnText}>{contactCreated ? '✅ Contact créé' : 'Créer le contact La Flemme'}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Numéro La Flemme : <Text style={{ color: '#e94560', fontWeight: '700' }}>{FLEMME_PHONE}</Text>{'\n'}
                Escalade : 2h → 1h → 30min → 15min au fur et à mesure du retard
              </Text>
            </View>
          </Section>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Sauvegarder</Text>
          </TouchableOpacity>

          <Section title="DÉMO">
            <TouchableOpacity style={styles.demoBtn} onPress={async () => {
              await seedDemoData();
              Alert.alert('Données chargées ✅', '10 tâches de démo injectées.');
            }}>
              <Text style={styles.demoBtnText}>Charger les données de démo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearBtn} onPress={() =>
              Alert.alert('Vider toutes les tâches ?', 'Action irréversible.', [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Vider', style: 'destructive', onPress: async () => { await clearAllTasks(); Alert.alert('Vidé ✅'); } },
              ])
            }>
              <Text style={styles.clearBtnText}>Vider toutes les tâches</Text>
            </TouchableOpacity>
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function PomodoroField({ label, hint, value, onSet }) {
  return (
    <View style={styles.pomodoroField}>
      <Text style={styles.pomodoroLabel}>{label}</Text>
      <View style={styles.pomodoroInputRow}>
        <TextInput style={styles.pomodoroInput} value={value} onChangeText={onSet}
          keyboardType="number-pad" maxLength={3} placeholderTextColor="#555" />
        <Text style={styles.pomodoroHintText}>{hint}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  scroll: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '900', color: '#e94560', marginBottom: 20 },
  section: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 16 },
  sectionTitle: { color: '#8888aa', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  fieldLabel: { color: '#eee', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: { backgroundColor: '#0f3460', color: '#eee', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  pomodoroRow: { flexDirection: 'row', gap: 8 },
  pomodoroField: { flex: 1, alignItems: 'center' },
  pomodoroLabel: { color: '#8888aa', fontSize: 11, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  pomodoroInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pomodoroInput: { backgroundColor: '#0f3460', color: '#e94560', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, fontSize: 20, fontWeight: '900', textAlign: 'center', width: 60 },
  pomodoroHintText: { color: '#8888aa', fontSize: 11 },
  pomodoroHint: { color: '#555', fontSize: 12, marginTop: 10, textAlign: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  switchLabel: { color: '#eee', fontWeight: '700', fontSize: 14 },
  switchHint: { color: '#8888aa', fontSize: 12, marginTop: 2 },
  flemmeBtn: { backgroundColor: '#b71c1c', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
  flemmeBtnDone: { backgroundColor: '#1a3a1a' },
  flemmeBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  infoBox: { backgroundColor: '#0f3460', borderRadius: 10, padding: 12 },
  infoText: { color: '#8888aa', fontSize: 13, lineHeight: 20 },
  saveBtn: { backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  demoBtn: { backgroundColor: '#0f3460', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 10 },
  demoBtnText: { color: '#eee', fontWeight: '800', fontSize: 14 },
  clearBtn: { backgroundColor: '#1a0a0a', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#b71c1c' },
  clearBtnText: { color: '#e94560', fontWeight: '700', fontSize: 14 },
});
