/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, FlatList, ToastAndroid } from 'react-native';
import { pick, types as docTypes, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Button, Checkbox, RadioButton } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import { TextInputMask } from 'react-native-masked-text';
import Spinner from 'react-native-loading-spinner-overlay';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { API, PADDING } from '../tools/constants';
import LogoText from '../assets/img/brand.svg';
import useColors from '../hooks/useColors';
import homeStyles from './style';

const AddWorkScreen = () => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Get contexts ===============
  const { userInfo, changeRole } = useContext(AuthContext);
  // =============== Get parameters ===============
  const route = useRoute();
  const { owner, ownerId } = route.params;
  // =============== Get data ===============
  const [workTitle, setWorkTitle] = useState('');
  const [workContent, setWorkContent] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [workUrl, setWorkUrl] = useState('');
  const [mediaLengthStr, setMediaLengthStr] = useState('00:00:00');
  const [author, setAuthor] = useState('');
  const [editor, setEditor] = useState('');
  const [isPublic, setIsPublic] = useState(1);
  const [consultationPrice, setConsultationPrice] = useState(undefined);
  const [files, setFiles] = useState([]);
  const [currency, setCurrency] = useState(undefined);
  const [selectedType, setSelectedType] = useState(undefined);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [defaultCategories, setDefaultCategories] = useState([]);
  const [mapCategories, setMapCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch Types (Radio Buttons)
    axios.get(`${API.boongo_url}/type/find_by_group/Type d'œuvre`)
      .then((response) => {
        const typeList = response.data.data.map(item => ({
          value: item.id,
          label: item.type_name,
        }));

        setTypes(typeList);
      })
      .catch((error) => {
        console.log(error);
      });

    // Fetch Currencies (Dropdown)
    axios.get(`${API.boongo_url}/currency`)
      .then((response) => {
        const currencyList = response.data.data.map(item => ({
          value: item.id,
          label: `${item.currency_name} (${item.currency_acronym})`,
        }));

        setCurrencies(currencyList);
      })
      .catch((error) => {
        console.log(error);
      });

    // Fetch Categories (Checkboxes)
    axios.get(`${API.boongo_url}/category/find_by_group/Catégorie pour œuvre`)
      .then((response) => {
        const categoryList = response.data.data.map(item => ({
          value: item.id,
          label: item.category_name,
        }));

        setDefaultCategories(categoryList);
        setCategories(categoryList); // Initial value
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  // =============== Dynamically manage categories when a type is selected ===============
  const handleTypeChange = async (value) => {
    setSelectedType(value);

    if (value === 32) {
      if (mapCategories.length === 0) {
        // If it has not yet been loaded, we display the spinner and load
        setCategoriesLoading(true);

        try {
          const response = await axios.get(`${API.boongo_url}/category/find_by_group/Catégorie pour carte`);
          const mapCategoryList = response.data.data.map(item => ({
            value: item.id,
            label: item.category_name,
          }));

          setMapCategories(mapCategoryList);
          setCategories(mapCategoryList);
        } catch (error) {
          console.log(error);
        } finally {
          setCategoriesLoading(false);
        }

      } else {
        // Otherwise we already have it, we use it directly
        setCategories(mapCategories);
      }

    } else {
      // If we choose another type, we return to the default categories
      setCategories(defaultCategories);
    }
  };

  // =============== Truncate long file name ===============
  const truncateFileName = (name, maxLength = 30) => {
    if (name.length <= maxLength) return name;
    const start = name.slice(0, 15);
    const end = name.slice(-12);
    return `${start} ... ${end}`;
  };

  // =============== Get icon according to file type ===============
  const getIconName = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png'].includes(ext)) return 'file-image-outline';
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return 'television-play';
    if (['pdf'].includes(ext)) return 'file-document-outline';
    if (['mp3', 'wav'].includes(ext)) return 'microphone-outline';
    return 'file-outline';
  };

  // Accepted extension
  const acceptedExtensions = ['jpg', 'jpeg', 'png', 'mp4', 'avi', 'mov', 'mkv', 'webm', 'pdf', 'mp3', 'wav'];

  // =============== Filter valid extension ===============
  const filterValidFiles = (files) => {
    return files.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return acceptedExtensions.includes(ext);
    });
  };

  // Protect pick execution against several clics on button
  const [isPicking, setIsPicking] = useState(false);
  const MAX_FILES = 20;

  // =============== Handle File Selection ===============
  const pickFiles = async () => {
    if (isPicking) return;
    setIsPicking(true);

    try {
      const selectedFiles = await pick({
        mode: 'import',
        allowMultiSelection: true,
        types: [docTypes.images, docTypes.audio, docTypes.video, docTypes.pdf],
      });
      const validFiles = filterValidFiles(selectedFiles);
      const totalFiles = files.length + validFiles.length;

      if (totalFiles > MAX_FILES) {
        const allowedToAdd = MAX_FILES - files.length;
        const limitedFiles = validFiles.slice(0, allowedToAdd);

        setFiles(prev => [...prev, ...limitedFiles]);
        ToastAndroid.show(t('work.max_files', { count: MAX_FILES }), ToastAndroid.LONG);
        console.warn(`Limite de ${MAX_FILES} fichiers atteinte. Certains fichiers ont été ignorés.`);

      } else {
        setFiles(prev => [...prev, ...validFiles]);
      }
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.userCancelled) {
        console.log('L’utilisateur a annulé la sélection.');

      } else {
        console.error('Erreur lors de la sélection de fichiers:', err);
      }
    } finally {
      setIsPicking(false); // reset, even in the case of error
    }
  };

  // =============== Convert time to second ===============
  const convertTimeToSeconds = (hhmmss) => {
    const [hh = '0', mm = '0', ss = '0'] = hhmmss.split(':');

    return parseInt(hh, 10) * 3600 + parseInt(mm, 10) * 60 + parseInt(ss, 10);
  };

  // =============== Handle Form Submit ===============
  const handleSubmit = async () => {
    setIsLoading(true);

    const mediaLengthInSeconds = convertTimeToSeconds(mediaLengthStr);
    const formData = new FormData();

    formData.append('work_title', workTitle || '');
    formData.append('work_content', workContent || '');
    formData.append('work_url', workUrl || '');
    formData.append('media_length', mediaLengthInSeconds);
    formData.append('author', author || '');
    formData.append('editor', editor || '');
    formData.append('consultation_price', consultationPrice ?? '');
    formData.append('is_public', isPublic);
    formData.append('currency_id', currency ?? '');
    formData.append('type_id', selectedType ?? '');
    formData.append('status_id', 18);
    formData.append(`${owner}_id`, ownerId);

    // Add selected categories
    selectedCategories.forEach((catId) => {
      formData.append('categories_ids[]', catId);
    });

    // Sending files
    files.forEach(file => {
      formData.append('files_urls[]', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      });
    });

    try {
      const response = await fetch(`${API.boongo_url}/work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-localization': 'fr',
          'Authorization': `Bearer ${userInfo.api_token}`
        },
        body: formData,
      });

      const text = await response.text();
      const json = JSON.stringify(text);

      console.log(json);

      if (!userInfo.is_publisher) {
        changeRole('add', userInfo.id, 4);
      }

      // Reset all after success
      setWorkTitle('');
      setWorkContent('');
      setWorkUrl('');
      setMediaLengthStr('00:00:00');
      setAuthor('');
      setEditor('');
      setIsPublic(1);
      setConsultationPrice(undefined);
      setCurrency(undefined);
      setSelectedType(undefined);
      setSelectedCategories([]);
      setFiles([]);

      // Optional : Return to the default categories
      setCategories(defaultCategories);

      navigation.navigate('Account');

    } catch (error) {
      console.error('Error:', error);
    }

    setIsLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <Spinner visible={isLoading} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: PADDING.p10, paddingHorizontal: PADDING.p10 }}>
        {/* Brand / Title */}
        <View style={homeStyles.authlogo}>
          <LogoText width={200} height={48} />
        </View>
        <Text style={[homeStyles.authTitle, { color: COLORS.black, textAlign: 'center', marginBottom: PADDING.p02 }]}>{t('work.publish_new')}</Text>
        <Text style={{ color: COLORS.black, textAlign: 'center', fontWeight: '300', marginBottom: PADDING.p12, paddingHorizontal: PADDING.p05 }}>{t('work.publishing_info')}</Text>

        {/* Work Title
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('work.work_title')}</Text> */}
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={workTitle || ''}
          placeholder={t('work.work_title')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={setWorkTitle} />

        {/* Work Content
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('work.work_content')}</Text> */}
        <TextInput
          multiline
          onContentSizeChange={(e) =>
            setInputHeight(e.nativeEvent.contentSize.height)
          }
          style={[homeStyles.authInput, { height: Math.max(40, inputHeight), color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={workContent || ''}
          placeholder={t('work.work_content')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={setWorkContent} />

        {/* Work URL
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('work.work_url')}</Text> */}
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={workUrl || ''}
          placeholder={t('work.work_url')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={setWorkUrl} />

        {/* Media Length */}
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('work.media_length')}</Text>
        {/* <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={mediaLength}
          placeholder={t('work.media_length')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={setMediaLength} /> */}
        <TextInputMask
          type={'custom'}
          options={{
            mask: '99:99:99', // HH:MM:SS
          }}
          value={mediaLengthStr || ''}
          onChangeText={setMediaLengthStr}
          placeholder="00:00:00"
          keyboardType="numeric"
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]} />

        {/* Author
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('work.author')}</Text> */}
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={author || ''}
          placeholder={t('work.author')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={setAuthor} />

        {/* Editor
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('work.editor')}</Text> */}
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={editor || ''}
          placeholder={t('work.editor')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={setEditor} />

        {/* Is public */}
        <Text style={[homeStyles.authText, { textAlign: 'center', color: COLORS.dark_secondary }]}>{t('work.is_public.title')}</Text>
        <RadioButton.Group onValueChange={(value) => setIsPublic(Number(value))} value={isPublic}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
              <RadioButton value={0} />
              <Text style={{ color: COLORS.black }}>{t('yes')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <RadioButton value={1} />
              <Text style={{ color: COLORS.black }}>{t('no')}</Text>
            </View>
          </View>
        </RadioButton.Group>
        {/* Consultation info */}
        {isPublic === 0 && (
          <>
            {/* Price */}
            <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('work.is_public.consult_price')}</Text>
            <TextInput
              keyboardType='numeric'
              style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
              value={consultationPrice || ''}
              placeholder={t('work.is_public.consult_price')}
              placeholderTextColor={COLORS.dark_secondary}
              onChangeText={setConsultationPrice} />

            {/* Currency Dropdown */}
            <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('work.currency.title')}</Text>
            <Dropdown
              style={[homeStyles.authInput, { color: COLORS.black, height: 50, borderColor: COLORS.light_secondary }]}
              borderColor={COLORS.dark_secondary}
              textStyle={{ color: COLORS.black }}
              containerStyle={{ backgroundColor: COLORS.white }}
              activeColor={COLORS.white}
              selectedTextStyle={{ color: COLORS.black }}
              placeholderStyle={{ color: COLORS.dark_secondary }}
              data={currencies}
              labelField="label"
              valueField="value"
              placeholder={t('work.currency.label')}
              value={currency}
              onChange={(item) => setCurrency(item.value)} />
          </>
        )}

        {/* Type Radio Buttons */}
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('work.type')}</Text>
        <RadioButton.Group onValueChange={handleTypeChange} value={selectedType}>
          {types.map((type) => (
            <View key={type.value} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <RadioButton value={type.value} />
              <Text style={{ color: COLORS.black }}>{type.label}</Text>
            </View>
          ))}
        </RadioButton.Group>

        {/* Categories Checkboxes */}
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary, marginTop: PADDING.p01 }]}>{t('work.categories')}</Text>
        {categoriesLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 10 }} />
        ) : (
          <FlatList
            data={categories}
            scrollEnabled={false}
            nestedScrollEnabled
            keyExtractor={(item) => item.value.toString()}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Checkbox
                  status={selectedCategories.includes(item.value) ? 'checked' : 'unchecked'}
                  onPress={() => {
                    if (selectedCategories.includes(item.value)) {
                      setSelectedCategories(selectedCategories.filter(id => id !== item.value));
                    } else {
                      setSelectedCategories([...selectedCategories, item.value]);
                    }
                  }}
                />
                <Text style={{ color: COLORS.black }}>{item.label}</Text>
              </View>
            )}
          />
        )}

        {/* Select Files */}
        <TouchableOpacity
          style={[homeStyles.authCancel, {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            alignSelf: 'center',
            width: 230,
            borderColor: COLORS.dark_secondary,
            marginVertical: PADDING.p03,
            paddingVertical: PADDING.p00
          }]} onPress={pickFiles} disabled={isPicking}>
          <Icon name='paperclip' color={COLORS.dark_secondary} size={30} />
          <Text style={[homeStyles.authText, { color: COLORS.dark_secondary, marginLeft: PADDING.p01 }]}>{t('work.add_files')}</Text>
        </TouchableOpacity>

        {/* List of selected files */}
        {files.length > 0 && (
          <>
            <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('work.selected_files')}</Text>
            <FlatList
              data={files}
              scrollEnabled={false}
              nestedScrollEnabled
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.light_secondary, borderRadius: PADDING.p01, padding: PADDING.p01, marginVertical: PADDING.p00, }}>
                  <Icon name={getIconName(item.name)} size={22} color={COLORS.black} style={{ marginRight: 8 }} />
                  <Text style={{ flex: 1, color: COLORS.black }}>{truncateFileName(item.name)}</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: COLORS.danger, padding: 6, borderRadius: PADDING.p07, marginLeft: 8, }}
                    onPress={() => {
                      const updatedFiles = [...files];
                      updatedFiles.splice(index, 1);
                      setFiles(updatedFiles);
                    }}
                  >
                    <Icon name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            />
          </>
        )}

        {/* Submit */}
        <Button style={[homeStyles.authButton, { backgroundColor: COLORS.success }]} onPress={handleSubmit}>
          <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('publish')}</Text>
        </Button>
      </ScrollView>
    </View>
  );
};

export default AddWorkScreen;