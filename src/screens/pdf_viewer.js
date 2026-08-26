/**
 * @author Xanders
 * @note SQLite implementation migrated to expo-sqlite by Vander Otis.
 * @see https://team.xsamtech.com/xanderssamoth
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  FlatList,
  Text,
  TextInput,
  Modal,
  Alert,
} from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import Pdf from 'react-native-pdf';
import Spinner from 'react-native-loading-spinner-overlay';
import * as SQLite from 'expo-sqlite';

import { IMAGE_SIZE, PADDING } from '../tools/constants';
import useColors from '../hooks/useColors';

const Tab = createBottomTabNavigator();

/**
 * ============================================================
 * SUMMARY / NOTES
 * ============================================================
 */
const SummaryScreenContent = ({ route, navigation }) => {
  // =============== Colors ===============
  const COLORS = useColors();

  // =============== Get parameters ===============
  const { docTitle, docUri } = route.params;

  // =============== Language ===============
  const { t } = useTranslation();

  // =============== Get data ===============
  const [notes, setNotes] = useState([]);
  const [noteItem, setNoteItem] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState('');
  const [noteText, setNoteText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // =============== SQLite database ===============
  const [db, setDb] = useState(null);

  /**
   * Initialize SQLite database
   */
  useEffect(() => {
    let mounted = true;

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

        if (mounted) {
          setDb(database);
        }

        console.log('SQLite database initialized successfully');
      } catch (error) {
        console.log('Error initializing SQLite database:', error);
        Alert.alert(t('error'), 'Error initializing notes database');
      }
    };

    initializeDatabase();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Load notes once database is ready
   */
  useEffect(() => {
    if (db) {
      loadNotes();
    }
  }, [db]);

  // =============== Load notes ===============
  const loadNotes = async () => {
    if (!db) {
      return;
    }

    try {
      const rows = await db.getAllAsync(
        'SELECT * FROM BlocNotes ORDER BY id DESC'
      );

      setNotes(rows);
    } catch (error) {
      console.log('Error loading notes:', error);
      Alert.alert(t('error'), 'Error loading notes');
    }
  };

  // =============== Add note ===============
  const addNote = async () => {
    if (!db) {
      return;
    }

    if (!noteText.trim()) {
      Alert.alert(
        t('error'),
        t('error_message.cannot_be_empty')
      );
      return;
    }

    try {
      await db.runAsync(
        `INSERT INTO BlocNotes
  (page, noteText, doc_title, doc_uri)
VALUES(?, ?, ?, ?)`,
        [
          parseInt(page, 10) || 0,
          noteText,
          docTitle,
          docUri,
        ]
      );

      console.log('Note saved successfully');

      setPage('');
      setNoteText('');

      await loadNotes();
    } catch (error) {
      console.log('Error saving note:', error);
      Alert.alert(t('error'), 'Error saving note');
    }
  };

  // =============== Edit note ===============
  const editNote = async (id) => {
    if (!db) {
      return;
    }

    if (!noteItem.noteText || !noteItem.noteText.trim()) {
      Alert.alert(
        t('error'),
        t('error_message.cannot_be_empty')
      );
      return;
    }

    try {
      await db.runAsync(
        `UPDATE BlocNotes
         SET page = ?, noteText = ?
  WHERE id = ? `,
        [
          parseInt(noteItem.page, 10) || 0,
          noteItem.noteText,
          id,
        ]
      );

      console.log('Note edited successfully');

      setPage('');
      setNoteText('');

      await loadNotes();
      setModalVisible(false);
    } catch (error) {
      console.log('Error editing note:', error);
      Alert.alert(t('error'), 'Error editing note');
    }
  };

  // =============== Delete note ===============
  const deleteNote = async (id) => {
    if (!db) {
      return;
    }

    try {
      await db.runAsync(
        'DELETE FROM BlocNotes WHERE id = ?',
        [id]
      );

      await loadNotes();
    } catch (error) {
      console.log('Error while deleting note:', error);
      Alert.alert(t('error'), 'Error while deleting note');
    }
  };

  // =============== Open modal ===============
  const openModal = async (id) => {
    if (!db) {
      return;
    }

    try {
      const data = await db.getFirstAsync(
        'SELECT * FROM BlocNotes WHERE id = ?',
        [id]
      );

      if (data) {
        setNoteItem(data);
        setModalVisible(true);
      }
    } catch (error) {
      console.log('Error loading note:', error);
      Alert.alert(t('error'), 'Error loading note');
    }
  };

  // =============== Edit button ===============
  const editButtonPress = (id) => {
    openModal(id);
  };

  // =============== Go to page ===============
  const goToPage = (pageNumber, doc_uri) => {
    navigation.navigate('PDFViewerContent', {
      isLoading: false,
      docUri: doc_uri,
      curPage: parseInt(pageNumber, 10) || 1,
    });

    console.log('goToPage => ' + pageNumber);
  };

  // =============== Render note ===============
  const renderNoteItem = ({ item }) => {
    const isExpanded = item.id === expandedId;
    const maxLength = 34;

    const displayTitle =
      isExpanded
        ? item.doc_title
        : item.doc_title?.length > maxLength
          ? `${item.doc_title.substring(0, maxLength)}...`
          : item.doc_title;

    const displayText =
      isExpanded
        ? item.noteText
        : item.noteText?.length > maxLength
          ? `${item.noteText.substring(0, maxLength)}...`
          : item.noteText;

    return (
      <View
        style={[
          homeStyles.noteContainer,
          {
            backgroundColor: COLORS.white,
            borderColor: COLORS.dark_secondary,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => goToPage(item.page, item.doc_uri)}
          style={homeStyles.noteTextContainer}
        >
          <Text
            style={[
              homeStyles.noteWorkTitle,
              { color: COLORS.dark_secondary },
            ]}
          >
            {displayTitle}
          </Text>

          <Text
            style={[
              homeStyles.noteText,
              { color: COLORS.black },
            ]}
          >
            {displayText}
          </Text>

          {item.noteText?.length > maxLength ? (
            <TouchableOpacity
              onPress={() =>
                setExpandedId(
                  isExpanded ? null : item.id
                )
              }
              style={homeStyles.noteSeeTextButton}
            >
              <Icon
                size={IMAGE_SIZE.s06}
                color={COLORS.dark_secondary}
                name={
                  isExpanded
                    ? 'chevron-double-up'
                    : 'chevron-double-down'
                }
              />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => editButtonPress(item.id)}
          style={homeStyles.noteEditButton}
        >
          <Icon
            size={IMAGE_SIZE.s04}
            color={COLORS.dark_secondary}
            name="pencil"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => deleteNote(item.id)}
          style={homeStyles.noteDeleteButton}
        >
          <Icon
            size={IMAGE_SIZE.s04}
            color={COLORS.dark_secondary}
            name="close"
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <View
        style={{
          paddingVertical: PADDING.p01,
          backgroundColor: COLORS.white,
        }}
      />

      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.light_secondary,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.light_secondary,
          }}
        >
          <Text
            style={[
              homeStyles.noteTitle,
              { color: COLORS.black },
            ]}
          >
            {t('notepad.title')}
          </Text>

          <View style={homeStyles.noteForm}>
            <TextInput
              keyboardType="number-pad"
              style={[
                homeStyles.noteInput,
                {
                  color: COLORS.black,
                  borderColor: COLORS.dark,
                  borderTopLeftRadius: PADDING.p03,
                  borderTopRightRadius: PADDING.p03,
                },
              ]}
              placeholder={t('notepad.page_number')}
              placeholderTextColor={COLORS.dark}
              value={page}
              onChangeText={setPage}
            />

            <TextInput
              multiline
              numberOfLines={5}
              style={[
                homeStyles.noteInput,
                {
                  height: 80,
                  color: COLORS.black,
                  textAlignVertical: 'top',
                  borderColor: COLORS.dark,
                },
              ]}
              placeholder={t('notepad.enter_note')}
              placeholderTextColor={COLORS.dark}
              value={noteText}
              onChangeText={setNoteText}
            />

            <TouchableOpacity
              style={[
                homeStyles.noteSubmit,
                {
                  backgroundColor: COLORS.dark,
                  borderBottomLeftRadius: PADDING.p03,
                  borderBottomRightRadius: PADDING.p03,
                },
              ]}
              onPress={addNote}
            >
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 15,
                  color: COLORS.white,
                }}
              >
                {t('save')}
              </Text>
            </TouchableOpacity>
          </View>

          {noteItem.id ? (
            <Modal
              animationType="slide"
              transparent
              visible={modalVisible}
              onRequestClose={() =>
                setModalVisible(false)
              }
            >
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}
              >
                <View
                  style={{
                    width: 300,
                    padding: 20,
                    backgroundColor: COLORS.white,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                >
                  <TouchableOpacity
                    style={[
                      homeStyles.modalClose,
                      {
                        backgroundColor:
                          'rgba(255, 255, 255, 0)',
                      },
                    ]}
                    onPress={() =>
                      setModalVisible(false)
                    }
                  >
                    <Icon
                      style={homeStyles.noteButtonIcon}
                      color={COLORS.black}
                      name="close"
                    />
                  </TouchableOpacity>

                  <Text
                    style={[
                      homeStyles.noteTitle,
                      { color: COLORS.black },
                    ]}
                  >
                    {t('notepad.title_edit')}
                  </Text>

                  <View style={homeStyles.noteForm}>
                    <TextInput
                      keyboardType="numeric"
                      style={[
                        homeStyles.noteInput,
                        {
                          width:
                            Dimensions.get('window').width -
                            100,
                          color: COLORS.black,
                          borderColor:
                            COLORS.dark_secondary,
                        },
                      ]}
                      placeholderTextColor={
                        COLORS.dark_secondary
                      }
                      placeholder={t(
                        'notepad.page_number'
                      )}
                      value={String(
                        noteItem.page ?? ''
                      )}
                      onChangeText={(text) =>
                        setNoteItem({
                          ...noteItem,
                          page: text,
                        })
                      }
                    />

                    <TextInput
                      multiline
                      numberOfLines={5}
                      style={[
                        homeStyles.noteInput,
                        {
                          width:
                            Dimensions.get('window').width -
                            100,
                          height: 80,
                          color: COLORS.black,
                          textAlignVertical: 'top',
                          borderColor:
                            COLORS.dark_secondary,
                        },
                      ]}
                      placeholderTextColor={
                        COLORS.dark_secondary
                      }
                      placeholder={t(
                        'notepad.enter_note'
                      )}
                      value={noteItem.noteText}
                      onChangeText={(text) =>
                        setNoteItem({
                          ...noteItem,
                          noteText: text,
                        })
                      }
                    />

                    <TouchableOpacity
                      style={[
                        homeStyles.noteSubmit,
                        {
                          width:
                            Dimensions.get('window').width -
                            100,
                          backgroundColor:
                            COLORS.warning,
                        },
                      ]}
                      onPress={() =>
                        editNote(noteItem.id)
                      }
                    >
                      <Text
                        style={{
                          textAlign: 'center',
                          fontSize: 15,
                          color: COLORS.black,
                        }}
                      >
                        {t('update')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          ) : null}

          <FlatList
            data={notes}
            keyExtractor={(item) =>
              String(item.id)
            }
            style={{
              marginLeft: -10,
              marginTop: 16,
            }}
            renderItem={renderNoteItem}
          />
        </View>
      </SafeAreaView>
    </>
  );
};

/**
 * ============================================================
 * PDF VIEWER
 * ============================================================
 */
const PDFViewerScreenContent = ({
  route,
  navigation,
}) => {
  // =============== Colors ===============
  const COLORS = useColors();

  // =============== Get parameters ===============
  const {
    isLoading,
    docUri,
    curPage,
  } = route.params;

  const source = {
    uri: docUri,
    cache: true,
  };

  return (
    <>
      <View
        style={{
          paddingVertical: PADDING.p01,
          backgroundColor: COLORS.white,
        }}
      />

      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.dark_secondary,
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginTop: 5,
          }}
        >
          <Spinner visible={isLoading} />

          <Pdf
            trustAllCerts={false}
            source={source}
            onLoadComplete={(
              numberOfPages,
              filePath
            ) => {
              console.log(
                `Number of pages: ${numberOfPages} `
              );
            }}
            onPageChanged={(
              page,
              numberOfPages
            ) => {
              console.log(
                `Current page: ${page} `
              );
            }}
            onError={(error) => {
              console.log(error);
            }}
            onPressLink={(uri) => {
              console.log(
                `Link pressed: ${uri} `
              );
            }}
            page={curPage}
            style={{
              flex: 1,
              width:
                Dimensions.get('window').width,
              height:
                Dimensions.get('window').height,
            }}
          />
        </View>
      </SafeAreaView>
    </>
  );
};

/**
 * ============================================================
 * MAIN PDF SCREEN
 * ============================================================
 */
const PDFViewerScreen = ({ route }) => {
  // =============== Colors ===============
  const COLORS = useColors();

  // =============== Get parameters ===============
  const {
    docTitle,
    docUri,
  } = route.params;

  // =============== Language ===============
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="PDFViewerContent"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.black,
        tabBarStyle: {
          height: 55,
          backgroundColor: COLORS.white,
        },
        tabBarShowLabel: true,
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTitleStyle: {
          color: COLORS.black,
        },
      }}
    >
      <Tab.Screen
        name="PDFViewerContent"
        component={PDFViewerScreenContent}
        initialParams={{
          docTitle,
          docUri,
          isLoading: false,
          curPage: 1,
        }}
        options={{
          title: t('navigation.reading'),
          tabBarLabel: t('navigation.reading'),
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Icon
              name="book-open-page-variant"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Summary"
        component={SummaryScreenContent}
        initialParams={{
          docTitle,
          docUri,
        }}
        options={{
          title: t('navigation.summary'),
          tabBarLabel: t('navigation.summary'),
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Icon
              name="note-text-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default PDFViewerScreen;