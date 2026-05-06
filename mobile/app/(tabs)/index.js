import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTaskStore } from '../../stores/taskStore';
import { useUserStore } from '../../stores/userStore';
import { requestPermissions } from '../../lib/notifications';
import { startFlemmeLoop } from '../../lib/flemme';
import NavBar from '../../components/NavBar';

const PRIORITY_ORDER = { high: 0, normal: 1, low: 2 };
const PRIORITY_COLORS = { high: '#e94560', normal: '#ffd700', low: '#66bb6a' };
const SORT_OPTIONS = [
  { id: 'date',     label: '📅 Date' },
  { id: 'priority', label: '🔴 Priorité' },
  { id: 'progress', label: '📊 Avancement' },
];

export default function HomeScreen() {
  const { tasks, hydrate, loaded, activateFlemme } = useTaskStore();
  const { autoFlemme, phone, backendUrl } = useUserStore();
  const [sort, setSort] = useState('date');

  useEffect(() => {
    if (!loaded) hydrate();
    requestPermissions();
  }, []);

  const onboardingDone = useUserStore((s) => s.onboardingDone);
  const userLoaded = useUserStore((s) => s.loaded);
  useEffect(() => {
    if (userLoaded && !onboardingDone) router.replace('/onboarding');
  }, [userLoaded, onboardingDone]);

  useEffect(() => {
    const check = () => {
      if (!autoFlemme) return;
      const now = new Date();
      useTaskStore.getState().tasks.forEach(async (task) => {
        if (!task.completed && !task.flemmeActive && new Date(task.dueDate) < now) {
          await activateFlemme(task.id);
          if (phone) await startFlemmeLoop(task.id, phone, backendUrl);
        }
      });
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [autoFlemme, phone, backendUrl]);

  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  const sorted = [...pending].sort((a, b) => {
    if (sort === 'date') return new Date(a.dueDate) - new Date(b.dueDate);
    if (sort === 'priority') return PRIORITY_ORDER[a.priority || 'normal'] - PRIORITY_ORDER[b.priority || 'normal'];
    if (sort === 'progress') {
      const pa = a.steps.filter(s => s.completed).length / (a.steps.length || 1);
      const pb = b.steps.filter(s => s.completed).length / (b.steps.length || 1);
      return pb - pa;
    }
    return 0;
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <NavBar />
      <FlatList
        data={sorted}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={<Header count={pending.length} sort={sort} setSort={setSort} />}
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => <TaskCard task={item} />}
        ListFooterComponent={done.length > 0 ? <DoneSection tasks={done} /> : null}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/task/create')} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function Header({ count, sort, setSort }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Mes tâches</Text>
      <Text style={styles.headerSub}>
        {count === 0 ? 'Rien en cours. Bravo ou paresseux ?' : `${count} tâche${count > 1 ? 's' : ''} en cours`}
      </Text>
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((o) => (
          <TouchableOpacity
            key={o.id}
            style={[styles.sortBtn, sort === o.id && styles.sortBtnActive]}
            onPress={() => setSort(o.id)}
          >
            <Text style={[styles.sortText, sort === o.id && styles.sortTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function TaskCard({ task }) {
  const now = new Date();
  const due = new Date(task.dueDate);
  const isOverdue = due < now;
  const stepsTotal = task.steps.length;
  const stepsDone = task.steps.filter((s) => s.completed).length;
  const progress = stepsTotal > 0 ? stepsDone / stepsTotal : 0;
  const priorityColor = PRIORITY_COLORS[task.priority || 'normal'];

  return (
    <Pressable style={[styles.card, { borderLeftColor: isOverdue ? '#e94560' : priorityColor }]} onPress={() => router.push(`/task/${task.id}`)}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{task.title}</Text>
        <View style={styles.cardBadges}>
          {task.flemmeActive && <Text style={styles.flemmeBadge}></Text>}
          {isOverdue && <Text style={styles.overdueBadge}>⚠️</Text>}
        </View>
      </View>
      <Text style={styles.cardDue}>
        📅 {due.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.progressText}>{stepsDone}/{stepsTotal} étapes</Text>
        <Text style={[styles.priorityLabel, { color: priorityColor }]}>
          {task.priority === 'high' ? '● Haute' : task.priority === 'low' ? '● Basse' : '● Normale'}
        </Text>
      </View>
    </Pressable>
  );
}

function DoneSection({ tasks }) {
  return (
    <View style={{ marginTop: 24 }}>
      <Text style={styles.sectionTitle}>✅ Terminées ({tasks.length})</Text>
      {tasks.map((t) => (
        <Pressable key={t.id} style={styles.cardDone} onPress={() => router.push(`/task/${t.id}`)}>
          <Text style={styles.cardTitleDone}>{t.title}</Text>
          <Text style={styles.xpText}>+{t.xp} XP</Text>
        </Pressable>
      ))}
    </View>
  );
}

function EmptyState() {
  const { seedDemoData } = useTaskStore();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>😴</Text>
      <Text style={styles.emptyText}>Aucune tâche en cours.{'\n'}La Flemme te regarde...</Text>
      <TouchableOpacity style={styles.demoBtn} onPress={seedDemoData} activeOpacity={0.8}>
        <Text style={styles.demoBtnText}>Charger les données de démo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#eee' },
  headerSub: { fontSize: 14, color: '#8888aa', marginTop: 4 },
  sortRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  sortBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#0f3460' },
  sortBtnActive: { backgroundColor: '#0f3460', borderColor: '#e94560' },
  sortText: { color: '#8888aa', fontSize: 12, fontWeight: '700' },
  sortTextActive: { color: '#e94560' },
  card: { backgroundColor: '#1a1a2e', marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16, borderLeftWidth: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#eee', flex: 1 },
  cardBadges: { flexDirection: 'row', gap: 4 },
  flemmeBadge: { fontSize: 16 },
  overdueBadge: { fontSize: 16 },
  cardDue: { fontSize: 12, color: '#8888aa', marginTop: 6 },
  progressBar: { height: 4, backgroundColor: '#0f3460', borderRadius: 2, marginTop: 10 },
  progressFill: { height: 4, backgroundColor: '#e94560', borderRadius: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressText: { fontSize: 11, color: '#8888aa' },
  priorityLabel: { fontSize: 11, fontWeight: '700' },
  cardDone: { backgroundColor: '#1a2a1a', marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between' },
  cardTitleDone: { fontSize: 15, color: '#66bb6a', fontWeight: '600' },
  xpText: { fontSize: 13, color: '#ffd700', fontWeight: '700' },
  sectionTitle: { fontSize: 14, color: '#8888aa', marginHorizontal: 16, marginBottom: 4, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 28, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#e94560', alignItems: 'center', justifyContent: 'center', elevation: 8 },
  fabText: { fontSize: 32, color: '#fff', lineHeight: 36 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 64 },
  emptyText: { color: '#8888aa', textAlign: 'center', marginTop: 16, fontSize: 15 },
  demoBtn: { marginTop: 28, backgroundColor: '#0f3460', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, borderWidth: 1, borderColor: '#e94560' },
  demoBtnText: { color: '#e94560', fontWeight: '800', fontSize: 14 },
});
