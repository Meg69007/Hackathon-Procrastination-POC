import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTaskStore } from '../../stores/taskStore';
import NavBar from '../../components/NavBar';

const XP_LEVELS = [
  { level: 1, label: 'Full Flemme' , min: 0},
  { level: 2, label: 'Fatigué' , min: 60},
  { level: 3, label: 'Endormi', min: 120 },
  { level: 4, label: 'Réveillé', min: 180 },
  { level: 5, label: 'Motivé', min: 300 },
  { level: 6, label: 'En mode', min: 600 },
  { level: 7, label: 'Inarrêtable', min: 1000 },
  { level: 8, label: 'La Flemme vaincue', min: 2000 },
];

function getLevel(xp) {
  let current = XP_LEVELS[0];
  for (const lvl of XP_LEVELS) {
    if (xp >= lvl.min) current = lvl;
  }
  const idx = XP_LEVELS.indexOf(current);
  const next = XP_LEVELS[idx + 1];
  const progress = next ? (xp - current.min) / (next.min - current.min) : 1;
  return { current, next, progress };
}

function streakEmoji(streak) {
  if (streak >= 30) return '🏆';
  if (streak >= 14) return '🔥';
  if (streak >= 7) return '⚡';
  if (streak >= 3) return '✨';
  if (streak >= 1) return '🌱';
  return '😴';
}

export default function StatsScreen() {
  const { getTotalXP, getCompletedCount, getStreak, getWeekHistory, tasks } = useTaskStore();
  const xp = getTotalXP();
  const { current, next, progress } = getLevel(xp);
  const completed = getCompletedCount();
  const streak = getStreak();
  const weekHistory = getWeekHistory();
  const totalSteps = tasks.reduce((s, t) => s + t.steps.filter((st) => st.completed).length, 0);
  const maxDay = Math.max(...weekHistory.map((d) => d.count), 1);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <NavBar />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>Ton profil anti-flemme</Text>
        <View style={[styles.streakCard, streak >= 3 && styles.streakCardActive]}>
          <View style={styles.streakLeft}>
            <Text style={styles.streakEmoji}>{streakEmoji(streak)}</Text>
            <View>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakLabel}>jour{streak !== 1 ? 's' : ''} de streak</Text>
            </View>
          </View>
          <View style={styles.streakRight}>
            <Text style={styles.streakMsg}>
              {streak === 0 && 'Complète une tâche\naujourd\'hui pour démarrer !'}
              {streak === 1 && 'C\'est un début 💪\nReviens demain !'}
              {streak >= 2 && streak < 7 && `${7 - streak} jours pour\natteindre une semaine !`}
              {streak >= 7 && streak < 14 && 'Une semaine complète 🔥\nContinue !'}
              {streak >= 14 && 'Tu es une machine.\nLa Flemme a peur de toi.'}
            </Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activité — 7 derniers jours</Text>
          <View style={styles.weekRow}>
            {weekHistory.map((d, i) => {
              const isToday = i === 6;
              const heightPct = d.count > 0 ? Math.max(0.15, d.count / maxDay) : 0;
              return (
                <View key={i} style={styles.dayCol}>
                  <View style={styles.barContainer}>
                    {d.count > 0 && (
                      <View style={[
                        styles.dayBar,
                        { height: `${heightPct * 100}%` },
                        isToday && styles.dayBarToday,
                      ]} />
                    )}
                  </View>
                  {d.count > 0 && (
                    <Text style={[styles.dayCount, isToday && { color: '#e94560' }]}>{d.count}</Text>
                  )}
                  <Text style={[styles.dayName, isToday && styles.dayNameToday]}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.levelCard}>
          <Text style={styles.levelLabel}>Niveau {current.level}</Text>
          <Text style={styles.levelName}>{current.label}</Text>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
          <Text style={styles.xpText}>
            {xp} XP {next ? `→ ${next.min} XP pour "${next.label}"` : '— MAX LEVEL 🔥'}
          </Text>
        </View>
        <View style={styles.grid}>
          <Stat label="XP Total" value={xp} emoji="⚡" />
          <Stat label="Streak actuel" value={`${streak}j`} emoji={streakEmoji(streak)} />
          <Stat label="Tâches finies" value={completed} emoji="✅" />
          <Stat label="Étapes faites" value={totalSteps} emoji="🎯" />
        </View>
        <View style={styles.badgeSection}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badges}>
            {completed >= 1 ? <Badge emoji="🥇" label="Premier sang" /> : <Badge emoji="🥇" label="Premier sang" locked />}
            {completed >= 5 ? <Badge emoji="🔥" label="En feu" /> : <Badge emoji="🔥" label="En feu" locked />}
            {streak >= 3 ? <Badge emoji="✨" label="3j streak" /> : <Badge emoji="✨" label="3j streak" locked />}
            {streak >= 7 ? <Badge emoji="⚡" label="7j streak" /> : <Badge emoji="⚡" label="7j streak" locked />}
            {streak >= 30 ? <Badge emoji="🏆" label="30j streak" /> : <Badge emoji="🏆" label="30j streak" locked />}
            {xp >= 200 ? <Badge emoji="💎" label="XP 200" /> : <Badge emoji="💎" label="XP 200" locked />}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, emoji }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Badge({ emoji, label, locked }) {
  return (
    <View style={[styles.badge, locked && styles.badgeLocked]}>
      <Text style={{ fontSize: 26, opacity: locked ? 0.25 : 1 }}>{emoji}</Text>
      <Text style={[styles.badgeLabel, locked && { color: '#444' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  title: { fontSize: 24, fontWeight: '900', color: '#e94560', marginBottom: 16 },

  streakCard: {
    backgroundColor: '#1a1a2e', borderRadius: 16, padding: 18, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#0f3460',
  },
  streakCardActive: { borderColor: '#e94560', backgroundColor: '#1a0f0f' },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  streakEmoji: { fontSize: 44 },
  streakNumber: { fontSize: 40, fontWeight: '900', color: '#e94560', lineHeight: 44 },
  streakLabel: { fontSize: 12, color: '#8888aa', fontWeight: '700' },
  streakRight: { flex: 1, alignItems: 'flex-end' },
  streakMsg: { color: '#8888aa', fontSize: 12, textAlign: 'right', lineHeight: 18 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#8888aa', marginBottom: 12, letterSpacing: 0.5 },

  weekRow: {
    flexDirection: 'row', backgroundColor: '#1a1a2e', borderRadius: 14,
    padding: 16, gap: 8, alignItems: 'flex-end', height: 100,
  },
  dayCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barContainer: { flex: 1, width: '100%', justifyContent: 'flex-end', marginBottom: 2 },
  dayBar: { width: '100%', backgroundColor: '#0f3460', borderRadius: 4 },
  dayBarToday: { backgroundColor: '#e94560' },
  dayCount: { fontSize: 10, color: '#8888aa', fontWeight: '700', marginBottom: 2 },
  dayName: { fontSize: 10, color: '#555', fontWeight: '700' },
  dayNameToday: { color: '#e94560' },

  levelCard: {
    backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 20,
  },
  levelLabel: { fontSize: 11, color: '#8888aa', fontWeight: '800', letterSpacing: 1 },
  levelName: { fontSize: 26, fontWeight: '900', color: '#e94560', marginTop: 4 },
  bar: { height: 8, backgroundColor: '#0f3460', borderRadius: 4, marginTop: 12 },
  barFill: { height: 8, backgroundColor: '#e94560', borderRadius: 4 },
  xpText: { fontSize: 12, color: '#8888aa', marginTop: 8 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16,
    flex: 1, minWidth: '45%', alignItems: 'center',
  },
  statEmoji: { fontSize: 26 },
  statValue: { fontSize: 28, fontWeight: '900', color: '#e94560', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#8888aa', marginTop: 2, textAlign: 'center' },

  badgeSection: { marginBottom: 40 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: {
    backgroundColor: '#1a1a2e', borderRadius: 12, padding: 12,
    alignItems: 'center', minWidth: 76,
  },
  badgeLocked: { opacity: 0.4 },
  badgeLabel: { fontSize: 10, color: '#eee', marginTop: 4, textAlign: 'center' },
});
