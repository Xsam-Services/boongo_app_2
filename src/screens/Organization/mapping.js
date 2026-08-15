/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, SafeAreaView, Dimensions/*, ActivityIndicator*/, ToastAndroid, Image, TouchableHighlight, Platform, NativeModules } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API, IMAGE_SIZE, PADDING } from '../../tools/constants';
import homeStyles from '../style';
import useColors from '../../hooks/useColors';

const MappingScreen = () => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();

  // =============== Float button ===============
  const [showBackToTop, setShowBackToTop] = useState(false);
  const flatListRef = useRef(null);

  // =============== Get data ===============
  const [categories, setCategories] = useState([]);
  const [idCat, setIdCat] = useState(0);
  const [maps, setMaps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // =============== Get device language ===============
  // const getDeviceLang = () => {
  //   const appLanguage = Platform.OS === 'ios' ? NativeModules.SettingsManager.settings.AppleLocale || NativeModules.SettingsManager.settings.AppleLanguages[0] : NativeModules.I18nManager.localeIdentifier;

  //   return appLanguage.search(/-|_/g) !== -1 ? appLanguage.slice(0, 2) : appLanguage;
  // };

  // =============== Handle "scroll top" button ===============
  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    const isAtTop = contentOffset.y === 0;

    setShowBackToTop(!isAtTop);
  };

  const scrollToTop = () => {
    flatListRef.current.scrollToOffset({ offset: 0, animated: true });
  };

  // =============== Handle badge press ===============
  const handleBadgePress = useCallback((id) => {
    setIdCat(id);
    maps.splice(0, maps.length);

    // Reload data
    getMaps2(id);
    console.log('handleReload => Works count: ' + maps.length + ', Selected category: ' + idCat);
  }, []);

  // =============== Refresh control ===============
  const onRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); }, 2000);
  }, []);

  // =============== Using the Effect Hook ===============
  // CATEGORIES
  useEffect(() => {
    getCategories();
  }, []);

  // MAPS
  useEffect(() => {
    getMaps();
  }, [idCat]);

  // =============== Some work functions ===============
  // CATEGORIES
  // Get all categories
  const getCategories = () => {
    setIsLoading(true);

    const config = { method: 'GET', url: `${API.boongo_url}/category/find_by_group/Catégorie%20pour%20carte`, headers: { 'X-localization': 'fr' } };
    const item_all = { "id": 0, "category_name": t('all_f'), "category_name_fr": "Toutes", "category_name_en": "All", "category_description": null };

    axios(config)
      .then(res => {
        const categoriesData = res.data.data;

        categoriesData.unshift(item_all);

        setIdCat(item_all.id);
        setCategories(categoriesData);
        setIsLoading(false);
      })
      .catch(error => {
        console.log(error);
      });
  };

  // MAPS
  const getMaps = () => {
    setIsLoading(true);

    let qs = require('qs');
    const url = `${API.boongo_url}/work/filter_by_categories_type_status/fr/Carte%20géographique/Pertinente`;
    let mParams = { 'categories_ids[0]': idCat }
    const mHeaders = {
      'X-localization': 'fr'
    };

    axios.post(url, qs.stringify(mParams), mHeaders).then(res => {
      const mapsData = res.data.data;

      setMaps(mapsData);
      setIsLoading(false);

      console.log(new Date() + ' : getMaps => Works count: ' + mapsData.length + ', Selected category: ' + idCat);

    }).catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        ToastAndroid.show(`${error.response.status} -> ${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
        console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

      } else if (error.request) {
        // The request was made but no response was received
        ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

      } else {
        // An error occurred while configuring the query
        ToastAndroid.show(`${error}`, ToastAndroid.LONG);
      }
    });
  };

  const getMaps2 = (id) => {
    setIsLoading(true);

    let qs = require('qs');
    const url = `${API.boongo_url}/work/filter_by_categories_type_status/fr/Carte%20géographique/Pertinente`;
    let mParams = { 'categories_ids[0]': id }
    const mHeaders = {
      'X-localization': 'fr'
    };

    axios.post(url, qs.stringify(mParams), mHeaders).then(res => {
      const mapsData = res.data.data;

      setMaps(mapsData);
      setIsLoading(false);

      console.log(new Date() + ' : getMaps => Works count: ' + mapsData.length + ', Selected category: ' + id);

    }).catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        ToastAndroid.show(`${error.response.status} -> ${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
        console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

      } else if (error.request) {
        // The request was made but no response was received
        ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

      } else {
        // An error occurred while configuring the query
        ToastAndroid.show(`${error}`, ToastAndroid.LONG);
      }
    });
  };

  // =============== « Load more » button ===============
  // const renderLoadMoreButton = () => {
  //   return (
  //     <View>
  //       <TouchableOpacity activeOpacity={0.9} onPress={getMaps} style={[homeStyles.authButton, { marginBottom: 30, paddingVertical: PADDING.vertical, borderRadius: 30 }]}>
  //         <Text style={homeStyles.authButtonText}>{t('load_more')}</Text>
  //         {isLoading ? (<ActivityIndicator color={COLORS.white} style={{ marginLeft: 8 }} />) : null}
  //       </TouchableOpacity>
  //     </View>
  //   );
  // };

  // =============== Category Item ===============
  const CategoryItem = ({ item }) => {
    if (idCat === item.id) {
      return (
        <TouchableHighlight style={homeStyles.categoryBadgeSelected}>
          <Text style={homeStyles.categoryBadgeTextSelected}>{item.category_name}</Text>
        </TouchableHighlight>
      );

    } else {
      return (
        <TouchableOpacity style={homeStyles.categoryBadge} key={item.id} onPress={() => handleBadgePress(item.id)}>
          <Text style={homeStyles.categoryBadgeText}>{item.category_name}</Text>
        </TouchableOpacity>
      );
    }
  };

  // =============== Map Item ===============
  const MapItem = ({ item }) => {
    const navigation = useNavigation();

    return (
      <TouchableOpacity onPress={() => navigation.navigate('WorkData', { itemId: item.id })}>
        <View style={[homeStyles.cardEmpty, { marginLeft: 0, marginBottom: 0 }]}>
          <View>
            <Image source={{ uri: item.image_url ? item.image_url : `${WEB.boongo_url}/assets/img/cover.png` }} style={[homeStyles.workImage, { width: Dimensions.get('window').width - 45, height: Dimensions.get('window').width / 1.5 }]} />
          </View>
          <View style={homeStyles.workDescTop}>
            <Text style={[homeStyles.workTitle, { textAlign: 'center', fontWeight: '500' }]}>{item.work_title}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  };

  return (
    <View style={{ height: Dimensions.get('window').height - 20 }}>
      {/* Floating button */}
      {showBackToTop && (
        <TouchableOpacity style={[homeStyles.floatingButton, { backgroundColor: COLORS.success, bottom: 80 }]} onPress={scrollToTop}>
          <MaterialCommunityIcons name='chevron-double-up' size={IMAGE_SIZE.s13} style={{ color: COLORS.white }} />
        </TouchableOpacity>
      )}

      {/* Categories */}
      <View style={{ paddingTop: PADDING.vertical }}>
        <FlatList
          data={categories}
          keyExtractor={item => item.id}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: PADDING.horizontal }}
          renderItem={({ item }) => {
            return (<CategoryItem item={item} />);
          }} />
      </View>

      {/* Works */}
      <SafeAreaView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[homeStyles.cardEmpty, { height: Dimensions.get('window').height - 70, marginLeft: 0, paddingLeft: 5 }]}>
          <FlatList
            ref={flatListRef}
            data={maps}
            extraData={maps}
            keyExtractor={item => item.id}
            horizontal={false}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            style={homeStyles.scrollableList}
            windowSize={10}
            ListEmptyComponent={() => {
              return (
                <>
                  <Text style={homeStyles.cardEmptyTitle}>{t('empty_list.title')}</Text>
                  <Text style={[homeStyles.cardEmptyText, { marginBottom: 25 }]}>{t('empty_list.description_maps')}</Text>
                </>
              )
            }}
            renderItem={({ item }) => {
              return (<MapItem item={item} />);
            }}
            // ListFooterComponent={maps.length > 0 ? currentPage === lastPage ? null : renderLoadMoreButton : null}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />} />
        </View>
      </SafeAreaView>
    </View>
  );
};

export default MappingScreen;