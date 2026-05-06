import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Vibration, Platform, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTaskStore } from '../../stores/taskStore';
import { useTimerStore } from '../../stores/timerStore';
import { useUserStore } from '../../stores/userStore';
import { notifyFlemmeActivated } from '../../lib/notifications';
import { getRandomChallenge } from '../../lib/challenges';
import { createFlemmeContact, startFlemmeLoop, stopFlemmeLoop } from '../../lib/flemme';
import CelebrationOverlay from '../../components/CelebrationOverlay';

const PRIORITY_CONFIG = {
  high:   { label: '🔴 Haute',   color: '#e94560' },
  normal: { label: '🟡 Normale', color: '#ffd700' },
  low:    { label: '🟢 Basse',   color: '#66bb6a' },
};

function getFlemmeLevel(task) {
  if (!task.flemmeActive || !task.flemmeActivatedAt) return null;
  const minutesSince = (Date.now() - new Date(task.flemmeActivatedAt)) / 60000;
  if (minutesSince < 60)  return { label: 'Niveau 1 — Appels toutes les 2h',  interval: '2h',  color: '#ff9800' };
  if (minutesSince < 180) return { label: 'Niveau 2 — Appels toutes les 1h',  interval: '1h',  color: '#ff5722' };
  if (minutesSince < 360) return { label: 'Niveau 3 — Appels toutes les 30min', interval: '30min', color: '#e94560' };
  return                  { label: 'Niveau MAX — Appels toutes les 15min', interval: '15min', color: '#b71c1c' };
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const { tasks, completeStep, uncompleteStep, completeTask, uncompleteTask, activateFlemme, deleteTask, updateStepNotes } = useTaskStore();
  const { startSession } = useTimerStore();
  const { phone, backendUrl } = useUserStore();
  const task = tasks.find((t) => t.id === id);

  const [challenge, setChallenge] = useState(null);
  const [usedChallengeIds, setUsedChallengeIds] = useState([]);
  const [celebrating, setCelebrating] = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);
  const [notesDraft, setNotesDraft] = useState({});

  if (!task) return (
    <View style={styles.notFound}>
      <Text style={{ color: '#eee' }}>Tâche introuvable.</Text>
    </View>
  );

  const now = new Date();
  const due = new Date(task.dueDate);
  const isOverdue = due < now && !task.completed;
  const allStepsDone = task.steps.every((s) => s.completed);
  const doneSteps = task.steps.filter((s) => s.completed).length;
  const progressPct = task.steps.length > 0 ? doneSteps / task.steps.length : 0;
  const flemmeLevel = getFlemmeLevel(task);
  const priorityCfg = PRIORITY_CONFIG[task.priority || 'normal'];

  const handleToggleStep = async (step) => {
    if (step.completed) {
      await uncompleteStep(task.id, step.id);
    } else {
      if (Platform.OS !== 'web') Vibration.vibrate(50);
      await completeStep(task.id, step.id);
      const c = getRandomChallenge(usedChallengeIds);
      setUsedChallengeIds([...usedChallengeIds, c.id]);
      setChallenge(c);
    }
  };

  const handleSaveNote = async (step) => {
    const notes = notesDraft[step.id] ?? step.notes ?? '';
    await updateStepNotes(task.id, step.id, notes);
    setExpandedStep(null);
  };

  const handleComplete = () => {
    Alert.alert('Tâche terminée ?', 'Confirme la complétion.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Oui, c\'est fini !', onPress: async () => {
          await stopFlemmeLoop(task.id, backendUrl);
          await completeTask(task.id);
          setCelebrating(true);
          setTimeout(() => { setCelebrating(false); router.push('/'); }, 2800);
        },
      },
    ]);
  };

  const handleFlemme = async () => {
    if (!phone) {
      Alert.alert('Numéro manquant', 'Va dans Paramètres ⚙️ pour entrer ton numéro.', [
        { text: 'Paramètres', onPress: () => router.push('/settings') },
        { text: 'Annuler', style: 'cancel' },
      ]);
      return;
    }
    Alert.alert('💀 Activer La Flemme ?',
      `Elle t'appellera en boucle au ${phone} jusqu'à ce que tu termines.\nLes appels s'intensifient avec le temps.`, [
        { text: 'Non merci', style: 'cancel' },
        {
          text: 'ACTIVER 😤', style: 'destructive', onPress: async () => {
            if (Platform.OS !== 'web') await createFlemmeContact();
            await activateFlemme(task.id);
            await notifyFlemmeActivated(task.title);
            const ok = await startFlemmeLoop(task.id, phone, backendUrl);
            Alert.alert(ok ? '💀 La Flemme est lâchée' : '⚠️ Backend hors ligne',
              ok ? 'Premier appel dans 30 secondes. Bonne chance.' : 'Lance le backend pour activer les vrais appels. Le contact est créé.');
          },
        },
      ]);
  };

  const handleDelete = () => {
    Alert.alert('Supprimer ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await deleteTask(task.id); router.push('/'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <CelebrationOverlay visible={celebrating} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Text style={styles.backText}>← Mes tâches</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/task/edit/${task.id}`)}>
          <Text style={styles.editBtnText}>✏️ Modifier</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.headerCard, { borderLeftColor: isOverdue ? '#e94560' : priorityCfg.color }]}>
          <View style={styles.headerTop}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={[styles.priorityTag, { color: priorityCfg.color }]}>{priorityCfg.label}</Text>
          </View>
          {task.description ? <Text style={styles.taskDesc}>{task.description}</Text> : null}
          <View style={styles.metaRow}>
            <Text style={styles.meta}>⏱ {Math.round(task.estimatedMinutes / 60 * 10) / 10}h estimées</Text>
            <Text style={[styles.meta, isOverdue && { color: '#e94560' }]}>
              📅 {due.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          {isOverdue && <Text style={styles.overdueTag}>⚠️ EN RETARD</Text>}
          {task.completed && <Text style={styles.completedTag}>✅ TERMINÉE — +{task.xp} XP</Text>}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progression</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{doneSteps} / {task.steps.length} étapes — {Math.round(progressPct * 100)}%</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Étapes</Text>
          {task.steps.map((step, i) => {
            const isExpanded = expandedStep === step.id;
            return (
              <View key={step.id}>
                <TouchableOpacity
                  style={[styles.stepItem, step.completed && styles.stepDone]}
                  onPress={() => handleToggleStep(step)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepCheck}>{step.completed ? '✅' : '⬜'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stepTitle, step.completed && styles.stepTitleDone]}>
                      {i + 1}. {step.title}
                    </Text>
                    {step.estimatedMinutes ? (
                      <Text style={styles.stepTime}>
                        ⏱ {step.estimatedMinutes >= 60 ? `${(step.estimatedMinutes / 60).toFixed(1)}h` : `${step.estimatedMinutes} min`}
                      </Text>
                    ) : null}
                    {step.notes ? <Text style={styles.stepNotePreview} numberOfLines={1}>📝 {step.notes}</Text> : null}
                  </View>
                  <TouchableOpacity
                    style={styles.noteToggle}
                    onPress={() => {
                      setExpandedStep(isExpanded ? null : step.id);
                      setNotesDraft((d) => ({ ...d, [step.id]: step.notes || '' }));
                    }}
                  >
                    <Text style={styles.noteToggleText}>📝</Text>
                  </TouchableOpacity>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.notesBox}>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Ajoute des notes pour cette étape..."
                      placeholderTextColor="#555"
                      value={notesDraft[step.id] ?? step.notes ?? ''}
                      onChangeText={(v) => setNotesDraft((d) => ({ ...d, [step.id]: v }))}
                      multiline
                      numberOfLines={3}
                    />
                    <TouchableOpacity style={styles.notesSaveBtn} onPress={() => handleSaveNote(step)}>
                      <Text style={styles.notesSaveBtnText}>Sauvegarder</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
        {challenge && (
          <View style={styles.challengeCard}>
            <Text style={styles.challengeTitle}>🎯 Mini-Challenge</Text>
            <Text style={styles.challengeText}>{challenge.text}</Text>
            <Text style={styles.challengeXP}>+{challenge.xp} XP si tu le fais</Text>
            <TouchableOpacity onPress={() => setChallenge(null)}>
              <Text style={styles.challengeDismiss}>Ignorer →</Text>
            </TouchableOpacity>
          </View>
        )}
        {!task.completed && (
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.btnFocus} onPress={() => { startSession(task.id); router.push(`/cycle/${task.id}`); }}>
              <Text style={styles.btnText}>▶ Lancer un cycle focus</Text>
            </TouchableOpacity>

            {allStepsDone && (
              <TouchableOpacity style={styles.btnComplete} onPress={handleComplete}>
                <Text style={styles.btnText}>✅ Marquer comme terminée</Text>
              </TouchableOpacity>
            )}

            {isOverdue && !task.flemmeActive && (
              <TouchableOpacity style={styles.btnFlemme} onPress={handleFlemme}>
                <Text style={styles.btnText}>💀 Activer La Flemme</Text>
              </TouchableOpacity>
            )}

            {task.flemmeActive && flemmeLevel && (
              <View style={[styles.flemmeActiveCard, { borderColor: flemmeLevel.color }]}>
                <Text style={[styles.flemmeActiveTitle, { color: flemmeLevel.color }]}>💀 LA FLEMME EST ACTIVE</Text>
                <Text style={styles.flemmeActiveSub}>{flemmeLevel.label}</Text>
                <Text style={styles.flemmeCallCount}>Appels passés : {task.flemmeCallCount || 0}</Text>
              </View>
            )}
          </View>
        )}
        {task.completed && (
          <TouchableOpacity style={styles.btnReopen}
            onPress={() => Alert.alert('Rouvrir la tâche ?', 'Elle repassera en cours et tu perdras 50 XP.', [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Rouvrir', onPress: () => uncompleteTask(task.id) },
            ])}
          >
            <Text style={styles.btnReopenText}>↩ Rouvrir la tâche</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Supprimer la tâche</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#16213e' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  backText: { color: '#e94560', fontSize: 15, fontWeight: '700' },
  editBtn: { backgroundColor: '#0f3460', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: '#eee', fontSize: 13, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 60 },
  headerCard: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 18, borderLeftWidth: 4, marginBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  taskTitle: { fontSize: 20, fontWeight: '900', color: '#eee', flex: 1 },
  priorityTag: { fontSize: 12, fontWeight: '700' },
  taskDesc: { color: '#8888aa', marginTop: 6, fontSize: 14 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 10, flexWrap: 'wrap' },
  meta: { fontSize: 13, color: '#8888aa' },
  overdueTag: { color: '#e94560', fontWeight: '700', marginTop: 10, fontSize: 13 },
  completedTag: { color: '#66bb6a', fontWeight: '700', marginTop: 10, fontSize: 13 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#8888aa', fontWeight: '700', fontSize: 12, letterSpacing: 0.5, marginBottom: 10 },
  progressBar: { height: 6, backgroundColor: '#0f3460', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: '#e94560', borderRadius: 3 },
  progressText: { color: '#8888aa', fontSize: 12, marginTop: 6 },
  stepItem: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, marginBottom: 2, flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDone: { opacity: 0.6 },
  stepCheck: { fontSize: 20 },
  stepTitle: { color: '#eee', fontSize: 15, fontWeight: '600' },
  stepTitleDone: { textDecorationLine: 'line-through', color: '#8888aa' },
  stepTime: { color: '#8888aa', fontSize: 12, marginTop: 2 },
  stepNotePreview: { color: '#555', fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  noteToggle: { padding: 4 },
  noteToggleText: { fontSize: 18, opacity: 0.6 },
  notesBox: { backgroundColor: '#0f3460', borderRadius: 8, padding: 12, marginBottom: 8, marginTop: -2 },
  notesInput: { backgroundColor: '#1a1a2e', color: '#eee', borderRadius: 8, padding: 10, fontSize: 14, minHeight: 70, textAlignVertical: 'top' },
  notesSaveBtn: { backgroundColor: '#e94560', borderRadius: 6, padding: 8, alignItems: 'center', marginTop: 8 },
  notesSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  challengeCard: { backgroundColor: '#0f3460', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e94560' },
  challengeTitle: { color: '#e94560', fontWeight: '900', fontSize: 15, marginBottom: 6 },
  challengeText: { color: '#eee', fontSize: 15, fontWeight: '600' },
  challengeXP: { color: '#ffd700', fontSize: 13, marginTop: 6 },
  challengeDismiss: { color: '#8888aa', marginTop: 10, fontSize: 13 },
  actionsSection: { gap: 10, marginBottom: 16 },
  btnFocus: { backgroundColor: '#0f3460', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnComplete: { backgroundColor: '#2e7d32', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnFlemme: { backgroundColor: '#b71c1c', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  flemmeActiveCard: { backgroundColor: '#1a0000', borderRadius: 12, padding: 16, borderWidth: 1, alignItems: 'center' },
  flemmeActiveTitle: { fontWeight: '900', fontSize: 15 },
  flemmeActiveSub: { color: '#8888aa', fontSize: 13, marginTop: 4 },
  flemmeCallCount: { color: '#555', fontSize: 12, marginTop: 4 },
  btnReopen: { borderWidth: 1, borderColor: '#8888aa', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 10 },
  btnReopenText: { color: '#8888aa', fontWeight: '700', fontSize: 14 },
  deleteBtn: { alignItems: 'center', paddingVertical: 16 },
  deleteBtnText: { color: '#555', fontSize: 13 },
});
