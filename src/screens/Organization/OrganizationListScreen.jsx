import React, { useContext, useEffect, useEffectEvent, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';

import { API } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import EmptyListComponent from '../../components/empty_list';
import HeaderComponent from '../header';
import useColors from '../../hooks/useColors';

const OrganizationCard = ({ item, onPress, COLORS }) => {
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <TouchableOpacity activeOpacity={0.78} style={[styles.organizationCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]} onPress={onPress}>
      <View style={[styles.coverFrame, { backgroundColor: COLORS.light_primary }]}>
        {item.cover_url && !hasImageError ? <Image source={{ uri: item.cover_url }} style={[styles.cover, styles.editorialSurface]} resizeMode="contain" onError={() => setHasImageError(true)} /> : <Icon name="domain" size={28} color={COLORS.primary} />}
      </View>
      <View style={styles.organizationCopy}>
        <Text style={[styles.organizationName, { color: COLORS.black }]} numberOfLines={2}>{item.org_name}</Text>
        {item.org_description ? <Text style={[styles.organizationDescription, { color: COLORS.dark }]} numberOfLines={2}>{item.org_description}</Text> : null}
      </View>
      <Icon name="chevron-right" size={23} color={COLORS.dark} />
    </TouchableOpacity>
  );
};

const OrganizationListScreen = ({ typeId, navigationTitle, detailType, addRoute, emptyIcon }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userInfo } = useContext(AuthContext);
  const listRef = useRef(null);
  const loadingRef = useRef(false);
  const [organizations, setOrganizations] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const headers = {
    'X-localization': 'fr',
    'X-user-id': userInfo?.id,
    Authorization: `Bearer ${userInfo?.api_token}`,
  };

  const fetchOrganizations = async () => {
    if (!userInfo?.api_token || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API.boongo_url}/organization/find_all_by_type/${typeId}`, { headers });
      setOrganizations(response.data.data || []);
    } catch (error) {
      console.error('Unable to load organizations:', error);
      setOrganizations([]);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const searchOrganizations = async () => {
    const query = inputValue.trim();
    if (!query) {
      setHasSearched(false);
      fetchOrganizations();
      return;
    }

    if (!userInfo?.api_token || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const qs = require('qs');
      const response = await axios.post(
        `${API.boongo_url}/organization/search`,
        qs.stringify({ data: query, type_id: typeId, status_id: 7 }, { arrayFormat: 'brackets' }),
        { headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      setOrganizations(response.data.data || []);
    } catch (error) {
      console.error('Unable to search organizations:', error);
      setOrganizations([]);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadInitialOrganizations = useEffectEvent(fetchOrganizations);

  useEffect(() => {
    loadInitialOrganizations();
  }, [userInfo?.api_token]);

  const clearSearch = () => {
    setInputValue('');
    setHasSearched(false);
    fetchOrganizations();
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    if (hasSearched) searchOrganizations();
    else fetchOrganizations();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.light }]} edges={['top', 'bottom']}>
      <HeaderComponent title={t(navigationTitle)} />
      <View style={styles.content}>
        <View style={[styles.searchCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
          <Icon name="magnify" size={22} color={COLORS.dark} />
          <TextInput
            accessibilityLabel={t('search')}
            placeholder={t('search')}
            placeholderTextColor={COLORS.dark}
            returnKeyType="search"
            style={[styles.searchInput, { color: COLORS.black }]}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={searchOrganizations}
          />
          {inputValue ? <TouchableOpacity accessibilityLabel={t('clear')} onPress={clearSearch}><Icon name="close-circle" size={20} color={COLORS.dark} /></TouchableOpacity> : null}
          <TouchableOpacity accessibilityLabel={t('search')} disabled={isLoading} style={[styles.searchSubmit, { backgroundColor: COLORS.primary, opacity: isLoading ? 0.75 : 1 }]} onPress={searchOrganizations}>
            {isLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Icon name="arrow-right" size={20} color="#ffffff" />}
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={organizations}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <OrganizationCard item={item} COLORS={COLORS} onPress={() => navigation.navigate('OrganizationData', { organization_id: item.id, type: detailType })} />}
          contentContainerStyle={organizations.length ? styles.listContent : styles.emptyListContent}
          showsVerticalScrollIndicator={false}
          onScroll={event => setShowBackToTop(event.nativeEvent.contentOffset.y > 240)}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={isLoading ? <View style={styles.loadingState}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={[styles.loadingLabel, { color: COLORS.dark }]}>{t('loading')}</Text></View> : <EmptyListComponent iconName={emptyIcon} title={hasSearched ? t('search_no_results_title') : t('empty_list.title')} />}
        />
      </View>

      {showBackToTop ? <TouchableOpacity accessibilityLabel="Retour en haut" style={[styles.backToTop, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]} onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}><Icon name="chevron-up" size={24} color={COLORS.black} /></TouchableOpacity> : null}
      <TouchableOpacity accessibilityLabel={t('add')} style={[styles.addButton, { backgroundColor: COLORS.primary }]} onPress={() => navigation.navigate(addRoute)}><Icon name="plus" size={27} color="#ffffff" /></TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },
  searchCard: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', marginVertical: 16, minHeight: 56, paddingLeft: 16, paddingRight: 7 },
  searchInput: { flex: 1, fontSize: 15, marginHorizontal: 11, paddingVertical: 12 },
  searchSubmit: { alignItems: 'center', borderRadius: 14, height: 42, justifyContent: 'center', marginLeft: 8, width: 42 },
  listContent: { gap: 10, paddingBottom: 100 },
  emptyListContent: { flexGrow: 1, paddingBottom: 100 },
  organizationCard: { alignItems: 'center', borderRadius: 20, borderWidth: 1, flexDirection: 'row', minHeight: 96, padding: 12 },
  coverFrame: { alignItems: 'center', borderRadius: 14, height: 64, justifyContent: 'center', overflow: 'hidden', width: 64 },
  cover: { height: '100%', width: '100%' },
  editorialSurface: { backgroundColor: '#ffffff' },
  organizationCopy: { flex: 1, marginHorizontal: 12 },
  organizationName: { fontSize: 16, fontWeight: '800', lineHeight: 21 },
  organizationDescription: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  loadingState: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 280 },
  loadingLabel: { fontSize: 14, marginTop: 12 },
  addButton: { alignItems: 'center', borderRadius: 28, bottom: 28, elevation: 4, height: 56, justifyContent: 'center', position: 'absolute', right: 22, width: 56 },
  backToTop: { alignItems: 'center', borderRadius: 22, borderWidth: 1, bottom: 94, elevation: 3, height: 44, justifyContent: 'center', position: 'absolute', right: 28, width: 44 },
});

export default OrganizationListScreen;
