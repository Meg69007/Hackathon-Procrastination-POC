import { Tabs } from 'expo-router';
import NavBar from '../../components/NavBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="stats" />
    </Tabs>
  );
}
