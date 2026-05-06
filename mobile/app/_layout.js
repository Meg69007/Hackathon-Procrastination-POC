import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTaskStore } from '../stores/taskStore';
import { useUserStore } from '../stores/userStore';

export default function RootLayout() {
  const hydrateTask = useTaskStore((s) => s.hydrate);
  const hydrateUser = useUserStore((s) => s.hydrate);

  useEffect(() => {
    hydrateTask();
    hydrateUser();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: '#16213e' },
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="task/create" />
        <Stack.Screen name="task/[id]" />
        <Stack.Screen name="task/edit/[id]" />
        <Stack.Screen name="cycle/[id]" />
        <Stack.Screen name="settings" />
      </Stack>
    </SafeAreaProvider>
  );
}
