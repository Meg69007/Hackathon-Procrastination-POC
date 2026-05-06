import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTaskStore } from '../../stores/taskStore';
import { scheduleDeadlineAlert } from '../../lib/notifications';

const emptyStep = () => ({ title: '', minutes: '' });

export default function CreateTaskScreen() {
  const { addTask } = useTaskStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [hour, setHour] = useState('23');
  const [minute, setMinute] = useState('59');
  const [steps, setSteps] = useState([emptyStep(), emptyStep()]);

  const addStep = () => setSteps([...steps, emptyStep()]);
  const removeStep = (i) => setSteps(steps.filter((_, idx) => idx !== i));
  const updateStepTitle = (i, val) =>
    setSteps(steps.map((s, idx) => idx === i ? { ...s, title: val } : s));
  const updateStepMinutes = (i, val) =>
    setSteps(steps.map((s, idx) => idx === i ? { ...s, minutes: val } : s));

  const totalFromSteps = steps.reduce((sum, s) => sum + (parseInt(s.minutes, 10) || 0), 0);
  const suggestedHours = totalFromSteps > 0 ? (totalFromSteps / 60).toFixed(1) : '';

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Champ manquant', 'Donne un nom à ta tâche.');
      return;
    }
    const validSteps = steps.filter((s) => s.title.trim());
    if (validSteps.length === 0) {
      Alert.alert('Champ manquant', 'Ajoute au moins une étape.');
      return;
    }

    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const h = parseInt(hour, 10);
    const min = parseInt(minute, 10);

    if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 2024) {
      Alert.alert('Date invalide', 'Vérifie le jour, le mois et l\'année.');
      return;
    }
    if (isNaN(h) || isNaN(min) || h < 0 || h > 23 || min < 0 || min > 59) {
      Alert.alert('Heure invalide', 'Heure entre 0-23, minutes entre 0-59.');
      return;
    }

    const due = new Date(y, m - 1, d, h, min, 0);
    if (isNaN(due.getTime())) {
      Alert.alert('Date invalide', 'Cette date n\'existe pas.');
      return;
    }

    const globalMinutes = estimatedHours.trim()
      ? Math.round(parseFloat(estimatedHours) * 60)
      : totalFromSteps > 0
        ? totalFromSteps
        : 60;

    const task = await addTask({
      title: title.trim(),
      description: description.trim(),
      estimatedMinutes: globalMinutes,
      dueDate: due.toISOString(),
      steps: validSteps,
    });

    await scheduleDeadlineAlert(task);
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.backRow} onPress={() => router.push('/')}>
        <Text style={styles.backText}>← Mes tâches</Text>
      </TouchableOpacity>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Text style={styles.screenTitle}>Nouvelle tâche</Text>
          <Text style={styles.label}>Nom de la tâche *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Rendre le projet React..."
            placeholderTextColor="#555"
            value={title}
            onChangeText={setTitle}
          />
          <Text style={styles.label}>Description (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Contexte, notes..."
            placeholderTextColor="#555"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.label}>Date de rendu *</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Jour</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="15"
                placeholderTextColor="#555"
                value={day}
                onChangeText={setDay}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <Text style={styles.dateSep}>/</Text>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Mois</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="06"
                placeholderTextColor="#555"
                value={month}
                onChangeText={setMonth}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <Text style={styles.dateSep}>/</Text>
            <View style={[styles.dateField, { flex: 2 }]}>
              <Text style={styles.dateLabel}>Année</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="2025"
                placeholderTextColor="#555"
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <Text style={styles.dateSep}>à</Text>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Heure</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="23"
                placeholderTextColor="#555"
                value={hour}
                onChangeText={setHour}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <Text style={styles.dateSep}>:</Text>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Min</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="59"
                placeholderTextColor="#555"
                value={minute}
                onChangeText={setMinute}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
          <Text style={styles.label}>Temps total estimé (heures)</Text>
          <Text style={styles.hint}>
            Laisse vide pour utiliser la somme des étapes
            {suggestedHours ? ` — somme actuelle : ${suggestedHours}h` : ''}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={suggestedHours ? `${suggestedHours} (calculé depuis les étapes)` : 'Ex: 3.5'}
            placeholderTextColor="#555"
            value={estimatedHours}
            onChangeText={setEstimatedHours}
            keyboardType="decimal-pad"
          />
          <Text style={styles.label}>Étapes *</Text>
          <Text style={styles.hint}>
            Découpe ta tâche en actions concrètes.{'\n'}
            La durée par étape est optionnelle — elle aide à mieux planifier.
          </Text>

          {steps.map((s, i) => (
            <View key={i} style={styles.stepBlock}>
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>{i + 1}</Text>
                </View>
                <Text style={styles.stepLabel}>Étape {i + 1}</Text>
                {steps.length > 1 && (
                  <TouchableOpacity onPress={() => removeStep(i)} style={styles.removeBtn}>
                    <Text style={styles.removeText}>× Supprimer</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.input}
                placeholder={`Décris l'étape ${i + 1}...`}
                placeholderTextColor="#555"
                value={s.title}
                onChangeText={(v) => updateStepTitle(i, v)}
              />

              <View style={styles.stepTimeRow}>
                <Text style={styles.stepTimeIcon}>⏱</Text>
                <TextInput
                  style={styles.stepTimeInput}
                  placeholder="Durée (min) — optionnel"
                  placeholderTextColor="#555"
                  value={s.minutes}
                  onChangeText={(v) => updateStepMinutes(i, v)}
                  keyboardType="number-pad"
                />
                {s.minutes ? (
                  <Text style={styles.stepTimeBadge}>
                    {parseInt(s.minutes, 10) >= 60
                      ? `${(parseInt(s.minutes, 10) / 60).toFixed(1)}h`
                      : `${s.minutes} min`}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addStepBtn} onPress={addStep}>
            <Text style={styles.addStepText}>+ Ajouter une étape</Text>
          </TouchableOpacity>
          {totalFromSteps > 0 && (
            <View style={styles.recap}>
              <Text style={styles.recapTitle}>Récap du projet</Text>
              {steps.filter(s => s.title.trim() && s.minutes).map((s, i) => (
                <View key={i} style={styles.recapRow}>
                  <Text style={styles.recapStep} numberOfLines={1}>{s.title.trim()}</Text>
                  <Text style={styles.recapTime}>{s.minutes} min</Text>
                </View>
              ))}
              <View style={styles.recapTotal}>
                <Text style={styles.recapTotalLabel}>Total estimé</Text>
                <Text style={styles.recapTotalValue}>
                  {totalFromSteps >= 60
                    ? `${(totalFromSteps / 60).toFixed(1)}h`
                    : `${totalFromSteps} min`}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.createBtn} onPress={handleCreate} activeOpacity={0.8}>
            <Text style={styles.createBtnText}>Créer la tâche 🚀</Text>
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
  screenTitle: { fontSize: 26, fontWeight: '900', color: '#e94560', marginBottom: 4 },
  label: { color: '#eee', fontWeight: '700', fontSize: 13, marginTop: 18, marginBottom: 6, letterSpacing: 0.5 },
  hint: { color: '#8888aa', fontSize: 12, marginBottom: 8, marginTop: -4, lineHeight: 18 },
  input: {
    backgroundColor: '#1a1a2e', color: '#eee', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    borderWidth: 1, borderColor: '#0f3460',
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, flexWrap: 'wrap' },
  dateField: { flex: 1, minWidth: 44 },
  dateLabel: { color: '#8888aa', fontSize: 10, marginBottom: 4, textAlign: 'center' },
  dateInput: {
    backgroundColor: '#1a1a2e', color: '#eee', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 11, fontSize: 15,
    borderWidth: 1, borderColor: '#0f3460', textAlign: 'center',
  },
  dateSep: { color: '#8888aa', fontSize: 18, paddingBottom: 10, paddingHorizontal: 2 },

  stepBlock: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: '#0f3460',
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  stepBadge: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#0f3460',
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { color: '#e94560', fontWeight: '900', fontSize: 12 },
  stepLabel: { flex: 1, color: '#8888aa', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  removeBtn: { paddingVertical: 2 },
  removeText: { color: '#e94560', fontSize: 12 },
  stepTimeRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8,
  },
  stepTimeIcon: { fontSize: 16 },
  stepTimeInput: {
    flex: 1, backgroundColor: '#0f3460', color: '#eee', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 13,
  },
  stepTimeBadge: {
    backgroundColor: '#e94560', borderRadius: 6, paddingHorizontal: 8,
    paddingVertical: 4, color: '#fff', fontSize: 12, fontWeight: '700',
  },

  addStepBtn: {
    borderWidth: 1, borderColor: '#0f3460', borderStyle: 'dashed',
    borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4,
  },
  addStepText: { color: '#8888aa', fontSize: 14 },

  recap: {
    backgroundColor: '#0f3460', borderRadius: 12, padding: 14, marginTop: 16,
  },
  recapTitle: { color: '#eee', fontWeight: '800', fontSize: 13, marginBottom: 10, letterSpacing: 0.5 },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  recapStep: { color: '#8888aa', fontSize: 13, flex: 1, marginRight: 8 },
  recapTime: { color: '#eee', fontSize: 13, fontWeight: '700' },
  recapTotal: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#1a1a2e', paddingTop: 8, marginTop: 4,
  },
  recapTotalLabel: { color: '#eee', fontWeight: '800', fontSize: 14 },
  recapTotalValue: { color: '#e94560', fontWeight: '900', fontSize: 14 },

  createBtn: {
    backgroundColor: '#e94560', borderRadius: 14, padding: 18,
    alignItems: 'center', marginTop: 24,
  },
  createBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
});
