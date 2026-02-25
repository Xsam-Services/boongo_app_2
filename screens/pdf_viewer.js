/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useEffect, useState } from 'react'
import { View, TouchableOpacity, SafeAreaView, Dimensions, FlatList, Text, ScrollView, TextInput, Modal } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Pdf from 'react-native-pdf';
import Spinner from 'react-native-loading-spinner-overlay';
import SQLite from 'react-native-sqlite-storage';
import { IMAGE_SIZE, PADDING } from '../tools/constants';
import HeaderComponent from './header';
import homeStyles from './style';
import useColors from '../hooks/useColors';

const Tab = createBottomTabNavigator();

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
  const [page, setPage] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // =============== Database handling ===============
  const db = SQLite.openDatabase({ name: 'notes.db', location: 'default' });

  useEffect(() => {
    // Create table if it does not exist
    db.transaction(tx => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS BlocNotes (id INTEGER PRIMARY KEY AUTOINCREMENT, page INTEGER, noteText TEXT, doc_title TEXT, doc_uri TEXT)',
        [], () => console.log('Table BlocNotes created successfully'),
        (tx, error) => console.log('Error creating table', error)
      );
    });

    // Load existing notes
    loadNotes();
  }, []);

  const addNote = () => {
    if (noteText.trim()) {
      // setNotes([...notes, { id: Date.now().toString(), page: page, text: noteText }]);

      db.transaction(tx => {
        tx.executeSql('INSERT INTO BlocNotes (page, noteText, doc_title, doc_uri) VALUES (?, ?, ?, ?)',
          [page, noteText, docTitle, docUri],
          () => {
            console.log('Note saved successfully');
            setPage('');
            setNoteText('');

            loadNotes();
          },
          (tx, error) => console.log('Error saving note', tx)
        );
      });

    } else {
      Alert.alert(t('error'), t('error_message.cannot_be_empty'));
    }
  };

  const editNote = (id) => {
    if (noteItem.noteText.trim()) {
      db.transaction(tx => {
        tx.executeSql('UPDATE BlocNotes SET page = ?, noteText = ? WHERE id = ? ',
          [noteItem.page, noteItem.noteText, id],
          () => {
            console.log('Note edited successfully');
            setPage('');
            setNoteText('');

            loadNotes();
            setModalVisible(false);
          },
          (tx, error) => console.log('Error saving note', error)
        );
      });

    } else {
      Alert.alert(t('error'), t('error_message.cannot_be_empty'));
    }
  };

  const loadNotes = () => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM BlocNotes', [],
        (tx, results) => {
          let notesList = [];

          for (let i = 0; i < results.rows.length; i++) {
            notesList.push(results.rows.item(i));
          }

          setNotes(notesList);
        },
        (tx, error) => {
          Alert.alert(t('error'), 'Error loading notes', error);
          console.log('Error loading notes', error)
        }
      );
    });
  };

  const deleteNote = (id) => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM BlocNotes WHERE id = ?', [id],
        (tx, results) => {
          // setNotes(notes.filter(note => note.id !== id));
          // Load existing notes
          loadNotes();
        },
        (tx, error) => {
          Alert.alert(t('error'), 'Error while deleting note', error);
          console.log('Error while deleting note', error)
        }
      );
    });
  };

  // =============== Open modal ===============
  const openModal = (id) => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM BlocNotes WHERE id = ?', [id],
        (tx, results) => {
          if (results.rows.length > 0) {
            const data = results.rows.item(0);

            setNoteItem(data);
            setModalVisible(true);
          }
        },
        (tx, error) => {
          Alert.alert(t('error'), 'Error loading note', error);
          console.log('Error loading note', error)
        }
      );
    });
  };

  // =============== When the "Edit" button is pressed ===============
  const editButtonPress = (id) => {
    openModal(id);
  };

  // =============== Go to page ===============
  const goToPage = (pageNumber, doc_uri) => {
    setIsLoading(true);
    navigation.navigate('PDFViewerContent', { isLoading: isLoading, docUri: doc_uri, curPage: parseInt(pageNumber) });
    console.log('goToPage => ' + pageNumber);
    setIsLoading(false);
  };

  // =============== Go to page ===============
  const renderNoteItem = ({ item }) => {
    const isExpanded = item.id === expandedId;
    const maxLength = 34; // Max length before cutting

    // Cut the text if necessary
    const displayTitle = isExpanded ? item.doc_title : (((item.doc_title).length > maxLength) ? `${item.doc_title.substring(0, maxLength)}...` : item.doc_title);
    const displayText = isExpanded ? item.noteText : (((item.noteText).length > maxLength) ? `${item.noteText.substring(0, maxLength)}...` : item.noteText);

    return (
      <View style={[homeStyles.noteContainer, { backgroundColor: COLORS.white, borderColor: COLORS.dark_secondary }]}>
        <TouchableOpacity onPress={() => goToPage(item.page, item.doc_uri)} style={homeStyles.noteTextContainer}>
          <Text style={[homeStyles.noteWorkTitle, { color: COLORS.dark_secondary }]}>{displayTitle}</Text>
          <Text style={[homeStyles.noteText, { color: COLORS.black }]}>{displayText}</Text>
          {item.noteText.length > maxLength ?
            <>
              <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : item.id)} style={homeStyles.noteSeeTextButton}>
                <Icon size={IMAGE_SIZE.s06} color={COLORS.dark_secondary} name={isExpanded ? 'chevron-double-up' : 'chevron-double-down'} />
              </TouchableOpacity>
            </>
            : ''
          }
        </TouchableOpacity>
        <TouchableOpacity onPress={() => editButtonPress(item.id)} style={[homeStyles.noteEditButton]}>
          <Icon size={IMAGE_SIZE.s04} color={COLORS.dark_secondary} name='pencil' />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteNote(item.id)} style={homeStyles.noteDeleteButton}>
          <Icon size={IMAGE_SIZE.s04} color={COLORS.dark_secondary} name='close' />
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() => navigation.navigate('ChatEntity', { doc_title: item.doc_title, doc_page: item.id, doc_note: item.noteText })} style={homeStyles.noteShareButton}>
          <Icon size={IMAGE_SIZE.s04} color={COLORS.dark_secondary} name='share-variant' />
        </TouchableOpacity> */}
      </View>
    );
  };

  return (
    <>
      {/* Header */}
      <View style={{ paddingVertical: PADDING.p01, backgroundColor: COLORS.white }}>
        <HeaderComponent />
      </View>

      {/* Content */}
      <SafeAreaView contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}>
        <View style={{ height: Dimensions.get('window').height - 110, backgroundColor: COLORS.light_secondary }}>
          <Text style={[homeStyles.noteTitle, { color: COLORS.black }]}>{t('notepad.title')}</Text>
          <View style={homeStyles.noteForm}>
            <TextInput
              keyboardType='number-pad'
              style={[homeStyles.noteInput, { color: COLORS.black, borderColor: COLORS.dark, borderTopLeftRadius: PADDING.p03, borderTopRightRadius: PADDING.p03 }]}
              placeholder={t('notepad.page_number')}
              placeholderTextColor={COLORS.dark}
              value={page}
              onChangeText={text => setPage(text)} />
            <TextInput
              multiline={true}
              numberOfLines={5}
              style={[homeStyles.noteInput, { height: 80, color: COLORS.black, textAlignVertical: 'top', borderColor: COLORS.dark }]}
              placeholder={t('notepad.enter_note')}
              placeholderTextColor={COLORS.dark}
              value={noteText}
              onChangeText={setNoteText} />
            <TouchableOpacity style={[homeStyles.noteSubmit, { backgroundColor: COLORS.dark, borderBottomLeftRadius: PADDING.p03, borderBottomRightRadius: PADDING.p03 }]} onPress={addNote}>
              <Text style={{ textAlign: 'center', fontSize: 15, color: COLORS.white }}>{t('save')}</Text>
            </TouchableOpacity>
          </View>

          {noteItem.id ? (
            <>
              <Modal animationType='slide' transparent={true} visible={modalVisible} onRequestClose={() => { setModalVisible(!modalVisible); }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                  <View style={{ width: 300, padding: 20, backgroundColor: COLORS.white, borderRadius: 10, alignItems: 'center' }}>
                    <TouchableOpacity style={[homeStyles.modalClose, { backgroundColor: 'rgba(255, 255, 255, 0)', }]} onPress={() => setModalVisible(false)}>
                      <Icon style={homeStyles.noteButtonIcon} color={COLORS.black} name='close' />
                    </TouchableOpacity>
                    <Text style={[homeStyles.noteTitle, { color: COLORS.black }]}>{t('notepad.title_edit')}</Text>
                    <View style={homeStyles.noteForm}>
                      <TextInput
                        keyboardType="numeric"
                        style={[homeStyles.noteInput, { width: Dimensions.get('window').width - 100, color: COLORS.black, borderColor: COLORS.dark_secondary }]}
                        placeholderTextColor={COLORS.dark_secondary}
                        placeholder={t('notepad.page_number')}
                        value={noteItem.page.toString()}
                        onChangeText={(text) => setNoteItem({ ...noteItem, page: text })}
                      />
                      <TextInput
                        multiline={true}
                        numberOfLines={5}
                        style={[homeStyles.noteInput, { width: Dimensions.get('window').width - 100, height: 80, color: COLORS.black, textAlignVertical: 'top', borderColor: COLORS.dark_secondary }]}
                        placeholderTextColor={COLORS.dark_secondary}
                        placeholder={t('notepad.enter_note')}
                        value={noteItem.noteText}
                        onChangeText={(text) => setNoteItem({ ...noteItem, noteText: text })}
                      />
                      <TouchableOpacity style={[homeStyles.noteSubmit, { width: Dimensions.get('window').width - 100, backgroundColor: COLORS.warning }]} onPress={() => editNote(noteItem.id)}>
                        <Text style={{ textAlign: 'center', fontSize: 15, color: COLORS.black }}>{t('update')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </>
          ) : ''}

          <FlatList
            data={notes}
            keyExtractor={item => item.id}
            style={{ marginLeft: -10, marginTop: 16 }}
            renderItem={renderNoteItem}
          />
        </View>
      </SafeAreaView>
    </>
  );
};

const PDFViewerScreenContent = ({ route, navigation }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Get parameters ===============
  const { isLoading, docUri, curPage } = route.params;

  // =============== Get data ===============
  const source = { uri: docUri, cache: true };

  return (
    <>
      {/* Header */}
      <View style={{ paddingVertical: PADDING.p01, backgroundColor: COLORS.white }}>
        <HeaderComponent />
      </View>

      {/* Content */}
      <SafeAreaView contentContainerStyle={{ flexGrow: 1, paddingBottom: 50, backgroundColor: COLORS.dark_secondary }}>
        <View style={{ height: Dimensions.get('window').height - 110, justifyContent: 'flex-start', alignItems: 'center', marginTop: 5, }}>
          <Spinner visible={isLoading} />

          <Pdf
            trustAllCerts={false}
            source={source}
            onLoadComplete={(numberOfPages, filePath) => {
              console.log(`Number of pages: ${numberOfPages}`);
            }}
            onPageChanged={(page, numberOfPages) => {
              console.log(`Current page: ${page}`);
            }}
            onError={(error) => {
              console.log(error);
            }}
            onPressLink={(uri) => {
              console.log(`Link pressed: ${uri}`);
            }}
            page={curPage}
            style={{ flex: 1, width: Dimensions.get('window').width, height: Dimensions.get('window').height, }} />
        </View>
      </SafeAreaView>
    </>
  );
};

const PDFViewerScreen = ({ route }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Get parameters ===============
  const { docTitle, docUri } = route.params;

  // =============== Language ===============
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName='PDFViewerContent'
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
        name='PDFViewerContent' component={PDFViewerScreenContent}
        initialParams={{ docTitle: docTitle, docUri: docUri }}
        options={{
          title: t('navigation.reading'),
          tabBarLabel: t('navigation.reading'),
          tabBarIcon: ({ color, size }) => (
            <Icon name='book-open-page-variant-outline' color={color} size={IMAGE_SIZE.s06} />
          )
        }}
      />
      <Tab.Screen
        name='Summary' component={SummaryScreenContent}
        initialParams={{ docTitle: docTitle, docUri: docUri }}
        options={{
          title: t('navigation.summary'),
          tabBarLabel: t('navigation.summary'),
          tabBarIcon: ({ color, size }) => (
            <Icon name='lead-pencil' color={color} size={IMAGE_SIZE.s06} />
          )
        }}
      />
    </Tab.Navigator>
  );
};

export default PDFViewerScreen;