import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';

const NAV_ITEMS = [
  { path: '/',         icon: '📋', label: 'Tâches'  },
  { path: '/stats',    icon: '🏆', label: 'Stats'   },
  { path: '/settings', icon: '⚙️', label: 'Params'  },
];

export default function NavBar() {
  const pathname = usePathname();

  const isActive = (path) => {
    if (path === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(path);
  };

  return (
    <View style={styles.bar}>
      <Text style={styles.logo}>💀 LaFlemme</Text>
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <TouchableOpacity
              key={item.path}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => router.push(item.path)}
              activeOpacity={0.7}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  logo: {
    color: '#e94560',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  nav: {
    flexDirection: 'row',
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#0f3460',
  },
  navIcon: {
    fontSize: 16,
  },
  navLabel: {
    color: '#8888aa',
    fontSize: 13,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#e94560',
  },
});
