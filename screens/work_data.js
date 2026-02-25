/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { View, Text, RefreshControl, Image, TouchableOpacity, FlatList, Linking, ToastAndroid, Dimensions, TouchableHighlight } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { Divider } from 'react-native-paper';
import { NetworkInfo } from 'react-native-network-info';
import Spinner from 'react-native-loading-spinner-overlay';
import * as RNLocalize from 'react-native-localize';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import UserAgent from 'react-native-user-agent';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { API, PADDING, PHONE, TEXT_SIZE } from '../tools/constants';
import homeStyles from './style';
import useColors from '../hooks/useColors';
import HeaderComponent from './header';
import FileThumbnail from '../components/file_thumbnail';

const sendWhatsAppMessage = async () => {
  const phoneNumber = PHONE.admin;
  const message = "Bonjour Boongo.\n\nJe voudrais devenir partenaire pour faire la promotion de vos services.\n\nQue dois-je faire ?";
  const text = encodeURIComponent(message);
  const url = `whatsapp://send?phone=${phoneNumber}&text=${text}`;

  try {
    await Linking.openURL(url);

  } catch (error) {
    // An error occurred while configuring the query
    ToastAndroid.show(`${error.message}`, ToastAndroid.LONG);
  }
};

const WorkDataScreen = ({ route, navigation }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Get contexts ===============
  const { userInfo, isLoading, addToCart, resetPaymentURL, validateSubscription, invalidateSubscription, disableSubscriptionByCode, validateConsultations, invalidateConsultations } = useContext(AuthContext);
  // =============== Get parameters ===============
  const { itemId } = route.params;
  // =============== Get data ===============
  const [work, setWork] = useState({});
  const [categoryCount, setCategoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const mWidth = Dimensions.get('window').width / 1.7;
  const [price, setPrice] = useState('');
  // Check if user has valid consultation if the work is not public
  const isPaid = work.is_public === 0 ? (userInfo.valid_consultations && userInfo.valid_consultations.some(consultation => consultation.id === work.id)) : false;
  // Check if user has added work in the cart
  const isInCart = userInfo.unpaid_consultations && userInfo.unpaid_consultations.some(consultation => consultation.id === work.id);

  // =============== First letter uppercase ===============
  const ucfirst = (str) => {
    if (!str) return str;

    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // =============== Check if file is video ===============
  const isVideoFile = (url) => {
    if (!url) return false;

    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];

    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  // =============== Image mapping ===============
  const galleryFiles = work.images?.filter(image => { return image.type.alias === 'image_file'; });

  const gallerySources = galleryFiles?.map(file => ({
    id: file.id,
    uri: file.file_url,
    type: isVideoFile(file.file_url) ? 'video' : 'image',
  }));

  // =============== Get system language ===============
  const getLanguage = () => {
    const locales = RNLocalize.getLocales();

    if (locales && locales.length > 0) {
      return locales[0].languageCode;
    }

    return 'fr';
  };

  // =============== Refresh control ===============
  const onRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => { setLoading(false); }, 2000);
  }, []);

  // Reset "paymentURL" when entering this screen
  useEffect(() => {
    resetPaymentURL();
  }, []);

  // =============== Like/Unlike work ===============
  const handleLikeToggle = (user_id, work_id) => {
    setLoading(true);

    if (hasLiked) {
      // If the work is already liked, we cancel the like
      axios.delete(`${API.boongo_url}/like/unlike_entity/${user_id}/work/${work_id}`, {
        headers: {
          'Authorization': `Bearer ${userInfo.api_token}`,
          'X-localization': getLanguage(),
        }
      }).then(res => {
        const message = res.data.message;

        ToastAndroid.show(message, ToastAndroid.LONG);
        console.log(message);

        // Update likes counter and status
        setLikeCount(likeCount - 1); // Decrement
        setHasLiked(false); // User no longer likes
        setLoading(false);
      }).catch(error => {
        handleApiError(error);
      });

    } else {
      // If the work is not yet liked, we love it
      axios.post(`${API.boongo_url}/like`, { user_id: user_id, for_work_id: work_id }, {
        headers: {
          'Authorization': `Bearer ${userInfo.api_token}`,
          'X-localization': getLanguage(),
        }
      }).then(res => {
        const message = res.data.message;

        ToastAndroid.show(message, ToastAndroid.LONG);
        console.log(message);

        // Update likes counter and status
        setLikeCount(likeCount + 1); // Increment
        setHasLiked(true); // The user likes the work
        setLoading(false);
      }).catch(error => {
        handleApiError(error);
      });
    }
  };

  const handleApiError = (error) => {
    if (error.response) {
      ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
      console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

    } else if (error.request) {
      ToastAndroid.show('Erreur de connexion au serveur', ToastAndroid.LONG);

    } else {
      ToastAndroid.show(`${error}`, ToastAndroid.LONG);
    }

    setLoading(false);
  };

  // =============== Get item API with effect hook ===============
  // useEffect(() => {
  //   const validationInterval = setInterval(() => {
  //     if (userInfo.has_pending_subscription) {
  //       validateSubscription(userInfo.id);
  //     }

  //     if (userInfo.has_valid_subscription) {
  //       invalidateSubscription(userInfo.id);
  //     }

  //     if (userInfo.has_active_code) {
  //       disableSubscriptionByCode(userInfo.id);
  //     }

  //     if (userInfo.has_pending_consultation) {
  //       validateConsultations(userInfo.id);
  //     }

  //     if (userInfo.has_valid_consultation) {
  //       invalidateConsultations(userInfo.id);
  //     }
  //   }, 60000);

  //   return () => clearInterval(validationInterval);
  // }, []);
  useEffect(() => {
    if (userInfo.has_pending_subscription) {
      validateSubscription(userInfo.id);
    }

    if (userInfo.has_valid_subscription) {
      invalidateSubscription(userInfo.id);
    }

    if (userInfo.has_active_code) {
      disableSubscriptionByCode(userInfo.id);
    }

    if (userInfo.has_pending_consultation) {
      validateConsultations(userInfo.id);
    }

    if (userInfo.has_valid_consultation) {
      invalidateConsultations(userInfo.id);
    }
  }, [userInfo.has_pending_subscription, userInfo.has_valid_subscription, userInfo.has_active_code, userInfo.has_pending_consultation, userInfo.has_valid_consultation]);

  useEffect(() => {
    getWork();
  }, [work]);

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
          const workCategories = res.data.data.categories.length;

          setWork(workData);
          setCategoryCount(workCategories);

          // Update "likeCount" and "hasLiked"
          const isAlreadyLiked = workData.likes.some(like => like.user.id === userInfo.id);

          setLikeCount(workData.likes.length);
          setHasLiked(isAlreadyLiked);

          console.log(`${userInfo.firstname} a aimé cette œuvre : ${hasLiked}`);

          setLoading(false);

          return workData;
        })
        .catch(error => {
          console.log(error);
        });
    })
  };

  useEffect(() => {
    getPrice();
  }, []);

  const getPrice = () => {
    setLoading(true);

    const config = {
      method: 'GET',
      url: `${API.boongo_url}/work/${itemId}`,
      headers: {
        'X-localization': 'fr',
        'Authorization': `Bearer ${userInfo.api_token}`,
      }
    };

    axios(config)
      .then(res => {
        const workData = res.data.data;

        if (workData.consultation_price) {
          const userLang = getLanguage();

          if (workData.currency.currency_acronym === userInfo.currency.currency_acronym) {
            // Apply language-specific formatting
            const formattedPrice = workData.consultation_price.toLocaleString(userLang, {
              style: 'decimal',
              useGrouping: true,
              minimumFractionDigits: 0, // No digits after the decimal point
              maximumFractionDigits: 0, // No digits after the decimal point
            });

            console.log(formattedPrice);

            setPrice(`${formattedPrice} ${userInfo.currency.currency_acronym}`);
            setLoading(false);

          } else {
            const url = `${API.boongo_url}/currencies_rate/find_currency_rate/${workData.currency.currency_acronym}/${userInfo.currency.currency_acronym}`;
            const mHeaders = {
              'X-localization': 'fr',
              'Authorization': `Bearer ${userInfo.api_token}`
            };

            axios.get(url, { headers: mHeaders })
              .then(response => {
                // Vérifie si la réponse contient les données nécessaires
                if (response && response.data && response.data.success && response.data.data) {
                  const responseData = response.data.data;
                  let userPrice = workData.consultation_price * responseData.rate;

                  // Apply language-specific formatting
                  const formattedPrice = userPrice.toLocaleString(userLang, {
                    style: 'decimal',
                    useGrouping: true,
                    minimumFractionDigits: 0, // No digits after the decimal point
                    maximumFractionDigits: 0, // No digits after the decimal point
                  });

                  console.log(formattedPrice);

                  setPrice(`${formattedPrice} ${userInfo.currency.currency_acronym}`);

                } else {
                  console.error('Erreur : Données manquantes ou format incorrect', response.data.message);
                }
              })
              .catch(error => {
                // Gère les erreurs liées à la requête
                if (error.response?.status === 429) {
                  console.warn("Trop de requêtes envoyées. Attendez avant de réessayer.");
                } else {
                  console.error('Erreur lors de la récupération du taux de change', error);
                }
              })
              .finally(() => {
                // Enfin, on met à jour l'état de chargement
                setLoading(false);
              });
          }
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  // Subscribe links component
  const WorkFiles = () => {
    if (userInfo.has_valid_subscription || userInfo.has_active_code) {
      if (work.is_public === 0) {
        if (isPaid) {
          return (
            <View style={[homeStyles.workDescBottom, { flexDirection: 'column' }]}>
              <Divider style={{ marginTop: PADDING.p01 }} />
              {/* Remote video (YouTube or other) */}
              {work.work_url && (
                <View style={{ padding: PADDING.p00 }}>
                  <Text style={{ color: COLORS.black }}>{t('file.external_videos')}</Text>

                  <FileThumbnail
                    uri={work.work_url}
                    type="video"
                    title={t('file.video')}
                    onPress={() => navigation.navigate('VideoPlayer', {
                      videoTitle: work.work_title,
                      videoUri: work.work_url,
                    })}
                  />
                </View>
              )}

              {/* Documents */}
              {Array.isArray(work.documents) && work.documents.length > 0 && (
                <View style={{ padding: PADDING.p00 }}>
                  <Text style={{ color: COLORS.black }}>{t('file.documents')}</Text>

                  <FlatList
                    data={work.documents}
                    keyExtractor={(item, idx) => `doc-${idx}`}
                    scrollEnabled={false}
                    horizontal={false}
                    numColumns={3}
                    style={{ flexGrow: 0 }}
                    renderItem={({ item, index }) => (
                      <FileThumbnail
                        key={`doc-${index}`}
                        uri={null}
                        type="document"
                        title={`${t('file.document')} ${index + 1}`}
                        onPress={() => navigation.navigate('PDFViewer', {
                          docTitle: work.work_title,
                          docUri: item.file_url,
                          curPage: 1,
                        })}
                      />
                    )}
                  />
                </View>
              )}

              {/* Audios */}
              {Array.isArray(work.audios) && work.audios.length > 0 && (
                <View style={{ padding: PADDING.p00 }}>
                  <Text style={{ color: COLORS.black }}>{t('file.audios')}</Text>

                  <FlatList
                    data={work.audios}
                    keyExtractor={(item) => `audio-${item.id.toString()}`}
                    scrollEnabled={false}
                    horizontal={false}
                    numColumns={3}
                    style={{ flexGrow: 0 }}
                    renderItem={({ item, index }) => (
                      <FileThumbnail
                        key={`audio-${index}`}
                        uri={null}
                        type="audio"
                        title={`${t('file.audio')} ${index + 1}`}
                        onPress={() => navigation.navigate('Audio', {
                          audioTitle: work.work_title,
                          audioUrl: item.file_url,
                          mediaCover: work.photo_url,
                          mediaAuthor: work.author,
                        })}
                      />
                    )}
                  />
                </View>
              )}

              {/* Gallery (Local photos/videos) */}
              {Array.isArray(work.images) && work.images.length > 0 && (
                <View style={{ padding: PADDING.p00 }}>
                  <Text style={{ color: COLORS.black }}>{t('file.photos')} / {t('file.videos')}</Text>

                  <FlatList
                    data={gallerySources}
                    keyExtractor={(item) => `media-${item.id.toString()}`}
                    scrollEnabled={false}
                    horizontal={false}
                    numColumns={3}
                    style={{ flexGrow: 0 }}
                    renderItem={({ item, index }) => (
                      <FileThumbnail
                        key={`media-${index}`}
                        uri={item.uri}
                        type={item.type}
                        title={`${t('file.image')} ${index + 1}`}
                        onPress={() => navigation.navigate('VideoPlayer', {
                          videoTitle: work.work_title,
                          videoUri: item.uri,
                        })}
                      />
                    )}
                  />
                </View>
              )}
            </View>
          );

        } else {
          '';
        }

      } else {
        return (
          <View style={[homeStyles.workDescBottom, { flexDirection: 'column' }]}>
            <Divider style={{ marginTop: PADDING.p01 }} />
            {/* Remote video (YouTube or other) */}
            {work.work_url && (
              <View style={{ padding: PADDING.p00 }}>
                <Text style={{ color: COLORS.black }}>{t('file.external_videos')}</Text>

                <FileThumbnail
                  uri={work.work_url}
                  type="video"
                  title={t('file.video')}
                  onPress={() => navigation.navigate('VideoPlayer', {
                    videoTitle: work.work_title,
                    videoUri: work.work_url,
                  })}
                />
              </View>
            )}

            {/* Documents */}
            {Array.isArray(work.documents) && work.documents.length > 0 && (
              <View style={{ padding: PADDING.p00 }}>
                <Text style={{ color: COLORS.black }}>{t('file.documents')}</Text>

                <FlatList
                  data={work.documents}
                  keyExtractor={(item, idx) => `doc-${idx}`}
                  scrollEnabled={false}
                  horizontal={false}
                  numColumns={3}
                  style={{ flexGrow: 0 }}
                  renderItem={({ item, index }) => (
                    <FileThumbnail
                      key={`doc-${index}`}
                      uri={null}
                      type="document"
                      title={`${t('file.document')} ${index + 1}`}
                      onPress={() => navigation.navigate('PDFViewer', {
                        docTitle: work.work_title,
                        docUri: item.file_url,
                        curPage: 1,
                      })}
                    />
                  )}
                />
              </View>
            )}

            {/* Audios */}
            {Array.isArray(work.audios) && work.audios.length > 0 && (
              <View style={{ padding: PADDING.p00 }}>
                <Text style={{ color: COLORS.black }}>{t('file.audios')}</Text>

                <FlatList
                  data={work.audios}
                  keyExtractor={(item) => `audio-${item.id.toString()}`}
                  scrollEnabled={false}
                  horizontal={false}
                  numColumns={3}
                  style={{ flexGrow: 0 }}
                  renderItem={({ item, index }) => (
                    <FileThumbnail
                      key={`audio-${index}`}
                      uri={null}
                      type="audio"
                      title={`${t('file.audio')} ${index + 1}`}
                      onPress={() => navigation.navigate('Audio', {
                        audioTitle: work.work_title,
                        audioUrl: item.file_url,
                        mediaCover: work.photo_url,
                        mediaAuthor: work.author,
                      })}
                    />
                  )}
                />
              </View>
            )}

            {/* Gallery (Local photos/videos) */}
            {Array.isArray(work.images) && work.images.length > 0 && (
              <View style={{ padding: PADDING.p00 }}>
                <Text style={{ color: COLORS.black }}>{t('file.photos')} / {t('file.videos')}</Text>

                <FlatList
                  data={gallerySources}
                  keyExtractor={(item) => `media-${item.id.toString()}`}
                  scrollEnabled={false}
                  horizontal={false}
                  numColumns={3}
                  style={{ flexGrow: 0 }}
                  renderItem={({ item, index }) => (
                    <FileThumbnail
                      key={`media-${index}`}
                      uri={item.uri}
                      type={item.type}
                      title={`${t('file.image')} ${index + 1}`}
                      onPress={() => navigation.navigate('VideoPlayer', {
                        videoTitle: work.work_title,
                        videoUri: item.uri,
                      })}
                    />
                  )}
                />
              </View>
            )}
          </View>
        );
      }

    } else {
      return '';
    }
  };

  // Subscribe links component
  const SubscribeLinks = () => {
    if (!userInfo.has_valid_subscription && !userInfo.has_active_code) {
      return (
        <>
          <Text style={{ marginBottom: 10, textAlign: 'center', color: COLORS.black }}>{t('subscription.info')}</Text>
          <TouchableOpacity style={[homeStyles.workCmd, { backgroundColor: COLORS.primary, marginBottom: 10 }]} onPress={() => { navigation.navigate('Subscription', { object: 'subscription', itemId: work.id }) }}>
            <FontAwesome6 style={[homeStyles.workCmdIcon, { color: 'white' }]} name='money-check-dollar' />
            <Text style={{ fontSize: TEXT_SIZE.paragraph, color: 'white' }}>{t('subscription.link')}</Text>
          </TouchableOpacity>
        </>
      );

    } else {
      if (userInfo.has_valid_subscription && work.is_public === 0 && !isPaid || userInfo.has_active_code && work.is_public === 0 && !isPaid) {
        if (isInCart) {
          return (
            <>
              <Text style={{ marginBottom: 10, textAlign: 'center', color: COLORS.black }}>{t('consultation.info')}</Text>
              <TouchableHighlight style={[homeStyles.workCmd, { borderWidth: 1, borderColor: COLORS.dark_secondary, marginBottom: 10 }]}>
                <>
                  <FontAwesome6 style={[homeStyles.workCmdIcon, { color: COLORS.dark_secondary }]} name='cart-shopping' />
                  <Text style={{ fontSize: TEXT_SIZE.paragraph, color: COLORS.dark_secondary }}>{t('already_ordered')}</Text>
                </>
              </TouchableHighlight>
              {/* <TouchableOpacity style={[homeStyles.linkIcon, { justifyContent: 'center', alignItems: 'flex-start' }]} onPress={() => navigation.navigate('Account', { initialIndex: 2 })}>
                <Text style={{ marginBottom: 10, color: COLORS.link_color }}>{t('consultation.link')}</Text>
                <FontAwesome6 name='angles-right' size={IMAGE_SIZE.s03} color={COLORS.link_color} style={{ marginLeft: PADDING.p01 }} />
              </TouchableOpacity> */}
            </>
          );

        } else {
          return (
            <>
              <Text style={{ marginBottom: 10, textAlign: 'center', color: COLORS.black }}>{t('consultation.info')}</Text>
              <TouchableOpacity style={[homeStyles.workCmd, { backgroundColor: COLORS.success, marginBottom: 10 }]} onPress={() => { addToCart('consultation', userInfo.id, work.id, null); }}>
                <FontAwesome6 style={[homeStyles.workCmdIcon, { color: 'white' }]} name='eye' />
                <Text style={{ fontSize: TEXT_SIZE.paragraph, color: 'white' }}>{t('add_to_cart')}</Text>
              </TouchableOpacity>
            </>
          );
        }

      } else {
        return '';
      }
    }
  };

  return (
    <>
      {/* Header */}
      <Spinner visible={isLoading} />

      {/* Header */}
      <View style={{ paddingVertical: PADDING.p01, backgroundColor: COLORS.white }}>
        <HeaderComponent />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 50, backgroundColor: COLORS.white }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}>
        <View style={[homeStyles.workBody, { paddingTop: 0, paddingBottom: PADDING.p01 }]}>
          <View style={homeStyles.workCard}>
            <View style={[homeStyles.workTop, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              {work.user_id ?
                <View style={{ width: Dimensions.get('window').width - 50 }}>
                  <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} onPress={() => { navigation.navigate('Profile', { user_id: work.user_owner.id }); }}>
                    <Image source={{ uri: work.user_owner.avatar_url }} style={{ width: 37, height: 37, marginRight: PADDING.p02, borderRadius: 37 / 2 }} />
                    <Text style={{ fontSize: TEXT_SIZE.normal, color: COLORS.black }}>{`${work.user_owner.firstname} ${work.user_owner.lastname}`}</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: TEXT_SIZE.label, color: COLORS.dark_secondary, textAlign: 'center' }}>{`${t('work.publication_date')} ${ucfirst(work.created_at_explicit)}`}</Text>
                </View>
                : ''}
              <View>
                <Image source={{ uri: work.photo_url }} style={[homeStyles.workImage, { width: Dimensions.get('window').width - 50, height: mWidth * 2 }]} />
              </View>
              <View style={homeStyles.workDescTop}>
                <Text style={[homeStyles.workTitle, { color: COLORS.black }]}>{work.work_title}</Text>
                <Text style={[homeStyles.workContent, { color: COLORS.black, textAlign: 'justify' }]}>{work.work_content}</Text>
              </View>
            </View>
            {/* Metadata */}
            <View style={homeStyles.workBottom}>
              {/* Auhtor */}
              {work.author ? (
                <>
                  <View style={homeStyles.workDescBottom}>
                    <Text style={[homeStyles.workDescText, { color: COLORS.dark_secondary }]}>{t('work.author')} : </Text>
                    <Text style={[homeStyles.workDescText, { fontWeight: '600', color: COLORS.black }]}>{work.author ? work.author : null}</Text>
                  </View>
                </>
              ) : ''}

              {/* Editor */}
              {work.editor ? (
                <>
                  <View style={[homeStyles.workDescBottom, { flexDirection: 'column' }]}>
                    <Text style={[homeStyles.workDescText, { color: COLORS.dark_secondary, marginBottom: 1 }]}>{t('work.editor')} : </Text>
                    <Text style={[homeStyles.workDescText, { fontWeight: '600', color: COLORS.black }]}>{work.editor ? work.editor : null}</Text>
                  </View>
                </>
              ) : ''}

              {/* Type */}
              <View style={homeStyles.workDescBottom}>
                <Text style={[homeStyles.workDescText, { color: COLORS.dark_secondary }]}>{t('work.type')}</Text>
                <Text style={[homeStyles.workDescText, { fontWeight: '600', color: COLORS.black }]}>{work.type ? work.type.type_name : null}</Text>
              </View>

              {/* Categor(ies)y */}
              <View style={homeStyles.workDescBottom}>
                <Text style={[homeStyles.workDescText, { color: COLORS.dark_secondary }]}>
                  {categoryCount > 1 ? t('work.categories') : t('work.category')}
                </Text>
                <FlatList
                  data={work.categories}
                  keyExtractor={item => item.id}
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  style={homeStyles.workDescBadgesList}
                  contentContainerStyle={homeStyles.workDescBadgesListContents}
                  renderItem={({ item }) => {
                    return (<Text style={[homeStyles.workDescBadge, { backgroundColor: COLORS.black, color: COLORS.white }]}>{item.category_name}</Text>);
                  }} />
              </View>

              {/* Consultation price */}
              {work.is_public === 0 && (
                <View style={homeStyles.workDescBottom}>
                  <Text style={[homeStyles.workDescText, { color: COLORS.dark_secondary }]}>{t('work.is_public.consult_price')} : </Text>
                  {/* <Text style={[homeStyles.workDescText, { fontWeight: '600', color: COLORS.black }]}>{`${work.consultation_price} ${work.currency.currency_acronym}`}</Text> */}
                  <Text style={[homeStyles.workDescText, { fontWeight: '600', color: COLORS.black }]}>{price ? price : `${work.consultation_price} ${work.currency.currency_acronym}`}</Text>
                </View>
              )}

              {/* Like work button */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: Dimensions.get('window').width - 50, paddingVertical: PADDING.p01, borderTopWidth: 1, borderTopColor: COLORS.light_secondary, borderBottomWidth: 1, borderBottomColor: COLORS.light_secondary }}>
                <TouchableOpacity style={{ width: 30, height: 30, backgroundColor: (hasLiked ? COLORS.danger : 'rgba(250, 250, 250, 0)'), marginRight: PADDING.p03, paddingVertical: 4, paddingHorizontal: 3.5, borderRadius: 30 / 2, borderWidth: 2, borderColor: (hasLiked ? COLORS.danger : COLORS.dark_secondary) }} onPress={() => handleLikeToggle(userInfo.id, work.id)} disabled={loading}>
                  <Icon size={19} name={hasLiked ? 'heart' : 'heart-outline'} color={hasLiked ? COLORS.light_danger : COLORS.dark_secondary} />
                </TouchableOpacity>
                <Text style={{ fontWeight: '400', color: COLORS.black }}>{`${likeCount} ${likeCount > 1 ? t('likes') : t('like')}`}</Text>
              </View>

              {/* Work files */}
              <WorkFiles />
            </View>
          </View>
          <View style={homeStyles.workCard}>
            <View style={homeStyles.workCmds}>
              <SubscribeLinks />
              {!userInfo.is_partner &&
                <>
                  <TouchableOpacity style={[homeStyles.workCmd, { backgroundColor: COLORS.warning }]} onPress={sendWhatsAppMessage}>
                    <FontAwesome6 style={[homeStyles.workCmdIcon, { color: 'black' }]} name='handshake-angle' />
                    <Text style={{ fontSize: TEXT_SIZE.paragraph, color: 'black' }}>{t('auth.my_works.start_button')}</Text>
                  </TouchableOpacity>
                </>
              }
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

export default WorkDataScreen;