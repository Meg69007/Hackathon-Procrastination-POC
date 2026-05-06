import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTaskStore } from '../../../stores/taskStore';

const PRIORITIES = [
  { id: 'high',   label: '🔴 Haute',   color: '#e94560' },
  { id: 'normal', label: '🟡 Normale', color: '#ffd700' },
  { id: 'low',    label: '🟢 Basse',   color: '#66bb6a' },
];

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams();
  const { tasks, updateTask } = useTaskStore();
  const task = tasks.find((t) => t.id === id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [hour, setHour] = useState('23');
  const [minute, setMinute] = useState('59');
  const [priority, setPriority] = useState('normal');
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    if (!task) return;
    const due = new Date(task.dueDate);
    setTitle(task.title);
    setDescription(task.description || '');
    setEstimatedHours(task.estimatedMinutes ? String(task.estimatedMinutes / 60) : '');
    setDay(String(due.getDate()));
    setMonth(String(due.getMonth() + 1));
    setYear(String(due.getFullYear()));
    setHour(String(due.getHours()));
    setMinute(String(due.getMinutes()).padStart(2, '0'));
    setPriority(task.priority || 'normal');
    setSteps(task.steps.map((s) => ({
      title: s.title,
      minutes: s.estimatedMinutes ? String(s.estimatedMinutes) : '',
      notes: s.notes || '',
    })));
  }, [task?.id]);

  if (!task) return (
    <View style={{ flex: 1, backgroundColor: '#16213e', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#eee' }}>Tâche introuvable</Text>
    </View>
  );

  const addStep = () => setSteps([...steps, { title: '', minutes: '', notes: '' }]);
  const removeStep = (i) => steps.length > 1 && setSteps(steps.filter((_, idx) => idx !== i));
  const updateField = (i, field, val) =>
    setSteps(steps.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const totalFromSteps = steps.reduce((s, st) => s + (parseInt(st.minutes, 10) || 0), 0);
  const suggestedHours = totalFromSteps > 0 ? (totalFromSteps / 60).toFixed(1) : '';

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Champ manquant', 'Donne un nom à ta tâche.'); return; }
    const validSteps = steps.filter((s) => s.title.trim());
    if (validSteps.length === 0) { Alert.alert('Champ manquant', 'Ajoute au moins une étape.'); return; }

    const d = parseInt(day, 10), m = parseInt(month, 10), y = parseInt(year, 10);
    const h = parseInt(hour, 10), min = parseInt(minute, 10);
    if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 2024) {
      Alert.alert('Date invalide', 'Vérifie le jour, le mois et l\'année.'); return;
    }
    const due = new Date(y, m - 1, d, h, min, 0);
    if (isNaN(due.getTime())) { Alert.alert('Date invalide', 'Cette date n\'existe pas.'); return; }

    const globalMinutes = estimatedHours.trim()
      ? Math.round(parseFloat(estimatedHours) * 60)
      : totalFromSteps > 0 ? totalFromSteps : 60;

    await updateTask(id, {
      title: title.trim(),
      description: description.trim(),
      estimatedMinutes: globalMinutes,
      dueDate: due.toISOString(),
      priority,
      steps: validSteps,
    });
    router.push(`/task/${id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TouchableOpacity style={styles.backRow} onPress={() => router.push(`/task/${id}`)}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.screenTitle}>Modifier la tâche</Text>

          <Text style={styles.label}>Nom *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor="#555" />

          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription}
            multiline numberOfLines={3} placeholderTextColor="#555" />

          <Text style={styles.label}>Priorité</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.priorityBtn, priority === p.id && { borderColor: p.color, backgroundColor: p.color + '22' }]}
                onPress={() => setPriority(p.id)}
              >
                <Text style={[styles.priorityText, priority === p.id && { color: p.color }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Date de rendu *</Text>
          <View style={styles.dateRow}>
            {[
              { label: 'Jour', value: day, set: setDay, max: 2, placeholder: '15' },
              { label: 'Mois', value: month, set: setMonth, max: 2, placeholder: '06' },
              { label: 'Année', value: year, set: setYear, max: 4, placeholder: '2025', flex: 2 },
              { label: 'Heure', value: hour, set: setHour, max: 2, placeholder: '23' },
              { label: 'Min', value: minute, set: setMinute, max: 2, placeholder: '59' },
            ].map((f, i, arr) => (
              <View key={f.label} style={[styles.dateField, f.flex && { flex: f.flex }]}>
                <Text style={styles.dateLabel}>{f.label}</Text>
                <TextInput style={styles.dateInput} value={f.value} onChangeText={f.set}
                  placeholder={f.placeholder} placeholderTextColor="#555"
                  keyboardType="number-pad" maxLength={f.max} />
              </View>
            ))}
          </View>

          <Text style={styles.label}>Temps total (h)</Text>
          <TextInput style={styles.input}
            placeholder={suggestedHours ? `${suggestedHours} (depuis étapes)` : 'Ex: 3.5'}
            placeholderTextColor="#555" value={estimatedHours} onChangeText={setEstimatedHours}
            keyboardType="decimal-pad" />

          <Text style={styles.label}>Étapes *</Text>
          {steps.map((s, i) => (
            <View key={i} style={styles.stepBlock}>
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}><Text style={styles.stepNum}>{i + 1}</Text></View>
                <Text style={styles.stepLabelText}>Étape {i + 1}</Text>
                {steps.length > 1 && (
                  <TouchableOpacity onPress={() => removeStep(i)}>
                    <Text style={styles.removeText}>× Supprimer</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput style={styles.input} placeholder={`Étape ${i + 1}...`} placeholderTextColor="#555"
                value={s.title} onChangeText={(v) => updateField(i, 'title', v)} />
              <View style={styles.stepTimeRow}>
                <Text>⏱</Text>
                <TextInput style={styles.stepTimeInput} placeholder="Durée (min)" placeholderTextColor="#555"
                  value={s.minutes} onChangeText={(v) => updateField(i, 'minutes', v)} keyboardType="number-pad" />
                {s.minutes ? (
                  <Text style={styles.stepTimeBadge}>
                    {parseInt(s.minutes) >= 60 ? `${(parseInt(s.minutes) / 60).toFixed(1)}h` : `${s.minutes} min`}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addStepBtn} onPress={addStep}>
            <Text style={styles.addStepText}>+ Ajouter une étape</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Sauvegarder les modifications ✅</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  backRow: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  backText: { color: '#e94560', fontSize: 15, fontWeight: '700' },
  scroll: { padding: 20, paddingBottom: 80 },
  screenTitle: { fontSize: 24, fontWeight: '900', color: '#e94560', marginBottom: 4 },
  label: { color: '#eee', fontWeight: '700', fontSize: 13, marginTop: 16, marginBottom: 6 },
  input: { backgroundColor: '#1a1a2e', color: '#eee', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: '#0f3460' },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityBtn: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#0f3460', padding: 10, alignItems: 'center' },
  priorityText: { color: '#8888aa', fontWeight: '700', fontSize: 13 },
  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, flexWrap: 'wrap' },
  dateField: { flex: 1, minWidth: 44 },
  dateLabel: { color: '#8888aa', fontSize: 10, marginBottom: 4, textAlign: 'center' },
  dateInput: { backgroundColor: '#1a1a2e', color: '#eee', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 11, fontSize: 15, borderWidth: 1, borderColor: '#0f3460', textAlign: 'center' },
  stepBlock: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#0f3460' },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  stepBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#0f3460', alignItems: 'center', justifyContent: 'center' },
  stepNum: { color: '#e94560', fontWeight: '900', fontSize: 12 },
  stepLabelText: { flex: 1, color: '#8888aa', fontSize: 12, fontWeight: '700' },
  removeText: { color: '#e94560', fontSize: 12 },
  stepTimeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  stepTimeInput: { flex: 1, backgroundColor: '#0f3460', color: '#eee', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  stepTimeBadge: { backgroundColor: '#e94560', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, color: '#fff', fontSize: 12, fontWeight: '700' },
  addStepBtn: { borderWidth: 1, borderColor: '#0f3460', borderStyle: 'dashed', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  addStepText: { color: '#8888aa', fontSize: 14 },
  saveBtn: { backgroundColor: '#e94560', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
});
