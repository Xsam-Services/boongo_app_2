/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity, Animated, SafeAreaView, Dimensions, RefreshControl, TouchableHighlight, FlatList, Text, Image, ActivityIndicator } from 'react-native'
import { TabBar, TabView } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import * as RNLocalize from 'react-native-localize';
import Spinner from 'react-native-loading-spinner-overlay';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API, IMAGE_SIZE, PADDING, TEXT_SIZE } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import HeaderComponent from '../header';
import EmptyListComponent from '../../components/empty_list';
import WorkItemComponent from '../../components/work_item';
import FloatingActionsButton from '../../components/floating_actions_button';
import homeStyles from '../style';
import useColors from '../../hooks/useColors';
import UserItemComponent from '../../components/user_item';

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
  const flatListRef = listRef || useRef(null);

  // ================= Get categories =================
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const headers = {
      'X-localization': 'fr',
      Authorization: `Bearer ${userInfo.api_token}`,
    };

    try {
      const res = await axios.get(`${API.boongo_url}/category/find_by_group/Catégorie%20pour%20œuvre`, { headers });
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
    const Container = isSelected ? TouchableHighlight : TouchableOpacity;

    return (
      <Container
        key={item.id}
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
      {showBackToTop && (
        <TouchableOpacity
          style={[homeStyles.floatingButton, { backgroundColor: COLORS.warning }]}
          onPress={scrollToTop}
        >
          <Icon name='chevron-double-up' size={IMAGE_SIZE.s09} style={{ color: 'black' }} />
        </TouchableOpacity>
      )}

      <SafeAreaView contentContainerStyle={{ flexGrow: 1 }}>
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
            paddingTop: headerHeight + TAB_BAR_HEIGHT,
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
                style={{ height: 40, flexGrow: 0 }}
                contentContainerStyle={{
                  alignItems: 'center',
                  paddingHorizontal: PADDING.p00,
                }}
                renderItem={({ item }) => <CategoryItem item={item} />}
              />
            </>
          }
          ListFooterComponent={() => isLoading ? (<Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01, }} >{t('loading')}</Text>) : null}
        />
      </SafeAreaView>
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
  const { userInfo, addToCart, removeFromCart, isLoading } = useContext(AuthContext);
  const consultations = userInfo.unpaid_consultations;
  const subscriptions = userInfo.unpaid_subscriptions;
  // =============== Get data ===============
  const [loading, setLoading] = useState(false);
  const flatListRef = listRef || useRef(null);

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
    }, [item, userInfo, price]);

    useEffect(() => {
      fetchPrice();  // On charge le prix lors du montage de l'élément
    }, [item, userInfo, price]);

    return (
      <View style={[homeStyles.workTop, { backgroundColor: COLORS.white, marginBottom: 1, padding: PADDING.p03 }]}>
        <View style={{ flexDirection: 'column', width: '70%' }}>
          <Text style={{ flex: 2, color: COLORS.dark_secondary }} numberOfLines={2}>
            {item.item_type === 'subscription' ? item.type.type_name : item.work_title}
          </Text>
          {item.item_type === 'subscription' &&
            <Text style={{ fontSize: TEXT_SIZE.label, color: COLORS.link_color, textTransform: 'uppercase' }}>{item.category.category_name}</Text>
          }
          <Text style={{ fontSize: TEXT_SIZE.paragraph, fontWeight: '500', color: COLORS.black }}>
            {isLoadingItem ? <ActivityIndicator size="small" /> : price}  {/* Affiche le loader ou le prix */}
          </Text>
        </View>
        <TouchableOpacity
          style={[homeStyles.workCmd, { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.light_secondary }]}
          onPress={() => {
            if (item.item_type === 'subscription') {
              removeFromCart(userInfo.unpaid_subscription_cart.id, null, item.id);
            } else {
              removeFromCart(userInfo.unpaid_consultation_cart.id, item.id, null);
            }
          }}
        >
          <Icon name="trash-can-outline" size={20} color={COLORS.danger} />
          <Text style={{ color: COLORS.danger, fontWeight: '600', marginLeft: PADDING.p00 }}>
            {t('withdraw')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      {/* Spinner (for AuthContext requests) */}
      <Spinner visible={isLoading} />

      {/* Content */}
      <View style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
        {showBackToTop && (
          <TouchableOpacity
            style={[homeStyles.floatingButton, { backgroundColor: COLORS.warning }]}
            onPress={scrollToTop}
          >
            <Icon name='chevron-double-up' size={IMAGE_SIZE.s09} style={{ color: 'black' }} />
          </TouchableOpacity>
        )}

        <SafeAreaView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={[homeStyles.cardEmpty, { height: Dimensions.get('window').height, marginLeft: 0, paddingHorizontal: 2 }]}>
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
                paddingTop: headerHeight + TAB_BAR_HEIGHT,
              }}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} progressViewOffset={headerHeight + TAB_BAR_HEIGHT} />}
              ListEmptyComponent={<EmptyListComponent iconName="cart-outline" title={t('empty_list.title')} description={t('empty_list.description_cart')} />}
              ListHeaderComponent={() => {
                return (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: PADDING.p01 }}>
                    <Text style={{ fontSize: TEXT_SIZE.label, color: COLORS.black }}>
                      <Text style={{ textDecorationLine: 'underline' }}>{t('total_price')}</Text>{` : `}<Text style={{ fontWeight: 'bold' }}>{`${getFormattedPrice(userInfo.totals_unpaid.grand_totals, userInfo.currency.currency_acronym, 'fr')}`}</Text>
                    </Text>
                    <TouchableOpacity style={[homeStyles.authButton, { width: 'auto', backgroundColor: COLORS.warning, marginVertical: PADDING.p00, paddingHorizontal: PADDING.p05 }]} onPress={() => navigation.navigate('MobileSubscribe', { amount: userInfo.totals_unpaid.grand_totals, currency: userInfo.currency.currency_acronym })}>
                      <Text style={[homeStyles.authButtonText, { fontSize: TEXT_SIZE.label, color: 'black' }]}>{t('pay')}</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            // ListFooterComponent={() => loading ? (<Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01, }} >{t('loading')}</Text>) : null}
            />
          </View>
        </SafeAreaView>
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
  const flatListRef = listRef || useRef(null);

  // ================= Fetch works when idCat or page changes =================
  useEffect(() => {
    fetchSubscribers();
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
    <View style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
      {showBackToTop && (
        <TouchableOpacity
          style={[homeStyles.floatingButton, { backgroundColor: COLORS.warning }]}
          onPress={scrollToTop}
        >
          <Icon name='chevron-double-up' size={IMAGE_SIZE.s09} style={{ color: 'black' }} />
        </TouchableOpacity>
      )}

      <SafeAreaView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[homeStyles.cardEmpty, { height: Dimensions.get('window').height, marginLeft: 0, paddingHorizontal: 2 }]}>
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
              paddingTop: headerHeight + TAB_BAR_HEIGHT,
            }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={headerHeight + TAB_BAR_HEIGHT} />}
            ListEmptyComponent={<EmptyListComponent iconName="book-search-outline" title={t('empty_list.title')} description={t('empty_list.description_subscribers')} />}
            ListFooterComponent={() => isLoading ? (<Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01, }} >{t('loading')}</Text>) : null}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const AccountScreen = ({ route }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
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

  // const headerTranslateY = scrollY.interpolate({
  const clampedScrollY = Animated.diffClamp(scrollY, 0, headerHeight);
  const headerTranslateY = clampedScrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolate: 'clamp',
  });

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
        return <MySubscribers {...sceneProps} handleScroll={handleScroll} showBackToTop={showBackToTopByTab.my_subscribers} listRef={myCartListRef} />;
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

    } else if (newIndex === 1 && mySubscribersListRef.current) {
      mySubscribersListRef.current.scrollToOffset({ offset, animated: true });
    }

    setIndex(newIndex);
  };

  // Custom "TabBar"
  const renderTabBar = (props) => (
    <>
      <Animated.View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)} style={{ transform: [{ translateY: headerTranslateY }], zIndex: 1000, position: 'absolute', top: 0, width: '100%', backgroundColor: COLORS.white, paddingTop: 20 }}>
        <HeaderComponent />
      </Animated.View>
      <Animated.View
        style={{
          transform: [{ translateY: headerTranslateY }],
          position: 'absolute',
          top: headerHeight, // Positionnée juste en dessous du header
          zIndex: 999,
          width: '100%',
          height: TAB_BAR_HEIGHT,
          backgroundColor: COLORS.white,
        }}>
        <TabBar
          {...props}
          style={{ backgroundColor: COLORS.white, borderBottomWidth: 0, elevation: 0, shadowOpacity: 0 }}
          indicatorStyle={{ backgroundColor: COLORS.black }}
          activeColor={COLORS.black}
          inactiveColor={COLORS.dark_secondary}
        />
      </Animated.View>
      <FloatingActionsButton />
    </>
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={handleIndexChange}
      initialLayout={{ width: 100 }}
      renderTabBar={renderTabBar} // Using the Custom TabBar
    />
  );
};

export default AccountScreen