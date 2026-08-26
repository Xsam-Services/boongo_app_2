/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Animated, Dimensions, RefreshControl, TouchableHighlight, FlatList, Text } from 'react-native';
import { TabBar, TabView } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API, IMAGE_SIZE, PADDING } from '../../tools/constants';
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
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = listRef || useRef(null);

  const fetchWorks = useCallback(async (pageToFetch = 1) => {
    if (!userInfo?.api_token || isLoading || (pageToFetch > lastPage && pageToFetch !== 1)) return;

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
      setLastPage(response.data?.lastPage || 1);
      setCount(response.data?.count || 0);
    } catch (error) {
      if (error.response?.status === 429) {
        console.warn("Trop de requêtes envoyées. Attendez avant de réessayer.");
      } else {
        console.error("Erreur fetchWorks News:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userInfo?.api_token, lastPage, isLoading]);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light_secondary }} edges={[]}>
      <View style={[homeStyles.cardEmpty, { flex: 1, marginLeft: 0, paddingHorizontal: 2 }]}>
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
          contentContainerStyle={[homeStyles.scrollableList, { paddingTop: contentTopInset }]}
          windowSize={10}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              progressViewOffset={105}
            />
          }
          ListEmptyComponent={
            <EmptyListComponent
              iconName='script-text-outline'
              title={t('empty_list.title')}
              description={t('empty_list.description_news')}
            />
          }
          ListFooterComponent={() =>
            isLoading ? (
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
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = listRef || useRef(null);

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
    if (!userInfo?.api_token || isLoading || (pageToFetch > lastPage && pageToFetch !== 1)) return;
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
      setLastPage(response.data?.lastPage || pageToFetch);
      setCount(response.data?.count || 0);
    } catch (error) {
      console.error('Erreur fetchBooks', error);
    } finally {
      setIsLoading(false);
    }
  }, [userInfo?.api_token, idCat, lastPage, isLoading]);

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
  }, []);

  const CategoryItem = ({ item }) => {
    const isSelected = idCat === item.id;
    const Container = isSelected ? TouchableHighlight : TouchableOpacity;

    return (
      <Container
        onPress={() => handleBadgePress(item.id)}
        style={
          isSelected
            ? [homeStyles.categoryBadgeSelected, { backgroundColor: COLORS.white }]
            : [homeStyles.categoryBadge, { backgroundColor: COLORS.warning }]
        }
        underlayColor={COLORS.light_secondary}
      >
        <Text
          style={
            isSelected
              ? [homeStyles.categoryBadgeTextSelected, { color: COLORS.black }]
              : [homeStyles.categoryBadgeText, { color: 'black' }]
          }
        >
          {item.category_name}
        </Text>
      </Container>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
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
          contentContainerStyle={{ paddingTop: contentTopInset }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={105} />}
          ListEmptyComponent={<EmptyListComponent iconName="book-open-page-variant-outline" title={t('empty_list.title')} description={t('empty_list.description_books')} />}
          ListHeaderComponent={
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ height: 40, flexGrow: 0 }}
              contentContainerStyle={{
                alignItems: 'center',
                paddingHorizontal: PADDING.p00,
              }}
              renderItem={({ item }) => <CategoryItem item={item} />}
            />
          }
          ListFooterComponent={() => isLoading ? (<Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01 }}>{t('loading')}</Text>) : null}
        />
      </SafeAreaView>
    </View>
  );
};

const HomeScreen = () => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const newsListRef = useRef(null);
  const booksListRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [showBackToTopByTab, setShowBackToTopByTab] = useState({ news: false, books: false });
  const scrollY = useRef(new Animated.Value(0)).current;
  const savedScrollOffsets = useRef({ news: 0, books: 0 });

  const contentTopInset = insets.top + 112;

  const [routes] = useState([
    { key: 'news', title: t('navigation.home.news') },
    { key: 'books', title: t('navigation.home.books') },
  ]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'news':
        return <News handleScroll={handleScroll} listRef={newsListRef} contentTopInset={contentTopInset} />;
      case 'books':
        return <Books handleScroll={handleScroll} listRef={booksListRef} contentTopInset={contentTopInset} />;
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
        const currentTab = index === 0 ? 'news' : 'books';
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
    const newTabKey = newIndex === 0 ? 'news' : 'books';
    const offset = savedScrollOffsets.current[newTabKey] || 0;

    if (newIndex === 0 && newsListRef.current) {
      newsListRef.current.scrollToOffset({ offset, animated: true });
    } else if (newIndex === 1 && booksListRef.current) {
      booksListRef.current.scrollToOffset({ offset, animated: true });
    }

    setIndex(newIndex);
  };

  const renderTabBar = (props) => (
    <View
      style={{
        zIndex: 1000,
        elevation: 8,
        position: 'absolute',
        top: 0,
        width: '100%',
        backgroundColor: COLORS.white,
        paddingTop: insets.top,
      }}
    >
      <HeaderComponent />
      <TabBar
        {...props}
        style={{
          backgroundColor: COLORS.white,
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        }}
        indicatorStyle={{ backgroundColor: COLORS.black }}
        activeColor={COLORS.black}
        inactiveColor={COLORS.dark_secondary}
      />
    </View>
  );

  const handleBackToTop = () => {
    if (index === 0 && newsListRef.current) {
      newsListRef.current.scrollToOffset({ offset: 0, animated: true });
    } else if (index === 1 && booksListRef.current) {
      booksListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={handleIndexChange}
        initialLayout={{ width: screenWidth }}
        renderTabBar={renderTabBar}
      />

      {showBackToTopByTab[index === 0 ? 'news' : 'books'] && (
        <TouchableOpacity
          onPress={handleBackToTop}
          style={[homeStyles.floatingButton, { backgroundColor: COLORS.warning }]}
        >
          <Icon name='chevron-double-up' size={IMAGE_SIZE.s09} style={{ color: 'black' }} />
        </TouchableOpacity>
      )}

      <FloatingActionsButton />
    </View>
  );
};

export default HomeScreen;
