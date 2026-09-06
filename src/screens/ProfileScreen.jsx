import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import qs from 'qs';

import { AuthContext } from '../contexts/AuthContext';
import EmptyListComponent from '../components/empty_list';
import HeaderComponent from './header';
import WorkItemComponent from '../components/work_item';
import useColors from '../hooks/useColors';
import { API } from '../tools/constants';

const tabs = [
  { icon: 'book-open-page-variant-outline', key: 'works', label: 'Œuvres' },
  { icon: 'account-group-outline', key: 'circles', label: 'Cercles' },
  { icon: 'cash-check', key: 'consultations', label: 'Consultations' },
];

const getCircle = item => item.circle || item.group || item;
const hasCircleIdentity = item => {
  const circle = getCircle(item);
  return Boolean(circle?.circle_name || circle?.name || item?.circle_name);
};

const ProfileScreen = () => {
  const COLORS = useColors();
  const { userInfo } = useContext(AuthContext);
  const { user_id: userId } = useRoute().params || {};
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('works');
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(0);
  const [items, setItems] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const contentRequestRef = useRef(null);

  const headers = useMemo(() => ({ 'X-localization': 'fr', Authorization: `Bearer ${userInfo?.api_token}`, 'X-user-id': userInfo?.id }), [userInfo?.api_token, userInfo?.id]);

  const loadProfile = useCallback(async () => {
    if (!userId || !userInfo?.api_token) return;
    setLoadingProfile(true);
    try {
      const response = await axios.get(`${API.boongo_url}/user/${userId}`, { headers });
      setProfile(response.data?.data?.user || null);
    } catch (error) {

      setProfile(null);
    } finally { setLoadingProfile(false); }
  }, [headers, userId, userInfo?.api_token]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API.boongo_url}/category/find_by_group/${encodeURIComponent('Catégorie pour œuvre')}`, { headers });
      setCategories([{ id: 0, category_name: 'Toutes' }, ...(response.data?.data || [])]);
    } catch (error) {  }
  }, [headers]);

  const loadContent = useCallback(async (force = false) => {
    if (!profile?.id) return;
    const requestKey = `${activeTab}:${profile.id}:${categoryId}`;
    if (!force && contentRequestRef.current === requestKey) return;
    contentRequestRef.current = requestKey;
    setLoadingContent(true);
    try {
      if (activeTab === 'consultations') {
        if (contentRequestRef.current === requestKey) setItems(profile.valid_consultations || []);
      } else if (activeTab === 'circles') {
        const response = await axios.get(`${API.boongo_url}/user/member_groups/circle/${profile.id}/15`, { headers });
        const circles = (response.data?.data || []).filter(hasCircleIdentity);

        if (contentRequestRef.current === requestKey) setItems(circles);
      } else {
        const response = await axios.post(`${API.boongo_url}/work/filter_by_categories`, qs.stringify({ 'categories_ids[0]': categoryId, user_id: profile.id }), { headers });
        if (contentRequestRef.current === requestKey) setItems(response.data?.data || []);
      }
    } catch (error) {

    } finally {
      if (contentRequestRef.current === requestKey) {
        contentRequestRef.current = null;
        setLoadingContent(false);
      }
    }
  }, [activeTab, categoryId, headers, profile?.id, profile?.valid_consultations]);

  useEffect(() => { loadProfile(); loadCategories(); }, [loadCategories, loadProfile]);
  useEffect(() => { loadContent(); }, [loadContent]);

  const refresh = async () => { setRefreshing(true); await loadProfile(); await loadContent(true); setRefreshing(false); };
  const selectTab = tab => {
    if (tab === activeTab) return;
    contentRequestRef.current = `invalidated:${Date.now()}`;
    setItems([]);
    setLoadingContent(true);
    setActiveTab(tab);
  };
  const selectCategory = id => {
    if (id === categoryId) return;
    contentRequestRef.current = `invalidated:${Date.now()}`;
    setItems([]);
    setLoadingContent(true);
    setCategoryId(id);
  };
  const renderCircle = ({ item }) => {
    const circle = getCircle(item);
    const circleName = circle.circle_name || circle.name || item.circle_name || 'Cercle';
    const circleImage = circle.profile_url || circle.cover_url || item.profile_url || item.cover_url;
    const circleDescription = circle.circle_description || circle.description || item.circle_description;
    return <View style={[styles.circleCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
      {circleImage ? <Image source={{ uri: circleImage }} style={styles.circleImage} /> : <View style={[styles.circleImage, styles.circleFallback, { backgroundColor: COLORS.light_primary }]}><Icon name="account-group-outline" size={26} color={COLORS.primary} /></View>}
      <View style={styles.circleCopy}><Text style={[styles.circleTitle, { color: COLORS.black }]} numberOfLines={1}>{circleName}</Text><Text style={[styles.circleHint, { color: COLORS.dark }]} numberOfLines={2}>{circleDescription || 'Cercle de discussion.'}</Text></View>
    </View>
  };
  const emptyIcon = activeTab === 'circles' ? 'account-group-outline' : 'book-open-page-variant-outline';
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.light }]} edges={['top']}>
      <HeaderComponent title="Profil" hideSearch />
      {loadingProfile ? <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View> : <FlatList
        data={items}
        key={activeTab}
        keyExtractor={(item, index) => String(item.id || item.circle?.id || item.group?.id || index)}
        renderItem={activeTab === 'circles' ? renderCircle : ({ item }) => <WorkItemComponent item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={items.length ? styles.listContent : styles.emptyContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primary} />}
        ListHeaderComponent={<>
          <View style={[styles.profileCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
            <View style={[styles.profileAccent, { backgroundColor: COLORS.primary }]} />
            <View style={styles.profileTopline}><Icon name="account-circle-outline" size={14} color={COLORS.primary} /><Text style={[styles.profileEyebrow, { color: COLORS.primary }]}>PROFIL PUBLIC</Text></View>
            <View style={styles.profileIdentity}>
              {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={[styles.avatar, { borderColor: COLORS.light_secondary }]} /> : <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: COLORS.light_primary, borderColor: COLORS.light_secondary }]}><Icon name="account" size={34} color={COLORS.primary} /></View>}
              <View style={styles.profileCopy}><Text style={[styles.name, { color: COLORS.black }]} numberOfLines={2}>{[profile?.firstname, profile?.lastname].filter(Boolean).join(' ') || profile?.username || 'Profil'}</Text><Text style={[styles.handle, { color: COLORS.primary }]} numberOfLines={1}>@{profile?.username || '...'}</Text>{profile?.address_1 ? <View style={styles.location}><Icon name="map-marker-outline" size={14} color={COLORS.dark} /><Text style={[styles.meta, { color: COLORS.dark }]} numberOfLines={1}>{profile.address_1}</Text></View> : null}</View>
            </View>
          </View>
          <View style={[styles.tabBar, { borderBottomColor: COLORS.light_secondary }]}>{tabs.map(tab => <TouchableOpacity key={tab.key} onPress={() => selectTab(tab.key)} style={[styles.tab, activeTab === tab.key ? { borderBottomColor: COLORS.primary } : null]}><Icon name={tab.icon} size={18} color={activeTab === tab.key ? COLORS.primary : COLORS.dark} /><Text style={[styles.tabLabel, { color: activeTab === tab.key ? COLORS.primary : COLORS.dark }]}>{tab.label}</Text></TouchableOpacity>)}</View>
          {activeTab === 'works' ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{categories.map(category => <TouchableOpacity key={category.id} onPress={() => selectCategory(category.id)} style={[styles.chip, { backgroundColor: category.id === categoryId ? COLORS.primary : COLORS.white, borderColor: category.id === categoryId ? COLORS.primary : COLORS.light_secondary }]}><Text style={[styles.chipText, { color: category.id === categoryId ? '#fff' : COLORS.black }]}>{category.category_name}</Text></TouchableOpacity>)}</ScrollView> : null}
        </>}
        ListEmptyComponent={loadingContent ? <View style={styles.loadingContent}><ActivityIndicator color={COLORS.primary} /></View> : <EmptyListComponent iconName={emptyIcon} title="La liste est vide" />}
      />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({ screen: { flex: 1 }, center: { alignItems: 'center', flex: 1, justifyContent: 'center' }, listContent: { paddingBottom: 32 }, emptyContent: { flexGrow: 1, paddingBottom: 32 }, profileCard: { borderRadius: 24, borderWidth: 1, margin: 16, marginBottom: 6, overflow: 'hidden', padding: 18 }, profileAccent: { height: 4, left: 0, position: 'absolute', right: 0, top: 0 }, profileTopline: { alignItems: 'center', flexDirection: 'row' }, profileEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginLeft: 6 }, profileIdentity: { alignItems: 'center', flexDirection: 'row', marginTop: 15 }, avatar: { borderRadius: 34, borderWidth: 2, height: 68, width: 68 }, avatarFallback: { alignItems: 'center', justifyContent: 'center' }, profileCopy: { flex: 1, marginLeft: 13 }, name: { fontSize: 23, fontWeight: '800', letterSpacing: -0.35, lineHeight: 28 }, handle: { fontSize: 14, fontWeight: '800', marginTop: 3 }, location: { alignItems: 'center', flexDirection: 'row', marginTop: 8 }, meta: { flexShrink: 1, fontSize: 12, marginLeft: 4 }, tabBar: { borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginTop: 2 }, tab: { alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent', flex: 1, minHeight: 62, justifyContent: 'center' }, tabLabel: { fontSize: 12, fontWeight: '800', marginTop: 4 }, chips: { gap: 8, paddingHorizontal: 16, paddingBottom: 14, paddingTop: 14 }, chip: { borderRadius: 17, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 }, chipText: { fontSize: 13, fontWeight: '700' }, loadingContent: { alignItems: 'center', paddingTop: 70 }, circleCard: { alignItems: 'center', borderRadius: 20, borderWidth: 1, flexDirection: 'row', marginBottom: 10, marginHorizontal: 16, minHeight: 94, padding: 12 }, circleImage: { borderRadius: 14, height: 62, width: 62 }, circleFallback: { alignItems: 'center', justifyContent: 'center' }, circleCopy: { flex: 1, marginHorizontal: 12 }, circleTitle: { fontSize: 16, fontWeight: '800' }, circleHint: { fontSize: 13, lineHeight: 18, marginTop: 4 } });

export default ProfileScreen;
