import React, { useContext } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { AuthContext } from '../contexts/AuthContext';
import ThemeContext from '../contexts/ThemeContext';
import useColors from '../hooks/useColors';
import LogoText from '../../assets/img/brand.svg';

const drawerItems = [
  { icon: 'home-variant-outline', label: 'navigation.home.title', route: 'HomeStack' },
  { icon: 'account-circle-outline', label: 'navigation.account.title', route: 'Account' },
  { icon: 'bank-outline', label: 'navigation.establishment.title', route: 'Establishment' },
  { icon: 'city-variant-outline', label: 'navigation.government.title', route: 'Government' },
  { icon: 'image-multiple-outline', label: 'navigation.media.title', route: 'Media' },
  { icon: 'cog-outline', label: 'navigation.settings.title', route: 'Settings' },
  { icon: 'help-circle-outline', label: 'navigation.about', route: 'About' },
];

const DrawerContent = props => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { userInfo, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const displayName = [userInfo?.firstname, userInfo?.lastname].filter(Boolean).join(' ') || userInfo?.username;

  const navigate = route => {
    props.navigation.navigate(route);
    props.navigation.closeDrawer();
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: COLORS.white }]}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        <View style={styles.brandHeader}>
          <LogoText width={118} height={34} />
          <Text style={[styles.byReborn, { color: COLORS.dark }]}>by Reborn</Text>
        </View>

        <TouchableOpacity style={[styles.profileCard, { backgroundColor: COLORS.light_primary }]} onPress={() => navigate('Account')} activeOpacity={0.8}>
          {userInfo?.avatar_url ? <Image source={{ uri: userInfo.avatar_url }} style={styles.avatar} /> : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: COLORS.primary }]}>
              <MaterialCommunityIcons name="account" size={28} color="#ffffff" />
            </View>
          )}
          <View style={styles.profileText}>
            <Text style={[styles.profileName, { color: COLORS.black }]} numberOfLines={1}>{displayName}</Text>
            <Text style={[styles.profileHandle, { color: COLORS.dark }]} numberOfLines={1}>@{userInfo?.username}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.dark_secondary} />
        </TouchableOpacity>

        <View style={styles.menu}>
          {drawerItems.map(item => (
            <TouchableOpacity key={item.route} style={styles.menuItem} onPress={() => navigate(item.route)} activeOpacity={0.7}>
              <View style={[styles.iconBubble, { backgroundColor: COLORS.light_secondary }]}>
                <MaterialCommunityIcons name={item.icon} size={21} color={COLORS.dark_secondary} />
              </View>
              <Text style={[styles.menuLabel, { color: COLORS.black }]}>{t(item.label)}</Text>
              <MaterialCommunityIcons name="chevron-right" size={19} color={COLORS.dark} />
            </TouchableOpacity>
          ))}
        </View>
      </DrawerContentScrollView>

      <View style={styles.bottomArea}>
        <View style={styles.bottomActions}>
          <TouchableOpacity style={[styles.logoutButton, { borderColor: COLORS.danger_transparent }]} onPress={logout} activeOpacity={0.8}>
            <FontAwesome6 name="power-off" size={16} color={COLORS.danger} />
            <Text style={[styles.logoutText, { color: COLORS.danger }]}>{t('logout')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={t('dark_theme')}
            style={[styles.themeButton, { backgroundColor: COLORS.light_secondary }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name={theme === 'dark' ? 'weather-night' : 'white-balance-sunny'} size={21} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
  brandHeader: { alignItems: 'center', marginBottom: 24 },
  byReborn: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3, marginTop: 2 },
  profileCard: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', padding: 12 },
  avatar: { borderRadius: 24, height: 48, width: 48 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  profileText: { flex: 1, marginHorizontal: 11 },
  profileName: { fontSize: 15, fontWeight: '700' },
  profileHandle: { fontSize: 13, marginTop: 2 },
  menu: { marginTop: 24 },
  menuItem: { alignItems: 'center', flexDirection: 'row', minHeight: 56 },
  iconBubble: { alignItems: 'center', borderRadius: 11, height: 38, justifyContent: 'center', width: 38 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', marginLeft: 12 },
  bottomArea: { padding: 16 },
  bottomActions: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  logoutButton: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 10, justifyContent: 'center', minHeight: 48 },
  themeButton: { alignItems: 'center', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  logoutText: { fontSize: 15, fontWeight: '700' },
});

export default DrawerContent;
