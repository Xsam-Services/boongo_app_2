/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, SafeAreaView, TouchableHighlight, Animated, Image } from 'react-native';
import { TabBar, TabView } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import Video from 'react-native-video';
import Sound from 'react-native-sound';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { API, IMAGE_SIZE, PADDING, TEXT_SIZE } from '../tools/constants';
import HeaderComponent from './header';
import FloatingActionsButton from '../components/floating_actions_button';
import EmptyListComponent from '../components/empty_list';
import useColors from '../hooks/useColors';
import homeStyles from './style';
import Spinner from 'react-native-loading-spinner-overlay';
import MediaItemComponent from '../components/media_item';
import { useNavigation } from '@react-navigation/native';

const TAB_BAR_HEIGHT = 48;

// Medias frame
const Medias = ({ handleScroll, showBackToTop, listRef, headerHeight = 0 }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get data ===============
  const [categories, setCategories] = useState([]);
  const [idCat, setIdCat] = useState(0);
  const [medias, setMedias] = useState([]);
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

  // ================= Fetch meidas when idCat or page changes =================
  // useEffect(() => {
  //   fetchMedias();
  // }, [page, idCat]);
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchMedias();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [page, idCat]);

  const fetchMedias = async () => {
    if (isLoading || page > lastPage) return;
    setIsLoading(true);

    const qs = require('qs');
    const url = `${API.boongo_url}/work/filter_by_categories?page=${page}`;
    const params = {
      'categories_ids[0]': idCat,
      type_id: 31,
      status_id: 17,
    };

    const headers = {
      'X-localization': 'fr',
      Authorization: `Bearer ${userInfo.api_token}`,
    };

    try {
      const response = await axios.post(url, qs.stringify(params), { headers });
      const data = response.data.data || [];

      setMedias(prev => (page === 1 ? data : [...prev, ...data]));
      setAd(response.data.ad || null);
      setLastPage(response.data.lastPage || page);
      setCount(response.data.count || 0);

      // console.log(response.data);

    } catch (error) {
      console.error('Erreur fetchMedias', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= Combined data =================
  const combinedData = [...medias];
  if (ad) {
    combinedData.push({ ...ad, id: 'ad', realId: ad.id });
  }

  // ================= Handlers =================
  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setMedias([]);
    await fetchMedias();
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
    setMedias([]);
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
      {/* {showBackToTop && (
        <TouchableOpacity
          style={[homeStyles.floatingButton, { backgroundColor: COLORS.warning }]}
          onPress={scrollToTop}
        >
          <Icon name='chevron-double-up' size={IMAGE_SIZE.s09} style={{ color: 'black' }} />
        </TouchableOpacity>
      )} */}

      <SafeAreaView contentContainerStyle={{ flexGrow: 1 }}>
        {/* <View style={[homeStyles.cardEmpty, { height: Dimensions.get('window').height, marginLeft: 0, paddingHorizontal: 2 }]}> */}
        {/* Medias List */}
        <Animated.FlatList
          ref={flatListRef}
          data={combinedData}
          extraData={combinedData}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <MediaItemComponent item={item} />}
          horizontal={false}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={false}
          onScroll={handleScroll}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
          scrollEventThrottle={16}
          windowSize={10}
          contentContainerStyle={{
            paddingTop: 110,
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={105} />}
          ListEmptyComponent={<EmptyListComponent iconName="play-box-multiple-outline" title={t('empty_list.title')} description={t('empty_list.description_medias')} />}
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
        {/* </View> */}
      </SafeAreaView>
    </View>
  );
};

// Favorite frame
const Favorite = ({ handleScroll, showBackToTop, listRef, headerHeight = 0 }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Get contexts ===============
  const { userInfo, removeFromCart, isLoading } = useContext(AuthContext);
  // =============== Get data ===============
  const favorites = userInfo.favorite_works;
  const flatListRef = listRef || useRef(null);

  // State pour la lecture de l'audio/vidéo et l'élément en cours
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(null);
  const [audio, setAudio] = useState(null); // Pour gérer l'audio avec react-native-sound
  const videoRef = useRef(null); // Utiliser useRef pour la référence vidéo

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleItemPress = (index, item) => {
    setCurrentItemIndex(index);

    console.log(JSON.stringify(item));

    if (item.video_url) {
      if (videoRef.current) {
        // Au lieu de chercher et de jouer immédiatement, on attend que la vidéo soit prête
        console.log('Vidéo prête à être lue.');
        // Ne pas appeler `seek(0)` ici, on le fait dans `onLoad`
      } else {
        console.log('Erreur: vidéo non prête');
      }
    } else if (item.audio_url) {
      playAudio(item.audio_url);
    }
    setIsPlaying(true);
  };



  const playAudio = (uri) => {
    if (audio) {
      audio.stop(); // Stoppe l’audio précédent avant de jouer un nouveau
    }

    const newAudio = new Sound(uri, null, (error) => {
      if (error) {
        console.log('Erreur de chargement audio', error);
      } else {
        newAudio.play(() => {
          newAudio.release();
          // Appeler handleNext() seulement si l'index a changé
          if (currentItemIndex !== null && currentItemIndex < favorites.length - 1) {
            handleNext();
          }
        });
      }
    });

    setAudio(newAudio);
    newAudio.play();
  };

  const handleNext = () => {
    const nextIndex = currentItemIndex < favorites.length - 1 ? currentItemIndex + 1 : 0;
    if (nextIndex !== currentItemIndex) {
      setCurrentItemIndex(nextIndex);
      setIsPlaying(true); // Assurez-vous que l'état est correctement mis à jour
    }
  };

  const stopAudio = () => {
    if (audio) {
      audio.stop();
    }
  };

  return (
    <>
      {/* Spinner (for AuthContext requests) */}
      <Spinner visible={isLoading} />

      {/* Content */}
      <View style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
        {/* Contrôle global play/pause */}
        {/* <TouchableOpacity style={[homeStyles.floatingButton, { left: 20, bottom: 30, backgroundColor: COLORS.black }]} onPress={handlePlayPause}>
          <Icon name={isPlaying ? 'pause' : 'play'} size={IMAGE_SIZE.s09} color={COLORS.white} />
        </TouchableOpacity> */}

        <SafeAreaView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Favorites List */}
          <Animated.FlatList
            ref={flatListRef}
            data={favorites}
            extraData={favorites}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item, index }) => {
              return (
                <View style={[homeStyles.workTop, { backgroundColor: COLORS.white, marginBottom: 1, padding: PADDING.p03 }]}>
                  <Image source={{ uri: item.photo_url }} style={{ width: IMAGE_SIZE.s13, height: IMAGE_SIZE.s13, borderRadius: PADDING.p00, borderWidth: 1, borderColor: COLORS.light_secondary }} />
                  <View style={{ flexDirection: 'column', width: '60%' }}>
                    <Text numberOfLines={2} style={{ fontSize: TEXT_SIZE.paragraph, fontWeight: '400', color: COLORS.black }}>{item.work_content}</Text>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity style={{ backgroundColor: COLORS.white, marginRight: PADDING.p00, padding: 3, borderRadius: 3, borderWidth: 1, borderColor: COLORS.danger }} onPress={() => { removeFromCart(userInfo.favorite_works_cart.id, item.id, null); }}>
                      <Icon name="trash-can-outline" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ backgroundColor: COLORS.white, padding: 3, borderRadius: 3, borderWidth: 1, borderColor: COLORS.link_color }} onPress={() => navigation.navigate('WorkData', { itemId: item.id })}>
                      <Icon name="arrow-right" size={20} color={COLORS.link_color} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            horizontal={false}
            showsVerticalScrollIndicator={false}
            alwaysBounceVertical={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            windowSize={10}
            contentContainerStyle={{
              paddingTop: 110,
            }}
            ListEmptyComponent={<EmptyListComponent iconName="play-box-multiple-outline" title={t('empty_list.title')} description={t('empty_list.description_medias')} />}
          />
        </SafeAreaView>
      </View>

      {/* Player vidéo */}
      {currentItemIndex !== null && favorites[currentItemIndex].video_url && (
        <Video
          source={{ uri: favorites[currentItemIndex].video_url }}
          ref={videoRef} // Assurez-vous d'utiliser `videoRef` ici
          onReadyForDisplay={() => {
            console.log('Vidéo prête pour affichage');
            if (videoRef.current) {
              videoRef.current.seek(0);  // Chercher le début de la vidéo
              videoRef.current.resume();   // Lire la vidéo
            }
          }}
          onEnd={handleNext}
          paused={!isPlaying}
          resizeMode="contain"
          style={{ width: '100%', height: 200 }}
        />
      )}

      {/* Player audio */}
      {currentItemIndex !== null && favorites[currentItemIndex].audio_url && (
        <Sound
          source={{ uri: favorites[currentItemIndex].audio_url }}
          shouldPlay={isPlaying}
          onPlaybackStatusUpdate={status => {
            if (status.didJustFinish) handleNext();
          }}
        />
      )}
    </>
  );
};

const MediaScreen = () => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Get data ===============
  const mediasListRef = useRef(null);
  const favoriteListRef = useRef(null);
  const [index, setIndex] = useState(0); // State for managing active tab index
  const [showBackToTopByTab, setShowBackToTopByTab] = useState({ medias: false, favorite: false });
  const scrollY = useRef(new Animated.Value(0)).current;
  const savedScrollOffsets = useRef({ medias: 0, favorite: 0 });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -60], // The header hides at -60px
    extrapolate: 'clamp',
  });

  const [routes] = useState([
    { key: 'medias', title: t('navigation.media.title') },
    { key: 'favorite', title: t('navigation.media.favorite') },
  ]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'medias':
        return <Medias handleScroll={handleScroll} showBackToTop={showBackToTopByTab.news} listRef={mediasListRef} />;
      case 'favorite':
        return <Favorite handleScroll={handleScroll} showBackToTop={showBackToTopByTab.books} listRef={favoriteListRef} />;
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
        const currentTab = (index === 0 ? 'medias' : 'favorite');

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
    const newTabKey = newIndex === 0 ? 'medias' : 'favorite';
    const offset = savedScrollOffsets.current[newTabKey] || 0;

    // Animate scrollY back to 0 smoothly (for header + tabbar)
    Animated.timing(scrollY, {
      toValue: offset,
      duration: 300, // 300ms for smooth effect
      useNativeDriver: true,
    }).start();

    // Back to top according to selected tab
    if (newIndex === 0 && mediasListRef.current) {
      mediasListRef.current.scrollToOffset({ offset, animated: true });

    } else if (newIndex === 1 && favoriteListRef.current) {
      favoriteListRef.current.scrollToOffset({ offset, animated: true });
    }

    setIndex(newIndex);
  };

  // Custom "TabBar"
  const renderTabBar = (props) => (
    <>
      <Animated.View style={{ transform: [{ translateY: headerTranslateY }], zIndex: 1000, position: 'absolute', top: 0, width: '100%', backgroundColor: COLORS.white, paddingTop: 20 }}>
        <HeaderComponent />
        <TabBar
          {...props}
          style={{ backgroundColor: COLORS.white, borderBottomWidth: 0, elevation: 0, shadowOpacity: 0 }}
          indicatorStyle={{ backgroundColor: COLORS.black }}
          activeColor={COLORS.black}
          inactiveColor={COLORS.dark_secondary}
        />
      </Animated.View>
    </>
  );

  // Back to top handler
  const handleBackToTop = () => {
    if (index === 0 && newsListRef.current) {
      newsListRef.current.scrollToOffset({ offset: 0, animated: true });
    } else if (index === 1 && booksListRef.current) {
      booksListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  return (
    <>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={handleIndexChange}
        initialLayout={{ width: 100 }}
        renderTabBar={renderTabBar} // Using the Custom TabBar
      />

      {/* === Bouton global BackToTop === */}
      {showBackToTopByTab[index === 0 ? 'medias' : 'favorite'] && (
        <TouchableOpacity
          onPress={handleBackToTop}
          style={[homeStyles.floatingButton, { backgroundColor: COLORS.warning }]}
        >
          <Icon name='chevron-double-up' size={IMAGE_SIZE.s09} style={{ color: 'black' }} />
        </TouchableOpacity>
      )}

      {/* === Floating Button === */}
      <FloatingActionsButton />
    </>
  );
};

export default MediaScreen;