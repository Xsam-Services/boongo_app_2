/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RadioButton, Checkbox } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';

import { API } from '../tools/constants';
import { AuthContext } from '../contexts/AuthContext';
import WorkItemComponent from '../components/work_item';
import HeaderComponent from './header';
import useColors from '../hooks/useColors';

const SearchScreen = () => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { userInfo } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [datas, setDatas] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await axios.get(`${API.boongo_url}/type/find_by_group/${encodeURIComponent("Type d'œuvre")}`);
        setTypes(response.data.data || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des types:', error);
      }
    };

    fetchTypes();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API.boongo_url}/category/find_by_group/${encodeURIComponent('Catégorie pour œuvre')}`);
        setCategories(response.data.data || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
      }
    };

    fetchCategories();
  }, []);

  const fetchData = async searchTerm => {
    if (isLoading) return;

    setIsLoading(true);
    setHasSearched(true);
    const qs = require('qs');
    const params = {
      data: searchTerm,
      type_id: selectedType,
      status_id: 17,
      categories_ids: selectedCategories,
    };

    try {
      const response = await axios.post(
        `${API.boongo_url}/work/search`,
        qs.stringify(params, { arrayFormat: 'brackets' }),
        {
          headers: {
            'X-localization': 'fr',
            Authorization: `Bearer ${userInfo.api_token}`,
            'X-user-id': userInfo.id,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      setDatas(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = event => setShowBackToTop(event.nativeEvent.contentOffset.y > 200);
  const scrollToTop = () => flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  const onRefresh = () => fetchData(inputValue);

  const handleCategoryToggle = id => {
    setSelectedCategories(previous => previous.includes(id) ? previous.filter(categoryId => categoryId !== id) : [...previous, id]);
  };

  const applyFilters = () => {
    setShowModal(false);
    fetchData(inputValue);
  };

  const hasFilters = Boolean(selectedType) || selectedCategories.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.light }]} edges={['top', 'bottom']}>
      <HeaderComponent title={t('search')} />
      <View style={styles.content}>
        <View style={[styles.searchCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
          <Icon name="magnify" size={23} color={COLORS.dark} />
          <TextInput
            accessibilityLabel={t('search')}
            value={inputValue}
            placeholder={t('search_description')}
            placeholderTextColor={COLORS.dark}
            returnKeyType="search"
            style={[styles.searchInput, { color: COLORS.black }]}
            onChangeText={setInputValue}
            onSubmitEditing={() => fetchData(inputValue)}
          />
          <TouchableOpacity
            accessibilityLabel={t('search_filter')}
            activeOpacity={0.75}
            style={[styles.filterButton, { backgroundColor: hasFilters ? COLORS.primary : COLORS.light_secondary }]}
            onPress={() => setShowModal(true)}
          >
            <Icon name="tune-variant" size={20} color={hasFilters ? '#ffffff' : COLORS.black} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={datas}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <WorkItemComponent item={item} />}
          contentContainerStyle={datas.length ? styles.results : styles.emptyResults}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={[styles.loadingLabel, { color: COLORS.dark }]}>{t('loading')}</Text>
              </View>
            ) : (
            <View style={[styles.emptyState, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
              <View style={[styles.emptyIcon, { backgroundColor: COLORS.light_primary }]}>
                <Icon name="magnify" size={30} color={COLORS.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: COLORS.black }]}>{hasSearched ? t('search_no_results_title') : t('search_start_title')}</Text>
              <Text style={[styles.emptyDescription, { color: COLORS.dark }]}>{hasSearched ? t('search_no_results_description') : t('search_start_description')}</Text>
            </View>
            )
          }
        />
      </View>

      {showBackToTop ? (
        <TouchableOpacity
          accessibilityLabel="Retour en haut"
          activeOpacity={0.8}
          style={[styles.floatingButton, styles.backToTopButton, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}
          onPress={scrollToTop}
        >
          <Icon name="chevron-up" size={24} color={COLORS.black} />
        </TouchableOpacity>
      ) : null}

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalBackdrop}>
          <SafeAreaView edges={['bottom']} style={[styles.filterSheet, { backgroundColor: COLORS.white, paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={[styles.sheetHandle, { backgroundColor: COLORS.light_secondary }]} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: COLORS.black }]}>{t('search_filter')}</Text>
                <Text style={[styles.sheetSubtitle, { color: COLORS.dark }]}>{t('search_filter_description')}</Text>
              </View>
              <TouchableOpacity accessibilityLabel={t('cancel')} style={[styles.closeButton, { backgroundColor: COLORS.light_secondary }]} onPress={() => setShowModal(false)}>
                <Icon name="close" size={20} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.filterContent} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: COLORS.black }]}>{t('search_filter_type')}</Text>
              <View style={styles.optionsList}>
                {types.map(type => {
                  const isSelected = selectedType === type.id.toString();
                  return (
                    <TouchableOpacity key={type.id} style={[styles.option, { backgroundColor: isSelected ? COLORS.light_primary : COLORS.light }]} onPress={() => setSelectedType(isSelected ? null : type.id.toString())}>
                      <Text style={[styles.optionText, { color: COLORS.black }]}>{type.type_name}</Text>
                      <RadioButton pointerEvents="none" value={type.id.toString()} status={isSelected ? 'checked' : 'unchecked'} color={COLORS.primary} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sectionTitle, styles.categoriesTitle, { color: COLORS.black }]}>{t('search_filter_categories')}</Text>
              <View style={styles.optionsList}>
                {categories.map(category => {
                  const isSelected = selectedCategories.includes(category.id);
                  return (
                    <TouchableOpacity key={category.id} style={[styles.option, { backgroundColor: isSelected ? COLORS.light_primary : COLORS.light }]} onPress={() => handleCategoryToggle(category.id)}>
                      <Text style={[styles.optionText, { color: COLORS.black }]}>{category.category_name}</Text>
                      <Checkbox pointerEvents="none" status={isSelected ? 'checked' : 'unchecked'} color={COLORS.primary} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity activeOpacity={0.82} style={[styles.applyButton, { backgroundColor: COLORS.primary }]} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>{t('search_filter_apply')}</Text>
              <Icon name="check" size={20} color="#ffffff" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },
  searchCard: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', marginVertical: 16, minHeight: 56, paddingLeft: 16, paddingRight: 7 },
  searchInput: { flex: 1, fontSize: 15, marginHorizontal: 11, paddingVertical: 12 },
  filterButton: { alignItems: 'center', borderRadius: 14, height: 42, justifyContent: 'center', width: 42 },
  results: { paddingBottom: 34 },
  emptyResults: { flexGrow: 1, justifyContent: 'center', paddingBottom: 72 },
  emptyState: { alignItems: 'center', borderRadius: 22, borderWidth: 1, padding: 28 },
  emptyIcon: { alignItems: 'center', borderRadius: 22, height: 58, justifyContent: 'center', width: 58 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  emptyDescription: { fontSize: 14, lineHeight: 20, marginTop: 7, textAlign: 'center' },
  loadingLabel: { fontSize: 14, marginTop: 12 },
  loadingState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 72 },
  floatingButton: { alignItems: 'center', borderRadius: 24, borderWidth: 1, height: 48, justifyContent: 'center', position: 'absolute', right: 22, width: 48 },
  backToTopButton: { bottom: 30 },
  modalBackdrop: { backgroundColor: 'rgba(18, 26, 36, 0.38)', flex: 1, justifyContent: 'flex-end' },
  filterSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '82%', paddingHorizontal: 20, paddingTop: 10 },
  sheetHandle: { alignSelf: 'center', borderRadius: 3, height: 5, width: 42 },
  sheetHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, marginTop: 18 },
  sheetTitle: { fontSize: 21, fontWeight: '700' },
  sheetSubtitle: { fontSize: 13, lineHeight: 18, marginTop: 4, maxWidth: 280 },
  closeButton: { alignItems: 'center', borderRadius: 16, height: 34, justifyContent: 'center', width: 34 },
  filterContent: { paddingBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  categoriesTitle: { marginTop: 22 },
  optionsList: { gap: 8 },
  option: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', minHeight: 52, paddingLeft: 14, paddingRight: 4 },
  optionText: { flex: 1, fontSize: 15, fontWeight: '500' },
  applyButton: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 6, minHeight: 52 },
  applyButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});

export default SearchScreen;
