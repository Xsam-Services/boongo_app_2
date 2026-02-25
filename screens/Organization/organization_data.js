/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { View, TouchableOpacity, Animated, SafeAreaView, Dimensions, RefreshControl, TouchableHighlight, FlatList, Text, Image, StatusBar, TextInput, Linking, ScrollView, Modal, ToastAndroid, Platform, Pressable } from 'react-native'
import { pick, types as docTypes, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-paper';
import { TabBar, TabView } from 'react-native-tab-view';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import ImagePicker from 'react-native-image-crop-picker';
import Pdf from 'react-native-pdf';
import Spinner from 'react-native-loading-spinner-overlay';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API, IMAGE_SIZE, PADDING, TEXT_SIZE, WEB } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import EmptyListComponent from '../../components/empty_list';
import WorkItemComponent from '../../components/work_item';
import LogoText from '../../assets/img/brand.svg';
import useColors from '../../hooks/useColors';
import homeStyles from '../style';

const TAB_BAR_HEIGHT = 48;

const Schedule = ({ handleScroll, showBackToTop, listRef, headerHeight = 0 }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get parameters ===============
  const route = useRoute();
  const { organization_id } = route.params;
  // =============== Get data ===============
  const [selectedOrganization, setSelectedOrganization] = useState({});
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [pdfPage, setPdfPage] = useState(1);
  // Form data
  const [formProgramModalVisible, setFormProgramModalVisible] = useState(false);
  const [docProgramModalVisible, setDocProgramModalVisible] = useState(false);
  const [newClass, setNewClass] = useState('');
  // Loaders
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewListRef = listRef || useRef(null);
  // Protect pick execution against multiple clicks on button
  const [files, setFiles] = useState([]);
  const [isPicking, setIsPicking] = useState(false);
  // Current course year
  const currentYear = new Date().getFullYear();
  const currentMonthNumber = new Date().getMonth() + 1;
  const course_year = (currentMonthNumber >= 8 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`);

  // ================= Get current organization =================
  useEffect(() => {
    getOrganization();
  }, []); // ✅ Correction : une seule fois au montage (avant: [selectedOrganization])

  const getOrganization = async () => {
    try {
      const res = await axios.get(`${API.boongo_url}/organization/${organization_id}`, {
        headers: {
          'X-localization': 'fr',
          'Authorization': `Bearer ${userInfo.api_token}`,
        },
      });

      const organizationData = res.data.data;
      setSelectedOrganization(organizationData);
    } catch (error) {
      console.log(error);
    }
  };

  // ================= Get programs =================
  useEffect(() => {
    if (selectedOrganization.id && !isLoaded) {
      fetchPrograms();
    }
  }, [selectedOrganization]); // ✅ Ici, c’est correct : on attend que l’organisation soit chargée

  const fetchPrograms = async () => {
    if (!selectedOrganization.id || isLoaded) return;

    try {
      const response = await axios.get(
        `${API.boongo_url}/program/find_all_by_year_and_organization/${course_year}/${organization_id}`,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-localization': 'fr',
            'Authorization': `Bearer ${userInfo.api_token}`,
          },
        }
      );

      setPrograms(response.data.data);
      setSelectedProgram(response.data.data[0]);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setIsLoaded(false);
    }
  };

  // ================= Add new program =================
  const addNewProgram = async () => {
    setIsLoading(true);

    const formData = new FormData();

    formData.append('course_year', course_year);
    formData.append('class', newClass);
    formData.append('document_url', {
      uri: files[0].uri,
      type: files[0].type,
      name: files[0].name,
    });

    try {
      const response = await axios.post(
        `${API.boongo_url}/program/add_organization_program/${organization_id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-localization': 'fr',
            'Authorization': `Bearer ${userInfo.api_token}`,
          },
        }
      );

      await fetchPrograms();
      setSelectedProgram(response.data.data);
      setFormProgramModalVisible(false);
    } catch (error) {
      console.error('Error adding program:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= Handlers =================
  const onRefresh = async () => {
    setRefreshing(true);
    setIsLoaded(false);
    setPrograms([]);
    await fetchPrograms();
    setRefreshing(false);
  };

  const scrollToTop = () => {
    scrollViewListRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleBadgeClick = async (programId) => {
    setRefreshing(true);

    try {
      const response = await axios.get(`${API.boongo_url}/program/${programId}`, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-localization': 'fr',
          'Authorization': `Bearer ${userInfo.api_token}`,
        },
      });

      setSelectedProgram(null);
      setSelectedProgram(response.data.data);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching program details:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const ProgramItem = ({ item }) => {
    const isSelected = selectedProgram?.id === item.id;
    const Container = isSelected ? TouchableHighlight : TouchableOpacity;

    return (
      <Container
        key={item.id}
        onPress={() => handleBadgeClick(item.id)}
        style={
          isSelected
            ? [homeStyles.categoryBadge, { backgroundColor: 'white', borderWidth: 1, borderColor: COLORS.primary }]
            : [homeStyles.categoryBadgeSelected, { backgroundColor: COLORS.primary, borderWidth: 0 }]
        }
        underlayColor={COLORS.light_secondary}
      >
        <Text
          style={
            isSelected
              ? [homeStyles.categoryBadgeText, { color: COLORS.primary }]
              : [homeStyles.categoryBadgeTextSelected, { color: 'black' }]
          }
        >
          {item.class}
        </Text>
      </Container>
    );
  };

  // =============== Truncate file name for PDF ===============
  const truncateFileName = (name, maxLength = 30) => {
    if (name.length <= maxLength) return name;

    const start = name.slice(0, 15);
    const end = name.slice(-12);

    return `${start} ... ${end}`;
  };

  // =============== Get icon for PDF file ===============
  const getIconName = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();

    if (ext === 'pdf') return 'file-document-outline';

    return 'file-outline'; // Default icon if not PDF
  };

  // Accepted extensions for a single PDF file
  const acceptedExtensions = ['pdf'];

  // =============== Filter valid extension for single PDF ===============
  const filterValidFiles = (files) => {
    return files.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return acceptedExtensions.includes(ext);
    });
  };

  // =============== Handle File Selection for single PDF ===============
  const pickFile = async () => {
    if (isPicking) return;
    setIsPicking(true);

    try {
      const selectedFiles = await pick({
        mode: 'import',
        allowMultiSelection: false,  // Only allow one file
        types: [docTypes.pdf],        // Only allow PDF files
      });

      const validFiles = filterValidFiles(selectedFiles);

      if (validFiles.length === 0) {
        ToastAndroid.show(t('error.invalid_file_type'), ToastAndroid.LONG);
        console.warn("Le fichier sélectionné n'est pas un PDF valide.");
        return;
      }

      setFiles(validFiles); // Set only the first valid PDF file

    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.userCancelled) {
        console.log('L’utilisateur a annulé la sélection.');
      } else {
        console.error('Erreur lors de la sélection de fichier:', err);
      }
    } finally {
      setIsPicking(false); // reset, even in the case of error
    }
  };

  // ==================== UI rendering ====================
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
      <Spinner visible={isLoading} />

      {showBackToTop && (
        <TouchableOpacity
          style={[homeStyles.floatingButton, { bottom: 30, backgroundColor: COLORS.warning }]}
          onPress={scrollToTop}
        >
          <Icon name="chevron-double-up" size={IMAGE_SIZE.s09} style={{ color: 'black' }} />
        </TouchableOpacity>
      )}

      <Animated.ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        ref={scrollViewListRef}
        onScroll={handleScroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={headerHeight + TAB_BAR_HEIGHT} />}
      >
        <View style={{ flex: 1, paddingTop: headerHeight + TAB_BAR_HEIGHT }}>
          {/* Classes list */}
          <FlatList
            data={programs}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ height: 40, flexGrow: 0 }}
            contentContainerStyle={{
              alignItems: 'center',
              paddingHorizontal: PADDING.p00,
            }}
            renderItem={({ item }) => <ProgramItem item={item} />}
            ListFooterComponent={
              <TouchableOpacity style={{ width: 32, height: 32, backgroundColor: COLORS.primary, padding: 2.5, borderRadius: 37 / 2 }} onPress={() => setFormProgramModalVisible(true)}>
                <Icon name='plus' size={28} color='black' />
              </TouchableOpacity>
            }
          />

          {selectedProgram ? (
            <>
              {refreshing ? (
                <Text style={{ fontSize: TEXT_SIZE.paragraph, color: COLORS.black, textAlign: 'center', marginTop: PADDING.p05 }}>{t('loading')}</Text>
              ) : (
                <>
                  {/* Program details */}
                  <View style={{ flexDirection: 'row', padding: PADDING.p03 }}>
                    <View style={{ width: 160 }}>
                      <Pdf
                        trustAllCerts={false}
                        source={{ uri: selectedProgram.files[0].file_url, cache: true }}
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
                        page={pdfPage}
                        style={{ flex: 1, width: '100%', height: 230 }} />
                    </View>

                    <View style={{ flexShrink: 1, marginLeft: PADDING.p01, marginTop: PADDING.p05 }}>
                      <Text style={{ fontSize: TEXT_SIZE.title, color: COLORS.black, textAlign: 'left' }}>{t('program.title', { class: selectedProgram.class, course_year: selectedProgram.course_year.year })}</Text>
                      <TouchableOpacity style={homeStyles.linkIcon} onPress={() => setDocProgramModalVisible(true)}>
                        <Text style={[homeStyles.link, { color: COLORS.link_color }]}>{t('see_details')} </Text>
                        <Icon name='dock-window' size={IMAGE_SIZE.s05} color={COLORS.link_color} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Modal to see program details */}
                  <Modal visible={docProgramModalVisible} animationType='slide'>
                    <SafeAreaView contentContainerStyle={{ flexGrow: 1, padding: PADDING.p05, backgroundColor: COLORS.white }}>
                      <TouchableOpacity style={{ position: 'absolute', right: PADDING.p01, top: PADDING.p01, zIndex: 10, width: 37, height: 37, backgroundColor: 'rgba(200,200,200,0.5)', padding: 2.6, borderRadius: 37 / 2 }} onPress={() => setDocProgramModalVisible(false)}>
                        <Icon name='close' size={IMAGE_SIZE.s07} color='black' />
                      </TouchableOpacity>

                      <View style={{ height: Dimensions.get('window').height - 5, justifyContent: 'flex-start', alignItems: 'center' }}>
                        <Pdf
                          trustAllCerts={false}
                          source={{ uri: selectedProgram.files[0].file_url, cache: true }}
                          onLoadComplete={(numberOfPages, filePath) => {
                            console.log(`Number of pages: ${numberOfPages}`);
                          }}
                          onPageChanged={(page, numberOfPages) => {
                            console.log(`Current page: ${page}`);
                            // setPdfPage(page);
                          }}
                          onError={(error) => {
                            console.log(error);
                          }}
                          onPressLink={(uri) => {
                            console.log(`Link pressed: ${uri}`);
                          }}
                          page={pdfPage}
                          style={{ flex: 1, width: Dimensions.get('window').width, height: Dimensions.get('window').height, }} />
                      </View>
                    </SafeAreaView>
                  </Modal>
                </>
              )}
            </>

          ) : (
            <>
              {/* Empty list message */}
              <EmptyListComponent iconName="file-document-outline" title={t('empty_list.title')} description={t('empty_list.description_establishment_programs')} />
            </>
          )}

          {/* Modal to add a program */}
          <Modal visible={formProgramModalVisible} animationType='slide'>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white, padding: 20 }}>
              {/* Close modal */}
              <TouchableOpacity style={{ position: 'absolute', right: PADDING.p01, top: PADDING.p01, zIndex: 10, width: 37, height: 37, backgroundColor: 'rgba(200,200,200,0.5)', padding: 2.6, borderRadius: 37 / 2 }} onPress={() => setFormProgramModalVisible(false)}>
                <Icon name='close' size={IMAGE_SIZE.s07} color='black' />
              </TouchableOpacity>

              {/* Brand / Title */}
              <View style={[homeStyles.authlogo, { marginTop: PADDING.p05 }]}>
                <LogoText width={200} height={48} />
              </View>
              <Text style={[homeStyles.authTitle, { fontSize: 21, fontWeight: '300', color: COLORS.black, textAlign: 'center' }]}>{t('program.data.title', { course_year: course_year })}</Text>

              {/* Class */}
              <TextInput
                style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
                label={t('program.data.class')}
                value={newClass}
                placeholder={t('program.data.class')}
                placeholderTextColor={COLORS.dark_secondary}
                onChangeText={setNewClass}
              />

              {/* Selected file */}
              {files.length > 0 ? (
                <>
                  <FlatList
                    data={files}
                    scrollEnabled={false}
                    nestedScrollEnabled
                    keyExtractor={(item, index) => index.toString()}
                    style={{ flexGrow: 0 }}
                    renderItem={({ item, index }) => {
                      return (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.light_secondary, borderRadius: PADDING.p01, padding: PADDING.p01, marginVertical: PADDING.p01, }}>
                          {/* Icon associated with the file */}
                          <Icon name={getIconName(item.name)} size={22} color={COLORS.black} style={{ marginRight: 8 }} />

                          {/* File name */}
                          <Text style={{ flex: 1, color: COLORS.black }}>{truncateFileName(item.name)}</Text>

                          {/* Button to delete */}
                          <TouchableOpacity style={{ backgroundColor: COLORS.danger, padding: 6, borderRadius: PADDING.p07, marginLeft: 8, }}
                            onPress={() => {
                              const updatedFiles = [...files];
                              updatedFiles.splice(index, 1);
                              setFiles(updatedFiles);
                            }}
                          >
                            <Icon name="close" size={16} color="white" />
                          </TouchableOpacity>
                        </View>
                      )
                    }}
                  />
                </>
              ) : (
                <>
                  {/* Select File */}
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
                    }]} onPress={pickFile} disabled={isPicking}>
                    <Icon name='paperclip' color={COLORS.dark_secondary} size={30} />
                    <Text style={[homeStyles.authText, { color: COLORS.dark_secondary, marginLeft: PADDING.p01 }]}>{t('program.data.file')}</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Submit */}
              <Button style={[homeStyles.authButton, { backgroundColor: COLORS.success }]} onPress={addNewProgram}>
                <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('send')}</Text>
              </Button>
            </View>
          </Modal>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

// Events frame
const Events = ({ handleScroll, showBackToTop, listRef, headerHeight = 0 }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get parameters ===============
  const route = useRoute();
  const { organization_id } = route.params;
  // =============== Get data ===============
  const [selectedOrganization, setSelectedOrganization] = useState({});
  // Events list data
  const [events, setEvents] = useState([]);
  const [ad, setAd] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [count, setCount] = useState(0);
  // Form data
  const [formEventModalVisible, setFormEventModalVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [inputDescHeight, setInputDescHeight] = useState(40);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [eventPlace, setEventPlace] = useState('');
  const [eventPlaceAddress, setEventPlaceAddress] = useState('');
  const [imageData, setImageData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const flatListRef = listRef || useRef(null);
  // Show picker
  const [isStartPickerVisible, setStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setEndPickerVisible] = useState(false);
  // Loaders
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ================= Get current organization =================
  useEffect(() => {
    getOrganization();
  }, []);

  const getOrganization = () => {
    const config = {
      method: 'GET',
      url: `${API.boongo_url}/organization/${organization_id}`,
      headers: {
        'X-localization': 'fr',
        'Authorization': `Bearer ${userInfo.api_token}`,
      }
    };

    axios(config)
      .then(res => {
        const organizationData = res.data.data;

        setSelectedOrganization(organizationData);

        return organizationData;
      })
      .catch(error => {
        console.log(error);
      });
  };

  // ================= Get events list =================
  useEffect(() => {
    if (selectedOrganization && selectedOrganization.id) {
      fetchEvents(1); // INITIAL LOADING : Call fetchEvents once organization is available
    }
  }, [selectedOrganization]);

  useEffect(() => {
    if (page > 1) {
      if (selectedOrganization && selectedOrganization.id) {
        fetchEvents(page);
      }
    }
  }, [page]);

  const fetchEvents = async (pageToFetch = 1) => {
    if (isLoading || pageToFetch > lastPage || !selectedOrganization?.id) return;

    if (selectedOrganization && selectedOrganization.id) {
      try {
        const response = await axios.get(`${API.boongo_url}/event/find_by_organization/${organization_id}?page=${pageToFetch}`, { headers: { 'Content-Type': 'multipart/form-data', 'X-localization': 'fr', 'Authorization': `Bearer ${userInfo.api_token}` } });

        if (pageToFetch === 1) {
          setEvents(response.data.data);

        } else {
          setEvents(prev => [...prev, ...response.data.data]);
        }

        setAd(response.data.ad);
        setLastPage(response.data.lastPage);
        setCount(response.data.count);
      } catch (error) {
        if (error.response?.status === 429) {
          console.warn("Trop de requêtes envoyées. Attendez avant de réessayer.");
        } else {
          console.error(error);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // =============== Handle Image Picker ===============
  const imagePick = () => {
    ImagePicker.openPicker({
      width: 700,
      height: 700,
      cropping: true,
      includeBase64: true
    }).then(image => {
      setImageData(`data:${image.mime};base64,${image.data}`);
    }).catch(error => {
      console.log(`${error}`);
    });
  };

  // =============== Format Datetime ===============
  const formatDateForSQL = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' '); // Format 'YYYY-MM-DD HH:MM:SS'
  };

  // =============== Handle Add New Event ===============
  const handleAddEvent = () => {
    setIsLoading(true);

    axios.post(`${API.boongo_url}/event`, {
      event_title: eventTitle, event_description: eventDescription, start_at: formatDateForSQL(startDate), end_at: formatDateForSQL(endDate), event_place: (isOnline ? '' : eventPlace), image_64: imageData, type_id: 36, status_id: 11, organization_id: selectedOrganization.id
    }, {
      headers: { 'Authorization': `Bearer ${userInfo.api_token}` }
    }).then(res => {
      const message = res.data.message;

      ToastAndroid.show(`${message}`, ToastAndroid.LONG);
      console.log(`${message}`);

      setFormEventModalVisible(false);
      setIsLoading(false);

    }).catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
        console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

      } else if (error.request) {
        // The request was made but no response was received
        ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

      } else {
        // An error occurred while configuring the query
        ToastAndroid.show(`${error}`, ToastAndroid.LONG);
      }

      setIsLoading(false);
    });
  };

  // =============== Other functions ===============
  const scrollToTop = () => {
    flatListRef.current.scrollToOffset({ offset: 0, animated: true });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);

    if (selectedOrganization && selectedOrganization.id) {
      await fetchEvents(1);
    }

    setRefreshing(false);
  };

  const onEndReached = () => {
    if (!isLoading && page < lastPage) {
      const nextPage = page + 1;

      setPage(nextPage); // Update the page
    }
  };

  const combinedData = [...events];

  if (ad) {
    combinedData.push({ ...ad, realId: ad.id, id: 'ad' });
  }

  // =============== Event item ===============
  const EventItemComponent = ({ item }) => {
    return (
      <TouchableOpacity onPress={() => { navigation.navigate('Event', { event_id: item.id }) }} style={{ flexDirection: 'row', alignItems: 'center', padding: PADDING.p03, backgroundColor: COLORS.white }}>
        <Image source={{ uri: item.cover_url }} style={{ width: IMAGE_SIZE.s13, height: IMAGE_SIZE.s13, borderRadius: PADDING.p00, marginRight: PADDING.p03, borderWidth: 1, borderColor: COLORS.light_secondary }} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: COLORS.black, fontSize: TEXT_SIZE.paragraph, fontWeight: '500' }}>{`${item.event_title}`}</Text>
          <Text numberOfLines={2} style={{ color: COLORS.dark_secondary }}>{`${item.event_description}`}</Text>
        </View>
        <Icon name="chevron-right" size={IMAGE_SIZE.s05} color={COLORS.black} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
      <Spinner visible={isLoading} />

      {showBackToTop && (
        <TouchableOpacity style={[homeStyles.floatingButton, { backgroundColor: COLORS.warning }]} onPress={scrollToTop}>
          <Icon name='chevron-double-up' size={IMAGE_SIZE.s09} style={{ color: 'black' }} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={[homeStyles.floatingButton, { bottom: 30, backgroundColor: COLORS.primary }]} onPress={() => setFormEventModalVisible(true)}>
        <Icon name='plus' size={IMAGE_SIZE.s07} style={{ color: 'white' }} />
      </TouchableOpacity>

      <SafeAreaView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Events list */}
        <View style={[homeStyles.cardEmpty, { height: Dimensions.get('window').height, marginLeft: 0, paddingHorizontal: 2 }]}>
          {/* Events List */}
          <Animated.FlatList
            ref={flatListRef}
            data={combinedData}
            extraData={combinedData}
            keyExtractor={(item, index) => `${item.id || 'no-id'}-${index}`}
            renderItem={({ item }) => (<EventItemComponent item={item} />)}
            horizontal={false}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.1}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingTop: headerHeight + TAB_BAR_HEIGHT }}
            windowSize={10}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={headerHeight + TAB_BAR_HEIGHT} />}
            contentInset={{ top: 0 }}
            contentOffset={{ y: 0 }}
            ListEmptyComponent={<EmptyListComponent iconName='calendar-outline' title={t('empty_list.title')} description={selectedOrganization && selectedOrganization.type && selectedOrganization.type.alias ? (selectedOrganization.type.alias === 'government_organization' ? t('empty_list.description_government_events') : t('empty_list.description_establishment_events')) : '...'} />}
            ListFooterComponent={() =>
              isLoading ? (
                <Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01 }}>{t('loading')}</Text>
              ) : null
            }
          />
        </View>

        {/* Modal to add an event */}
        <Modal animationType='slide' transparent={true} visible={formEventModalVisible} onRequestClose={() => setFormEventModalVisible(false)}>
          <ScrollView style={{ flex: 1, backgroundColor: COLORS.white }}>
            {/* Close modal */}
            <TouchableOpacity style={{ position: 'absolute', right: PADDING.p01, top: PADDING.p01, zIndex: 10, width: 37, height: 37, backgroundColor: 'rgba(200,200,200,0.5)', padding: 2.6, borderRadius: 37 / 2 }} onPress={() => setFormEventModalVisible(false)}>
              <Icon name='close' size={IMAGE_SIZE.s07} color='black' />
            </TouchableOpacity>

            {/* Brand / Title */}
            <View style={[homeStyles.authlogo, { marginTop: PADDING.p15 }]}>
              <LogoText width={200} height={48} />
            </View>
            <Text style={[homeStyles.authTitle, { fontSize: 21, fontWeight: '300', color: COLORS.black, textAlign: 'center' }]}>{t('event.create')}</Text>

            {/* Event cover */}
            <View style={{ position: 'relative', width: Dimensions.get('window').width, marginVertical: PADDING.p01 }}>
              <TouchableOpacity style={{ position: 'absolute', top: 10, right: 10, zIndex: 9, backgroundColor: COLORS.primary, marginLeft: 140, borderRadius: 40 / 2, padding: PADDING.p01 }} onPress={imagePick}>
                <Icon name='lead-pencil' size={20} color='white' />
              </TouchableOpacity>
              <Image style={{ width: Dimensions.get('window').width, height: 250 }} source={{ uri: imageData || `${WEB.boongo_url}/assets/img/banner-event.png` }} />
            </View>

            <View style={{ padding: PADDING.p07 }}>
              {/* Event title */}
              <TextInput
                style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
                label={t('event.data.event_title')}
                value={eventTitle}
                placeholder={t('event.data.event_title')}
                placeholderTextColor={COLORS.dark_secondary}
                onChangeText={setEventTitle}
              />

              {/* Event description */}
              <TextInput
                multiline
                onContentSizeChange={(e) =>
                  setInputDescHeight(e.nativeEvent.contentSize.height)
                }
                style={[homeStyles.authInput, { height: Math.max(40, inputDescHeight), color: COLORS.black, borderColor: COLORS.light_secondary }]}
                value={eventDescription}
                placeholder={t('event.data.event_description')}
                placeholderTextColor={COLORS.dark_secondary}
                onChangeText={setEventDescription} />

              <View style={{ flexDirection: 'row', width: '100%', marginBottom: PADDING.p01, padding: PADDING.p00, borderWidth: 1, borderColor: COLORS.light_secondary, borderRadius: 5 }}>
                {/* Start at */}
                <View style={{ width: '50%', paddingVertical: PADDING.p00 }}>
                  <Icon name='calendar' size={IMAGE_SIZE.s09} color={COLORS.dark_secondary} style={{ alignSelf: 'center' }} />
                  <Text style={{ textAlign: 'center', color: COLORS.dark_secondary }}>{t('event.data.start_at')}</Text>
                  <TouchableOpacity onPress={() => setStartPickerVisible(true)}>
                    <Text style={{ color: COLORS.black, textAlign: 'center' }}>{startDate.toLocaleString()}</Text>
                  </TouchableOpacity>

                  <DateTimePickerModal
                    isVisible={isStartPickerVisible}
                    mode="datetime"
                    date={startDate}
                    onConfirm={date => {
                      setStartDate(date);
                      setStartPickerVisible(false);  // ← refermer en premier :contentReference[oaicite:1]{index=1}
                    }}
                    onCancel={() => setStartPickerVisible(false)}
                  />
                </View>

                {/* End at */}
                <View style={{ width: '50%', paddingVertical: PADDING.p00 }}>
                  <Icon name='calendar' size={IMAGE_SIZE.s09} color={COLORS.dark_secondary} style={{ alignSelf: 'center' }} />
                  <Text style={{ textAlign: 'center', color: COLORS.dark_secondary }}>{t('event.data.end_at')}</Text>
                  <TouchableOpacity onPress={() => setEndPickerVisible(true)}>
                    <Text style={{ color: COLORS.black, textAlign: 'center' }}>{endDate.toLocaleString()}</Text>
                  </TouchableOpacity>

                  <DateTimePickerModal
                    isVisible={isEndPickerVisible}
                    mode="datetime"
                    date={endDate}
                    onConfirm={date => {
                      setEndDate(date);
                      setEndPickerVisible(false);
                    }}
                    onCancel={() => setEndPickerVisible(false)}
                  />
                </View>
              </View>

              {/* Choose whether the event is online */}
              <View style={{ width: Dimensions.get('window').width - PADDING.p15 }}>
                <TouchableOpacity onPress={() => setIsOnline(!isOnline)} style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: PADDING.p00 }}>
                  <Icon name={!isOnline ? 'checkbox-blank-outline' : 'checkbox-outline'} size={IMAGE_SIZE.s07} color={!isOnline ? COLORS.dark_secondary : COLORS.black} />
                  <Text style={{ color: COLORS.dark_secondary, marginLeft: PADDING.p00 }}>{t('event.data.is_online')}</Text>
                </TouchableOpacity>

                {/* Champ de lieu ou URL */}
                {!isOnline && (
                  <>
                    <TextInput
                      style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
                      label={t('event.data.event_place')}
                      value={eventPlace}
                      placeholder={t('event.data.event_place')}
                      placeholderTextColor={COLORS.dark_secondary}
                      onChangeText={setEventPlace}
                    />

                    <TextInput
                      style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
                      label={t('event.data.event_place_address')}
                      value={eventPlaceAddress}
                      placeholder={t('event.data.event_place_address')}
                      placeholderTextColor={COLORS.dark_secondary}
                      onChangeText={setEventPlaceAddress}
                    />
                  </>
                )}
                {/* {isOnline && (
                  <TextInput
                    placeholder="URL de l'événement"
                    value={eventPlace}
                    onChangeText={setEventPlace}
                    style={{ borderBottomWidth: 1, marginBottom: 10 }}
                  />
                )} */}
              </View>

              {/* Submit */}
              <Button style={[homeStyles.authButton, { backgroundColor: COLORS.success }]} onPress={handleAddEvent}>
                <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('send')}</Text>
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

// Books frame
const Books = ({ handleScroll, showBackToTop, listRef, headerHeight = 0 }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get parameters ===============
  const route = useRoute();
  const { organization_id } = route.params;
  // =============== Get data ===============
  const [selectedOrganization, setSelectedOrganization] = useState({});
  const [categories, setCategories] = useState([]);
  const [idCat, setIdCat] = useState(0);
  const [books, setBooks] = useState([]);
  const [ad, setAd] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = listRef || useRef(null);

  // ================= Get current organization =================
  useEffect(() => {
    getOrganization();
  }, []);

  const getOrganization = () => {
    const config = {
      method: 'GET',
      url: `${API.boongo_url}/organization/${organization_id}`,
      headers: {
        'X-localization': 'fr',
        'Authorization': `Bearer ${userInfo.api_token}`,
      }
    };

    axios(config)
      .then(res => {
        const organizationData = res.data.data;

        setSelectedOrganization(organizationData);

        return organizationData;
      })
      .catch(error => {
        console.log(error);
      });
  };

  // ================= Get categories =================
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const headers = {
      'X-localization': 'fr',
      Authorization: `Bearer ${userInfo.api_token}`,
    };

    try {
      const res = await axios.get(`${API.boongo_url}/category/find_by_group/Catégorie%20pour%20œuvre`, { headers });
      const data = res.data.data;
      const itemAll = { id: 0, category_name: t('all_f'), category_name_fr: "Toutes", category_name_en: "All", category_name_ln: "Nioso", category_description: null, };

      data.unshift(itemAll);
      setCategories(data);
      setIdCat(itemAll.id);

    } catch (error) {
      console.error('Erreur fetchCategories', error);
    }
  };

  // ================= Get events list =================
  useEffect(() => {
    if (selectedOrganization && selectedOrganization.id) {
      fetchBooks(1); // INITIAL LOADING : Call fetchBooks once organization is available
    }
  }, [selectedOrganization]);

  useEffect(() => {
    if (page > 1) {
      if (selectedOrganization && selectedOrganization.id) {
        fetchBooks(page);
      }
    }
  }, [page]);

  const fetchBooks = async (pageToFetch = 1) => {
    if (isLoading || pageToFetch > lastPage || !selectedOrganization?.id) return;
    setIsLoading(true);

    const qs = require('qs');
    const url = `${API.boongo_url}/work/filter_by_categories?page=${pageToFetch}`;
    const params = {
      'categories_ids[0]': idCat,
      type_id: 29,
      status_id: 17,
      organization_id: selectedOrganization.id,
    };
    const headers = {
      'X-localization': 'fr',
      Authorization: `Bearer ${userInfo.api_token}`,
    };

    try {
      const response = await axios.post(url, qs.stringify(params), { headers });
      const data = response.data.data || [];

      setBooks(prev => (page === 1 ? data : [...prev, ...data]));
      setAd(response.data.ad || null);
      setLastPage(response.data.lastPage || page);
      setCount(response.data.count || 0);

      // console.log(response.data);

    } catch (error) {
      console.error('Erreur fetchBooks', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= Combined data =================
  const combinedData = [...books];

  if (ad) {
    combinedData.push({ ...ad, id: 'ad', realId: ad.id });
  }

  // ================= Handlers =================
  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setBooks([]);

    if (selectedOrganization && selectedOrganization.id) {
      await fetchBooks(1);
    }

    setRefreshing(false);
  };

  const onEndReached = () => {
    if (!isLoading && page < lastPage) {
      setPage(prev => prev + 1);
    }
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleBadgePress = useCallback((id) => {
    setIdCat(id);
    setPage(1);
    setBooks([]);
    setLastPage(1);
  }, []);

  const CategoryItem = ({ item }) => {
    const isSelected = idCat === item.id;
    const Container = isSelected ? TouchableHighlight : TouchableOpacity;

    return (
      <Container
        key={item.id}
        onPress={() => handleBadgePress(item.id)}
        style={
          isSelected
            ? [homeStyles.categoryBadgeSelected, { backgroundColor: COLORS.white }]
            : [homeStyles.categoryBadge, { backgroundColor: COLORS.info }]
        }
        underlayColor={COLORS.light_secondary}
      >
        <Text
          style={
            isSelected
              ? [homeStyles.categoryBadgeTextSelected, { color: COLORS.black }]
              : [homeStyles.categoryBadgeText, { color: 'black' }]
          }
        >
          {item.category_name}
        </Text>
      </Container>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
      {showBackToTop && (
        <TouchableOpacity style={[homeStyles.floatingButton, { backgroundColor: COLORS.warning }]} onPress={scrollToTop}>
          <Icon name='chevron-double-up' size={IMAGE_SIZE.s09} style={{ color: 'black' }} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={[homeStyles.floatingButton, { bottom: 30, backgroundColor: COLORS.success }]} onPress={() => navigation.navigate('AddWork', { owner: 'organization', ownerId: selectedOrganization.id })}>
        <Icon name='plus' size={IMAGE_SIZE.s07} style={{ color: 'white' }} />
      </TouchableOpacity>

      <SafeAreaView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Books List */}
        <Animated.FlatList
          ref={flatListRef}
          data={combinedData}
          extraData={combinedData}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <WorkItemComponent item={item} />}
          horizontal={false}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.1}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: headerHeight + TAB_BAR_HEIGHT }}
          windowSize={10}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={headerHeight + TAB_BAR_HEIGHT} />}
          contentInset={{ top: 0 }}
          contentOffset={{ y: 0 }}
          ListEmptyComponent={<EmptyListComponent iconName="book-open-page-variant-outline" title={t('empty_list.title')} description={t('empty_list.description_establishment_books')} />}
          ListHeaderComponent={
            <>
              <FlatList
                data={categories}
                keyExtractor={item => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ height: 40, flexGrow: 0 }}
                contentContainerStyle={{
                  alignItems: 'center',
                  paddingHorizontal: PADDING.p00,
                }}
                renderItem={({ item }) => <CategoryItem item={item} />}
              />
            </>
          }
          ListFooterComponent={() => isLoading ? (<Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01, }} >{t('loading')}</Text>) : null}
        />

      </SafeAreaView>
    </View>
  );
};

// Teach frame
const Teach = ({ handleScroll, showBackToTop, listRef, headerHeight = 0 }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get parameters ===============
  const route = useRoute();
  const { organization_id } = route.params;
  // =============== Get data ===============
  const [selectedOrganization, setSelectedOrganization] = useState({});
  // Events list data
  const [events, setEvents] = useState([]);
  const [ad, setAd] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [count, setCount] = useState(0);
  // Form data
  const [formEventModalVisible, setFormEventModalVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [inputDescHeight, setInputDescHeight] = useState(40);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [eventPlace, setEventPlace] = useState('');
  const [imageData, setImageData] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const flatListRef = listRef || useRef(null);
  // Show picker
  const [isStartPickerVisible, setStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setEndPickerVisible] = useState(false);
  // Loaders
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ================= Get current organization =================
  useEffect(() => {
    getOrganization();
  }, []);

  const getOrganization = () => {
    const config = {
      method: 'GET',
      url: `${API.boongo_url}/organization/${organization_id}`,
      headers: {
        'X-localization': 'fr',
        'Authorization': `Bearer ${userInfo.api_token}`,
      }
    };

    axios(config)
      .then(res => {
        const organizationData = res.data.data;

        setSelectedOrganization(organizationData);

        return organizationData;
      })
      .catch(error => {
        console.log(error);
      });
  };

  // ================= Get events list =================
  useEffect(() => {
    if (selectedOrganization && selectedOrganization.id) {
      fetchEvents(1); // INITIAL LOADING : Call fetchEvents once organization is available
    }
  }, [selectedOrganization]);

  useEffect(() => {
    if (page > 1) {
      if (selectedOrganization && selectedOrganization.id) {
        fetchEvents(page);
      }
    }
  }, [page]);

  const fetchEvents = async (pageToFetch = 1) => {
    if (isLoading || pageToFetch > lastPage || !selectedOrganization?.id) return;

    const qs = require('qs');
    const url = `${API.boongo_url}/event/filter_for_organization/${selectedOrganization.id}?page=${pageToFetch}`;
    const mParams = { category_id: 30 };
    const mHeaders = {
      'X-localization': 'fr',
      'Authorization': `Bearer ${userInfo.api_token}`
    };

    if (selectedOrganization && selectedOrganization.id) {
      try {
        const response = await axios.post(url, qs.stringify(mParams), { headers: mHeaders });

        if (pageToFetch === 1) {
          setEvents(response.data.data);

        } else {
          setEvents(prev => [...prev, ...response.data.data]);
        }

        setAd(response.data.ad);
        setLastPage(response.data.lastPage);
        setCount(response.data.count);
      } catch (error) {
        if (error.response?.status === 429) {
          console.warn("Trop de requêtes envoyées. Attendez avant de réessayer.");
        } else {
          console.error(error);
        }
      } finally {
        setIsLoading(false);
      }
    }

    setIsLoading(false);
  };

  // =============== Handle Image Picker ===============
  const imagePick = () => {
    ImagePicker.openPicker({
      width: 700,
      height: 700,
      cropping: true,
      includeBase64: true
    }).then(image => {
      setImageData(`data:${image.mime};base64,${image.data}`);
    }).catch(error => {
      console.log(`${error}`);
    });
  };

  // =============== Format Datetime ===============
  const formatDateForSQL = (date) => {
    return date.toISOString().slice(0, 19).replace('T', ' '); // Format 'YYYY-MM-DD HH:MM:SS'
  };

  // =============== Handle Add New Event ===============
  const handleAddEvent = () => {
    setIsLoading(true);

    axios.post(`${API.boongo_url}/event`, {
      event_title: eventTitle, event_description: eventDescription, start_at: formatDateForSQL(startDate), end_at: formatDateForSQL(endDate), event_place: (isOnline ? '' : eventPlace), image_64: imageData, type_id: 36, status_id: 11, organization_id: selectedOrganization.id
    }, {
      headers: { 'Authorization': `Bearer ${userInfo.api_token}` }
    }).then(res => {
      const message = res.data.message;

      ToastAndroid.show(`${message}`, ToastAndroid.LONG);
      console.log(`${message}`);

      setFormEventModalVisible(false);
      setIsLoading(false);

    }).catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
        console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

      } else if (error.request) {
        // The request was made but no response was received
        ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

      } else {
        // An error occurred while configuring the query
        ToastAndroid.show(`${error}`, ToastAndroid.LONG);
      }

      setIsLoading(false);
    });
  };

  // =============== Other functions ===============
  const scrollToTop = () => {
    flatListRef.current.scrollToOffset({ offset: 0, animated: true });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);

    if (selectedOrganization && selectedOrganization.id) {
      await fetchEvents(1);
    }

    setRefreshing(false);
  };

  const onEndReached = () => {
    if (!isLoading && page < lastPage) {
      const nextPage = page + 1;

      setPage(nextPage); // Update the page
    }
  };

  const combinedData = [...events];

  if (ad) {
    combinedData.push({ ...ad, realId: ad.id, id: 'ad' });
  }

  // =============== Event item ===============
  const EventItemComponent = ({ item }) => {
    return (
      <TouchableOpacity onPress={() => { navigation.navigate('Event', { event_id: item.id }) }} style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: PADDING.p03,
        backgroundColor: COLORS.white
      }}>
        <Image
          source={{ uri: item.cover_url }}
          style={{
            width: IMAGE_SIZE.s13,
            height: IMAGE_SIZE.s13,
            borderRadius: PADDING.p00,
            marginRight: PADDING.p03,
            borderWidth: 1,
            borderColor: COLORS.light_secondary
          }}
        />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: COLORS.black, fontSize: TEXT_SIZE.paragraph, fontWeight: '500' }}>{`${item.event_title}`}</Text>
          <Text numberOfLines={2} style={{ color: COLORS.dark_secondary }}>{`${item.event_description}`}</Text>
        </View>
        <Icon name="chevron-right" size={IMAGE_SIZE.s05} color={COLORS.black} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
      <Spinner visible={isLoading} />

      {showBackToTop && (
        <TouchableOpacity style={[homeStyles.floatingButton, { backgroundColor: COLORS.warning }]} onPress={scrollToTop}>
          <Icon name='chevron-double-up' size={IMAGE_SIZE.s09} style={{ color: 'black' }} />
        </TouchableOpacity>
      )}
      {/* <TouchableOpacity style={[homeStyles.floatingButton, { bottom: 30, backgroundColor: COLORS.primary }]} onPress={() => setFormEventModalVisible(true)}> */}
      <TouchableOpacity style={[homeStyles.floatingButton, { bottom: 30, backgroundColor: COLORS.primary }]} onPress={() => { ToastAndroid.show('Boongo Teach sera bientôt disponible', ToastAndroid.LONG) }}>
        <Icon name='plus' size={IMAGE_SIZE.s07} style={{ color: 'white' }} />
      </TouchableOpacity>

      <SafeAreaView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Events list */}
        <View style={[homeStyles.cardEmpty, { height: Dimensions.get('window').height, marginLeft: 0, paddingHorizontal: 2 }]}>
          {/* Events List */}
          <Animated.FlatList
            ref={flatListRef}
            data={combinedData}
            extraData={combinedData}
            keyExtractor={(item, index) => `${item.id || 'no-id'}-${index}`}
            renderItem={({ item }) => (<EventItemComponent item={item} />)}
            horizontal={false}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.1}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingTop: headerHeight + TAB_BAR_HEIGHT }}
            windowSize={10}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={headerHeight + TAB_BAR_HEIGHT} />}
            contentInset={{ top: 0 }}
            contentOffset={{ y: 0 }}
            ListEmptyComponent={<EmptyListComponent iconName='brain' title={t('empty_list.title')} description={t('empty_list.description_establishment_teach')} />}
            ListFooterComponent={() =>
              isLoading ? (
                <Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01 }}>{t('loading')}</Text>
              ) : null
            }
          />
        </View>

        {/* Modal to add an event */}
        <Modal animationType='slide' transparent={true} visible={formEventModalVisible} onRequestClose={() => setFormEventModalVisible(false)}>
          <ScrollView style={{ flex: 1, backgroundColor: COLORS.white }}>
            {/* Close modal */}
            <TouchableOpacity style={{ position: 'absolute', right: PADDING.p01, top: PADDING.p01, zIndex: 10, width: 37, height: 37, backgroundColor: 'rgba(200,200,200,0.5)', padding: 2.6, borderRadius: 37 / 2 }} onPress={() => setFormEventModalVisible(false)}>
              <Icon name='close' size={IMAGE_SIZE.s07} color='black' />
            </TouchableOpacity>

            {/* Brand / Title */}
            <View style={[homeStyles.authlogo, { marginTop: PADDING.p15 }]}>
              <LogoText width={200} height={48} />
            </View>
            <Text style={[homeStyles.authTitle, { fontSize: 21, fontWeight: '300', color: COLORS.black, textAlign: 'center' }]}>{t('event.create')}</Text>

            {/* Event cover */}
            <View style={{ position: 'relative', width: Dimensions.get('window').width, marginVertical: PADDING.p01 }}>
              <TouchableOpacity style={{ position: 'absolute', top: 10, right: 10, zIndex: 9, backgroundColor: COLORS.primary, marginLeft: 140, borderRadius: 40 / 2, padding: PADDING.p01 }} onPress={imagePick}>
                <Icon name='lead-pencil' size={20} color='white' />
              </TouchableOpacity>
              <Image style={{ width: Dimensions.get('window').width, height: 250 }} source={{ uri: imageData || `${WEB.boongo_url}/assets/img/banner-event.png` }} />
            </View>

            <View style={{ padding: PADDING.p07 }}>
              {/* Event title */}
              <TextInput
                style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
                label={t('event.data.event_title')}
                value={eventTitle}
                placeholder={t('event.data.event_title')}
                placeholderTextColor={COLORS.dark_secondary}
                onChangeText={setEventTitle}
              />

              {/* Event description */}
              <TextInput
                multiline
                onContentSizeChange={(e) =>
                  setInputDescHeight(e.nativeEvent.contentSize.height)
                }
                style={[homeStyles.authInput, { height: Math.max(40, inputDescHeight), color: COLORS.black, borderColor: COLORS.light_secondary }]}
                value={eventDescription}
                placeholder={t('event.data.event_description')}
                placeholderTextColor={COLORS.dark_secondary}
                onChangeText={setEventDescription} />

              <View style={{ flexDirection: 'row', width: '100%', marginBottom: PADDING.p01, padding: PADDING.p00, borderWidth: 1, borderColor: COLORS.light_secondary, borderRadius: 5 }}>
                {/* Start at */}
                <View style={{ width: '50%', paddingVertical: PADDING.p00 }}>
                  <Icon name='calendar' size={IMAGE_SIZE.s09} color={COLORS.dark_secondary} style={{ alignSelf: 'center' }} />
                  <Text style={{ textAlign: 'center', color: COLORS.dark_secondary }}>{t('event.data.start_at')}</Text>
                  <TouchableOpacity onPress={() => setStartPickerVisible(true)}>
                    <Text style={{ color: COLORS.black, textAlign: 'center' }}>{startDate.toLocaleString()}</Text>
                  </TouchableOpacity>

                  <DateTimePickerModal
                    isVisible={isStartPickerVisible}
                    mode="datetime"
                    date={startDate}
                    onConfirm={date => {
                      setStartDate(date);
                      setStartPickerVisible(false);  // ← refermer en premier :contentReference[oaicite:1]{index=1}
                    }}
                    onCancel={() => setStartPickerVisible(false)}
                  />
                </View>

                {/* End at */}
                <View style={{ width: '50%', paddingVertical: PADDING.p00 }}>
                  <Icon name='calendar' size={IMAGE_SIZE.s09} color={COLORS.dark_secondary} style={{ alignSelf: 'center' }} />
                  <Text style={{ textAlign: 'center', color: COLORS.dark_secondary }}>{t('event.data.end_at')}</Text>
                  <TouchableOpacity onPress={() => setEndPickerVisible(true)}>
                    <Text style={{ color: COLORS.black, textAlign: 'center' }}>{endDate.toLocaleString()}</Text>
                  </TouchableOpacity>

                  <DateTimePickerModal
                    isVisible={isEndPickerVisible}
                    mode="datetime"
                    date={endDate}
                    onConfirm={date => {
                      setEndDate(date);
                      setEndPickerVisible(false);
                    }}
                    onCancel={() => setEndPickerVisible(false)}
                  />
                </View>
              </View>

              {/* Choose whether the event is online */}
              <View style={{ width: Dimensions.get('window').width - PADDING.p15 }}>
                <TouchableOpacity onPress={() => setIsOnline(!isOnline)} style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: PADDING.p00 }}>
                  <Icon name={!isOnline ? 'checkbox-blank-outline' : 'checkbox-outline'} size={IMAGE_SIZE.s07} color={!isOnline ? COLORS.dark_secondary : COLORS.black} />
                  <Text style={{ color: COLORS.dark_secondary, marginLeft: PADDING.p00 }}>{t('event.data.is_online')}</Text>
                </TouchableOpacity>

                {/* Champ de lieu ou URL */}
                {!isOnline && (
                  <TextInput
                    style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
                    label={t('event.data.event_place')}
                    value={eventPlace}
                    placeholder={t('event.data.event_place')}
                    placeholderTextColor={COLORS.dark_secondary}
                    onChangeText={setEventPlace}
                  />
                )}
                {/* {isOnline && (
                  <TextInput
                    placeholder="URL de l'événement"
                    value={eventPlace}
                    onChangeText={setEventPlace}
                    style={{ borderBottomWidth: 1, marginBottom: 10 }}
                  />
                )} */}
              </View>

              {/* Submit */}
              <Button style={[homeStyles.authButton, { backgroundColor: COLORS.success }]} onPress={handleAddEvent}>
                <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('send')}</Text>
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

// OrganizationDataScreen
const OrganizationDataScreen = () => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get parameters ===============
  const route = useRoute();
  const { organization_id, type } = route.params;
  // =============== Get data ===============
  const [selectedOrganization, setSelectedOrganization] = useState({});

  const scheduleListRef = useRef(null);
  const eventListRef = useRef(null);
  const booksListRef = useRef(null);
  const teachListRef = useRef(null);

  const [index, setIndex] = useState(0); // State for managing active tab index
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showBackToTopByTab, setShowBackToTopByTab] = (type === 'government' ? useState({ event: false }) : useState({ schedule: false, event: false, books: false, teach: false }));

  const scrollY = useRef(new Animated.Value(0)).current;
  const savedScrollOffsets = (type === 'government' ? useRef({ event: 0 }) : useRef({ schedule: 0, event: 0, books: 0, teach: 0 }));
  const clampedScrollY = Animated.diffClamp(scrollY, 0, headerHeight);

  const headerTranslateY = clampedScrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolate: 'clamp',
  });

  const [routes] = type === 'government' ?
    useState([{ key: 'event', title: t('navigation.government.event') }]) :
    useState([
      { key: 'schedule', title: t('navigation.establishment.course_schedule') },
      { key: 'event', title: t('navigation.establishment.event') },
      { key: 'books', title: t('navigation.establishment.authors.books') },
      { key: 'teach', title: 'Boongo Teach' },
    ]);

  const renderScene = ({ route }) => {
    const sceneProps = {
      handleScroll,
      headerHeight,
      selectedOrganization, // <-- important : on passe l'organisation aux scènes
    };

    if (type === 'government') {
      return <Events {...sceneProps} handleScroll={handleScroll} showBackToTop={showBackToTopByTab.event} listRef={eventListRef} />;

    } else {
      switch (route.key) {
        case 'schedule':
          return <Schedule {...sceneProps} handleScroll={handleScroll} showBackToTop={showBackToTopByTab.schedule} listRef={scheduleListRef} />;
        case 'event':
          return <Events {...sceneProps} handleScroll={handleScroll} showBackToTop={showBackToTopByTab.event} listRef={eventListRef} />;
        case 'books':
          return <Books {...sceneProps} handleScroll={handleScroll} showBackToTop={showBackToTopByTab.books} listRef={booksListRef} />;
        case 'teach':
          return <Teach {...sceneProps} handleScroll={handleScroll} showBackToTop={showBackToTopByTab.teach} listRef={teachListRef} />;
        default:
          return null;
      }
    }
  };

  // Handle scrolling and show/hide the header
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const currentTab = (type === 'government' ? 'event' : (index === 0 ? 'schedule' : (index === 1 ? 'event' : (index === 2 ? 'books' : 'teach'))));

        savedScrollOffsets.current[currentTab] = offsetY;

        const isAtTop = (offsetY <= 0);
        setShowBackToTopByTab(prev => ({
          ...prev,
          [currentTab]: !isAtTop,
        }));
      },
    }
  );

  // On "TabBar" index change
  const handleIndexChange = (newIndex) => {
    const newTabKey = (type === 'government' ? 'event' : (newIndex === 0 ? 'schedule' : (newIndex === 1 ? 'event' : (newIndex === 2 ? 'books' : 'teach'))));
    const offset = savedScrollOffsets.current[newTabKey] || 0;

    // Animate scrollY back to the saved offset smoothly (for header + tabbar)
    Animated.timing(scrollY, {
      toValue: offset,
      duration: 300, // 300ms for smooth effect
      useNativeDriver: true,
    }).start();

    // Scroll the inner list to the saved offset
    if (type === 'government') {
      eventListRef.current?.scrollToOffset({ offset, animated: true });

    } else {
      if (newIndex === 0 && scheduleListRef.current) {
        scheduleListRef.current.scrollTo({ offset, animated: true });

      } else if (newIndex === 1 && eventListRef.current) {
        eventListRef.current.scrollToOffset({ offset, animated: true });

      } else if (newIndex === 2 && booksListRef.current) {
        booksListRef.current.scrollToOffset({ offset, animated: true });

      } else if (newIndex === 3 && teachListRef.current) {
        teachListRef.current.scrollToOffset({ offset, animated: true });
      }
    }

    setIndex(newIndex);
  };

  // ================= Get current organization =================
  useEffect(() => {
    getOrganization();
  }, []); // <-- CORRECTION : une seule fois au montage

  const getOrganization = () => {
    const config = {
      method: 'GET',
      url: `${API.boongo_url}/organization/${organization_id}`,
      headers: {
        'X-localization': 'fr',
        'Authorization': `Bearer ${userInfo.api_token}`,
      }
    };

    axios(config)
      .then(res => {
        const organizationData = res.data.data;

        setSelectedOrganization(organizationData);

        return organizationData;
      })
      .catch(error => {
        console.log(error);
      });
  };

  // Custom "TabBar"
  const renderTabBar = (props) => (
    <>
      <Animated.View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)} style={{ transform: [{ translateY: headerTranslateY }], zIndex: 1000, position: 'absolute', top: 0, width: '100%', backgroundColor: COLORS.white, paddingTop: 20 }}>
        {/* Status bar */}
        <StatusBar barStyle='dark-content' backgroundColor={COLORS.warning} />

        {/* Content */}
        <View style={{ backgroundColor: COLORS.white }}>
          {/* Top buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', left: 7, top: -10, zIndex: 10, width: Dimensions.get('window').width - 20 }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name='chevron-left' size={37} color={COLORS.black} />
            </TouchableOpacity>
            {selectedOrganization.user_id === userInfo.id && (
              <TouchableOpacity onPress={() => navigation.navigate('OrganizationSettings', { organization_id: organization_id })}>
                <Icon name='cog-outline' size={28} color={COLORS.black} />
              </TouchableOpacity>
            )}
          </View>

          {/* Profile / Cover */}
          <View style={{ flexDirection: 'column', width: Dimensions.get('window').width, justifyContent: 'flex-start', alignItems: 'flex-start', paddingTop: PADDING.p02, paddingHorizontal: PADDING.p02 }}>
            <Image style={{ width: 160, height: 160, borderRadius: PADDING.p04, borderWidth: 3, borderColor: COLORS.light_secondary, alignSelf: 'center' }} source={{ uri: selectedOrganization.cover_url || `${WEB.boongo_url}/assets/img/banner-organization.png` }} />
            <View style={{ flexDirection: 'column', width: '100%', justifyContent: 'center', paddingTop: PADDING.p01 }}>
              <Text style={{ fontSize: 25, fontWeight: '500', color: COLORS.black, textAlign: 'center' }}>{`${selectedOrganization.org_name || '...'}`}</Text>
              {selectedOrganization.org_acronym &&
                <Text style={{ fontSize: 13, fontWeight: '400', color: COLORS.black, textAlign: 'center', marginTop: 8 }}>
                  {selectedOrganization.org_acronym}
                </Text>
              }
              {selectedOrganization.org_description &&
                <Text style={{ fontSize: 14, fontWeight: '400', color: COLORS.dark_secondary, textAlign: 'center', marginTop: 8 }}>
                  {selectedOrganization.org_description}
                </Text>
              }
              {selectedOrganization.website_url &&
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', marginTop: 8 }}>
                  <Icon name='web' size={16} color={COLORS.black} style={{ marginTop: 1, marginRight: PADDING.p00 }} />
                  <Text style={{ fontSize: 13, fontWeight: '400', color: COLORS.link_color, textAlign: 'center' }} onPress={() => Linking.openURL(selectedOrganization.website_url)}>
                    {selectedOrganization.website_url}
                  </Text>
                </View>
              }
              {selectedOrganization.email &&
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', marginTop: 8 }}>
                  <Icon name='email' size={16} color={COLORS.black} style={{ marginTop: 1, marginRight: PADDING.p00 }} />
                  <Text style={{ fontSize: 13, fontWeight: '400', color: COLORS.black, textAlign: 'center' }}>
                    {selectedOrganization.email}
                  </Text>
                </View>
              }
              {selectedOrganization.phone &&
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', marginTop: 8 }}>
                  <Icon name='phone' size={16} color={COLORS.black} style={{ marginTop: 1, marginRight: PADDING.p00 }} />
                  <Text style={{ fontSize: 13, fontWeight: '400', color: COLORS.black, textAlign: 'center' }}>
                    {selectedOrganization.phone}
                  </Text>
                </View>
              }
              {selectedOrganization.address &&
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', marginTop: 8 }}>
                  <Icon name='map-marker' size={16} color={COLORS.black} style={{ marginTop: 1, marginRight: PADDING.p00 }} />
                  <Text style={{ fontSize: 13, fontWeight: '400', color: COLORS.black, textAlign: 'center' }}>
                    {selectedOrganization.address}
                  </Text>
                </View>
              }
            </View>
          </View>
        </View>
      </Animated.View>
      <Animated.View
        style={{
          transform: [{ translateY: headerTranslateY }],
          position: 'absolute',
          top: headerHeight,
          zIndex: 999,
          width: '100%',
          height: TAB_BAR_HEIGHT,
          backgroundColor: COLORS.white,
        }}>
        <TabBar
          {...props}
          scrollEnabled
          style={{ backgroundColor: COLORS.white, borderBottomWidth: 0, elevation: 0, shadowOpacity: 0 }}
          indicatorStyle={{ backgroundColor: COLORS.black }}
          tabStyle={{ width: 140 }}
          labelStyle={{ flexShrink: 1 }}
          activeColor={COLORS.black}
          inactiveColor={COLORS.dark_secondary}
        />
      </Animated.View>
    </>
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={handleIndexChange}
      initialLayout={{ width: 100 }}
      renderTabBar={renderTabBar}
    />
  );
};

export default OrganizationDataScreen;
