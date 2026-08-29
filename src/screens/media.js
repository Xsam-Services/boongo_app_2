/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TabBar, TabView } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthContext } from '../contexts/AuthContext';
import { API, PADDING } from '../tools/constants';
import HeaderComponent from './header';
import FloatingActionsButton from '../components/floating_actions_button';
import EmptyListComponent from '../components/empty_list';
import MediaItemComponent from '../components/media_item';
import useColors from '../hooks/useColors';

const screenWidth = Dimensions.get('window').width;
const AUTO_REFRESH_MS = 60000;

const LoadingList = ({ COLORS, label }) => (
  <View style={styles.loadingState}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={[styles.loadingLabel, { color: COLORS.dark }]}>{label}</Text>
  </View>
);

const MediaList = ({ contentTopInset, handleScroll, isActive, listRef }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { userInfo } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(0);
  const [medias, setMedias] = useState([]);
  const [ad, setAd] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fallbackListRef = useRef(null);
  const flatListRef = listRef || fallbackListRef;
  const loadingRef = useRef(false);
  const lastPageRef = useRef(1);

  const fetchCategories = useCallback(async () => {
    if (!userInfo?.api_token) return;

    try {
      const group = encodeURIComponent('Catégorie pour œuvre');
      const response = await axios.get(`${API.boongo_url}/category/find_by_group/${group}`, {
        headers: { 'X-localization': 'fr', Authorization: `Bearer ${userInfo.api_token}` },
      });
      setCategories([{ id: 0, category_name: t('all_f') }, ...(response.data?.data || [])]);
    } catch (error) {
      console.error('Erreur fetchCategories media:', error);
    }
  }, [t, userInfo?.api_token]);

  const fetchMedias = useCallback(async (pageToFetch = 1, silent = false) => {
    if (!userInfo?.api_token || loadingRef.current || (pageToFetch > lastPageRef.current && pageToFetch !== 1)) return;

    loadingRef.current = true;
    if (!silent) setIsLoading(true);
    const qs = require('qs');

    try {
      const response = await axios.post(
        `${API.boongo_url}/work/filter_by_categories?page=${pageToFetch}`,
        qs.stringify({ 'categories_ids[0]': selectedCategoryId, type_id: 31, status_id: 17 }),
        { headers: { 'X-localization': 'fr', Authorization: `Bearer ${userInfo.api_token}` } }
      );
      const nextLastPage = response.data?.lastPage || 1;
      lastPageRef.current = nextLastPage;
      setLastPage(nextLastPage);
      setMedias(currentMedias => pageToFetch === 1 ? (response.data?.data || []) : [...currentMedias, ...(response.data?.data || [])]);
      setAd(response.data?.ad || null);
    } catch (error) {
      console.error('Erreur fetchMedias:', error);
    } finally {
      loadingRef.current = false;
      if (!silent) setIsLoading(false);
    }
  }, [selectedCategoryId, userInfo?.api_token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchMedias(page);
  }, [fetchMedias, page]);

  useEffect(() => {
    if (!isActive) return undefined;

    const interval = setInterval(() => fetchMedias(1, true), AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchMedias, isActive]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchMedias(1);
    setRefreshing(false);
  };

  const selectCategory = useCallback((id) => {
    setSelectedCategoryId(id);
    setPage(1);
    setMedias([]);
    setAd(null);
    setLastPage(1);
    lastPageRef.current = 1;
  }, []);

  const data = ad ? [...medias, { ...ad, id: 'ad', realId: ad.id }] : medias;

  return (
    <SafeAreaView style={[styles.scene, { backgroundColor: COLORS.light }]} edges={[]}>
      <Animated.FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
        renderItem={({ item }) => <MediaItemComponent item={item} />}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onEndReached={() => !isLoading && page < lastPage && setPage(currentPage => currentPage + 1)}
        onEndReachedThreshold={0.25}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.listContent, { paddingTop: contentTopInset }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={contentTopInset} />}
        ListHeaderComponent={
          <FlatList
            data={categories}
            horizontal
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesList}
            contentContainerStyle={styles.categoriesContent}
            renderItem={({ item }) => {
              const isSelected = selectedCategoryId === item.id;
              return (
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={() => selectCategory(item.id)}
                  style={[styles.categoryChip, { backgroundColor: isSelected ? COLORS.primary : COLORS.white, borderColor: isSelected ? COLORS.primary : COLORS.light_secondary }]}
                >
                  <Text style={[styles.categoryChipText, { color: isSelected ? '#ffffff' : COLORS.black }]}>{item.category_name}</Text>
                </TouchableOpacity>
              );
            }}
          />
        }
        ListEmptyComponent={isLoading ? <LoadingList COLORS={COLORS} label={t('loading')} /> : <EmptyListComponent iconName="play-box-multiple-outline" title={t('empty_list.title')} />}
        ListFooterComponent={() => isLoading && data.length > 0 ? <Text style={[styles.footerLoading, { color: COLORS.dark }]}>{t('loading')}</Text> : null}
      />
    </SafeAreaView>
  );
};

const FavoritesList = ({ contentTopInset, handleScroll, listRef }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { userInfo } = useContext(AuthContext);
  const fallbackListRef = useRef(null);
  const favorites = userInfo?.favorite_works || [];

  return (
    <SafeAreaView style={[styles.scene, { backgroundColor: COLORS.light }]} edges={[]}>
      <Animated.FlatList
        ref={listRef || fallbackListRef}
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MediaItemComponent item={item} />}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.listContent, { flexGrow: 1, paddingTop: contentTopInset }]}
        ListHeaderComponent={<Text style={[styles.favoriteIntro, { color: COLORS.dark }]}>{t('navigation.media.favorite')}</Text>}
        ListEmptyComponent={<EmptyListComponent iconName="heart-outline" title={t('empty_list.title')} />}
      />
    </SafeAreaView>
  );
};

const MediaScreen = () => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const mediaListRef = useRef(null);
  const favoriteListRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const contentTopInset = insets.top + 112;
  const [routes] = useState([
    { key: 'medias', title: t('navigation.media.title') },
    { key: 'favorite', title: t('navigation.media.favorite') },
  ]);

  const handleScroll = (event) => setShowBackToTop(event.nativeEvent.contentOffset.y > 0);

  const renderScene = ({ route }) => route.key === 'medias'
    ? <MediaList contentTopInset={contentTopInset} handleScroll={handleScroll} isActive={index === 0} listRef={mediaListRef} />
    : <FavoritesList contentTopInset={contentTopInset} handleScroll={handleScroll} listRef={favoriteListRef} />;

  const renderTabBar = (props) => (
    <View style={[styles.header, { backgroundColor: COLORS.white, paddingTop: insets.top }]}>
      <HeaderComponent title={t('navigation.media.title')} />
      <TabBar
        {...props}
        style={[styles.tabBar, { backgroundColor: COLORS.white }]}
        indicatorStyle={[styles.tabIndicator, { backgroundColor: COLORS.primary }]}
        activeColor={COLORS.primary}
        inactiveColor={COLORS.dark}
        renderLabel={({ route, focused, color }) => <Text style={[styles.tabLabel, { color, fontWeight: focused ? '700' : '600' }]}>{route.title}</Text>}
      />
    </View>
  );

  const handleIndexChange = (nextIndex) => {
    setIndex(nextIndex);
    setShowBackToTop(false);
  };

  const scrollToTop = () => {
    [mediaListRef, favoriteListRef][index].current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.light }]}>
      <TabView navigationState={{ index, routes }} renderScene={renderScene} onIndexChange={handleIndexChange} initialLayout={{ width: screenWidth }} renderTabBar={renderTabBar} />
      {showBackToTop ? <TouchableOpacity onPress={scrollToTop} style={[styles.backToTop, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}><Icon name="chevron-up" size={24} color={COLORS.black} /></TouchableOpacity> : null}
      <FloatingActionsButton />
    </View>
  );
};

export default MediaScreen;

const styles = StyleSheet.create({
  backToTop: { alignItems: 'center', borderRadius: 24, borderWidth: 1, bottom: 24, elevation: 6, height: 48, justifyContent: 'center', position: 'absolute', right: 20, shadowColor: '#172033', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 6, width: 48, zIndex: 20 },
  categoriesContent: { alignItems: 'center', paddingHorizontal: 16 },
  categoriesList: { flexGrow: 0, height: 48 },
  categoryChip: { borderRadius: 16, borderWidth: 1, marginRight: 8, paddingHorizontal: 14, paddingVertical: 8 },
  categoryChipText: { fontSize: 13, fontWeight: '700' },
  container: { flex: 1 },
  favoriteIntro: { fontSize: 14, fontWeight: '700', marginBottom: 12, marginHorizontal: 16 },
  footerLoading: { padding: PADDING.p01, textAlign: 'center' },
  header: { elevation: 8, position: 'absolute', shadowColor: '#172033', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, top: 0, width: '100%', zIndex: 10 },
  loadingLabel: { fontSize: 14, marginTop: 12 },
  loadingState: { alignItems: 'center', justifyContent: 'center', minHeight: 280, paddingHorizontal: 24 },
  listContent: { paddingBottom: 34 },
  scene: { flex: 1 },
  tabBar: { elevation: 0, shadowOpacity: 0 },
  tabIndicator: { borderRadius: 3, height: 3 },
  tabLabel: { fontSize: 13 },
});
