/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, TouchableOpacity, Animated, Dimensions, RefreshControl, FlatList, Text, StyleSheet } from 'react-native';
import { TabBar, TabView } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API, PADDING } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import HeaderComponent from '../header';
import EmptyListComponent from '../../components/empty_list';
import NewsItemComponent from '../../components/news_item';
import WorkItemComponent from '../../components/work_item';
import FloatingActionsButton from '../../components/floating_actions_button';
import homeStyles from '../style';
import useColors from '../../hooks/useColors';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;

const LoadingList = ({ COLORS, label }) => (
  <View style={styles.loadingState}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={[styles.loadingLabel, { color: COLORS.dark }]}>{label}</Text>
  </View>
);

// News frame
const News = ({ handleScroll, listRef, contentTopInset }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { userInfo } = useContext(AuthContext);

  const [news, setNews] = useState([]);
  const [ad, setAd] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fallbackListRef = useRef(null);
  const flatListRef = listRef || fallbackListRef;
  const loadingRef = useRef(false);
  const lastPageRef = useRef(1);

  const fetchWorks = useCallback(async (pageToFetch = 1) => {
    if (!userInfo?.api_token || loadingRef.current || (pageToFetch > lastPageRef.current && pageToFetch !== 1)) return;

    loadingRef.current = true;
    setIsLoading(true);
    const qs = require('qs');
    const url = `${API.boongo_url}/work/filter_by_categories?page=${pageToFetch}`;
    const mParams = { type_id: 33, status_id: 17 };
    const mHeaders = {
      'X-localization': 'fr',
      'Authorization': `Bearer ${userInfo.api_token}`
    };

    try {
      const response = await axios.post(url, qs.stringify(mParams), { headers: mHeaders });
      const responseData = response.data?.data || [];

      if (pageToFetch === 1) {
        setNews(responseData);
      } else {
        setNews(prev => [...prev, ...responseData]);
      }

      setAd(response.data?.ad || null);
      const nextLastPage = response.data?.lastPage || 1;
      lastPageRef.current = nextLastPage;
      setLastPage(nextLastPage);
      setCount(response.data?.count || 0);
    } catch (error) {
      if (error.response?.status === 429) {
        console.warn("Trop de requêtes envoyées. Attendez avant de réessayer.");
      } else {
        console.error("Erreur fetchWorks News:", error);
      }
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [userInfo?.api_token]);

  useEffect(() => {
    fetchWorks(1);
  }, [fetchWorks]);

  useEffect(() => {
    if (page > 1) {
      fetchWorks(page);
    }
  }, [page, fetchWorks]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchWorks(1);
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (!isLoading && page < lastPage) {
      setPage(prev => prev + 1);
    }
  };

  const combinedData = [...news];
  if (ad) {
    combinedData.push({ ...ad, realId: ad.id, id: 'ad' });
  }

  return (
    <SafeAreaView style={[styles.scene, { backgroundColor: COLORS.light }]} edges={[]}>
      <View style={styles.listShell}>
        <Animated.FlatList
          ref={flatListRef}
          data={combinedData}
          keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
          renderItem={({ item }) => <NewsItemComponent item={item} />}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={false}
          onScroll={handleScroll}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
          scrollEventThrottle={16}
          contentContainerStyle={[homeStyles.scrollableList, styles.listContent, { paddingTop: contentTopInset }]}
          windowSize={10}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              progressViewOffset={105}
            />
          }
          ListEmptyComponent={isLoading ? <LoadingList COLORS={COLORS} label={t('loading')} /> : <EmptyListComponent iconName='script-text-outline' title={t('empty_list.title')} description={t('empty_list.description_news')} />}
          ListFooterComponent={() =>
            isLoading && combinedData.length > 0 ? (
              <Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01 }}>{t('loading')}</Text>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
};

// Books frame
const Books = ({ handleScroll, listRef, contentTopInset }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { userInfo } = useContext(AuthContext);

  const [categories, setCategories] = useState([]);
  const [idCat, setIdCat] = useState(0);
  const [books, setBooks] = useState([]);
  const [ad, setAd] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fallbackListRef = useRef(null);
  const flatListRef = listRef || fallbackListRef;
  const loadingRef = useRef(false);
  const lastPageRef = useRef(1);

  const fetchCategories = useCallback(async () => {
    if (!userInfo?.api_token) return;
    const headers = {
      'X-localization': 'fr',
      Authorization: `Bearer ${userInfo.api_token}`,
    };

    try {
      const group = encodeURIComponent('Catégorie pour œuvre');
      const res = await axios.get(`${API.boongo_url}/category/find_by_group/${group}`, { headers });
      const data = res.data?.data || [];
      const itemAll = { id: 0, category_name: t('all_f'), category_name_fr: "Toutes", category_name_en: "All", category_name_ln: "Nioso", category_description: null };

      data.unshift(itemAll);
      setCategories(data);
      setIdCat(itemAll.id);
    } catch (error) {
      console.error('Erreur fetchCategories index', error);
    }
  }, [userInfo?.api_token, t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchBooks = useCallback(async (pageToFetch = 1) => {
    if (!userInfo?.api_token || loadingRef.current || (pageToFetch > lastPageRef.current && pageToFetch !== 1)) return;
    loadingRef.current = true;
    setIsLoading(true);

    const qs = require('qs');
    const url = `${API.boongo_url}/work/filter_by_categories?page=${pageToFetch}`;
    const params = {
      'categories_ids[0]': idCat,
      type_id: 29,
      status_id: 17,
    };

    const headers = {
      'X-localization': 'fr',
      Authorization: `Bearer ${userInfo.api_token}`,
    };

    try {
      const response = await axios.post(url, qs.stringify(params), { headers });
      const data = response.data?.data || [];

      setBooks(prev => (pageToFetch === 1 ? data : [...prev, ...data]));
      setAd(response.data?.ad || null);
      const nextLastPage = response.data?.lastPage || pageToFetch;
      lastPageRef.current = nextLastPage;
      setLastPage(nextLastPage);
      setCount(response.data?.count || 0);
    } catch (error) {
      console.error('Erreur fetchBooks', error);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [userInfo?.api_token, idCat]);

  useEffect(() => {
    fetchBooks(page);
  }, [page, idCat, fetchBooks]);

  const combinedData = [...books];
  if (ad) {
    combinedData.push({ ...ad, id: 'ad', realId: ad.id });
  }

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setBooks([]);
    await fetchBooks(1);
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (!isLoading && page < lastPage) {
      setPage(prev => prev + 1);
    }
  };

  const handleBadgePress = useCallback((id) => {
    setIdCat(id);
    setPage(1);
    setBooks([]);
    setLastPage(1);
    lastPageRef.current = 1;
  }, []);

  const CategoryItem = ({ item }) => {
    const isSelected = idCat === item.id;
    return (
      <TouchableOpacity
        onPress={() => handleBadgePress(item.id)}
        activeOpacity={0.78}
        style={[styles.categoryChip, { backgroundColor: isSelected ? COLORS.primary : COLORS.white, borderColor: isSelected ? COLORS.primary : COLORS.light_secondary }]}
      >
        <Text style={[styles.categoryChipText, { color: isSelected ? '#ffffff' : COLORS.black }]}>{item.category_name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.scene, { backgroundColor: COLORS.light }]}>
      <SafeAreaView style={{ flex: 1 }} edges={[]}>
        <Animated.FlatList
          ref={flatListRef}
          data={combinedData}
          extraData={combinedData}
          keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
          renderItem={({ item }) => <WorkItemComponent item={item} />}
          horizontal={false}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={false}
          onScroll={handleScroll}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
          scrollEventThrottle={16}
          windowSize={10}
          contentContainerStyle={[styles.listContent, { paddingTop: contentTopInset }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={105} />}
          ListEmptyComponent={isLoading ? <LoadingList COLORS={COLORS} label={t('loading')} /> : <EmptyListComponent iconName="book-open-page-variant-outline" title={t('empty_list.title')} description={t('empty_list.description_books')} />}
          ListHeaderComponent={
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesList}
              contentContainerStyle={{
                alignItems: 'center',
                paddingHorizontal: 16,
              }}
              renderItem={({ item }) => <CategoryItem item={item} />}
            />
          }
          ListFooterComponent={() => isLoading && combinedData.length > 0 ? (<Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01 }}>{t('loading')}</Text>) : null}
        />
      </SafeAreaView>
    </View>
  );
};

const ProgramWorks = ({ typeName, emptyDescriptionKey, handleScroll, listRef, contentTopInset }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { userInfo } = useContext(AuthContext);
  const [works, setWorks] = useState([]);
  const [ad, setAd] = useState(null);
  const [typeId, setTypeId] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fallbackListRef = useRef(null);
  const flatListRef = listRef || fallbackListRef;
  const loadingRef = useRef(false);
  const lastPageRef = useRef(1);

  useEffect(() => {
    if (!userInfo?.api_token) return;

    const headers = {
      'X-localization': 'fr',
      Authorization: `Bearer ${userInfo.api_token}`,
    };

    const fetchType = async () => {
      setIsLoading(true);
      try {
        const encodedTypeName = encodeURIComponent(typeName);
        const response = await axios.get(`${API.boongo_url}/type/search/fr/${encodedTypeName}`, { headers });
        setTypeId(response.data?.data?.id || null);
      } catch (error) {
        setTypeId(null);
        setIsLoading(false);
        console.error(`Erreur lors de la récupération du type ${typeName}:`, error);
      }
    };

    fetchType();
  }, [typeName, userInfo?.api_token]);

  const fetchWorks = useCallback(async (pageToFetch = 1) => {
    if (!userInfo?.api_token || !typeId || loadingRef.current || (pageToFetch > lastPageRef.current && pageToFetch !== 1)) return;

    loadingRef.current = true;
    setIsLoading(true);
    const qs = require('qs');
    const headers = {
      'X-localization': 'fr',
      Authorization: `Bearer ${userInfo.api_token}`,
    };

    try {
      const response = await axios.post(
        `${API.boongo_url}/work/filter_by_categories?page=${pageToFetch}`,
        qs.stringify({ type_id: typeId, status_id: 17 }),
        { headers }
      );
      const data = response.data?.data || [];

      setWorks(previousWorks => (pageToFetch === 1 ? data : [...previousWorks, ...data]));
      setAd(response.data?.ad || null);
      const nextLastPage = response.data?.lastPage || 1;
      lastPageRef.current = nextLastPage;
      setLastPage(nextLastPage);
    } catch (error) {
      console.error(`Erreur lors de la récupération de ${typeName}:`, error);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [typeId, typeName, userInfo?.api_token]);

  useEffect(() => {
    if (typeId) {
      fetchWorks(page);
    }
  }, [fetchWorks, page, typeId]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchWorks(1);
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (!isLoading && page < lastPage) {
      setPage(currentPage => currentPage + 1);
    }
  };

  const data = ad ? [...works, { ...ad, id: 'ad', realId: ad.id }] : works;

  return (
    <SafeAreaView style={[styles.scene, { backgroundColor: COLORS.light }]} edges={[]}>
      <Animated.FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={item => item.id ? item.id.toString() : Math.random().toString()}
        renderItem={({ item }) => <WorkItemComponent item={item} />}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
        onScroll={handleScroll}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        scrollEventThrottle={16}
        windowSize={10}
        contentContainerStyle={[styles.listContent, { paddingTop: contentTopInset }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={105} />}
        ListEmptyComponent={isLoading ? <LoadingList COLORS={COLORS} label={t('loading')} /> : <EmptyListComponent iconName="school-outline" title={t('empty_list.title')} description={t(emptyDescriptionKey)} />}
        ListFooterComponent={() => isLoading && data.length > 0 ? <Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01 }}>{t('loading')}</Text> : null}
      />
    </SafeAreaView>
  );
};

const HomeScreen = () => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const newsListRef = useRef(null);
  const booksListRef = useRef(null);
  const schoolProgramListRef = useRef(null);
  const academicProgramListRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [showBackToTopByTab, setShowBackToTopByTab] = useState({ news: false, books: false, school_program: false, academic_program: false });
  const scrollY = useRef(new Animated.Value(0)).current;
  const savedScrollOffsets = useRef({ news: 0, books: 0, school_program: 0, academic_program: 0 });

  // Keep the first card visually separated from the fixed tab bar.
  const contentTopInset = insets.top + 128;

  const [routes] = useState([
    { key: 'news', title: t('navigation.home.news') },
    { key: 'books', title: t('navigation.home.books') },
    { key: 'school_program', title: t('navigation.home.school_program') },
    { key: 'academic_program', title: t('navigation.home.academic_program') },
  ]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'news':
        return <News handleScroll={handleScroll} listRef={newsListRef} contentTopInset={contentTopInset} />;
      case 'books':
        return <Books handleScroll={handleScroll} listRef={booksListRef} contentTopInset={contentTopInset} />;
      case 'school_program':
        return <ProgramWorks typeName="Programme scolaire" emptyDescriptionKey="empty_list.description_school_program" handleScroll={handleScroll} listRef={schoolProgramListRef} contentTopInset={contentTopInset} />;
      case 'academic_program':
        return <ProgramWorks typeName="Programme académique" emptyDescriptionKey="empty_list.description_academic_program" handleScroll={handleScroll} listRef={academicProgramListRef} contentTopInset={contentTopInset} />;
      default:
        return null;
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const currentTab = routes[index].key;
        savedScrollOffsets.current[currentTab] = offsetY;
        const isAtTop = offsetY <= 0;

        setShowBackToTopByTab((prev) => ({
          ...prev,
          [currentTab]: !isAtTop,
        }));
      },
    }
  );

  const handleIndexChange = (newIndex) => {
    const newTabKey = routes[newIndex].key;
    const offset = savedScrollOffsets.current[newTabKey] || 0;

    const listRefs = [newsListRef, booksListRef, schoolProgramListRef, academicProgramListRef];
    listRefs[newIndex].current?.scrollToOffset({ offset, animated: true });

    setIndex(newIndex);
  };

  const renderTabBar = (props) => (
    <View style={[styles.homeHeader, { backgroundColor: COLORS.white, paddingTop: insets.top }]}>
      <HeaderComponent />
      <TabBar
        {...props}
        style={[styles.tabBar, { backgroundColor: COLORS.white }]}
        indicatorStyle={[styles.tabIndicator, { backgroundColor: COLORS.primary }]}
        activeColor={COLORS.primary}
        inactiveColor={COLORS.dark}
        tabStyle={styles.tab}
        scrollEnabled
        renderLabel={({ route, focused, color }) => <Text style={[styles.tabLabel, { color, fontWeight: focused ? '700' : '600' }]}>{route.title}</Text>}
      />
    </View>
  );

  const handleBackToTop = () => {
    const listRefs = [newsListRef, booksListRef, schoolProgramListRef, academicProgramListRef];
    listRefs[index].current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.light }]}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={handleIndexChange}
        initialLayout={{ width: screenWidth }}
        renderTabBar={renderTabBar}
      />

      {showBackToTopByTab[routes[index].key] && (
        <TouchableOpacity
          onPress={handleBackToTop}
          style={[styles.backToTopButton, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}
        >
          <Icon name='chevron-up' size={24} color={COLORS.black} />
        </TouchableOpacity>
      )}

      <FloatingActionsButton />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scene: { flex: 1 },
  listShell: { flex: 1 },
  listContent: { paddingBottom: 34 },
  loadingState: { alignItems: 'center', justifyContent: 'center', minHeight: 280, paddingHorizontal: 24 },
  loadingLabel: { fontSize: 14, marginTop: 12 },
  homeHeader: { elevation: 8, position: 'absolute', shadowColor: '#172033', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, top: 0, width: '100%', zIndex: 1000 },
  tabBar: { elevation: 0, shadowOpacity: 0 },
  tab: { minHeight: 48, width: 'auto' },
  tabIndicator: { borderRadius: 3, height: 3 },
  tabLabel: { fontSize: 13 },
  categoriesList: { flexGrow: 0, height: 48 },
  categoryChip: { borderRadius: 16, borderWidth: 1, marginRight: 8, paddingHorizontal: 14, paddingVertical: 8 },
  categoryChipText: { fontSize: 13, fontWeight: '700' },
  backToTopButton: { alignItems: 'center', borderRadius: 24, borderWidth: 1, bottom: 24, elevation: 6, height: 48, justifyContent: 'center', position: 'absolute', right: 20, shadowColor: '#172033', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 6, width: 48, zIndex: 20 },
});
