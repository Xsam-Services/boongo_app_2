/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity, Animated, Dimensions, RefreshControl, FlatList, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { TabBar, TabView } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import * as RNLocalize from 'react-native-localize';
import Spinner from 'react-native-loading-spinner-overlay';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API, PADDING, TEXT_SIZE } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import HeaderComponent from '../header';
import EmptyListComponent from '../../components/empty_list';
import WorkItemComponent from '../../components/work_item';
import FloatingActionsButton from '../../components/floating_actions_button';
import useColors from '../../hooks/useColors';
import UserItemComponent from '../../components/user_item';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_HEIGHT = 48;

// Works frame
const MyWorks = ({ handleScroll, showBackToTop, listRef, headerHeight = 0 }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get data ===============
  const [categories, setCategories] = useState([]);
  const [idCat, setIdCat] = useState(0);
  const [works, setWorks] = useState([]);
  const [ad, setAd] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fallbackListRef = useRef(null);
  const flatListRef = listRef || fallbackListRef;

  // ================= Get categories =================
  useEffect(() => {
    fetchCategories();
    // Categories are intentionally loaded once when this tab mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    const headers = {
      'X-localization': 'fr',
      Authorization: `Bearer ${userInfo.api_token}`,
    };

    try {
      const group = encodeURIComponent('Catégorie pour œuvre');
      const res = await axios.get(`${API.boongo_url}/category/find_by_group/${group}`, { headers });
      const data = res.data.data;
      const itemAll = { id: 0, category_name: t('all_f'), category_name_fr: "Toutes", category_name_en: "All", category_name_ln: "Nioso", category_description: null, };

      data.unshift(itemAll);
      setCategories(data);
      setIdCat(itemAll.id);

    } catch (error) {
      console.error('Erreur fetchCategories', error);
    }
  };

  // ================= Fetch works when idCat or page changes =================
  // useEffect(() => {
  //   fetchWorks();
  // }, [page, idCat]);
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchWorks();
    }, 5000);

    return () => clearInterval(intervalId);
    // The polling lifecycle is tied to the active category and page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, idCat]);

  const fetchWorks = async () => {
    if (isLoading || page > lastPage) return;
    setIsLoading(true);

    const qs = require('qs');
    const url = `${API.boongo_url}/work/filter_by_categories?page=${page}`;
    const params = {
      'categories_ids[0]': idCat,
      user_id: userInfo.id,
    };
    const headers = {
      'X-localization': 'fr',
      Authorization: `Bearer ${userInfo.api_token}`,
      'X-user-id': userInfo.id,
    };

    try {
      const response = await axios.post(url, qs.stringify(params), { headers });
      const data = response.data.data || [];

      setWorks(prev => (page === 1 ? data : [...prev, ...data]));
      setAd(response.data.ad || null);
      setLastPage(response.data.lastPage || page);
      setCount(response.data.count || 0);

      // console.log(response.data);

    } catch (error) {
      console.error('Erreur fetchWorks', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= Combined data =================
  const combinedData = [...works];
  if (ad) {
    combinedData.push({ ...ad, id: 'ad', realId: ad.id });
  }

  // ================= Handlers =================
  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setWorks([]);
    await fetchWorks();
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (!isLoading && page < lastPage) {
      setPage(prev => prev + 1);
    }
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleBadgePress = useCallback((id) => {
    setIdCat(id);
    setPage(1);
    setWorks([]);
    setLastPage(1);
  }, []);

  const CategoryItem = ({ item }) => {
    const isSelected = idCat === item.id;
    return (
      <TouchableOpacity
        key={item.id}
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
      {showBackToTop && (
        <TouchableOpacity
          style={[styles.backToTopButton, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}
          onPress={scrollToTop}
        >
          <Icon name='chevron-up' size={24} color={COLORS.black} />
        </TouchableOpacity>
      )}

      <View style={styles.listShell}>
        {/* Works List */}
        <Animated.FlatList
          ref={flatListRef}
          data={combinedData}
          extraData={combinedData}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <WorkItemComponent item={item} />}
          horizontal={false}
          bounces={false}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={false}
          onScroll={handleScroll}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
          scrollEventThrottle={16}
          windowSize={10}
          contentContainerStyle={{
            paddingTop: headerHeight + TAB_BAR_HEIGHT + 12,
            paddingBottom: 32,
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={headerHeight + TAB_BAR_HEIGHT} />}
          ListEmptyComponent={<EmptyListComponent iconName="book-open-page-variant-outline" title={t('empty_list.title')} description={t('empty_list.description_books')} />}
          ListHeaderComponent={
            <>
              <FlatList
                data={categories}
                keyExtractor={item => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesList}
                contentContainerStyle={{
                  alignItems: 'center',
                  paddingHorizontal: 16,
                }}
                renderItem={({ item }) => <CategoryItem item={item} />}
              />
            </>
          }
          ListFooterComponent={() => isLoading ? (<Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01, }} >{t('loading')}</Text>) : null}
        />
      </View>
    </View>
  );
};

// Cart frame
const MyCart = ({ handleScroll, showBackToTop, listRef, headerHeight = 0 }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { userInfo, removeFromCart, isLoading } = useContext(AuthContext);
  const consultations = userInfo.unpaid_consultations;
  const subscriptions = userInfo.unpaid_subscriptions;
  // =============== Get data ===============
  const [loading, setLoading] = useState(false);
  const fallbackListRef = useRef(null);
  const flatListRef = listRef || fallbackListRef;

  // ================= Handlers =================
  const onRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  }, []);

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // Get system language
  const getLanguage = () => {
    const locales = RNLocalize.getLocales();

    if (locales && locales.length > 0) {
      return locales[0].languageCode;
    }

    return 'fr';
  };

  // Utility function to get formatted price
  const getFormattedPrice = (price, currency, userLang) => {
    return price.toLocaleString(userLang, {
      style: 'decimal',
      useGrouping: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + ' ' + currency;
  };

  // Utility function to retrieve the exchange rate
  const fetchCurrencyRate = async (fromCurrency, toCurrency, apiToken) => {
    if (fromCurrency === toCurrency) {
      return 1; // No need for conversion if the currencies are the same
    }

    const url = `${API.boongo_url}/currencies_rate/find_currency_rate/${fromCurrency}/${toCurrency}`;

    const mHeaders = {
      'X-localization': 'fr',
      'Authorization': `Bearer ${apiToken}`,
    };

    try {
      const response = await axios.get(url, { headers: mHeaders });

      if (response && response.data && response.data.success && response.data.data) {
        return response.data.data.rate;

      } else {
        console.error('Erreur : Données manquantes ou format incorrect', response.data.message);
        return null;
      }
    } catch (error) {
      if (error.response?.status === 429) {
        console.warn("Trop de requêtes envoyées. Attendez avant de réessayer.");

      } else {
        console.error('Erreur lors de la récupération du taux de change', error);
      }
      return null;
    }
  };

  // Combine consultations and subscriptions
  const combinedData = [
    ...consultations.map(item => ({ ...item, item_type: 'consultation' })),
    ...subscriptions.map(item => ({ ...item, item_type: 'subscription' }))
  ];

  // Inner Item component
  const InnerItem = ({ item }) => {
    const [price, setPrice] = useState('');
    const [isLoadingItem, setIsLoadingItem] = useState(true);  // État local pour le chargement
    const userLang = getLanguage();
    const typePrice = item.item_type === 'subscription' ? item.price : item.consultation_price;

    // Vérifie si le prix est déjà disponible, sinon, on fait l'appel
    const fetchPrice = useCallback(async () => {
      if (price) return;  // Si le prix est déjà chargé, on ne fait rien

      setIsLoadingItem(true);  // On lance le chargement pour cet élément spécifique

      const userCurrency = userInfo.currency.currency_acronym;

      if (item.currency.currency_acronym === userCurrency) {
        // Si les devises sont identiques, on formate directement
        setPrice(getFormattedPrice(typePrice, userCurrency, userLang));
        setIsLoadingItem(false);
      } else {
        // Si les devises sont différentes, on obtient le taux de change
        const rate = await fetchCurrencyRate(item.currency.currency_acronym, userCurrency, userInfo.api_token);

        if (rate !== null) {
          const convertedPrice = typePrice * rate;
          setPrice(getFormattedPrice(convertedPrice, userCurrency, userLang));
        } else {
          setPrice('Erreur de taux de change');
        }

        setIsLoadingItem(false);
      }
    }, [item, price, typePrice, userLang]);

    useEffect(() => {
      fetchPrice();  // On charge le prix lors du montage de l'élément
    }, [fetchPrice]);

    return (
      <View style={[styles.cartItem, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
        <View style={styles.cartItemCopy}>
          <Text style={{ color: COLORS.dark_secondary, fontSize: 14, fontWeight: '600' }} numberOfLines={2}>
            {item.item_type === 'subscription' ? item.type.type_name : item.work_title}
          </Text>
          {item.item_type === 'subscription' &&
            <Text style={{ fontSize: TEXT_SIZE.label, color: COLORS.link_color, textTransform: 'uppercase' }}>{item.category.category_name}</Text>
          }
          <Text style={{ fontSize: TEXT_SIZE.paragraph, fontWeight: '700', color: COLORS.black, marginTop: 5 }}>
            {isLoadingItem ? <ActivityIndicator size="small" /> : price}  {/* Affiche le loader ou le prix */}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: COLORS.light_danger }]}
          onPress={() => {
            if (item.item_type === 'subscription') {
              removeFromCart(userInfo.unpaid_subscription_cart.id, null, item.id);
            } else {
              removeFromCart(userInfo.unpaid_consultation_cart.id, item.id, null);
            }
          }}
        >
          <Icon name="trash-can-outline" size={20} color={COLORS.danger} />
          <Text style={{ color: COLORS.danger, fontWeight: '700', marginLeft: PADDING.p00 }}>{t('withdraw')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      {/* Spinner (for AuthContext requests) */}
      <Spinner visible={isLoading} />

      {/* Content */}
      <View style={[styles.scene, { backgroundColor: COLORS.light }]}>
        {showBackToTop && (
          <TouchableOpacity
            style={[styles.backToTopButton, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}
            onPress={scrollToTop}
          >
            <Icon name='chevron-up' size={24} color={COLORS.black} />
          </TouchableOpacity>
        )}

        <View style={styles.listShell}>
            <Animated.FlatList
              ref={flatListRef}
              data={combinedData}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item, index }) => {
                if (index === 0 || combinedData[index - 1].item_type !== item.item_type) {
                  return (
                    <View>
                      {/* Group title */}
                      <Text style={{ fontSize: TEXT_SIZE.normal, fontWeight: '400', color: COLORS.black, textAlign: 'center', marginTop: PADDING.p02, marginBottom: PADDING.p00 }}>
                        {item.item_type === 'consultation' ? t('unpaid.consultation') : t('unpaid.subscription')}
                      </Text>
                      {/* List element */}
                      <InnerItem item={item} />
                    </View>
                  );
                }
                return <InnerItem item={item} />;
              }}
              horizontal={false}
              bounces={false}
              showsVerticalScrollIndicator={false}
              alwaysBounceVertical={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              windowSize={10}
              contentContainerStyle={{
                paddingTop: headerHeight + TAB_BAR_HEIGHT + 12,
                paddingBottom: 32,
              }}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} progressViewOffset={headerHeight + TAB_BAR_HEIGHT} />}
              ListEmptyComponent={<EmptyListComponent iconName="cart-outline" title={t('empty_list.title')} description={t('empty_list.description_cart')} />}
              ListHeaderComponent={() => {
                return (
                  <View style={[styles.cartSummary, { backgroundColor: COLORS.light_primary }]}>
                    <View>
                      <Text style={{ color: COLORS.dark, fontSize: 12, fontWeight: '600' }}>{t('total_price')}</Text>
                      <Text style={{ color: COLORS.black, fontSize: 17, fontWeight: '800', marginTop: 3 }}>{getFormattedPrice(userInfo.totals_unpaid.grand_totals, userInfo.currency.currency_acronym, 'fr')}</Text>
                    </View>
                    <TouchableOpacity style={[styles.payButton, { backgroundColor: COLORS.primary }]} onPress={() => navigation.navigate('MobileSubscribe', { amount: userInfo.totals_unpaid.grand_totals, currency: userInfo.currency.currency_acronym })}>
                      <Text style={styles.payButtonText}>{t('pay')}</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            // ListFooterComponent={() => loading ? (<Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01, }} >{t('loading')}</Text>) : null}
            />
        </View>
      </View>
    </>
  );
};

// Subscribers frame
const MySubscribers = ({ handleScroll, showBackToTop, listRef, headerHeight = 0 }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get data ===============
  const [subscribers, setSubscribers] = useState([]);
  const [ad, setAd] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fallbackListRef = useRef(null);
  const flatListRef = listRef || fallbackListRef;

  // ================= Fetch works when idCat or page changes =================
  useEffect(() => {
    fetchSubscribers();
    // Subscribers are refreshed when their pagination changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchSubscribers = async () => {
    if (isLoading || page > lastPage) return;
    setIsLoading(true);

    const url = `${API.boongo_url}/user/works_subscribers/${userInfo.id}?page=${page}`;

    const mHeaders = {
      'X-localization': 'fr',
      'X-user-id': userInfo.id,
      Authorization: `Bearer ${userInfo.api_token}`,
    };

    try {
      const response = await axios.get(url, { headers: mHeaders });
      const data = response.data.data || [];

      setSubscribers(prev => (page === 1 ? data : [...prev, ...data]));
      setAd(response.data.ad || null);
      setLastPage(response.data.lastPage || page);
      setCount(response.data.count || 0);

      console.log(response.data);

    } catch (error) {
      console.error('Erreur fetchSubscribers', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= Combined data =================
  const combinedData = [...subscribers];
  if (ad) {
    combinedData.push({ ...ad, id: 'ad', realId: ad.id });
  }

  // ================= Handlers =================
  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setSubscribers([]);
    await fetchSubscribers();
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (!isLoading && page < lastPage) {
      setPage(prev => prev + 1);
    }
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <View style={[styles.scene, { backgroundColor: COLORS.light }]}>
      {showBackToTop && (
        <TouchableOpacity
          style={[styles.backToTopButton, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}
          onPress={scrollToTop}
        >
          <Icon name='chevron-up' size={24} color={COLORS.black} />
        </TouchableOpacity>
      )}

      <View style={styles.listShell}>
          <Animated.FlatList
            ref={flatListRef}
            data={combinedData}
            extraData={combinedData}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => <UserItemComponent item={item} />}
            horizontal={false}
            bounces={false}
            showsVerticalScrollIndicator={false}
            alwaysBounceVertical={false}
            onScroll={handleScroll}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.1}
            scrollEventThrottle={16}
            windowSize={10}
            contentContainerStyle={{
              paddingTop: headerHeight + TAB_BAR_HEIGHT + 12,
              paddingBottom: 32,
            }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={headerHeight + TAB_BAR_HEIGHT} />}
            ListEmptyComponent={<EmptyListComponent iconName="book-search-outline" title={t('empty_list.title')} description={t('empty_list.description_subscribers')} />}
            ListFooterComponent={() => isLoading ? (<Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01, }} >{t('loading')}</Text>) : null}
          />
      </View>
    </View>
  );
};

const AccountScreen = ({ route }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // =============== Get data ===============
  const myWorksListRef = useRef(null);
  const myCartListRef = useRef(null);
  const mySubscribersListRef = useRef(null);
  const [index, setIndex] = useState(0); // State for managing active tab index
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showBackToTopByTab, setShowBackToTopByTab] = useState({ my_works: false, my_cart: false, my_subscribers: false });
  const scrollY = useRef(new Animated.Value(0)).current;
  const savedScrollOffsets = useRef({ my_works: 0, my_cart: 0, my_subscribers: 0 });

  // récupérer l'index initial du tab (ou 0 par défaut)
  const initialIndex = route.params?.initialIndex || 0;

  // Mettre à jour l'index au début
  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  const [routes] = useState([
    { key: 'my_works', title: t('navigation.account.my_works') },
    { key: 'my_cart', title: t('navigation.account.my_cart') },
    { key: 'my_subscribers', title: t('navigation.account.subscribers') },
  ]);

  const renderScene = ({ route }) => {
    const sceneProps = {
      handleScroll,
      headerHeight,
    };

    switch (route.key) {
      case 'my_works':
        return <MyWorks {...sceneProps} handleScroll={handleScroll} showBackToTop={showBackToTopByTab.my_works} listRef={myWorksListRef} />;
      case 'my_cart':
        return <MyCart {...sceneProps} handleScroll={handleScroll} showBackToTop={showBackToTopByTab.my_cart} listRef={myCartListRef} />;
      case 'my_subscribers':
        return <MySubscribers {...sceneProps} handleScroll={handleScroll} showBackToTop={showBackToTopByTab.my_subscribers} listRef={mySubscribersListRef} />;
      default:
        return null;
    }
  };

  // Handle scrolling and show/hide the header
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const currentTab = (index === 0 ? 'my_works' : (index === 1 ? 'my_cart' : 'my_subscribers'));

        savedScrollOffsets.current[currentTab] = offsetY;

        const isAtTop = (offsetY <= 0);
        setShowBackToTopByTab(prev => ({
          ...prev,
          [currentTab]: !isAtTop,
        }));
      },
    }
  );

  // On "TabBar" index change
  const handleIndexChange = (newIndex) => {
    const newTabKey = newIndex === 0 ? 'my_works' : (newIndex === 1 ? 'my_cart' : 'my_subscribers');
    const offset = savedScrollOffsets.current[newTabKey] || 0;

    // Animate scrollY back to 0 smoothly (for header + tabbar)
    Animated.timing(scrollY, {
      toValue: offset,
      duration: 300, // 300ms for smooth effect
      useNativeDriver: true,
    }).start();

    // Back to top according to selected tab
    if (newIndex === 0 && myWorksListRef.current) {
      myWorksListRef.current.scrollToOffset({ offset, animated: true });

    } else if (newIndex === 1 && myCartListRef.current) {
      myCartListRef.current.scrollToOffset({ offset, animated: true });

    } else if (newIndex === 2 && mySubscribersListRef.current) {
      mySubscribersListRef.current.scrollToOffset({ offset, animated: true });
    }

    setIndex(newIndex);
  };

  // Custom "TabBar"
  const renderTabBar = (props) => (
    <>
      <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)} style={[styles.accountHeader, { backgroundColor: COLORS.white, paddingTop: insets.top }]}>
        <HeaderComponent />
      </View>
      <View
        style={[styles.tabBarContainer, { backgroundColor: COLORS.white, top: headerHeight }]}>
        <TabBar
          {...props}
          style={[styles.tabBar, { backgroundColor: COLORS.white }]}
          indicatorStyle={[styles.tabIndicator, { backgroundColor: COLORS.primary }]}
          activeColor={COLORS.primary}
          inactiveColor={COLORS.dark}
          tabStyle={styles.tab}
          renderLabel={({ route: tabRoute, focused, color }) => <Text style={[styles.tabLabel, { color, fontWeight: focused ? '700' : '600' }]} numberOfLines={1}>{tabRoute.title}</Text>}
        />
      </View>
      <FloatingActionsButton />
    </>
  );

  return (
    <View style={[styles.accountContainer, { backgroundColor: COLORS.light }]}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={handleIndexChange}
        initialLayout={{ width: Dimensions.get('window').width }}
        renderTabBar={renderTabBar}
      />
    </View>
  );
};

export default AccountScreen

const styles = StyleSheet.create({
  accountContainer: { flex: 1 },
  scene: { flex: 1 },
  listShell: { flex: 1 },
  accountHeader: { elevation: 8, position: 'absolute', shadowColor: '#172033', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, top: 0, width: '100%', zIndex: 1000 },
  tabBarContainer: { elevation: 7, height: TAB_BAR_HEIGHT, position: 'absolute', shadowColor: '#172033', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6, width: '100%', zIndex: 999 },
  tabBar: { elevation: 0, shadowOpacity: 0 },
  tab: { minHeight: TAB_BAR_HEIGHT, paddingHorizontal: 4 },
  tabIndicator: { borderRadius: 3, height: 3 },
  tabLabel: { fontSize: 12, textAlign: 'center' },
  categoriesList: { flexGrow: 0, height: 48 },
  categoryChip: { borderRadius: 16, borderWidth: 1, marginRight: 8, paddingHorizontal: 14, paddingVertical: 8 },
  categoryChipText: { fontSize: 13, fontWeight: '700' },
  backToTopButton: { alignItems: 'center', borderRadius: 24, borderWidth: 1, bottom: 24, elevation: 6, height: 48, justifyContent: 'center', position: 'absolute', right: 20, shadowColor: '#172033', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 6, width: 48, zIndex: 20 },
  cartItem: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, marginHorizontal: 16, padding: 14 },
  cartItemCopy: { flex: 1, marginRight: 12 },
  removeButton: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', minHeight: 40, paddingHorizontal: 11 },
  cartSummary: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, marginHorizontal: 16, padding: 14 },
  payButton: { alignItems: 'center', borderRadius: 12, justifyContent: 'center', minHeight: 42, paddingHorizontal: 18 },
  payButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});
