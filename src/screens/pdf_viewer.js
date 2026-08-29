/**
 * @author Xanders
 * @note SQLite implementation migrated to expo-sqlite by Vander Otis.
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Pdf from 'react-native-pdf';
import * as SQLite from 'expo-sqlite';

import useColors from '../hooks/useColors';

const Tab = createBottomTabNavigator();

const ReaderHeader = ({ navigation, title }) => {
  const COLORS = useColors();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.white }}>
      <View style={[styles.readerHeader, { borderBottomColor: COLORS.light_secondary }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: COLORS.light_secondary }]} onPress={() => navigation.getParent()?.goBack()} accessibilityLabel="Retour">
          <Icon name="chevron-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={[styles.readerTitle, { color: COLORS.black }]} numberOfLines={1}>{title}</Text>
      </View>
    </SafeAreaView>
  );
};

const SummaryScreenContent = ({ route, navigation }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { docTitle, docUri } = route.params;
  const [db, setDb] = useState(null);
  const [notes, setNotes] = useState([]);
  const [page, setPage] = useState('');
  const [noteText, setNoteText] = useState('');
  const [editingNote, setEditingNote] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initializeDatabase = async () => {
      try {
        const database = await SQLite.openDatabaseAsync('notes.db');
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS BlocNotes(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page INTEGER,
            noteText TEXT,
            doc_title TEXT,
            doc_uri TEXT
          );
        `);
        if (isMounted) setDb(database);
      } catch (error) {
        console.error('Erreur lors de l’initialisation des notes:', error);
        Alert.alert(t('error'), 'Impossible d’initialiser les notes.');
      }
    };

    initializeDatabase();
    return () => { isMounted = false; };
  }, [t]);

  const loadNotes = useCallback(async () => {
    if (!db) return;

    try {
      const rows = await db.getAllAsync('SELECT * FROM BlocNotes WHERE doc_uri = ? ORDER BY id DESC', [docUri]);
      setNotes(rows);
    } catch (error) {
      console.error('Erreur lors du chargement des notes:', error);
      Alert.alert(t('error'), 'Impossible de charger les notes.');
    }
  }, [db, docUri, t]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const resetForm = () => {
    setPage('');
    setNoteText('');
    setEditingNote(null);
  };

  const saveNote = async () => {
    if (!db || !noteText.trim()) {
      Alert.alert(t('error'), t('error_message.cannot_be_empty'));
      return;
    }

    try {
      if (editingNote) {
        await db.runAsync('UPDATE BlocNotes SET page = ?, noteText = ? WHERE id = ?', [Number(page) || 0, noteText.trim(), editingNote.id]);
      } else {
        await db.runAsync('INSERT INTO BlocNotes (page, noteText, doc_title, doc_uri) VALUES (?, ?, ?, ?)', [Number(page) || 0, noteText.trim(), docTitle, docUri]);
      }
      resetForm();
      await loadNotes();
    } catch (error) {
      console.error('Erreur lors de l’enregistrement de la note:', error);
      Alert.alert(t('error'), 'Impossible d’enregistrer la note.');
    }
  };

  const deleteNote = note => {
    Alert.alert(t('notepad.title'), 'Supprimer cette note ?', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete.just'),
        style: 'destructive',
        onPress: async () => {
          try {
            await db?.runAsync('DELETE FROM BlocNotes WHERE id = ?', [note.id]);
            if (editingNote?.id === note.id) resetForm();
            await loadNotes();
          } catch (error) {
            console.error('Erreur lors de la suppression de la note:', error);
          }
        },
      },
    ]);
  };

  const editNote = note => {
    setEditingNote(note);
    setPage(String(note.page || ''));
    setNoteText(note.noteText || '');
  };

  const openPage = note => navigation.navigate('PDFViewerContent', {
    docTitle,
    docUri: note.doc_uri,
    curPage: Number(note.page) || 1,
  });

  return (
    <View style={[styles.summaryScreen, { backgroundColor: COLORS.light }]}>
      <ReaderHeader navigation={navigation} title={t('navigation.summary')} />
      <View style={styles.summaryContent}>
        <View style={[styles.noteFormCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
          <View style={styles.noteFormHeading}>
            <View style={[styles.noteIcon, { backgroundColor: COLORS.light_primary }]}><Icon name="note-text-outline" size={22} color={COLORS.primary} /></View>
            <View style={styles.noteHeadingCopy}>
              <Text style={[styles.noteHeadingTitle, { color: COLORS.black }]}>{editingNote ? t('notepad.title_edit') : t('notepad.title')}</Text>
              <Text style={[styles.noteHeadingDescription, { color: COLORS.dark }]}>{docTitle}</Text>
            </View>
          </View>
          <TextInput keyboardType="number-pad" style={[styles.pageInput, { backgroundColor: COLORS.light, borderColor: COLORS.light_secondary, color: COLORS.black }]} placeholder={t('notepad.page_number')} placeholderTextColor={COLORS.dark} value={page} onChangeText={setPage} />
          <TextInput multiline textAlignVertical="top" style={[styles.noteInput, { backgroundColor: COLORS.light, borderColor: COLORS.light_secondary, color: COLORS.black }]} placeholder={t('notepad.enter_note')} placeholderTextColor={COLORS.dark} value={noteText} onChangeText={setNoteText} />
          <View style={styles.formActions}>
            {editingNote ? <TouchableOpacity style={[styles.cancelEdit, { backgroundColor: COLORS.light_secondary }]} onPress={resetForm}><Text style={[styles.cancelEditText, { color: COLORS.dark }]}>{t('cancel')}</Text></TouchableOpacity> : null}
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: COLORS.primary }]} onPress={saveNote}><Icon name={editingNote ? 'check' : 'content-save-outline'} size={18} color="#ffffff" /><Text style={styles.saveButtonText}>{editingNote ? t('update') : t('save')}</Text></TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={notes}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={notes.length ? styles.notesList : styles.emptyNotesList}
          ListEmptyComponent={<View style={[styles.emptyNotes, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}><Icon name="notebook-outline" size={34} color={COLORS.primary} /><Text style={[styles.emptyNotesText, { color: COLORS.dark }]}>{t('notepad.empty')}</Text></View>}
          renderItem={({ item }) => (
            <View style={[styles.noteCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
              <TouchableOpacity style={styles.noteMain} onPress={() => openPage(item)} activeOpacity={0.78}>
                <View style={[styles.notePage, { backgroundColor: COLORS.light_primary }]}><Text style={[styles.notePageText, { color: COLORS.primary }]}>{item.page || 1}</Text></View>
                <Text style={[styles.noteText, { color: COLORS.black }]} numberOfLines={3}>{item.noteText}</Text>
              </TouchableOpacity>
              <View style={styles.noteActions}>
                <TouchableOpacity style={[styles.noteAction, { backgroundColor: COLORS.light_secondary }]} onPress={() => editNote(item)} accessibilityLabel="Modifier la note"><Icon name="pencil-outline" size={18} color={COLORS.dark} /></TouchableOpacity>
                <TouchableOpacity style={[styles.noteAction, { backgroundColor: COLORS.danger_transparent }]} onPress={() => deleteNote(item)} accessibilityLabel="Supprimer la note"><Icon name="trash-can-outline" size={18} color={COLORS.danger} /></TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
};

const PDFViewerScreenContent = ({ route, navigation }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { docTitle, docUri, curPage = 1 } = route.params;
  const [pageCount, setPageCount] = useState(null);

  return (
    <View style={[styles.pdfScreen, { backgroundColor: COLORS.dark_secondary }]}>
      <ReaderHeader navigation={navigation} title={docTitle || t('navigation.reading')} />
      <View style={styles.pdfBody}>
        {pageCount ? <View style={styles.pageCount}><Text style={styles.pageCountText}>{`${curPage} / ${pageCount}`}</Text></View> : null}
        <Pdf
          trustAllCerts={false}
          source={{ uri: docUri, cache: true }}
          page={curPage}
          onLoadComplete={numberOfPages => setPageCount(numberOfPages)}
          onError={error => { console.error('Erreur du lecteur PDF:', error); Alert.alert(t('error'), 'Impossible d’ouvrir ce document.'); }}
          style={styles.pdf}
        />
      </View>
    </View>
  );
};

const PDFViewerScreen = ({ route }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { docTitle, docUri } = route.params;

  return (
    <Tab.Navigator
      initialRouteName="PDFViewerContent"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.dark,
        tabBarStyle: [styles.tabBar, { backgroundColor: COLORS.white, borderTopColor: COLORS.light_secondary, height: 58 + insets.bottom, paddingBottom: insets.bottom }],
      }}
    >
      <Tab.Screen name="PDFViewerContent" component={PDFViewerScreenContent} initialParams={{ docTitle, docUri, curPage: 1 }} options={{ title: t('navigation.reading'), tabBarLabel: t('navigation.reading'), tabBarIcon: ({ color, size }) => <Icon name="book-open-page-variant" color={color} size={size} /> }} />
      <Tab.Screen name="Summary" component={SummaryScreenContent} initialParams={{ docTitle, docUri }} options={{ title: t('navigation.summary'), tabBarLabel: t('navigation.summary'), tabBarIcon: ({ color, size }) => <Icon name="note-text-outline" color={color} size={size} /> }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  readerHeader: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 64, paddingHorizontal: 16 },
  backButton: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  readerTitle: { flex: 1, fontSize: 16, fontWeight: '800', marginLeft: 10 },
  summaryScreen: { flex: 1 },
  summaryContent: { flex: 1, padding: 16 },
  noteFormCard: { borderRadius: 20, borderWidth: 1, padding: 16 },
  noteFormHeading: { alignItems: 'center', flexDirection: 'row', marginBottom: 14 },
  noteIcon: { alignItems: 'center', borderRadius: 17, height: 42, justifyContent: 'center', width: 42 },
  noteHeadingCopy: { flex: 1, marginLeft: 10 },
  noteHeadingTitle: { fontSize: 16, fontWeight: '800' },
  noteHeadingDescription: { fontSize: 12, marginTop: 2 },
  pageInput: { borderRadius: 12, borderWidth: 1, fontSize: 14, minHeight: 46, paddingHorizontal: 12 },
  noteInput: { borderRadius: 12, borderWidth: 1, fontSize: 14, height: 104, marginTop: 9, padding: 12 },
  formActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cancelEdit: { alignItems: 'center', borderRadius: 12, justifyContent: 'center', minHeight: 46, paddingHorizontal: 14 },
  cancelEditText: { fontSize: 14, fontWeight: '800' },
  saveButton: { alignItems: 'center', borderRadius: 12, flex: 1, flexDirection: 'row', justifyContent: 'center', minHeight: 46 },
  saveButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800', marginLeft: 7 },
  notesList: { gap: 9, paddingTop: 14, paddingBottom: 18 },
  emptyNotesList: { flexGrow: 1, justifyContent: 'center', paddingBottom: 70 },
  emptyNotes: { alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 24 },
  emptyNotesText: { fontSize: 14, marginTop: 10, textAlign: 'center' },
  noteCard: { borderRadius: 17, borderWidth: 1, padding: 12 },
  noteMain: { alignItems: 'center', flexDirection: 'row' },
  notePage: { alignItems: 'center', borderRadius: 15, height: 40, justifyContent: 'center', width: 40 },
  notePageText: { fontSize: 14, fontWeight: '800' },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20, marginLeft: 10 },
  noteActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 10 },
  noteAction: { alignItems: 'center', borderRadius: 14, height: 30, justifyContent: 'center', width: 30 },
  pdfScreen: { flex: 1 },
  pdfBody: { flex: 1 },
  pageCount: { backgroundColor: 'rgba(0, 0, 0, 0.58)', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, position: 'absolute', right: 14, top: 14, zIndex: 1 },
  pageCountText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  pdf: { flex: 1, width: '100%' },
  tabBar: { borderTopWidth: StyleSheet.hairlineWidth },
});

export default PDFViewerScreen;
