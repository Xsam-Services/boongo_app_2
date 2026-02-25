/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity, Animated, SafeAreaView, Dimensions, RefreshControl, TouchableHighlight, FlatList, Text, Image, StatusBar, TextInput } from 'react-native'
import { TabBar, TabView } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import FaIcon from 'react-native-vector-icons/FontAwesome6';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API, IMAGE_SIZE, PADDING, WEB } from '../tools/constants';
import { AuthContext } from '../contexts/AuthContext';
import EmptyListComponent from '../components/empty_list';
import WorkItemComponent from '../components/work_item';
import EntityItemComponent from '../components/entity_item';
import FloatingActionsButton from '../components/floating_actions_button';
import homeStyles from './style';
import useColors from '../hooks/useColors';

const TAB_BAR_HEIGHT = 48;

// Works frame
const Works = ({ handleScroll, showBackToTop, listRef, headerHeight = 0 }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get parameters ===============
  const route = useRoute();
  const { user_id } = route.params;
  // =============== Get data ===============
  const [selectedUser, setSelectedUser] = useState({});
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

  // Get current user
  useEffect(() => {
    getUser();
  }, [selectedUser]);

  const getUser = () => {
    const config = {
      method: 'GET',
      url: `${API.boongo_url}/user/${user_id}`,
      headers: {
        'X-localization': 'fr',
        'Authorization': `Bearer ${userInfo.api_token}`,
      }
    };

    axios(config)
      .then(res => {
        const userData = res.data.data.user;

        setSelectedUser(userData);

        return userData;
      })
      .catch(error => {
        console.log(error);
      });
  };

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
      if (selectedUser && selectedUser.id) {
        fetchWorks();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [selectedUser, page, idCat]);

  const fetchWorks = async () => {
    if (isLoading || page > lastPage) return;
    setIsLoading(true);

    const qs = require('qs');
    const url = `${API.boongo_url}/work/filter_by_categories?page=${page}`;
    const params = {
      'categories_ids[0]': idCat,
      user_id: selectedUser.id,
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
          ListEmptyComponent={<EmptyListComponent iconName="book-open-page-variant-outline" title={t('empty_list.title')} description={t('empty_list.description_user_works')} />}
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

// Cercles frame
const Cercles = ({ handleScroll, showBackToTop, listRef, headerHeight = 0 }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get parameters ===============
  const route = useRoute();
  const { user_id } = route.params;
  // =============== Get data ===============
  const [selectedUser, setSelectedUser] = useState({});
  const [circles, setCircles] = useState([]);
  const [ad, setAd] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [count, setCount] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = listRef || useRef(null);

  // Get current user
  useEffect(() => {
    getUser();
  }, [selectedUser]);

  const getUser = () => {
    const config = {
      method: 'GET',
      url: `${API.boongo_url}/user/${user_id}`,
      headers: {
        'X-localization': 'fr',
        'Authorization': `Bearer ${userInfo.api_token}`,
      }
    };

    axios(config)
      .then(res => {
        const userData = res.data.data.user;

        setSelectedUser(userData);

        return userData;
      })
      .catch(error => {
        console.log(error);
      });
  };

  // Fetch data from API
  const fetchSearchData = async (searchTerm) => {
    if (isLoading) return;

    setIsLoading(true);

    const qs = require('qs');
    const params = {
      data: searchTerm,
      user_id: selectedUser.id
    };

    try {
      const response = await axios.post(
        `${API.boongo_url}/circle/search`,
        qs.stringify(params, { arrayFormat: 'brackets' }), // 👈 key here
        {
          headers: {
            'X-localization': 'fr',
            'Authorization': `Bearer ${userInfo.api_token}`,
            'X-user-id': userInfo.id,
            'Content-Type': 'application/x-www-form-urlencoded', // consistent
          },
        }
      );

      setAddressees(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search event
  const handleSearch = (text) => {
    setInputValue(text);
    fetchSearchData(text);
  };

  const fetchCircles = async (pageToFetch = 1) => {
    if (isLoading || pageToFetch > lastPage) return;

    setIsLoading(true);

    const qs = require('qs');
    const url = `${API.boongo_url}/user/member_groups/circle/${selectedUser.id}/15?page=${pageToFetch}`;
    const mHeaders = {
      'X-localization': 'fr',
      'Authorization': `Bearer ${userInfo.api_token}`
    };

    try {
      const response = await axios.get(url, { headers: mHeaders });

      if (pageToFetch === 1) {
        setCircles(response.data.data);

      } else {
        setCircles(prev => [...prev, ...response.data.data]);
      }

      setAd(response.data.ad);
      setLastPage(response.data.lastPage);
      setCount(response.data.count);
    } catch (error) {
      if (error.response?.status === 429) {
        console.warn("Trop de requêtes envoyées. Attendez avant de réessayer.");
      } else {
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToTop = () => {
    flatListRef.current.scrollToOffset({ offset: 0, animated: true });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchCircles(1);
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (!isLoading && page < lastPage) {
      const nextPage = page + 1;

      setPage(nextPage); // Update the page
    }
  };

  const combinedData = [...circles];

  if (ad) {
    combinedData.push({ ...ad, realId: ad.id, id: 'ad' });
  }

  useEffect(() => {
    if (selectedUser && selectedUser.id) {
      fetchCircles(1); // Initial loading
    }
  }, [selectedUser]);

  useEffect(() => {
    if (page > 1) {
      fetchCircles(page);
    }
  }, [page]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
      {showBackToTop && (
        <TouchableOpacity style={[homeStyles.floatingButton, { backgroundColor: COLORS.warning }]} onPress={scrollToTop}>
          <Icon name='chevron-double-up' size={IMAGE_SIZE.s09} style={{ color: 'black' }} />
        </TouchableOpacity>
      )}

      <SafeAreaView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[homeStyles.cardEmpty, { height: Dimensions.get('window').height, marginLeft: 0, paddingHorizontal: 2 }]}>
          {/* Search bar */}
          <View style={[homeStyles.searchContainer, { marginTop: headerHeight + TAB_BAR_HEIGHT, backgroundColor: COLORS.white }]}>
            <View style={homeStyles.searchInput}>
              <TextInput placeholder={t('search')} placeholderTextColor={COLORS.black} onChangeText={handleSearch} style={[homeStyles.searchInputText, { color: COLORS.black, borderColor: COLORS.dark_secondary, marginHorizontal: 0 }]} />
              <TouchableOpacity style={[homeStyles.searchInputSubmit, { borderColor: COLORS.dark_secondary }]} onPress={() => fetchSearchData(inputValue)}>
                <FaIcon name='magnifying-glass' size={IMAGE_SIZE.s04} color={COLORS.black} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Circles List */}
          <Animated.FlatList
            ref={flatListRef}
            data={combinedData}
            keyExtractor={(item, index) => `${item.id || 'no-id'}-${index}`}
            renderItem={({ item }) => (
              <EntityItemComponent
                item={item}
                entity='circle'
                entity_id={item.id}
                entity_name={item.circle_name}
                entity_profile={item.profile_url}
              />
            )}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.1}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingTop: 0,
            }}
            windowSize={10}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={0} />}
            ListEmptyComponent={<EmptyListComponent iconName='account-group-outline' title={t('empty_list.title')} description={t('empty_list.description_user_circles')} />}
            ListFooterComponent={() =>
              isLoading ? (
                <Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01 }}>{t('loading')}</Text>
              ) : null
            }
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

// Consultations frame
const Consultations = ({ handleScroll, showBackToTop, listRef, headerHeight = 0 }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get parameters ===============
  const route = useRoute();
  const { user_id } = route.params;
  // =============== Get data ===============
  const [selectedUser, setSelectedUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const consultations = !loading ? selectedUser.valid_consultations : [];
  const flatListRef = listRef || useRef(null);

  // Get current user
  useEffect(() => {
    getUser();
  }, [selectedUser]);

  const getUser = async () => {
    const config = {
      method: 'GET',
      url: `${API.boongo_url}/user/${user_id}`,
      headers: {
        'X-localization': 'fr',
        'Authorization': `Bearer ${userInfo.api_token}`,
      }
    };

    try {
      const res = await axios(config);
      const userData = res.data.data.user || [];

      setSelectedUser(userData);
      setLoading(false);

    } catch (error) {
      console.error('Erreur getUser', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // ================= Handlers =================
  const onRefresh = async () => {
    setRefreshing(true);
    await getUser();
    setRefreshing(false);
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
        {/* Works List */}
        <Animated.FlatList
          ref={flatListRef}
          data={consultations}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <WorkItemComponent item={item} />}
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={headerHeight + TAB_BAR_HEIGHT} />}
          ListEmptyComponent={<EmptyListComponent iconName="book-open-page-variant-outline" title={t('empty_list.title')} description={t('empty_list.description_user_consultations')} />}
          ListFooterComponent={() => loading ? (<Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01, }} >{t('loading')}</Text>) : null}
        />
      </SafeAreaView>
    </View>
  );
};

const ProfileScreen = () => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get parameters ===============
  const route = useRoute();
  const { user_id } = route.params;
  // =============== Get data ===============
  const [selectedUser, setSelectedUser] = useState({});

  const worksListRef = useRef(null);
  const cerclesListRef = useRef(null);
  const consultationsListRef = useRef(null);

  const [index, setIndex] = useState(0); // State for managing active tab index
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showBackToTopByTab, setShowBackToTopByTab] = useState({ works: false, cercles: false, consultations: false });

  const scrollY = useRef(new Animated.Value(0)).current;
  const savedScrollOffsets = useRef({ works: 0, cercles: 0, consultations: 0 });
  const clampedScrollY = Animated.diffClamp(scrollY, 0, headerHeight);

  const headerTranslateY = clampedScrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolate: 'clamp',
  });

  const [routes] = useState([
    { key: 'works', title: t('navigation.profile.works') },
    { key: 'cercles', title: t('navigation.profile.circles') },
    { key: 'consultations', title: t('navigation.profile.consultations') },
  ]);

  const renderScene = ({ route }) => {
    const sceneProps = {
      handleScroll,
      headerHeight,
    };

    switch (route.key) {
      case 'works':
        return <Works {...sceneProps} handleScroll={handleScroll} showBackToTop={showBackToTopByTab.works} listRef={worksListRef} />;
      case 'cercles':
        return <Cercles {...sceneProps} handleScroll={handleScroll} showBackToTop={showBackToTopByTab.cercles} listRef={cerclesListRef} />;
      case 'consultations':
        return <Consultations {...sceneProps} handleScroll={handleScroll} showBackToTop={showBackToTopByTab.consultations} listRef={consultationsListRef} />;
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
        const currentTab = (index === 0 ? 'works' : (index === 1 ? 'cercles' : 'consultations'));

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
    const newTabKey = newIndex === 0 ? 'works' : (newIndex === 1 ? 'cercles' : 'consultations');
    const offset = savedScrollOffsets.current[newTabKey] || 0;

    // Animate scrollY back to 0 smoothly (for header + tabbar)
    Animated.timing(scrollY, {
      toValue: offset,
      duration: 300, // 300ms for smooth effect
      useNativeDriver: true,
    }).start();

    // Back to top according to selected tab
    if (newIndex === 0 && worksListRef.current) {
      worksListRef.current.scrollToOffset({ offset, animated: true });

    } else if (newIndex === 1 && cerclesListRef.current) {
      cerclesListRef.current.scrollToOffset({ offset, animated: true });

    } else if (newIndex === 2 && consultationsListRef.current) {
      consultationsListRef.current.scrollToOffset({ offset, animated: true });
    }

    setIndex(newIndex);
  };

  // Get current user
  useEffect(() => {
    getUser();
  }, [selectedUser]);

  const getUser = () => {
    const config = {
      method: 'GET',
      url: `${API.boongo_url}/user/${user_id}`,
      headers: {
        'X-localization': 'fr',
        'Authorization': `Bearer ${userInfo.api_token}`,
      }
    };

    axios(config)
      .then(res => {
        const userData = res.data.data.user;

        setSelectedUser(userData);

        return userData;
      })
      .catch(error => {
        console.log(error);
      });
  };

  // Adjust icon name
  const cleanIconName = (icon) => {
    // Separates the string by space and takes the last part, without the prefix
    const iconParts = icon.split(' ');  // Separates the prefix and the icon name
    return iconParts[iconParts.length - 1].replace(/^fa-/, '');  // Remove "fa-" if necessary
  };

  // Custom "TabBar"
  const renderTabBar = (props) => (
    <>
      <Animated.View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)} style={{ transform: [{ translateY: headerTranslateY }], zIndex: 1000, position: 'absolute', top: 0, width: '100%', backgroundColor: COLORS.white, paddingTop: 20 }}>
        {/* Status bar */}
        <StatusBar barStyle='light-content' backgroundColor={COLORS.success} />

        {/* Content */}
        <View style={{ backgroundColor: COLORS.white }}>
          {/* Username */}
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={{ position: 'absolute', left: 7, top: -7, zIndex: 10 }} onPress={() => navigation.goBack()}>
              <Icon name='chevron-left' size={37} color={COLORS.black} />
            </TouchableOpacity>
            <Text style={{ width: '100%', fontSize: 16, fontWeight: '400', textAlign: 'center', color: COLORS.success }}>{`@${selectedUser.username || '...'}`}</Text>
            <View style={{ flexDirection: 'row', position: 'absolute', right: 10, top: 3, zIndex: 10 }}>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                <Icon name='magnify' size={28} color={COLORS.black} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile */}
          <View style={{ flexDirection: 'row', width: Dimensions.get('window').width, justifyContent: 'flex-start', alignItems: 'flex-start', paddingTop: PADDING.p02, paddingHorizontal: PADDING.p02 }}>
            <Image style={{ width: 100, height: 100, borderRadius: 50, marginRight: PADDING.p02 }} source={{ uri: selectedUser.avatar_url || `${WEB.boongo_url}/assets/img/user.png` }} />
            <View style={{ flexDirection: 'column', paddingTop: PADDING.p02 }}>
              <Text style={{ fontSize: 20, fontWeight: '500', color: COLORS.black, maxWidth: '90%' }}>{`${selectedUser.firstname || '...'} ${selectedUser.lastname || ''}`}</Text>
              {selectedUser.email &&
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                  <Icon name='email' size={16} color={COLORS.black} style={{ marginTop: 1, marginRight: PADDING.p00 }} />
                  <Text style={{ fontSize: 13, fontWeight: '400', color: COLORS.black, maxWidth: '75%' }}>
                    {selectedUser.email}
                  </Text>
                </View>
              }
              {selectedUser.phone &&
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                  <Icon name='phone' size={16} color={COLORS.black} style={{ marginTop: 1, marginRight: PADDING.p00 }} />
                  <Text style={{ fontSize: 13, fontWeight: '400', color: COLORS.black, maxWidth: '75%' }}>
                    {selectedUser.phone}
                  </Text>
                </View>
              }
              {selectedUser.address_1 &&
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                  <Icon name='map-marker' size={16} color={COLORS.black} style={{ marginTop: 1, marginRight: PADDING.p00 }} />
                  <Text style={{ fontSize: 13, fontWeight: '400', color: COLORS.black, maxWidth: '75%' }}>
                    {selectedUser.address_1}
                  </Text>
                </View>
              }
              {selectedUser.last_organization ?
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                  <FaIcon name={cleanIconName(selectedUser.last_organization.type.icon)} size={16} color={COLORS.black} style={{ marginTop: 1, marginRight: PADDING.p00 }} />
                  <Text style={{ fontSize: 13, fontWeight: '400', color: COLORS.black, maxWidth: '75%' }}>
                    {selectedUser.last_organization.org_name}
                  </Text>
                </View> : ''
              }
            </View>
          </View>
        </View>
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

export default ProfileScreen;