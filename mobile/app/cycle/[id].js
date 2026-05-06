import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTimerStore } from '../../stores/timerStore';
import { useTaskStore } from '../../stores/taskStore';
import { useAmbientSound, SOUND_OPTIONS } from '../../lib/ambientSound';

const PHASE_CONFIG = {
  focus:     { label: 'FOCUS',         color: '#e94560', emoji: '🔥', bg: '#1a0010' },
  break:     { label: 'PAUSE',         color: '#00b894', emoji: '☕', bg: '#001a10' },
  longBreak: { label: 'GRANDE PAUSE',  color: '#0984e3', emoji: '🌊', bg: '#001020' },
  idle:      { label: 'PRÊT',          color: '#8888aa', emoji: '⏸',  bg: '#16213e' },
};

function formatTime(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function CycleScreen() {
  const { id } = useLocalSearchParams();
  const { tasks } = useTaskStore();
  const { phase, secondsLeft, cycleCount, isRunning, play, pause, reset, stop } = useTimerStore();
  const { active: activeSound, play: playSound, stop: stopSound } = useAmbientSound();
  const task = tasks.find((t) => t.id === id);
  const config = PHASE_CONFIG[phase] || PHASE_CONFIG.idle;

  useEffect(() => {
    if (phase !== 'focus' && !isRunning && Platform.OS !== 'web') {
      Vibration.vibrate([0, 200, 100, 200]);
    }
    if (phase !== 'focus' && activeSound !== 'off') stopSound();
  }, [phase]);

  const handleStop = () => { stop(); stopSound(); router.back(); };

  const totalSeconds = phase === 'focus'
    ? useTimerStore.getState().secondsLeft + (isRunning ? 0 : 0) || 25 * 60
    : phase === 'longBreak' ? 15 * 60 : 5 * 60;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: config.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleStop} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.taskName} numberOfLines={1}>{task?.title || 'Cycle focus'}</Text>
        <View style={styles.cycleBadge}>
          <Text style={styles.cycleText}>Cycle {cycleCount + 1}</Text>
        </View>
      </View>
      <View style={styles.timerContainer}>
        <View style={[styles.timerRing, { borderColor: config.color }]}>
          <View style={styles.timerInner}>
            <Text style={styles.phaseEmoji}>{config.emoji}</Text>
            <Text style={[styles.timerText, { color: config.color }]}>{formatTime(secondsLeft)}</Text>
            <Text style={[styles.phaseLabel, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
      </View>
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i < cycleCount % 4 ? config.color : '#333' }]} />
        ))}
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.resetBtn} onPress={reset}>
          <Text style={styles.ctrlText}>↺</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.playBtn, { backgroundColor: config.color }]} onPress={isRunning ? pause : play}>
          <Text style={styles.playText}>{isRunning ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetBtn} onPress={handleStop}>
          <Text style={styles.ctrlText}>⏹</Text>
        </TouchableOpacity>
      </View>
      {Platform.OS === 'web' && (
        <View style={styles.soundSection}>
          <Text style={styles.soundTitle}>Sons ambiants</Text>
          <View style={styles.soundRow}>
            {SOUND_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.soundBtn, activeSound === s.id && styles.soundBtnActive]}
                onPress={() => activeSound === s.id ? stopSound() : playSound(s.id)}
              >
                <Text style={styles.soundIcon}>{s.icon}</Text>
                <Text style={[styles.soundLabel, activeSound === s.id && { color: config.color }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      <View style={styles.tipBox}>
        {phase === 'focus'     && <Text style={styles.tipText}>📵 Coupe les notifications. Focus total.</Text>}
        {phase === 'break'     && <Text style={styles.tipText}>🚶 Lève-toi, bouge. Ton cerveau recharge.</Text>}
        {phase === 'longBreak' && <Text style={styles.tipText}>🍎 Mange, hydrate-toi. Tu l'as mérité.</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 12 },
  backBtn: { padding: 8 },
  backText: { color: '#8888aa', fontSize: 15 },
  taskName: { flex: 1, color: '#eee', fontSize: 15, fontWeight: '700' },
  cycleBadge: { backgroundColor: '#ffffff22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  cycleText: { color: '#eee', fontSize: 12, fontWeight: '700' },
  timerContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  timerRing: { width: 240, height: 240, borderRadius: 120, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  timerInner: { alignItems: 'center' },
  phaseEmoji: { fontSize: 36 },
  timerText: { fontSize: 58, fontWeight: '900', letterSpacing: -2, marginTop: 6 },
  phaseLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 3, marginTop: 4 },
  dotsRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 24 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 20 },
  resetBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#ffffff15', alignItems: 'center', justifyContent: 'center' },
  ctrlText: { fontSize: 22 },
  playBtn: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  playText: { fontSize: 30 },
  soundSection: { paddingHorizontal: 20, marginBottom: 12 },
  soundTitle: { color: '#8888aa', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8, textAlign: 'center' },
  soundRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  soundBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#ffffff10', alignItems: 'center' },
  soundBtnActive: { backgroundColor: '#ffffff25' },
  soundIcon: { fontSize: 20 },
  soundLabel: { color: '#8888aa', fontSize: 10, marginTop: 2, fontWeight: '600' },
  tipBox: { marginHorizontal: 32, marginBottom: 24, backgroundColor: '#ffffff08', borderRadius: 12, padding: 12, alignItems: 'center' },
  tipText: { color: '#8888aa', fontSize: 13, textAlign: 'center' },
});
