/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { FlatList, Modal, RefreshControl, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RadioButton, Checkbox, Button, Portal } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import axios from 'axios';
import { API, IMAGE_SIZE, PADDING } from '../tools/constants';
import { AuthContext } from '../contexts/AuthContext';
import WorkItemComponent from '../components/work_item';
import EmptyListComponent from '../components/empty_list';
import homeStyles from './style';
import useColors from '../hooks/useColors';

const SearchScreen = () => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get data ===============
  const flatListRef = useRef(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [datas, setDatas] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // For modal handling
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Fetch types from API
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await axios.get(`${API.boongo_url}/type/find_by_group/Type%20d'œuvre`);
        setTypes(response.data.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des types:', error);
      }
    };

    fetchTypes();
  }, []);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API.boongo_url}/category/find_by_group/Catégorie%20pour%20œuvre`);
        setCategories(response.data.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des catégories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch data from API
  const fetchData = async (searchTerm) => {
    if (isLoading) return;
    setIsLoading(true);

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

      setDatas(response.data.data);
      console.log('Réponse API:', response.data);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle scroll to top
  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    setShowBackToTop(contentOffset.y > 200);
  };

  const scrollToTop = () => {
    flatListRef.current.scrollToOffset({ offset: 0, animated: true });
  };

  // Handle refreshing
  const onRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  }, []);

  // Handle type selection
  const handleTypeChange = (value) => {
    setSelectedType(value);
  };

  // Handle category selection/deselection
  const handleCategoryToggle = (id) => {
    setSelectedCategories((prevSelected) =>
      prevSelected.includes(id) ? prevSelected.filter((categoryId) => categoryId !== id) : [...prevSelected, id]
    );
  };

  // Apply custom filters
  const applyFilters = () => {
    // Logic to apply filters (e.g., status update or API call)
    console.log('Filtres appliqués:', { selectedType, selectedCategories });
    setShowModal(false);
  };

  // Handle search event
  const handleSearch = (text) => {
    setInputValue(text);
    fetchData(text);
  };

  return (
    <SafeAreaView style={{ flex: 1, paddingBottom: 20, backgroundColor: COLORS.light_secondary }}>
      {/* Floating button */}
      {showBackToTop && (
        <TouchableOpacity style={[homeStyles.floatingButton, { backgroundColor: COLORS.warning }]} onPress={scrollToTop}>
          <Icon name='chevron-double-up' size={IMAGE_SIZE.s09} style={{ color: 'black' }} />
        </TouchableOpacity>
      )}

      {/* Search container */}
      <View style={homeStyles.searchContainer}>
        <View style={homeStyles.searchInput}>
          <TextInput placeholder={t('search')} placeholderTextColor={COLORS.black} onChangeText={handleSearch} style={[homeStyles.searchInputText, { color: COLORS.black, borderColor: COLORS.dark_secondary }]} />
          <TouchableOpacity style={[homeStyles.searchInputSubmit, { borderColor: COLORS.dark_secondary }]} onPress={() => fetchData(inputValue)}>
            <FontAwesome6 name='magnifying-glass' size={IMAGE_SIZE.s04} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={datas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => { return (<WorkItemComponent item={item} />); }}
        onScroll={handleScroll}
        ListEmptyComponent={<EmptyListComponent iconName='magnify' title={t('search_filter')} description={t('search_filter_description')} />}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      />

      <TouchableOpacity onPress={() => setShowModal(true)} style={[homeStyles.floatingButton, { bottom: 30, backgroundColor: COLORS.success }]}>
        <FontAwesome6 name="filter" size={20} color='white' />
      </TouchableOpacity>

      <Portal>
        <Modal visible={showModal} onRequestClose={() => setShowModal(false)}>
          <ScrollView style={{ backgroundColor: COLORS.white, paddingVertical: PADDING.p02, paddingHorizontal: PADDING.p07 }}>
            {/* Type selection */}
            <Text style={[homeStyles.headingText, { color: COLORS.black }]}>{t('search_filter_type')}</Text>
            <RadioButton.Group onValueChange={handleTypeChange} value={selectedType}>
              {types.map((type) => (
                <View key={type.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <RadioButton value={type.id.toString()} />
                  <Text style={{ color: COLORS.black }}>{type.type_name}</Text>
                </View>
              ))}
            </RadioButton.Group>

            {/* Categories selection */}
            <Text style={[homeStyles.headingText, { color: COLORS.black, marginTop: PADDING.p01 }]}>{t('search_filter_categories')}</Text>
            {categories.map((category) => (
              <View key={category.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Checkbox
                  status={selectedCategories.includes(category.id) ? 'checked' : 'unchecked'}
                  onPress={() => handleCategoryToggle(category.id)}
                />
                <Text style={{ color: COLORS.black }}>{category.category_name}</Text>
              </View>
            ))}

            {/* Bouton pour appliquer les filtres */}
            <Button mode="contained" onPress={applyFilters} style={{ marginTop: PADDING.p01, marginBottom: PADDING.p10 }}>{t('search_filter_apply')}</Button>
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

export default SearchScreen;