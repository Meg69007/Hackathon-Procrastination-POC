import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';

const NAV_ITEMS = [
  { path: '/',         icon: '📋', label: 'Tâches'  },
  { path: '/stats',    icon: '🏆', label: 'Stats'   },
  { path: '/settings', icon: '⚙️', label: 'Params'  },
];

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(path);
  };

  const handleNav = (path) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <View>
      <View style={styles.bar}>
        <TouchableOpacity onPress={() => router.push('/')} activeOpacity={0.7}>
          <Text style={styles.logo}>La Flemme</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.burger} onPress={() => setOpen((v) => !v)} activeOpacity={0.7}>
          <View style={[styles.burgerLine, open && styles.burgerLineActive]} />
          <View style={[styles.burgerLine, open && styles.burgerLineActive]} />
          <View style={[styles.burgerLine, open && styles.burgerLineActive]} />
        </TouchableOpacity>
      </View>

      {open && (
        <View style={styles.menu}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <TouchableOpacity
                key={item.path}
                style={[styles.menuItem, active && styles.menuItemActive]}
                onPress={() => handleNav(item.path)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  logo: {
    color: '#e94560',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 1.5,
  },
  burger: {
    gap: 5,
    padding: 6,
    justifyContent: 'center',
  },
  burgerLine: {
    width: 22,
    height: 2,
    backgroundColor: '#8888aa',
    borderRadius: 2,
  },
  burgerLineActive: {
    backgroundColor: '#e94560',
  },
  menu: {
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  menuItemActive: {
    backgroundColor: '#0f3460',
  },
  menuIcon: {
    fontSize: 18,
  },
  menuLabel: {
    color: '#8888aa',
    fontSize: 15,
    fontWeight: '600',
  },
  menuLabelActive: {
    color: '#e94560',
    fontWeight: '800',
  },
});
