/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Image, Modal, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import * as RNLocalize from 'react-native-localize';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Video from '../components/video_player';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import { AuthContext } from '../contexts/AuthContext';
import { API } from '../tools/constants';
import useColors from '../hooks/useColors';
import HeaderComponent from './header';
import ContentImage from '../components/content_image';
import { sanitizeImageUri } from '../tools/image_source';

const getLanguage = () => RNLocalize.getLocales()[0]?.languageCode || 'fr';

const NewsDataScreen = ({ route, navigation }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { userInfo } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const { itemId } = route.params;
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(null);

  const getWork = useCallback(async () => {
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


      setWork(response.data?.data || null);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  }, [itemId, userInfo?.api_token, userInfo?.id]);

  useEffect(() => {
    getWork();
  }, [getWork]);

  const media = work?.images || [];
  const coverImage = sanitizeImageUri(work?.photo_url || media.find(image => image.type?.alias === 'image_file')?.file_url || media.find(image => image.file_url)?.file_url);
  const selectedMedia = selectedMediaIndex === null ? null : media[selectedMediaIndex];
  const owner = work?.user_id ? work.user_owner : work?.organization_owner;
  const ownerName = work?.user_id
    ? [owner?.firstname, owner?.lastname].filter(Boolean).join(' ')
    : owner?.org_name;
  const ownerImage = sanitizeImageUri(work?.user_id ? owner?.avatar_url : owner?.cover_url);

  const openOwner = () => {
    if (!owner?.id) return;

    if (work.user_id) {
      navigation.navigate('Profile', { user_id: owner.id });
      return;
    }

    const type = owner?.type?.alias?.split('_')[0];
    navigation.navigate('Profile', { organization_id: owner.id, type });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.light }]} edges={['top']}>
      <StatusBar barStyle={COLORS.bar_style} backgroundColor={COLORS.white} />
      <View style={{ backgroundColor: COLORS.white }}>
        <HeaderComponent title={t('navigation.home.news')} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={getWork} />}
      >
        <View style={[styles.articleCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
          {coverImage ? (
            <ContentImage source={{ uri: coverImage }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverFallback, { backgroundColor: COLORS.light_primary }]}>
              <Icon name="newspaper-variant-outline" size={42} color={COLORS.primary} />
            </View>
          )}

          <View style={styles.articleBody}>
            <View style={[styles.categoryPill, { backgroundColor: COLORS.light_primary }]}>
              <Icon name="newspaper-variant-outline" size={15} color={COLORS.primary} />
              <Text style={[styles.categoryLabel, { color: COLORS.primary }]}>{t('navigation.home.news')}</Text>
            </View>
            <Text style={[styles.title, { color: COLORS.black }]}>{work?.work_title || ''}</Text>
            {work?.work_content ? <Text style={[styles.description, { color: COLORS.dark }]}>{work.work_content}</Text> : null}

            {ownerName ? (
              <TouchableOpacity style={[styles.owner, { borderTopColor: COLORS.light_secondary }]} onPress={openOwner} activeOpacity={0.76}>
                {ownerImage ? (
                  <Image source={{ uri: ownerImage }} style={[styles.ownerImage, { backgroundColor: COLORS.light_secondary }]} />
                ) : (
                  <View style={[styles.ownerImage, styles.ownerFallback, { backgroundColor: COLORS.light_primary }]}>
                    <Icon name={work?.user_id ? 'account' : 'domain'} size={19} color={COLORS.primary} />
                  </View>
                )}
                <View style={styles.ownerCopy}>
                  <Text style={[styles.ownerName, { color: COLORS.black }]} numberOfLines={1}>{ownerName}</Text>
                  {work?.created_at_explicit ? <Text style={[styles.date, { color: COLORS.dark }]} numberOfLines={1}>{`${t('work.publication_date')} ${work.created_at_explicit}`}</Text> : null}
                </View>
                <Icon name="chevron-right" size={21} color={COLORS.dark} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {media.length ? (
          <View style={styles.mediaSection}>
            <Text style={[styles.mediaTitle, { color: COLORS.black }]}>{t('work.associated_files')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaList}>
              {media.map(item => {
                const isVideo = item.is_video;
                return (
                  <TouchableOpacity key={item.id} style={[styles.mediaTile, { backgroundColor: COLORS.dark_secondary }]} onPress={() => setSelectedMediaIndex(media.indexOf(item))} activeOpacity={0.8}>
                    {!isVideo && item.file_url ? <Image source={{ uri: item.file_url }} style={[styles.mediaImage, styles.editorialSurface]} resizeMode="contain" /> : null}
                    {isVideo ? <Icon name="play-circle" size={42} color="#ffffff" /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={selectedMediaIndex !== null} animationType="fade" transparent onRequestClose={() => setSelectedMediaIndex(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
            <Text style={styles.modalCounter}>{`${(selectedMediaIndex || 0) + 1} / ${media.length}`}</Text>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedMediaIndex(null)} accessibilityLabel="Fermer le média">
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          {selectedMedia?.is_video ? (
            <Video source={{ uri: selectedMedia.file_url }} style={styles.modalMedia} controls resizeMode="contain" />
          ) : (
            <Image source={{ uri: selectedMedia?.file_url }} style={styles.modalMedia} resizeMode="contain" />
          )}
          {media.length > 1 ? (
            <>
              <TouchableOpacity
                style={[styles.mediaNavigation, styles.previousMedia, selectedMediaIndex === 0 && styles.disabledMediaNavigation]}
                disabled={selectedMediaIndex === 0}
                onPress={() => setSelectedMediaIndex(index => index - 1)}
                accessibilityLabel="Média précédent"
              >
                <Icon name="chevron-left" size={28} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mediaNavigation, styles.nextMedia, selectedMediaIndex === media.length - 1 && styles.disabledMediaNavigation]}
                disabled={selectedMediaIndex === media.length - 1}
                onPress={() => setSelectedMediaIndex(index => index + 1)}
                accessibilityLabel="Média suivant"
              >
                <Icon name="chevron-right" size={28} color="#ffffff" />
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 36 },
  articleCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  cover: { height: 238, width: '100%' },
  editorialSurface: { backgroundColor: '#ffffff' },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  articleBody: { padding: 18 },
  categoryPill: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: 14, flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6 },
  categoryLabel: { fontSize: 12, fontWeight: '800', marginLeft: 5 },
  title: { fontSize: 25, fontWeight: '800', letterSpacing: -0.4, lineHeight: 31, marginTop: 14 },
  description: { fontSize: 15, lineHeight: 23, marginTop: 10 },
  owner: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginTop: 20, paddingTop: 15 },
  ownerImage: { borderRadius: 21, height: 42, width: 42 },
  ownerFallback: { alignItems: 'center', justifyContent: 'center' },
  ownerCopy: { flex: 1, marginLeft: 10 },
  ownerName: { fontSize: 14, fontWeight: '800' },
  date: { fontSize: 12, marginTop: 3 },
  mediaSection: { marginHorizontal: -16, marginTop: 24 },
  mediaTitle: { fontSize: 17, fontWeight: '800', marginBottom: 11, marginLeft: 18 },
  mediaList: { gap: 10, paddingHorizontal: 16 },
  mediaTile: { alignItems: 'center', borderRadius: 16, height: 116, justifyContent: 'center', overflow: 'hidden', width: 116 },
  mediaImage: { height: '100%', width: '100%' },
  modalBackdrop: { alignItems: 'center', backgroundColor: 'rgba(8, 10, 16, 0.98)', flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', left: 20, position: 'absolute', right: 20, top: 0, zIndex: 1 },
  modalCounter: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  modalClose: { alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.16)', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  modalMedia: { height: '82%', width: '100%' },
  mediaNavigation: { alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.16)', borderRadius: 22, height: 44, justifyContent: 'center', position: 'absolute', top: '50%', width: 44 },
  disabledMediaNavigation: { opacity: 0.35 },
  previousMedia: { left: 16 },
  nextMedia: { right: 16 },
});

export default NewsDataScreen;
