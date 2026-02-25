/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { View, Text, RefreshControl, Image, Dimensions, TouchableOpacity, FlatList, Modal } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { NetworkInfo } from 'react-native-network-info';
import * as RNLocalize from 'react-native-localize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import UserAgent from 'react-native-user-agent';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { API, IMAGE_SIZE, PADDING, TEXT_SIZE } from '../tools/constants';
import homeStyles from './style';
import useColors from '../hooks/useColors';
import HeaderComponent from './header';
import ImageViewer from 'react-native-image-zoom-viewer';
import Video from 'react-native-video';

const NewsDataScreen = ({ route, navigation }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get parameters ===============
  const { itemId } = route.params;
  // =============== Get data ===============
  const [work, setWork] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mediaList = work && work.images ? work.images?.map(img => ({
    url: img.file_url,
    is_video: img.is_video,
  })) : [];
  const [loading, setLoading] = useState(true);

  // =============== Get system language ===============
  const getLanguage = () => {
    const locales = RNLocalize.getLocales();

    if (locales && locales.length > 0) {
      return locales[0].languageCode;
    }

    return 'fr';
  };

  // =============== First letter uppercase ===============
  const ucfirst = (str) => {
    if (!str) return str;

    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // =============== First word from splitted word ===============
  const getFirstPart = (str) => {
    if (!str) return str;

    const parts = str.split('_');

    return parts[0];
  };

  // =============== Refresh control ===============
  const onRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => { setLoading(false); }, 2000);
  }, []);

  useEffect(() => {
    getWork();
  }, []);

  const getWork = () => {
    NetworkInfo.getIPAddress().then(ip_address => {
      const config = {
        method: 'GET',
        url: `${API.boongo_url}/work/${itemId}`,
        headers: {
          'X-localization': getLanguage(),
          'X-user-id': userInfo.id,
          'X-ip-address': ip_address,
          'X-user-agent': UserAgent.getUserAgent(),
          'Authorization': `Bearer ${userInfo.api_token}`,
        }
      };

      axios(config)
        .then(res => {
          const workData = res.data.data;

          setWork(workData);
          setLoading(false);

          console.log(workData.organization_owner.type.alias);

          return workData;
        })
        .catch(error => {
          console.log(error);
        });
    })
  };

  // =============== Show/Hide modal ===============
  const openModal = (index) => {
    setSelectedIndex(index);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedIndex(0);
  };

  // =============== Render the thumbnails ===============
  const renderItem = ({ item, index }) => {
    const isVideo = item.is_video;

    return (
      <TouchableOpacity onPress={() => openModal(index)}>
        <View style={{ width: 100, height: 100, margin: 5 }}>
          {!isVideo && (
            <Image
              source={{ uri: item.file_url }}
              style={{ width: '100%', height: '100%', borderRadius: 5 }}
            />
          )}

          {isVideo && (
            <View style={{
              width: '100%',
              height: '100%',
              borderRadius: 5,
              backgroundColor: '#000',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Icon name="play-circle-outline" size={40} color="white" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Header */}
      <View style={{ paddingVertical: PADDING.p01, backgroundColor: COLORS.white }}>
        <HeaderComponent />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: PADDING.p07, backgroundColor: COLORS.white }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}>
        <View style={[homeStyles.workBody, { paddingTop: 0, paddingBottom: PADDING.p01 }]}>
          <View style={homeStyles.workCard}>
            <View style={[homeStyles.workTop, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <View>
                <Image source={{ uri: work.photo_url }} style={[homeStyles.workImage, { width: Dimensions.get('window').width, height: Dimensions.get('window').width, marginLeft: -25, marginTop: 0, borderRadius: 0 }]} />
              </View>
              <View style={homeStyles.workDescTop}>
                <Text style={[homeStyles.workTitle, { color: COLORS.black }]}>{work.work_title}</Text>
                <Text style={[homeStyles.workContent, { color: COLORS.black, textAlign: 'justify' }]}>{work.work_content}</Text>
              </View>

              {/* Horizontal FlatList */}
              {work.images && (
                <>
                  <FlatList
                    data={work.images}
                    renderItem={renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ padding: 10 }}
                  />

                  {/* Modal to display the image or video */}
                  {modalVisible && (
                    <Modal
                      visible={modalVisible}
                      transparent={true}
                      animationType="fade"
                      onRequestClose={closeModal}
                    >
                      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
                        <TouchableOpacity style={{ position: 'absolute', right: PADDING.p01, top: PADDING.p01, zIndex: 10, width: 37, height: 37, backgroundColor: 'rgba(200,200,200,0.5)', padding: 2.6, borderRadius: 37 / 2 }} onPress={closeModal}>
                          <Icon name='close' size={IMAGE_SIZE.s07} color='black' />
                        </TouchableOpacity>

                        <ImageViewer
                          imageUrls={mediaList}
                          index={selectedIndex}
                          enableSwipeDown={true}
                          onSwipeDown={() => setModalVisible(false)}
                          renderIndicator={() => null}
                          /* ⬇️ LE POINT IMPORTANT : rendre les vidéos */
                          renderImage={(props) => {
                            const media = mediaList.find(m => m.url === props.source.uri);

                            if (media?.is_video) {
                              return (
                                <Video
                                  source={{ uri: media.url }}
                                  style={{ width: '100%', height: '100%' }}
                                  controls={true}
                                  resizeMode="contain"
                                />
                              );
                            }

                            return <Image {...props} resizeMode="contain" />;
                          }}
                        />
                      </View>
                    </Modal>
                  )}
                </>
              )}

              {/* News owner */}
              {work.user_id ?
                <View style={{ width: Dimensions.get('window').width - 50, marginTop: PADDING.p07 }}>
                  <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} onPress={() => { navigation.navigate('Profile', { user_id: work.user_owner.id }); }}>
                    <Image source={{ uri: work.user_owner.avatar_url }} style={{ width: 37, height: 37, marginRight: PADDING.p02, borderRadius: 37 / 2 }} />
                    <Text style={{ fontSize: TEXT_SIZE.normal, color: COLORS.black }}>{`${work.user_owner.firstname} ${work.user_owner.lastname}`}</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: TEXT_SIZE.label, color: COLORS.dark_secondary, textAlign: 'center' }}>{`${t('work.publication_date')} ${ucfirst(work.created_at_explicit)}`}</Text>
                </View>
                : ''}
              {work.organization_id ?
                <View style={{ width: Dimensions.get('window').width - 50, marginTop: PADDING.p07 }}>
                  <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} onPress={() => { navigation.navigate('Profile', { organization_id: work.organization_owner.id, type: getFirstPart(work.organization_owner.type.alias) }); }}>
                    <Image source={{ uri: work.organization_owner.cover_url }} style={{ width: 37, height: 37, marginRight: PADDING.p02, borderRadius: 37 / 2 }} />
                    <Text style={{ fontSize: TEXT_SIZE.normal, color: COLORS.black }}>{work.organization_owner.org_name}</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: TEXT_SIZE.label, color: COLORS.dark_secondary, textAlign: 'center' }}>{`${t('work.publication_date')} ${ucfirst(work.created_at_explicit)}`}</Text>
                </View>
                : ''}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

export default NewsDataScreen;