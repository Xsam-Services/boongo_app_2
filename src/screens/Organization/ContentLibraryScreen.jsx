import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import qs from 'qs';
import { useTranslation } from 'react-i18next';

import { API } from '../../tools/constants';
import useColors from '../../hooks/useColors';
import HeaderComponent from '../header';
import EmptyListComponent from '../../components/empty_list';
import WorkItemComponent from '../../components/work_item';

const LoadingState = ({ COLORS }) => (
  <View style={styles.loadingState}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
);

const MapItem = ({ item }) => {
  const COLORS = useColors();
  const navigation = useNavigation();
  const imageUrl = item.photo_url || item.image_url || item.images?.find(image => image.type?.alias === 'image_file')?.file_url || item.images?.find(image => image.file_url)?.file_url;

  return (
    <TouchableOpacity activeOpacity={0.82} onPress={() => navigation.navigate('WorkData', { itemId: item.id })} style={[styles.mapCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={[styles.mapImage, styles.editorialSurface]} resizeMode="contain" /> : (
        <View style={[styles.mapImage, styles.mapFallback, { backgroundColor: COLORS.light_primary }]}>
          <Icon name="map-outline" size={42} color={COLORS.primary} />
        </View>
      )}
      <View style={styles.mapFooter}>
        <Text numberOfLines={2} style={[styles.mapTitle, { color: COLORS.black }]}>{item.work_title}</Text>
        <Icon name="arrow-right" size={20} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );
};

const ContentLibraryScreen = ({ categoryGroup, emptyDescriptionKey, emptyIcon, isMap = false, title, workType }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const listRef = useRef(null);
  const requestIdRef = useRef(0);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(0);
  const [items, setItems] = useState([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const response = await axios.get(
        `${API.boongo_url}/category/find_by_group/${encodeURIComponent(categoryGroup)}`,
        { headers: { 'X-localization': 'fr' } }
      );
      const allCategory = { id: 0, category_name: t('all_f') };
      const apiCategories = Array.isArray(response.data?.data) ? response.data.data : [];
      setCategories([allCategory, ...apiCategories.filter(category => category.id !== allCategory.id)]);
    } catch (fetchError) {

    } finally {
      setIsLoadingCategories(false);
    }
  }, [categoryGroup, t, title]);

  const fetchItems = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoadingContent(true);
    setError(false);

    try {
      const response = await axios.post(
        `${API.boongo_url}/work/filter_by_categories_type_status/fr/${encodeURIComponent(workType)}/${encodeURIComponent('Pertinente')}`,
        qs.stringify({ 'categories_ids[0]': selectedCategoryId }),
        { headers: { 'X-localization': 'fr' } }
      );
      if (requestId === requestIdRef.current) {
        setItems(Array.isArray(response.data?.data) ? response.data.data : []);
      }
    } catch (fetchError) {
      if (requestId === requestIdRef.current) {
        setItems([]);
        setError(true);
      }

    } finally {
      if (requestId === requestIdRef.current) setIsLoadingContent(false);
    }
  }, [selectedCategoryId, title, workType]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const selectCategory = (categoryId) => {
    if (categoryId === selectedCategoryId || isLoadingContent) return;
    setItems([]);
    setSelectedCategoryId(categoryId);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCategories(), fetchItems()]);
    setRefreshing(false);
  };

  const renderCategory = ({ item }) => {
    const selected = item.id === selectedCategoryId;
    const categoryTextColor = selected ? '#ffffff' : COLORS.black;
    return (
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={() => selectCategory(item.id)}
        style={[styles.categoryChip, { backgroundColor: selected ? COLORS.primary : COLORS.white, borderColor: selected ? COLORS.primary : COLORS.light_secondary }]}
      >
        <Text style={[styles.categoryText, { color: categoryTextColor }]}>{item.category_name}</Text>
      </TouchableOpacity>
    );
  };

  const showInitialLoader = (isLoadingContent || isLoadingCategories) && items.length === 0;
  const emptyContent = error ? (
    <View style={styles.errorState}>
      <Icon name="wifi-off" size={32} color={COLORS.danger} />
      <Text style={[styles.errorText, { color: COLORS.dark }]}>Impossible de charger ce contenu pour le moment.</Text>
    </View>
  ) : (
    <EmptyListComponent iconName={emptyIcon} title={t('empty_list.title')} description={t(emptyDescriptionKey)} />
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.light }]} edges={['top']}>
      <HeaderComponent title={title} />
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => isMap ? <MapItem item={item} /> : <WorkItemComponent item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={items.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
        ListHeaderComponent={
          <FlatList
            data={categories}
            horizontal
            keyExtractor={item => item.id.toString()}
            renderItem={renderCategory}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
            style={styles.categoriesList}
          />
        }
        ListEmptyComponent={showInitialLoader ? <LoadingState COLORS={COLORS} /> : emptyContent}
        ListFooterComponent={isLoadingContent && items.length > 0 ? <ActivityIndicator style={styles.footerLoader} color={COLORS.primary} /> : null}
      />
    </SafeAreaView>
  );
};

export default ContentLibraryScreen;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { paddingBottom: 28, paddingTop: 8 },
  emptyListContent: { flexGrow: 1, paddingBottom: 28, paddingTop: 8 },
  categoriesList: { marginBottom: 12 },
  categoriesContent: { paddingHorizontal: 16 },
  categoryChip: { borderRadius: 18, borderWidth: 1, marginRight: 8, paddingHorizontal: 16, paddingVertical: 10 },
  categoryText: { fontSize: 14, fontWeight: '700' },
  loadingState: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 300 },
  footerLoader: { marginVertical: 20 },
  errorState: { alignItems: 'center', minHeight: 280, justifyContent: 'center', paddingHorizontal: 36 },
  errorText: { fontSize: 15, lineHeight: 21, marginTop: 12, textAlign: 'center' },
  mapCard: { borderRadius: 22, borderWidth: 1, marginBottom: 12, marginHorizontal: 16, overflow: 'hidden' },
  mapImage: { height: 210, width: '100%' },
  editorialSurface: { backgroundColor: '#ffffff' },
  mapFallback: { alignItems: 'center', justifyContent: 'center' },
  mapFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  mapTitle: { flex: 1, fontSize: 16, fontWeight: '800', lineHeight: 21, marginRight: 12 },
});
