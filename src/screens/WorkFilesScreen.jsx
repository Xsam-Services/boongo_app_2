import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pick, types as docTypes, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import * as ImagePicker from 'expo-image-picker';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import { AuthContext } from '../contexts/AuthContext';
import { API } from '../tools/constants';
import useColors from '../hooks/useColors';
import HeaderComponent from './header';
import {
  ACCEPTED_EXTENSIONS,
  DEFAULT_FILE_TYPE_IDS,
  deleteWorkFile,
  fetchWork,
  getFileKind,
  listWorkFiles,
  mapFileTypeIds,
  uploadFileWithMeta,
} from '../utils/workFiles';

const KIND_ICONS = { audio: 'music-note', document: 'file-pdf-box', image: 'image-outline', video: 'video-outline' };
const TOTAL_STEPS = 3;

const WorkFilesScreen = ({ navigation, route }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { userInfo } = useContext(AuthContext);
  const { workId } = route.params;
  const token = userInfo?.api_token;
  const [work, setWork] = useState(null);
  const [remoteFiles, setRemoteFiles] = useState([]);
  const [items, setItems] = useState([]);
  const [typeIds, setTypeIds] = useState(DEFAULT_FILE_TYPE_IDS);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [sending, setSending] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [error, setError] = useState('');
  const remoteCountRef = useRef(0);

  const refresh = useCallback(async () => {
    const data = await fetchWork(workId, token);
    const files = listWorkFiles(data);
    remoteCountRef.current = files.length;
    setWork(data);
    setRemoteFiles(files);
    return files;
  }, [token, workId]);

  useEffect(() => {
    const load = async () => {
      try {
        const [types] = await Promise.all([
          axios.get(`${API.boongo_url}/type/find_by_group/${encodeURIComponent('Type de fichier')}`, { headers: { 'X-localization': 'fr' } }).catch(() => null),
          refresh(),
        ]);
        if (types?.data?.data) setTypeIds(mapFileTypeIds(types.data.data));
      } catch (loadError) {
        setError(t('work_steps.load_failed'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refresh, t]);

  const updateItem = (key, patch) => setItems(current => current.map(item => item.key === key ? { ...item, ...patch } : item));
  const removeItem = key => setItems(current => current.filter(item => item.key !== key));

  const addPicked = picked => {
    const stamp = Date.now();
    setItems(current => [...current, ...picked.map((file, index) => ({
      key: `${stamp}-${index}`,
      kind: getFileKind(file),
      name: file.name || `fichier-${index + 1}`,
      progress: 0,
      status: 'pending',
      title: '',
      type: file.type,
      uri: file.uri,
    }))]);
  };

  const closeSheet = action => {
    setSheetVisible(false);
    setTimeout(action, 320);
  };

  const chooseLibraryMedia = async mediaType => {
    if (picking) return;
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, mediaTypes: [mediaType], quality: 0.85 });
      if (!result.canceled) {
        addPicked(result.assets.map((asset, index) => ({
          name: asset.fileName || `${mediaType === 'images' ? 'image' : 'video'}-${index + 1}.${asset.mimeType?.split('/')[1] || (mediaType === 'images' ? 'jpg' : 'mp4')}`,
          type: asset.mimeType || (mediaType === 'images' ? 'image/jpeg' : 'video/mp4'),
          uri: asset.uri,
        })));
      }
    } catch (pickerError) {
      setError('Impossible de sélectionner ce média.');
    } finally {
      setPicking(false);
    }
  };

  const chooseFiles = async () => {
    if (picking) return;
    setPicking(true);
    try {
      const selected = await pick({ mode: 'import', allowMultiSelection: true, types: [docTypes.audio, docTypes.pdf] });
      addPicked(selected.filter(file => ACCEPTED_EXTENSIONS.includes(String(file.name || '').split('.').pop().toLowerCase())));
    } catch (pickerError) {
      if (!(isErrorWithCode(pickerError) && pickerError.code === errorCodes.userCancelled)) setError('Impossible de sélectionner ces fichiers.');
    } finally {
      setPicking(false);
    }
  };

  const sendItem = async item => {
    const before = remoteCountRef.current;
    updateItem(item.key, { error: '', progress: 0, status: 'uploading' });
    try {
      const { metaSaved } = await uploadFileWithMeta({
        file: { name: item.name, type: item.type, uri: item.uri },
        onProgress: progress => updateItem(item.key, { progress }),
        title: item.title,
        token,
        typeIds,
        workId,
      });
      removeItem(item.key);
      await refresh();
      if (!metaSaved) setError(t('work_steps.meta_failed'));
    } catch (uploadError) {
      // The server may store the file and still answer with an error: check before offering a retry.
      let stored = false;
      try {
        stored = (await refresh()).length > before;
      } catch (refreshError) {
        stored = false;
      }
      if (stored) removeItem(item.key);
      else updateItem(item.key, { error: uploadError.response?.data?.message || uploadError.message || t('work_steps.send_failed'), status: 'error' });
    }
  };

  const sendAll = async () => {
    if (sending) return;
    setSending(true);
    setError('');
    try {
      for (const item of items.filter(entry => entry.status !== 'uploading')) {
        await sendItem(item);
      }
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = file => Alert.alert(t('work_steps.delete_title'), t('work_steps.delete_message'), [
    { style: 'cancel', text: t('work_steps.cancel') },
    {
      onPress: async () => {
        try {
          await deleteWorkFile(file.id, token);
          await refresh();
        } catch (deleteError) {
          setError(deleteError.response?.data?.message || t('work_steps.send_failed'));
        }
      },
      style: 'destructive',
      text: t('work_steps.delete'),
    },
  ]);

  const finish = () => {
    if (items.length) {
      Alert.alert(t('work_steps.pending_title'), t('work_steps.pending_message'), [
        { style: 'cancel', text: t('work_steps.cancel') },
        { onPress: () => navigation.popToTop(), text: t('work_steps.finish_anyway') },
      ]);
      return;
    }
    navigation.popToTop();
  };

  const remoteTitle = (file, index) => {
    const label = t(`file.${file.kind}`);
    const fileName = String(file.file_name || '').replace(/\.[a-z0-9]{2,5}$/i, '').trim();
    const sameAsWork = fileName.toLowerCase() === String(work?.work_title || '').trim().toLowerCase();
    return file.part_title || (fileName && !sameAsWork ? fileName : '') || `${label} ${index + 1}`;
  };

  const waiting = items.filter(item => item.status !== 'uploading').length;

  const renderItem = item => (
    <View key={item.key} style={[styles.card, { backgroundColor: COLORS.white, borderColor: item.status === 'error' ? COLORS.danger : COLORS.light_secondary }]}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: COLORS.light_primary }]}><Icon name={KIND_ICONS[item.kind]} size={22} color={COLORS.primary} /></View>
        <Text numberOfLines={1} style={[styles.name, { color: COLORS.black }]}>{item.name}</Text>
        {item.status !== 'uploading' ? (
          <TouchableOpacity accessibilityLabel={t('work_steps.remove')} onPress={() => removeItem(item.key)}><Icon name="close" size={20} color={COLORS.danger} /></TouchableOpacity>
        ) : <ActivityIndicator size="small" color={COLORS.primary} />}
      </View>
      <TextInput
        editable={item.status !== 'uploading'}
        onChangeText={title => updateItem(item.key, { title })}
        placeholder={t('work_steps.title_placeholder')}
        placeholderTextColor={COLORS.dark}
        style={[styles.input, { borderColor: COLORS.light_secondary, color: COLORS.black }]}
        value={item.title}
      />
      {item.status === 'uploading' ? (
        <View style={[styles.track, { backgroundColor: COLORS.light_secondary }]}><View style={[styles.bar, { backgroundColor: COLORS.primary, width: `${Math.round(item.progress * 100)}%` }]} /></View>
      ) : null}
      {item.status === 'error' ? (
        <View style={styles.errorRow}>
          <Text style={[styles.errorText, { color: COLORS.danger }]} numberOfLines={2}>{item.error}</Text>
          <TouchableOpacity onPress={() => sendItem(item)} style={[styles.retry, { borderColor: COLORS.primary }]}><Text style={[styles.retryText, { color: COLORS.primary }]}>{t('work_steps.retry')}</Text></TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const sourceOption = (icon, title, hint, onPress) => (
    <TouchableOpacity style={[styles.sourceOption, { borderColor: COLORS.light_secondary }]} onPress={() => closeSheet(onPress)}>
      <View style={[styles.icon, { backgroundColor: COLORS.light_primary }]}><Icon name={icon} size={23} color={COLORS.primary} /></View>
      <View style={styles.sourceCopy}>
        <Text style={[styles.sourceTitle, { color: COLORS.black }]}>{title}</Text>
        <Text style={[styles.hint, { color: COLORS.dark }]}>{hint}</Text>
      </View>
      <Icon name="chevron-right" size={22} color={COLORS.dark} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.light }]} edges={['top']}>
      <StatusBar barStyle={COLORS.bar_style} backgroundColor={COLORS.white} />
      <HeaderComponent title={t('work_steps.files_title')} />
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} /> : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.step, { color: COLORS.primary }]}>{t('work_steps.step_label', { current: 2, total: TOTAL_STEPS })}</Text>
          <Text style={[styles.workTitle, { color: COLORS.black }]} numberOfLines={2}>{work?.work_title}</Text>
          <Text style={[styles.intro, { color: COLORS.dark }]}>{items.length || remoteFiles.length ? t('work_steps.files_intro') : `${t('work_steps.work_created')} ${t('work_steps.files_intro')}`}</Text>
          {error ? <View style={[styles.error, { backgroundColor: COLORS.danger_transparent }]}><Icon name="alert-circle-outline" color={COLORS.danger} size={20} /><Text style={[styles.errorMessage, { color: COLORS.black }]}>{error}</Text></View> : null}

          <TouchableOpacity disabled={picking || sending} onPress={() => setSheetVisible(true)} style={[styles.add, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
            <View style={[styles.icon, { backgroundColor: COLORS.light_primary }]}><Icon name="paperclip" size={23} color={COLORS.primary} /></View>
            <Text style={[styles.addText, { color: COLORS.black }]}>{picking ? t('loading') : t('work_steps.add_files')}</Text>
            <Icon name="plus" size={22} color={COLORS.primary} />
          </TouchableOpacity>

          {items.length ? (
            <>
              <Text style={[styles.section, { color: COLORS.black }]}>{t('work_steps.to_send')} ({items.length})</Text>
              {items.map(renderItem)}
              <TouchableOpacity disabled={sending || !waiting} onPress={sendAll} style={[styles.primary, { backgroundColor: COLORS.primary }, (sending || !waiting) && styles.disabled]}>
                {sending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryText}>{t('work_steps.send_all')}</Text>}
              </TouchableOpacity>
            </>
          ) : null}

          <Text style={[styles.section, { color: COLORS.black }]}>{t('work_steps.uploaded')} ({remoteFiles.length})</Text>
          {remoteFiles.length ? remoteFiles.map((file, index) => (
            <View key={file.id} style={[styles.card, styles.row, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
              <View style={[styles.icon, { backgroundColor: COLORS.light_primary }]}><Icon name={KIND_ICONS[file.kind]} size={22} color={COLORS.primary} /></View>
              <Text numberOfLines={1} style={[styles.name, { color: COLORS.black }]}>{remoteTitle(file, index)}</Text>
              <TouchableOpacity accessibilityLabel={t('work_steps.delete')} onPress={() => confirmDelete(file)}><Icon name="trash-can-outline" size={21} color={COLORS.danger} /></TouchableOpacity>
            </View>
          )) : <Text style={[styles.hint, { color: COLORS.dark }]}>{t('work_steps.no_files')}</Text>}

          <View style={styles.footer}>
            <TouchableOpacity disabled={!remoteFiles.length} onPress={() => navigation.navigate('MediaCollection', { itemId: workId, preview: true })} style={[styles.secondary, { borderColor: COLORS.primary }, !remoteFiles.length && styles.disabled]}>
              <Text style={[styles.secondaryText, { color: COLORS.primary }]}>{t('work_steps.step_label', { current: 3, total: TOTAL_STEPS })} · {t('work_steps.preview')}</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={sending} onPress={finish} style={[styles.primary, { backgroundColor: COLORS.primary }, sending && styles.disabled]}>
              <Text style={styles.primaryText}>{t('work_steps.finish')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      <Modal visible={sheetVisible} transparent animationType="slide" onRequestClose={() => setSheetVisible(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: COLORS.white }]}>
            <View style={[styles.handle, { backgroundColor: COLORS.light_secondary }]} />
            <Text style={[styles.sheetTitle, { color: COLORS.black }]}>{t('work_steps.add_files')}</Text>
            {sourceOption('image-outline', t('file.images'), 'Photos', () => chooseLibraryMedia('images'))}
            {sourceOption('video-outline', t('file.videos'), 'Photos', () => chooseLibraryMedia('videos'))}
            {sourceOption('file-music-outline', `${t('file.audios')} / ${t('file.documents')}`, 'Fichiers', chooseFiles)}
            <TouchableOpacity style={[styles.cancel, { backgroundColor: COLORS.light_primary }]} onPress={() => setSheetVisible(false)}>
              <Text style={[styles.cancelText, { color: COLORS.primary }]}>{t('work_steps.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loader: { marginTop: 40 },
  content: { padding: 16, paddingBottom: 48 },
  step: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  workTitle: { fontSize: 22, fontWeight: '800', lineHeight: 29, marginTop: 4 },
  intro: { fontSize: 14, lineHeight: 20, marginBottom: 16, marginTop: 6 },
  error: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', marginBottom: 14, padding: 12 },
  errorMessage: { flex: 1, fontSize: 13, lineHeight: 19, marginLeft: 8 },
  add: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', minHeight: 72, padding: 10 },
  addText: { flex: 1, fontSize: 15, fontWeight: '800', marginHorizontal: 12 },
  section: { fontSize: 16, fontWeight: '800', marginBottom: 10, marginTop: 22 },
  card: { borderRadius: 16, borderWidth: 1, marginBottom: 10, padding: 12 },
  row: { alignItems: 'center', flexDirection: 'row' },
  icon: { alignItems: 'center', borderRadius: 14, height: 44, justifyContent: 'center', width: 44 },
  name: { flex: 1, fontSize: 14, fontWeight: '700', marginHorizontal: 12 },
  input: { borderBottomWidth: 1, fontSize: 14, marginTop: 8, minHeight: 44, paddingVertical: 8 },
  track: { borderRadius: 3, height: 6, marginTop: 10, overflow: 'hidden' },
  bar: { height: '100%' },
  errorRow: { alignItems: 'center', flexDirection: 'row', marginTop: 10 },
  errorText: { flex: 1, fontSize: 12, lineHeight: 17 },
  retry: { borderRadius: 14, borderWidth: 1, marginLeft: 10, paddingHorizontal: 12, paddingVertical: 6 },
  retryText: { fontSize: 12, fontWeight: '800' },
  hint: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  primary: { alignItems: 'center', borderRadius: 18, justifyContent: 'center', marginTop: 14, minHeight: 52 },
  primaryText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  secondary: { alignItems: 'center', borderRadius: 18, borderWidth: 1, justifyContent: 'center', minHeight: 52 },
  secondaryText: { fontSize: 15, fontWeight: '800' },
  footer: { marginTop: 24 },
  disabled: { opacity: 0.5 },
  backdrop: { backgroundColor: 'rgba(0,0,0,.56)', flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 32 },
  handle: { alignSelf: 'center', borderRadius: 3, height: 5, marginBottom: 18, width: 44 },
  sheetTitle: { fontSize: 22, fontWeight: '800', marginBottom: 10 },
  sourceOption: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingVertical: 12 },
  sourceCopy: { flex: 1, marginHorizontal: 12 },
  sourceTitle: { fontSize: 15, fontWeight: '800' },
  cancel: { alignItems: 'center', borderRadius: 16, marginTop: 14, paddingVertical: 14 },
  cancelText: { fontSize: 15, fontWeight: '800' },
});

export default WorkFilesScreen;
