/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Image, Linking, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import * as RNLocalize from 'react-native-localize';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import { AuthContext } from '../contexts/AuthContext';
import { API, PHONE } from '../tools/constants';
import useColors from '../hooks/useColors';
import HeaderComponent from './header';
import FileThumbnail from '../components/file_thumbnail';

const getLanguage = () => RNLocalize.getLocales()[0]?.languageCode || 'fr';
const isVideoFile = url => ['.mp4', '.mov', '.avi', '.webm', '.mkv'].some(extension => url?.toLowerCase().includes(extension));

const WorkDataScreen = ({ route, navigation }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const {
    userInfo,
    addToCart,
    resetPaymentURL,
    validateSubscription,
    invalidateSubscription,
    disableSubscriptionByCode,
    validateConsultations,
    invalidateConsultations,
  } = useContext(AuthContext);
  const { itemId } = route.params;
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [price, setPrice] = useState('');

  const formatPrice = useCallback(async workData => {
    if (!workData?.consultation_price || !workData.currency?.currency_acronym || !userInfo?.currency?.currency_acronym) return '';

    const language = getLanguage();
    let amount = Number(workData.consultation_price);
    const sourceCurrency = workData.currency.currency_acronym;
    const targetCurrency = userInfo.currency.currency_acronym;

    if (sourceCurrency !== targetCurrency) {
      try {
        const response = await axios.get(
          `${API.boongo_url}/currencies_rate/find_currency_rate/${sourceCurrency}/${targetCurrency}`,
          { headers: { 'X-localization': language, Authorization: `Bearer ${userInfo.api_token}` } }
        );
        amount *= Number(response.data?.data?.rate || 1);
      } catch (error) {
        console.error('Erreur lors de la récupération du taux de change:', error);
      }
    }

    return `${amount.toLocaleString(language, { maximumFractionDigits: 0 })} ${targetCurrency}`;
  }, [userInfo?.api_token, userInfo?.currency?.currency_acronym]);

  const fetchWork = useCallback(async () => {
    if (!userInfo?.api_token) return;

    setLoading(true);
    try {
      const [netState, userAgent] = await Promise.all([
        NetInfo.fetch(),
        Constants.getWebViewUserAgentAsync(),
      ]);
      const response = await axios.get(`${API.boongo_url}/work/${itemId}`, {
        headers: {
          'X-localization': getLanguage(),
          'X-user-id': userInfo.id,
          'X-ip-address': netState.details?.ipAddress || '',
          'X-user-agent': userAgent || '',
          Authorization: `Bearer ${userInfo.api_token}`,
        },
      });
      const workData = response.data?.data || null;
      const userLike = workData?.likes?.some(like => like.user_id === userInfo.id || like.user?.id === userInfo.id) || false;

      setWork(workData);
      setLikeCount(workData?.likes?.length || 0);
      setHasLiked(userLike);
      setPrice(await formatPrice(workData));
    } catch (error) {
      console.error('Erreur lors de la récupération de l’œuvre:', error);
    } finally {
      setLoading(false);
    }
  }, [formatPrice, itemId, userInfo?.api_token, userInfo?.id]);

  useEffect(() => {
    resetPaymentURL();
  }, [resetPaymentURL]);

  useEffect(() => {
    fetchWork();
  }, [fetchWork]);

  useEffect(() => {
    if (userInfo.has_pending_subscription) validateSubscription(userInfo.id);
    if (userInfo.has_valid_subscription) invalidateSubscription(userInfo.id);
    if (userInfo.has_active_code) disableSubscriptionByCode(userInfo.id);
    if (userInfo.has_pending_consultation) validateConsultations(userInfo.id);
    if (userInfo.has_valid_consultation) invalidateConsultations(userInfo.id);
  }, [
    disableSubscriptionByCode,
    invalidateConsultations,
    invalidateSubscription,
    userInfo.has_active_code,
    userInfo.has_pending_consultation,
    userInfo.has_pending_subscription,
    userInfo.has_valid_consultation,
    userInfo.has_valid_subscription,
    userInfo.id,
    validateConsultations,
    validateSubscription,
  ]);

  const handleLikeToggle = async () => {
    if (!work?.id || loading) return;

    setLoading(true);
    try {
      if (hasLiked) {
        const response = await axios.delete(`${API.boongo_url}/like/unlike_entity/${userInfo.id}/work/${work.id}`, {
          headers: { 'X-localization': getLanguage(), Authorization: `Bearer ${userInfo.api_token}` },
        });
        Alert.alert(t('success.title'), response.data?.message || '');
        setLikeCount(currentCount => Math.max(0, currentCount - 1));
        setHasLiked(false);
      } else {
        const response = await axios.post(
          `${API.boongo_url}/like`,
          { user_id: userInfo.id, for_work_id: work.id },
          { headers: { 'X-localization': getLanguage(), Authorization: `Bearer ${userInfo.api_token}` } }
        );
        Alert.alert(t('success.title'), response.data?.message || '');
        setLikeCount(currentCount => currentCount + 1);
        setHasLiked(true);
      }
    } catch (error) {
      const message = error.response?.data?.message || t('error_message.no_server_response');
      Alert.alert(t('error'), message);
      console.error('Erreur lors de la mise à jour du like:', error);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = async () => {
    const message = encodeURIComponent('Bonjour Boongo.\n\nJe voudrais devenir partenaire pour faire la promotion de vos services.\n\nQue dois-je faire ?');
    try {
      await Linking.openURL(`whatsapp://send?phone=${PHONE.admin}&text=${message}`);
    } catch (error) {
      Alert.alert(t('error'), error.message);
    }
  };

  const isPrivate = Number(work?.is_public) === 0;
  const hasAccessPass = userInfo.has_valid_subscription || userInfo.has_active_code;
  const hasPaidConsultation = userInfo.valid_consultations?.some(consultation => consultation.id === work?.id);
  const isInCart = userInfo.unpaid_consultations?.some(consultation => consultation.id === work?.id);
  const canReadFiles = hasAccessPass && (!isPrivate || hasPaidConsultation);
  const coverImage = work?.photo_url || work?.images?.find(image => image.type?.alias === 'image_file')?.file_url || work?.images?.find(image => image.file_url)?.file_url;
  const gallerySources = work?.images?.filter(image => image.file_url).map(image => ({
    id: image.id,
    uri: image.file_url,
    type: isVideoFile(image.file_url) ? 'video' : 'image',
  })) || [];
  const owner = work?.user_id ? work.user_owner : work?.organization_owner;
  const ownerName = work?.user_id ? [owner?.firstname, owner?.lastname].filter(Boolean).join(' ') : owner?.org_name;
  const ownerImage = work?.user_id ? owner?.avatar_url : owner?.cover_url;

  const openOwner = () => {
    if (!owner?.id) return;
    if (work.user_id) {
      navigation.navigate('Profile', { user_id: owner.id });
    } else {
      navigation.navigate('Profile', { organization_id: owner.id, type: owner.type?.alias?.split('_')[0] });
    }
  };

  const renderFileRow = (title, items, renderItem) => {
    if (!items?.length) return null;
    return (
      <View style={styles.fileSection}>
        <Text style={[styles.fileSectionTitle, { color: COLORS.black }]}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fileList}>
          {items.map(renderItem)}
        </ScrollView>
      </View>
    );
  };

  const renderFiles = () => {
    if (!canReadFiles) return null;

    return (
      <View style={[styles.filesCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
        <View style={styles.sectionHeading}>
          <Icon name="folder-multiple-outline" size={21} color={COLORS.primary} />
          <Text style={[styles.sectionTitle, { color: COLORS.black }]}>{t('work.add_files')}</Text>
        </View>
        {work.work_url ? renderFileRow(t('file.external_videos'), [work.work_url], url => (
          <FileThumbnail key={url} uri={url} type="video" title={t('file.video')} onPress={() => navigation.navigate('VideoPlayer', { videoTitle: work.work_title, videoUri: url })} />
        )) : null}
        {renderFileRow(t('file.documents'), work.documents, (file, index) => (
          <FileThumbnail key={file.id || file.file_url} type="document" title={`${t('file.document')} ${index + 1}`} onPress={() => navigation.navigate('PDFViewer', { docTitle: work.work_title, docUri: file.file_url, curPage: 1 })} />
        ))}
        {renderFileRow(t('file.audios'), work.audios, (file, index) => (
          <FileThumbnail key={file.id || file.file_url} type="audio" title={`${t('file.audio')} ${index + 1}`} onPress={() => navigation.navigate('Audio', { audioTitle: work.work_title, audioUrl: file.file_url, mediaCover: coverImage, mediaAuthor: work.author })} />
        ))}
        {renderFileRow(`${t('file.photos')} / ${t('file.videos')}`, gallerySources, (file, index) => (
          <FileThumbnail key={file.id || file.uri} uri={file.uri} type={file.type} title={`${t('file.image')} ${index + 1}`} onPress={() => navigation.navigate('VideoPlayer', { videoTitle: work.work_title, videoUri: file.uri })} />
        ))}
      </View>
    );
  };

  const renderAccessActions = () => {
    if (!hasAccessPass) {
      return (
        <View style={[styles.actionCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
          <Icon name="crown-outline" size={27} color={COLORS.primary} />
          <Text style={[styles.actionText, { color: COLORS.black }]}>{t('subscription.info')}</Text>
          <TouchableOpacity style={[styles.primaryAction, { backgroundColor: COLORS.primary }]} onPress={() => navigation.navigate('Subscription', { object: 'subscription', itemId: work.id })}>
            <FontAwesome6 name="money-check-dollar" size={16} color="#ffffff" />
            <Text style={styles.primaryActionText}>{t('subscription.link')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isPrivate && !hasPaidConsultation) {
      return (
        <View style={[styles.actionCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
          <Icon name="eye-lock-outline" size={27} color={COLORS.primary} />
          <Text style={[styles.actionText, { color: COLORS.black }]}>{t('consultation.info')}</Text>
          {isInCart ? (
            <View style={[styles.alreadyOrdered, { backgroundColor: COLORS.light_secondary }]}>
              <Icon name="cart-check" size={18} color={COLORS.dark} />
              <Text style={[styles.alreadyOrderedText, { color: COLORS.dark }]}>{t('already_ordered')}</Text>
            </View>
          ) : (
            <TouchableOpacity style={[styles.primaryAction, { backgroundColor: COLORS.success }]} onPress={() => addToCart('consultation', userInfo.id, work.id, null)}>
              <Icon name="cart-plus" size={18} color="#ffffff" />
              <Text style={styles.primaryActionText}>{t('add_to_cart')}</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.light }]} edges={['top']}>
      <StatusBar barStyle={COLORS.bar_style} backgroundColor={COLORS.white} />
      <View style={{ backgroundColor: COLORS.white }}>
        <HeaderComponent title={t('work.title')} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchWork} />}
      >
        <View style={[styles.heroCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
          {coverImage ? <Image source={{ uri: coverImage }} style={[styles.cover, { backgroundColor: COLORS.light_secondary }]} resizeMode="cover" /> : (
            <View style={[styles.cover, styles.coverFallback, { backgroundColor: COLORS.light_primary }]}>
              <Icon name="book-open-page-variant-outline" size={46} color={COLORS.primary} />
            </View>
          )}
          <View style={styles.heroBody}>
            <View style={[styles.typeBadge, { backgroundColor: COLORS.light_primary }]}>
              <Icon name="book-open-variant" size={15} color={COLORS.primary} />
              <Text style={[styles.typeBadgeText, { color: COLORS.primary }]}>{work?.type?.type_name || t('navigation.home.books')}</Text>
            </View>
            <Text style={[styles.title, { color: COLORS.black }]}>{work?.work_title || ''}</Text>
            {work?.work_content ? <Text style={[styles.description, { color: COLORS.dark }]}>{work.work_content}</Text> : null}
            {ownerName ? (
              <TouchableOpacity style={[styles.owner, { borderTopColor: COLORS.light_secondary }]} onPress={openOwner} activeOpacity={0.76}>
                {ownerImage ? <Image source={{ uri: ownerImage }} style={[styles.ownerImage, { backgroundColor: COLORS.light_secondary }]} /> : (
                  <View style={[styles.ownerImage, styles.ownerFallback, { backgroundColor: COLORS.light_primary }]}><Icon name={work?.user_id ? 'account' : 'domain'} size={19} color={COLORS.primary} /></View>
                )}
                <View style={styles.ownerCopy}>
                  <Text style={[styles.ownerName, { color: COLORS.black }]} numberOfLines={1}>{ownerName}</Text>
                  {work?.created_at_explicit ? <Text style={[styles.ownerDate, { color: COLORS.dark }]} numberOfLines={1}>{`${t('work.publication_date')} ${work.created_at_explicit}`}</Text> : null}
                </View>
                <Icon name="chevron-right" size={21} color={COLORS.dark} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
          {work?.author ? <View style={styles.infoRow}><Icon name="account-edit-outline" size={19} color={COLORS.primary} /><View style={styles.infoCopy}><Text style={[styles.infoLabel, { color: COLORS.dark }]}>{t('work.author')}</Text><Text style={[styles.infoValue, { color: COLORS.black }]}>{work.author}</Text></View></View> : null}
          {work?.editor ? <View style={styles.infoRow}><Icon name="account-tie-outline" size={19} color={COLORS.primary} /><View style={styles.infoCopy}><Text style={[styles.infoLabel, { color: COLORS.dark }]}>{t('work.editor')}</Text><Text style={[styles.infoValue, { color: COLORS.black }]}>{work.editor}</Text></View></View> : null}
          {work?.categories?.length ? <View style={styles.categoriesRow}><Text style={[styles.infoLabel, { color: COLORS.dark }]}>{work.categories.length > 1 ? t('work.categories') : t('work.category')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>{work.categories.map(category => <Text key={category.id} style={[styles.categoryChip, { backgroundColor: COLORS.light_primary, color: COLORS.primary }]}>{category.category_name}</Text>)}</ScrollView></View> : null}
          {isPrivate ? <View style={[styles.priceRow, { borderTopColor: COLORS.light_secondary }]}><View><Text style={[styles.infoLabel, { color: COLORS.dark }]}>{t('work.is_public.consult_price')}</Text><Text style={[styles.priceValue, { color: COLORS.black }]}>{price || `${work?.consultation_price || ''} ${work?.currency?.currency_acronym || ''}`}</Text></View><Icon name="lock-outline" size={23} color={COLORS.primary} /></View> : null}
          <View style={[styles.likeRow, { borderTopColor: COLORS.light_secondary }]}>
            <TouchableOpacity style={[styles.likeButton, { backgroundColor: hasLiked ? COLORS.danger : COLORS.light_secondary }]} onPress={handleLikeToggle} disabled={loading} accessibilityLabel="Aimer cette œuvre"><Icon name={hasLiked ? 'heart' : 'heart-outline'} size={20} color={hasLiked ? '#ffffff' : COLORS.dark} /></TouchableOpacity>
            <Text style={[styles.likeText, { color: COLORS.dark }]}>{`${likeCount} ${likeCount === 1 ? t('like') : t('likes')}`}</Text>
          </View>
        </View>

        {renderFiles()}
        {work ? renderAccessActions() : null}
        {!userInfo.is_partner ? <TouchableOpacity style={[styles.partnerAction, { backgroundColor: COLORS.warning }]} onPress={openWhatsApp}><Icon name="handshake-outline" size={21} color="#1a1a1a" /><Text style={styles.partnerActionText}>{t('auth.my_works.start_button')}</Text></TouchableOpacity> : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 38 },
  heroCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  cover: { height: 250, width: '100%' },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  heroBody: { padding: 18 },
  typeBadge: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: 14, flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6 },
  typeBadgeText: { fontSize: 12, fontWeight: '800', marginLeft: 5 },
  title: { fontSize: 25, fontWeight: '800', letterSpacing: -0.4, lineHeight: 31, marginTop: 14 },
  description: { fontSize: 15, lineHeight: 23, marginTop: 10 },
  owner: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginTop: 20, paddingTop: 15 },
  ownerImage: { borderRadius: 21, height: 42, width: 42 },
  ownerFallback: { alignItems: 'center', justifyContent: 'center' },
  ownerCopy: { flex: 1, marginLeft: 10 },
  ownerName: { fontSize: 14, fontWeight: '800' },
  ownerDate: { fontSize: 12, marginTop: 3 },
  infoCard: { borderRadius: 20, borderWidth: 1, marginTop: 14, padding: 16 },
  infoRow: { alignItems: 'flex-start', flexDirection: 'row', marginBottom: 14 },
  infoCopy: { flex: 1, marginLeft: 10 },
  infoLabel: { fontSize: 12, fontWeight: '700' },
  infoValue: { fontSize: 15, fontWeight: '700', lineHeight: 21, marginTop: 3 },
  categoriesRow: { marginBottom: 14 },
  categoryList: { gap: 7, marginTop: 8 },
  categoryChip: { borderRadius: 13, fontSize: 12, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  priceRow: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14 },
  priceValue: { fontSize: 18, fontWeight: '800', marginTop: 3 },
  likeRow: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginTop: 14, paddingTop: 14 },
  likeButton: { alignItems: 'center', borderRadius: 19, height: 38, justifyContent: 'center', width: 38 },
  likeText: { fontSize: 14, fontWeight: '700', marginLeft: 9 },
  filesCard: { borderRadius: 20, borderWidth: 1, marginTop: 14, paddingVertical: 16 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginLeft: 8 },
  fileSection: { marginTop: 15 },
  fileSectionTitle: { fontSize: 13, fontWeight: '800', paddingHorizontal: 16 },
  fileList: { paddingHorizontal: 16 },
  actionCard: { alignItems: 'center', borderRadius: 20, borderWidth: 1, marginTop: 14, padding: 18 },
  actionText: { fontSize: 14, lineHeight: 21, marginTop: 9, textAlign: 'center' },
  primaryAction: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', justifyContent: 'center', marginTop: 14, minHeight: 48, paddingHorizontal: 16, width: '100%' },
  primaryActionText: { color: '#ffffff', fontSize: 14, fontWeight: '800', marginLeft: 8 },
  alreadyOrdered: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', justifyContent: 'center', marginTop: 14, minHeight: 48, paddingHorizontal: 16, width: '100%' },
  alreadyOrderedText: { fontSize: 14, fontWeight: '800', marginLeft: 8 },
  partnerAction: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', marginTop: 14, minHeight: 52, paddingHorizontal: 16 },
  partnerActionText: { color: '#1a1a1a', fontSize: 14, fontWeight: '800', marginLeft: 9 },
});

export default WorkDataScreen;
