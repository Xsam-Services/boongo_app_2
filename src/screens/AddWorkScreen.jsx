import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pick, types as docTypes, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import * as ImagePicker from 'expo-image-picker';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { AuthContext } from '../contexts/AuthContext';
import { API } from '../tools/constants';
import useColors from '../hooks/useColors';
import HeaderComponent from './header';

const MAX_FILES = 20;
const acceptedExtensions = ['jpg', 'jpeg', 'png', 'mp4', 'avi', 'mov', 'mkv', 'webm', 'pdf', 'mp3', 'wav'];
const fileIcon = name => {
  const extension = name?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png'].includes(extension)) return 'image-outline';
  if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(extension)) return 'video-outline';
  if (extension === 'pdf') return 'file-pdf-box';
  if (['mp3', 'wav'].includes(extension)) return 'music-note';
  return 'file-outline';
};

const AddWorkScreen = ({ navigation }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { userInfo, changeRole } = useContext(AuthContext);
  const { owner = 'user', ownerId = userInfo?.id } = useRoute().params || {};
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [editor, setEditor] = useState('');
  const [url, setUrl] = useState('');
  const [isPaidConsultation, setIsPaidConsultation] = useState(false);
  const [price, setPrice] = useState('');
  const [currencyId, setCurrencyId] = useState(null);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [typeId, setTypeId] = useState(null);
  const [categoryIds, setCategoryIds] = useState([]);
  const [coverImage, setCoverImage] = useState(null);
  const [files, setFiles] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [picking, setPicking] = useState(false);
  const [fileSourcePickerVisible, setFileSourcePickerVisible] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [typesResponse, currenciesResponse, categoriesResponse] = await Promise.all([
          axios.get(`${API.boongo_url}/type/find_by_group/${encodeURIComponent("Type d'œuvre")}`, { headers: { 'X-localization': 'fr' } }),
          axios.get(`${API.boongo_url}/currency`, { headers: { 'X-localization': 'fr' } }),
          axios.get(`${API.boongo_url}/category/find_by_group/${encodeURIComponent('Catégorie pour œuvre')}`, { headers: { 'X-localization': 'fr' } }),
        ]);
        setTypes(typesResponse.data?.data || []);
        setCurrencies(currenciesResponse.data?.data || []);
        setCategories(categoriesResponse.data?.data || []);
      } catch (metadataError) {

        setError('Impossible de préparer le formulaire. Réessayez plus tard.');
      } finally { setLoadingMetadata(false); }
    };
    loadMetadata();
  }, []);

  const toggleCategory = id => setCategoryIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const chooseCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("L'accès aux photos est requis pour choisir une image de couverture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true, mediaTypes: ['images'], quality: 0.85 });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.base64) {
      setCoverImage({
        name: asset.fileName || `couverture.${asset.mimeType?.split('/')[1] || 'jpg'}`,
        uri: asset.uri,
        value: `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`,
      });
      setError('');
    }
  };
  const appendFiles = selected => {
    const remainingSlots = MAX_FILES - files.length;
    setFiles(current => [...current, ...selected.slice(0, remainingSlots)]);
  };
  const closeFileSourcePicker = action => {
    setFileSourcePickerVisible(false);
    setTimeout(action, 320);
  };
  const chooseFiles = async () => {
    if (picking || files.length >= MAX_FILES) return;
    setPicking(true);
    try {
      const selected = await pick({ mode: 'import', allowMultiSelection: true, types: [docTypes.audio, docTypes.pdf] });
      const valid = selected.filter(file => acceptedExtensions.includes(file.name?.split('.').pop()?.toLowerCase())).slice(0, MAX_FILES - files.length);
      appendFiles(valid);
    } catch (pickerError) {
      if (!(isErrorWithCode(pickerError) && pickerError.code === errorCodes.userCancelled)) setError('Impossible de sélectionner ces fichiers.');
    } finally { setPicking(false); }
  };
  const chooseLibraryMedia = async mediaType => {
    if (picking || files.length >= MAX_FILES) return;
    setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("L'accès à la photothèque est requis pour ajouter ce média.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, mediaTypes: [mediaType], quality: 0.85 });
      if (!result.canceled) {
        const selected = result.assets.map((asset, index) => ({
          name: asset.fileName || `${mediaType === 'images' ? 'image' : 'video'}-${index + 1}.${asset.mimeType?.split('/')[1] || (mediaType === 'images' ? 'jpg' : 'mp4')}`,
          type: asset.mimeType || (mediaType === 'images' ? 'image/jpeg' : 'video/mp4'),
          uri: asset.uri,
        }));
        appendFiles(selected);
      }
    } catch (pickerError) {
      setError('Impossible de sélectionner ce média.');
    } finally { setPicking(false); }
  };
  const submit = async () => {
    if (!title.trim() || !description.trim() || !typeId || !categoryIds.length) { setError('Ajoutez un titre, une description, un type et au moins une catégorie.'); return; }
    if (isPaidConsultation && (!price || !currencyId)) { setError('Indiquez le prix et la devise de consultation.'); return; }
    setSubmitting(true); setError('');
    const data = new FormData();
    data.append('work_title', title.trim()); data.append('work_content', description.trim()); data.append('work_url', url.trim());
    data.append('author', author.trim()); data.append('editor', editor.trim()); data.append('is_public', isPaidConsultation ? '0' : '1');
    data.append('consultation_price', isPaidConsultation ? price : ''); data.append('currency_id', isPaidConsultation ? String(currencyId) : '');
    data.append('type_id', String(typeId)); data.append('status_id', '18'); data.append(`${owner}_id`, String(ownerId));
    if (coverImage) {
      data.append('image_64', coverImage.value);
      data.append('image_name', coverImage.name);
    }
    categoryIds.forEach(id => data.append('categories_ids[]', String(id)));
    files.forEach(file => data.append('files_urls[]', { uri: file.uri, type: file.type || 'application/octet-stream', name: file.name || 'fichier' }));
    try {
      const response = await axios.post(`${API.boongo_url}/work`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-localization': 'fr',
          Authorization: `Bearer ${userInfo.api_token}`,
        },
      });
      if (response.data?.success === false) throw new Error(response.data.message || 'La publication a échoué.');
      if (!userInfo.is_publisher) await changeRole('add', userInfo.id, 4);
      navigation.goBack();
    } catch (submitError) {  setError(submitError.message || 'Impossible de publier cette œuvre.'); }
    finally { setSubmitting(false); }
  };
  const chip = (item, selected, onPress, label) => {
    const chipTextColor = selected ? '#fff' : COLORS.black;
    return <TouchableOpacity key={item.id} onPress={onPress} style={[styles.chip, { backgroundColor: selected ? COLORS.primary : COLORS.white, borderColor: selected ? COLORS.primary : COLORS.light_secondary }]}><Text style={[styles.chipText, { color: chipTextColor }]}>{label}</Text></TouchableOpacity>;
  };
  if (loadingMetadata) return <SafeAreaView style={[styles.screen, styles.center, { backgroundColor: COLORS.light }]} edges={['top']}><HeaderComponent title={t('work.publish_new')} /><ActivityIndicator size="large" color={COLORS.primary} /></SafeAreaView>;
  return <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.light }]} edges={['top']}><HeaderComponent title={t('work.publish_new')} /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={[styles.intro, { color: COLORS.dark }]}>{t('work.publishing_info')}</Text>
    {error ? <View style={[styles.error, { backgroundColor: COLORS.danger_transparent }]}><Icon name="alert-circle-outline" color={COLORS.danger} size={20} /><Text style={[styles.errorText, { color: COLORS.black }]}>{error}</Text></View> : null}
    <View style={[styles.card, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
      <TextInput value={title} onChangeText={setTitle} placeholder={t('work.work_title')} placeholderTextColor={COLORS.dark} style={[styles.input, { color: COLORS.black, borderColor: COLORS.light_secondary }]} />
      <TextInput value={description} onChangeText={setDescription} multiline textAlignVertical="top" placeholder={t('work.work_content')} placeholderTextColor={COLORS.dark} style={[styles.input, styles.textarea, { color: COLORS.black, borderColor: COLORS.light_secondary }]} />
      <TextInput value={author} onChangeText={setAuthor} placeholder={t('work.author')} placeholderTextColor={COLORS.dark} style={[styles.input, { color: COLORS.black, borderColor: COLORS.light_secondary }]} />
      <TextInput value={editor} onChangeText={setEditor} placeholder={t('work.editor')} placeholderTextColor={COLORS.dark} style={[styles.input, { color: COLORS.black, borderColor: COLORS.light_secondary }]} />
      <TextInput value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" placeholder={t('work.work_url')} placeholderTextColor={COLORS.dark} style={[styles.input, { color: COLORS.black, borderColor: COLORS.light_secondary }]} />
    </View>
    <Text style={[styles.sectionTitle, { color: COLORS.black }]}>{t('work.type')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{types.map(item => chip(item, typeId === item.id, () => setTypeId(item.id), item.type_name))}</ScrollView>
    <Text style={[styles.sectionTitle, { color: COLORS.black }]}>{t('work.categories')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{categories.map(item => chip(item, categoryIds.includes(item.id), () => toggleCategory(item.id), item.category_name))}</ScrollView>
    <Text style={[styles.sectionTitle, { color: COLORS.black }]}>Consultation payante</Text><View style={styles.visibility}>{[true, false].map(value => <TouchableOpacity key={String(value)} onPress={() => setIsPaidConsultation(value)} style={[styles.visibilityOption, { backgroundColor: isPaidConsultation === value ? COLORS.light_primary : COLORS.white, borderColor: isPaidConsultation === value ? COLORS.primary : COLORS.light_secondary }]}><Icon name={value ? 'cash-check' : 'lock-open-outline'} size={18} color={isPaidConsultation === value ? COLORS.primary : COLORS.dark} /><Text style={[styles.visibilityText, { color: COLORS.black }]}>{value ? t('yes') : t('no')}</Text></TouchableOpacity>)}</View>
    {isPaidConsultation ? <View style={[styles.card, styles.priceCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}><Text style={[styles.priceLabel, { color: COLORS.black }]}>{t('work.is_public.consult_price')}</Text><TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder={t('work.is_public.consult_price')} placeholderTextColor={COLORS.dark} style={[styles.input, { color: COLORS.black, borderColor: COLORS.light_secondary }]} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{currencies.map(item => chip(item, currencyId === item.id, () => setCurrencyId(item.id), item.currency_acronym || item.currency_name))}</ScrollView></View> : null}
    <Text style={[styles.sectionTitle, { color: COLORS.black }]}>Image de couverture</Text>
    <TouchableOpacity onPress={chooseCover} style={[styles.coverPicker, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
      {coverImage ? <Image source={{ uri: coverImage.uri }} style={styles.coverPreview} resizeMode="contain" /> : <View style={[styles.coverPlaceholder, { backgroundColor: COLORS.light_primary }]}><Icon name="image-plus" size={32} color={COLORS.primary} /></View>}
      <View style={styles.coverCopy}><Text style={[styles.coverTitle, { color: COLORS.black }]}>{coverImage ? 'Modifier la couverture' : 'Choisir une couverture'}</Text><Text style={[styles.coverHint, { color: COLORS.dark }]}>{coverImage ? coverImage.name : 'Image affichée en tête de l’œuvre ou de l’article.'}</Text></View>
      <Icon name={coverImage ? 'pencil-outline' : 'chevron-right'} size={22} color={coverImage ? COLORS.primary : COLORS.dark} />
    </TouchableOpacity>
    <TouchableOpacity disabled={picking} onPress={() => setFileSourcePickerVisible(true)} style={[styles.filesButton, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}><View style={[styles.filesIcon, { backgroundColor: COLORS.light_primary }]}><Icon name="paperclip" size={25} color={COLORS.primary} /></View><View style={styles.filesCopy}><Text style={[styles.filesTitle, { color: COLORS.black }]}>{picking ? t('loading') : t('work.add_files')}</Text><Text style={[styles.filesHint, { color: COLORS.dark }]}>{files.length}/{MAX_FILES} · Images, vidéos, audios et documents</Text></View><Icon name="chevron-right" size={22} color={COLORS.dark} /></TouchableOpacity>
    {files.map((file, index) => <View key={`${file.uri}-${index}`} style={[styles.file, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}><Icon name={fileIcon(file.name)} size={22} color={COLORS.primary} /><Text numberOfLines={1} style={[styles.fileName, { color: COLORS.black }]}>{file.name}</Text><TouchableOpacity onPress={() => setFiles(current => current.filter((_, fileIndex) => fileIndex !== index))}><Icon name="close" size={20} color={COLORS.danger} /></TouchableOpacity></View>)}
    {error ? <View style={[styles.error, styles.submitError, { backgroundColor: COLORS.danger_transparent }]}><Icon name="alert-circle-outline" color={COLORS.danger} size={20} /><Text style={[styles.errorText, { color: COLORS.black }]}>{error}</Text></View> : null}
    <TouchableOpacity disabled={submitting} onPress={submit} style={[styles.submit, { backgroundColor: COLORS.primary }, submitting ? styles.submitDisabled : null]}>{submitting ? <ActivityIndicator color="#fff" /> : <><Text style={styles.submitText}>{t('publish')}</Text><Icon name="arrow-right" size={20} color="#fff" /></>}</TouchableOpacity>
  </ScrollView>
  <Modal visible={fileSourcePickerVisible} transparent animationType="slide" onRequestClose={() => setFileSourcePickerVisible(false)}>
    <View style={styles.sourcePickerBackdrop}>
      <View style={[styles.sourcePicker, { backgroundColor: COLORS.white }]}>
        <View style={[styles.sheetHandle, { backgroundColor: COLORS.light_secondary }]} />
        <Text style={[styles.sourcePickerTitle, { color: COLORS.black }]}>Ajouter des fichiers</Text>
        <Text style={[styles.sourcePickerHint, { color: COLORS.dark }]}>Choisissez le type de contenu à associer.</Text>
        <TouchableOpacity style={[styles.sourceOption, { borderColor: COLORS.light_secondary }]} onPress={() => closeFileSourcePicker(() => chooseLibraryMedia('images'))}><View style={[styles.sourceIcon, { backgroundColor: COLORS.light_primary }]}><Icon name="image-outline" size={23} color={COLORS.primary} /></View><View style={styles.sourceCopy}><Text style={[styles.sourceTitle, { color: COLORS.black }]}>Images</Text><Text style={[styles.sourceHint, { color: COLORS.dark }]}>Choisir dans Photos</Text></View><Icon name="chevron-right" size={22} color={COLORS.dark} /></TouchableOpacity>
        <TouchableOpacity style={[styles.sourceOption, { borderColor: COLORS.light_secondary }]} onPress={() => closeFileSourcePicker(() => chooseLibraryMedia('videos'))}><View style={[styles.sourceIcon, { backgroundColor: COLORS.light_primary }]}><Icon name="video-outline" size={23} color={COLORS.primary} /></View><View style={styles.sourceCopy}><Text style={[styles.sourceTitle, { color: COLORS.black }]}>Vidéos</Text><Text style={[styles.sourceHint, { color: COLORS.dark }]}>Choisir dans Photos</Text></View><Icon name="chevron-right" size={22} color={COLORS.dark} /></TouchableOpacity>
        <TouchableOpacity style={[styles.sourceOption, { borderColor: COLORS.light_secondary }]} onPress={() => closeFileSourcePicker(chooseFiles)}><View style={[styles.sourceIcon, { backgroundColor: COLORS.light_primary }]}><Icon name="file-music-outline" size={23} color={COLORS.primary} /></View><View style={styles.sourceCopy}><Text style={[styles.sourceTitle, { color: COLORS.black }]}>Audios et documents</Text><Text style={[styles.sourceHint, { color: COLORS.dark }]}>Choisir dans Fichiers</Text></View><Icon name="chevron-right" size={22} color={COLORS.dark} /></TouchableOpacity>
        <TouchableOpacity style={[styles.cancelSource, { backgroundColor: COLORS.light_primary }]} onPress={() => setFileSourcePickerVisible(false)}><Text style={[styles.cancelSourceText, { color: COLORS.primary }]}>Annuler</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
  </SafeAreaView>;
};
const styles = StyleSheet.create({ screen:{flex:1},center:{alignItems:'center'},content:{padding:16,paddingBottom:38},intro:{fontSize:15,lineHeight:22,marginBottom:16},error:{alignItems:'center',borderRadius:14,flexDirection:'row',marginBottom:14,padding:12},submitError:{marginTop:18},errorText:{flex:1,fontSize:13,lineHeight:19,marginLeft:8},card:{borderRadius:20,borderWidth:1,padding:14},priceCard:{marginTop:14},priceLabel:{fontSize:14,fontWeight:'800',marginBottom:4},input:{borderBottomWidth:1,fontSize:15,minHeight:48,paddingVertical:10},textarea:{minHeight:118},sectionTitle:{fontSize:16,fontWeight:'800',marginBottom:10,marginTop:22},chips:{gap:8,paddingRight:16},chip:{borderRadius:17,borderWidth:1,paddingHorizontal:14,paddingVertical:9},chipText:{fontSize:13,fontWeight:'700'},visibility:{flexDirection:'row',gap:10},visibilityOption:{alignItems:'center',borderRadius:16,borderWidth:1,flex:1,flexDirection:'row',justifyContent:'center',minHeight:48},visibilityText:{fontSize:14,fontWeight:'700',marginLeft:7},coverPicker:{alignItems:'center',borderRadius:18,borderWidth:1,flexDirection:'row',minHeight:86,overflow:'hidden',padding:10},coverPreview:{backgroundColor:'#ffffff',borderRadius:12,height:64,width:64},coverPlaceholder:{alignItems:'center',borderRadius:12,height:64,justifyContent:'center',width:64},coverCopy:{flex:1,marginHorizontal:12},coverTitle:{fontSize:15,fontWeight:'800'},coverHint:{fontSize:12,lineHeight:17,marginTop:3},filesButton:{alignItems:'center',borderRadius:18,borderWidth:1,flexDirection:'row',marginTop:16,minHeight:86,padding:10},filesIcon:{alignItems:'center',borderRadius:14,height:64,justifyContent:'center',width:64},filesCopy:{flex:1,marginHorizontal:12},filesTitle:{fontSize:15,fontWeight:'800'},filesHint:{fontSize:12,lineHeight:17,marginTop:3},file:{alignItems:'center',borderRadius:14,borderWidth:1,flexDirection:'row',marginTop:9,padding:11},fileName:{flex:1,fontSize:13,marginHorizontal:10},submit:{alignItems:'center',borderRadius:18,flexDirection:'row',justifyContent:'center',marginTop:24,minHeight:54},submitDisabled:{opacity:.7},submitText:{color:'#fff',fontSize:16,fontWeight:'800',marginRight:8},sourcePickerBackdrop:{backgroundColor:'rgba(0,0,0,.56)',flex:1,justifyContent:'flex-end'},sourcePicker:{borderTopLeftRadius:28,borderTopRightRadius:28,padding:20,paddingBottom:32},sheetHandle:{alignSelf:'center',borderRadius:3,height:5,marginBottom:18,width:44},sourcePickerTitle:{fontSize:22,fontWeight:'800'},sourcePickerHint:{fontSize:14,lineHeight:20,marginTop:5},sourceOption:{alignItems:'center',borderRadius:16,borderWidth:1,flexDirection:'row',marginTop:14,minHeight:72,padding:11},sourceIcon:{alignItems:'center',borderRadius:14,height:46,justifyContent:'center',width:46},sourceCopy:{flex:1,marginLeft:12},sourceTitle:{fontSize:15,fontWeight:'800'},sourceHint:{fontSize:12,marginTop:3},cancelSource:{alignItems:'center',borderRadius:16,marginTop:16,minHeight:50,justifyContent:'center'},cancelSourceText:{fontSize:15,fontWeight:'800'} });
export default AddWorkScreen;
