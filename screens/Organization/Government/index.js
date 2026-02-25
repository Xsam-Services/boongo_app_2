/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Text, RefreshControl, TouchableOpacity, Dimensions, Animated, TextInput, SafeAreaView, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { AuthContext } from '../../../contexts/AuthContext';
import { API, IMAGE_SIZE, PADDING, TEXT_SIZE } from '../../../tools/constants';
import homeStyles from '../../style';
import useColors from '../../../hooks/useColors';
import HeaderComponent from '../../header';
import EmptyListComponent from '../../../components/empty_list';

const GovernmentScreen = () => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Authentication context ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get data ===============
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [ad, setAd] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [count, setCount] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);

  // Fetch data from API
  const fetchSearchData = async (searchTerm) => {
    if (isLoading) return;
    setIsLoading(true);

    const qs = require('qs');

    const params = {
      data: searchTerm,
      type_id: 35,
      status_id: 7,
    };

    try {
      const response = await axios.post(
        `${API.boongo_url}/organization/search`,
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

      setOrganizations(response.data.data);
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

  const fetchOrganizations = async (pageToFetch = 1) => {
    if (isLoading || pageToFetch > lastPage) return;

    setIsLoading(true);

    const url = `${API.boongo_url}/organization/find_all_by_type/35`;
    const mHeaders = {
      'X-localization': 'fr',
      'X-user-id': userInfo.id,
      'Authorization': `Bearer ${userInfo.api_token}`
    };

    try {
      const response = await axios.get(url, { headers: mHeaders });

      if (pageToFetch === 1) {
        setOrganizations(response.data.data);

      } else {
        setOrganizations(prev => [...prev, ...response.data.data]);
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

  useEffect(() => {
    fetchOrganizations(1); // Initial loading
  }, []);

  useEffect(() => {
    if (page > 1) {
      fetchOrganizations(page);
    }
  }, [page]);

  // =============== Handle "scroll top" button ===============
  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    const isAtTop = contentOffset.y === 0;

    setShowBackToTop(!isAtTop);
  };

  const scrollToTop = () => {
    flatListRef.current.scrollToOffset({ offset: 0, animated: true });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchOrganizations(1);
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (!isLoading && page < lastPage) {
      const nextPage = page + 1;

      setPage(nextPage); // Update the page
    }
  };

  const combinedData = [...organizations];

  if (ad) {
    combinedData.push({ ...ad, realId: ad.id, id: 'ad' });
  }

  const OrganizationItem = ({ item }) => {
    if (item.id === 'ad') {
      // If it is the "advertisement" object, we display the advertisement component
      if (item.has_promo_code) {
        <SafeAreaView style={[homeStyles.workTop, { backgroundColor: COLORS.black, marginBottom: PADDING.p00, paddingHorizontal: PADDING.p03 }]}>
          <View>
            <Image source={{ uri: item.image_url }} style={[homeStyles.newsImage, { borderColor: COLORS.light_secondary }]} />
          </View>
          <View style={homeStyles.workDescTop}>
            <Text style={[homeStyles.newsContent, { color: COLORS.white }]} numberOfLines={4}>{item.message}</Text>
            {item.website_url &&
              <TouchableOpacity style={homeStyles.linkIcon} onPress={() => navigation.navigate('Subscription', { itemId: item.realId })}>
                <Text style={[homeStyles.link, { color: COLORS.link_color }]}>{t('see_details')} </Text>
                <Icon name='chevron-right' size={IMAGE_SIZE.s05} color={COLORS.link_color} />
              </TouchableOpacity>
            }
          </View>
        </SafeAreaView>

      } else {
        if (item.website_url) {
          return (
            <TouchableOpacity onPress={() => Linking.openURL(item.website_url)}>
              <SafeAreaView style={[homeStyles.workTop, { backgroundColor: COLORS.black, marginBottom: PADDING.p00, paddingHorizontal: PADDING.p03 }]}>
                <View>
                  <Image source={{ uri: item.image_url }} style={[homeStyles.newsImage, { marginLeft: 0, marginRight: 10, borderColor: COLORS.light_secondary }]} />
                </View>
                <View style={homeStyles.workDescTop}>
                  <Text style={[homeStyles.newsContent, { fontSize: 16, fontWeight: '700', color: COLORS.white }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[homeStyles.newsContent, { color: COLORS.white }]} numberOfLines={4}>{item.message}</Text>
                </View>
                <Icon name='earth' size={IMAGE_SIZE.s03} color={COLORS.dark_secondary} style={{ position: 'absolute', bottom: PADDING.p01, right: PADDING.p01 }} />
              </SafeAreaView>
            </TouchableOpacity>
          );

        } else {
          <SafeAreaView style={[homeStyles.workTop, { backgroundColor: COLORS.black, marginBottom: PADDING.p00, paddingHorizontal: PADDING.p03 }]}>
            <View>
              <Image source={{ uri: item.image_url }} style={[homeStyles.newsImage, { marginLeft: 0, marginRight: 10, borderColor: COLORS.light_secondary }]} />
            </View>
            <View style={homeStyles.workDescTop}>
              <Text style={[homeStyles.newsContent, { fontSize: 16, fontWeight: '700', color: COLORS.white }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[homeStyles.newsContent, { color: COLORS.white }]} numberOfLines={4}>{item.message}</Text>
            </View>
          </SafeAreaView>
        }
      }
    }

    return (
      <Pressable onPress={() => { navigation.navigate('OrganizationData', { organization_id: item.id, type: 'government' }); }} style={{ flexDirection: 'row', alignItems: 'center', padding: PADDING.p03, backgroundColor: COLORS.white }}>
        <Image source={{ uri: item.cover_url }} style={{ width: IMAGE_SIZE.s13, height: IMAGE_SIZE.s13, borderRadius: PADDING.p00, marginRight: PADDING.p03, borderWidth: 1, borderColor: COLORS.light_secondary }} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: COLORS.black, fontSize: TEXT_SIZE.paragraph, fontWeight: '500' }}>{`${item.org_name}`}</Text>
          <Text numberOfLines={2} style={{ color: COLORS.dark_secondary }}>{`${item.org_description}`}</Text>
        </View>
        <Icon name="chevron-right" size={IMAGE_SIZE.s05} color={COLORS.black} />
      </Pressable>
    );
  };

  return (
    <>
      {/* Header */}
      <View style={{ paddingVertical: PADDING.p01, backgroundColor: COLORS.white }}>
        <HeaderComponent title={t('navigation.government.title')} />
      </View>

      {/* Floating button */}
      <Pressable style={[homeStyles.floatingButton, { bottom: 30, backgroundColor: COLORS.success }]} onPress={() => { navigation.navigate('AddGovernment') }}>
        <Icon name='plus' size={IMAGE_SIZE.s06} color='white' />
      </Pressable>

      {/* Content */}
      <View style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
        {showBackToTop && (
          <TouchableOpacity style={[homeStyles.floatingButton, { backgroundColor: COLORS.warning }]} onPress={scrollToTop}>
            <Icon name='chevron-double-up' size={IMAGE_SIZE.s09} style={{ color: 'black' }} />
          </TouchableOpacity>
        )}
        <SafeAreaView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={[homeStyles.cardEmpty, { height: Dimensions.get('window').height, marginLeft: 0, paddingHorizontal: 2 }]}>
            {/* Search bar */}
            <View style={[homeStyles.searchContainer, { marginTop: 0, backgroundColor: COLORS.white }]}>
              <View style={homeStyles.searchInput}>
                <TextInput placeholder={t('search')} placeholderTextColor={COLORS.black} onChangeText={handleSearch} style={[homeStyles.searchInputText, { color: COLORS.black, borderColor: COLORS.dark_secondary, marginHorizontal: 0 }]} />
                <TouchableOpacity style={[homeStyles.searchInputSubmit, { borderColor: COLORS.dark_secondary }]} onPress={() => fetchSearchData(inputValue)}>
                  <FontAwesome6 name='magnifying-glass' size={IMAGE_SIZE.s04} color={COLORS.black} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Organizations List */}
            <Animated.FlatList
              ref={flatListRef}
              data={combinedData}
              keyExtractor={(item, index) => `${item.id || 'no-id'}-${index}`}
              renderItem={({ item }) => (<OrganizationItem item={item} />)}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.1}
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingTop: 0 }}
              windowSize={10}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={0} />}
              ListEmptyComponent={<EmptyListComponent iconName='city-variant-outline' title={t('empty_list.title')} description={t('empty_list.description_governments')} />}
              ListFooterComponent={() =>
                isLoading ? (
                  <Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01 }}>{t('loading')}</Text>
                ) : null
              }
            />
          </View>
        </SafeAreaView>
      </View>
    </>
  );
};

export default GovernmentScreen;