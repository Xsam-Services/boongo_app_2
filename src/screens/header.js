import React, { useContext } from 'react';
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DrawerActions, useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import LogoText from '../../assets/img/brand.svg';
import { AuthContext } from '../contexts/AuthContext';
import useColors from '../hooks/useColors';

const rootRoutes = new Set(['HomeStack', 'Media']);

const HeaderButton = ({ accessibilityLabel, children, onPress, COLORS }) => (
  <TouchableOpacity
    accessibilityLabel={accessibilityLabel}
    style={[styles.iconButton, { backgroundColor: COLORS.light_secondary }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {children}
  </TouchableOpacity>
);

const HeaderComponent = ({ title }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { userInfo } = useContext(AuthContext);
  const isRoot = rootRoutes.has(route.name);
  const isHome = route.name === 'HomeStack';
  const isAccount = route.name === 'Account';
  const displayName = [userInfo?.firstname, userInfo?.lastname].filter(Boolean).join(' ') || userInfo?.username;

  if (isAccount) {
    return (
      <>
        <StatusBar barStyle={COLORS.bar_style} backgroundColor={COLORS.white} />
        <View style={[styles.accountHeader, { backgroundColor: COLORS.white }]}>
          <View style={styles.accountActions}>
            <HeaderButton accessibilityLabel="Retour" onPress={() => navigation.goBack()} COLORS={COLORS}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.black} />
            </HeaderButton>
            <Text style={[styles.handle, { color: COLORS.dark }]}>@{userInfo?.username}</Text>
            <View style={styles.rightActions}>
              <HeaderButton accessibilityLabel="Notifications" onPress={() => navigation.navigate('Notifications')} COLORS={COLORS}>
                <MaterialCommunityIcons name="bell-outline" size={20} color={COLORS.black} />
              </HeaderButton>
              <HeaderButton accessibilityLabel="Paramètres" onPress={() => navigation.navigate('Settings')} COLORS={COLORS}>
                <MaterialCommunityIcons name="cog-outline" size={20} color={COLORS.black} />
              </HeaderButton>
            </View>
          </View>
          <View style={[styles.accountCard, { backgroundColor: COLORS.light_primary }]}>
            {userInfo?.avatar_url ? <Image source={{ uri: userInfo.avatar_url }} style={styles.accountAvatar} /> : (
              <View style={[styles.accountAvatar, styles.avatarFallback, { backgroundColor: COLORS.primary }]}>
                <MaterialCommunityIcons name="account" size={36} color="#ffffff" />
              </View>
            )}
            <View style={styles.accountIdentity}>
              <Text style={[styles.accountName, { color: COLORS.black }]} numberOfLines={1}>{displayName}</Text>
              {userInfo?.email ? <Text style={[styles.accountDetail, { color: COLORS.dark }]} numberOfLines={1}>{userInfo.email}</Text> : null}
              {userInfo?.phone ? <Text style={[styles.accountDetail, { color: COLORS.dark }]} numberOfLines={1}>{userInfo.phone}</Text> : null}
              {userInfo?.address_1 ? <Text style={[styles.accountDetail, { color: COLORS.dark }]} numberOfLines={1}>{userInfo.address_1}</Text> : null}
              {userInfo?.last_organization ? (
                <Text style={[styles.accountOrganization, { color: COLORS.primary }]} numberOfLines={1}>{userInfo.last_organization.org_name}</Text>
              ) : (
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                  <Text style={[styles.accountOrganization, { color: COLORS.primary }]}>{t('auth.organization.new')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </>
    );
  }

  const leadingAction = isRoot
    ? () => navigation.dispatch(DrawerActions.openDrawer())
    : () => navigation.goBack();

  return (
    <>
      <StatusBar barStyle={COLORS.bar_style} backgroundColor={COLORS.white} />
      <View style={[styles.header, { backgroundColor: COLORS.white, borderBottomColor: COLORS.dark_light }]}>
        <View style={styles.leading}>
          <HeaderButton accessibilityLabel={isRoot ? 'Ouvrir le menu' : 'Retour'} onPress={leadingAction} COLORS={COLORS}>
            <MaterialCommunityIcons name={isRoot ? 'menu' : 'chevron-left'} size={24} color={COLORS.black} />
          </HeaderButton>
          {isHome ? <LogoText width={104} height={28} style={styles.logo} /> : null}
          {title ? <Text style={[styles.title, { color: COLORS.black }]} numberOfLines={1}>{title}</Text> : null}
        </View>
        <View style={styles.rightActions}>
          {route.name !== 'OrganizationSettings' && route.name !== 'Notifications' && route.name !== 'Language' ? (
            route.name === 'Settings' ? (
              <HeaderButton accessibilityLabel="Langue" onPress={() => navigation.navigate('Language')} COLORS={COLORS}>
                <MaterialCommunityIcons name="translate" size={20} color={COLORS.black} />
              </HeaderButton>
            ) : (
              <HeaderButton accessibilityLabel="Recherche" onPress={() => navigation.navigate('Search')} COLORS={COLORS}>
                <MaterialCommunityIcons name="magnify" size={21} color={COLORS.black} />
              </HeaderButton>
            )
          ) : null}
          {isRoot || route.name === 'Establishment' || route.name === 'Government' ? (
            <HeaderButton accessibilityLabel="Dictionnaire" onPress={() => navigation.navigate('Dictionary')} COLORS={COLORS}>
              <MaterialCommunityIcons name="book-open-blank-variant" size={20} color={COLORS.black} />
            </HeaderButton>
          ) : null}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 64, paddingHorizontal: 16 },
  leading: { alignItems: 'center', flex: 1, flexDirection: 'row', minWidth: 0 },
  logo: { marginLeft: 10 },
  title: { flexShrink: 1, fontSize: 17, fontWeight: '700', marginLeft: 10 },
  iconButton: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  rightActions: { flexDirection: 'row', gap: 8 },
  accountHeader: { paddingHorizontal: 16, paddingVertical: 12 },
  accountActions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  handle: { fontSize: 14, fontWeight: '600' },
  accountCard: { alignItems: 'center', borderRadius: 20, flexDirection: 'row', marginTop: 16, padding: 14 },
  accountAvatar: { borderRadius: 34, height: 68, width: 68 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  accountIdentity: { flex: 1, marginLeft: 13 },
  accountName: { fontSize: 19, fontWeight: '700' },
  accountDetail: { fontSize: 13, marginTop: 3 },
  accountOrganization: { fontSize: 13, fontWeight: '700', marginTop: 7 },
});

export default HeaderComponent;
