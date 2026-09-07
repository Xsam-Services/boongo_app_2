/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import qs from 'qs';
import Toast from 'react-native-toast-message';

import { AuthContext } from '../contexts/AuthContext';
import useColors from '../hooks/useColors';
import { API } from '../tools/constants';

const getUserLike = (likes, userId) => (likes || []).find((like) =>
  Number(like.user_id ?? like.user?.id) === Number(userId)
);

const MediaItemComponent = ({ item }) => {
  const COLORS = useColors();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { addToCart, isLoading, removeFromCart, userInfo } = useContext(AuthContext);
  const isAd = item.id === 'ad';
  const isFavorite = userInfo?.favorite_works?.some((work) => work.id === item.id);
  const imageUri = item.photo_url || item.images?.find((image) => image.type?.alias === 'image_file')?.file_url || item.images?.find((image) => image.file_url)?.file_url;
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes?.length || 0);
  const [likeId, setLikeId] = useState(null);
  const [likeUpdating, setLikeUpdating] = useState(false);

  useEffect(() => {
    const userLike = getUserLike(item.likes, userInfo?.id);
    setHasLiked(Boolean(userLike));
    setLikeId(userLike?.id || null);
    setLikeCount(item.likes?.length || 0);
  }, [item.id, item.likes, userInfo?.id]);

  const openAd = () => {
    if (item.has_promo_code) {
      navigation.navigate('Subscription', { itemId: item.realId });
    } else if (item.website_url) {
      Linking.openURL(item.website_url);
    }
  };

  const toggleFavorite = () => {
    if (isFavorite) {
      const cartId = userInfo?.favorite_works_cart?.id;
      if (cartId) removeFromCart(cartId, item.id, null);
      return;
    }
    addToCart('favorite', userInfo.id, item.id, null);
  };

  const toggleLike = async () => {
    if (!userInfo?.id || !userInfo?.api_token || likeUpdating) return;

    setLikeUpdating(true);
    try {
      if (hasLiked) {
        if (!likeId) throw new Error('Le like ne peut pas être identifié.');
        await axios.delete(`${API.boongo_url}/like/${likeId}`, {
          headers: { Authorization: `Bearer ${userInfo.api_token}`, 'X-localization': 'fr' },
        });
        setHasLiked(false);
        setLikeId(null);
        setLikeCount((count) => Math.max(0, count - 1));
      } else {
        const response = await axios.post(
          `${API.boongo_url}/like`,
          qs.stringify({ user_id: userInfo.id, for_work_id: item.id, for_message_id: '' }),
          {
            headers: {
              Authorization: `Bearer ${userInfo.api_token}`,
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-localization': 'fr',
            },
          }
        );
        if (response.data?.success === false) {
          throw new Error(response.data?.message || "Le like n'a pas pu être enregistré.");
        }
        const createdLike = response.data?.data?.like || response.data?.data || response.data?.like;
        setHasLiked(true);
        setLikeId(createdLike?.id || response.data?.id || null);
        setLikeCount((count) => count + 1);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.response?.data?.message || error.message || "L'action n'a pas pu être effectuée.",
        position: 'top',
      });
    } finally {
      setLikeUpdating(false);
    }
  };

  const handleActionPress = (event, action) => {
    event.stopPropagation?.();
    action();
  };

  if (isAd) {
    return (
      <TouchableOpacity activeOpacity={0.82} disabled={!item.website_url && !item.has_promo_code} style={[styles.adCard, { backgroundColor: COLORS.dark_secondary }]} onPress={openAd}>
        {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.adImage} resizeMode="cover" /> : <View style={[styles.adImage, styles.adImageFallback, { backgroundColor: COLORS.primary }]}><Icon name="bullhorn-outline" size={26} color="#ffffff" /></View>}
        <View style={styles.adCopy}>
          {item.name ? <Text style={styles.adTitle} numberOfLines={1}>{item.name}</Text> : null}
          <Text style={styles.adText} numberOfLines={3}>{item.message}</Text>
          {item.website_url || item.has_promo_code ? <Text style={[styles.adLink, { color: COLORS.link_color }]}>{t('see_details')} <Icon name="arrow-right" size={13} /></Text> : null}
        </View>
      </TouchableOpacity>
    );
  }

  const openDetails = () => navigation.navigate('WorkData', { itemId: item.id });

  return (
    <TouchableOpacity activeOpacity={0.84} style={[styles.card, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]} onPress={openDetails}>
      {imageUri ? <Image source={{ uri: imageUri }} style={[styles.cover, styles.editorialSurface]} resizeMode="contain" /> : (
        <View style={[styles.cover, styles.coverFallback, { backgroundColor: COLORS.light_primary }]}>
          <Icon name="play-circle-outline" size={34} color={COLORS.primary} />
        </View>
      )}
      <View style={styles.copy}>
        <View>
          <View style={styles.metaRow}>
            <Icon name="play-box-multiple-outline" size={15} color={COLORS.primary} />
            <Text style={[styles.meta, { color: COLORS.primary }]}>Média</Text>
          </View>
          <Text style={[styles.title, { color: COLORS.black }]} numberOfLines={2}>{item.work_title}</Text>
          {item.work_content ? <Text style={[styles.description, { color: COLORS.dark }]} numberOfLines={2}>{item.work_content}</Text> : null}
        </View>
        <View style={styles.actions}>
          <View style={styles.engagementActions}>
            <TouchableOpacity
              accessibilityLabel={hasLiked ? "Retirer le J'aime" : "J'aime"}
              accessibilityRole="button"
              accessibilityState={{ selected: hasLiked }}
              activeOpacity={0.75}
              disabled={likeUpdating}
              onPress={(event) => handleActionPress(event, toggleLike)}
              style={[styles.likeButton, { backgroundColor: hasLiked ? COLORS.danger_transparent : COLORS.light_primary }]}
            >
              {likeUpdating ? <ActivityIndicator size="small" color={COLORS.danger} /> : <Icon name={hasLiked ? 'heart' : 'heart-outline'} size={18} color={hasLiked ? COLORS.danger : COLORS.dark} />}
            </TouchableOpacity>
            <Text style={[styles.likeCount, { color: COLORS.dark }]}>{likeCount}</Text>
            <TouchableOpacity
              accessibilityLabel={isFavorite ? t('remove_from_favorites') : t('add_to_favorite')}
              accessibilityRole="button"
              accessibilityState={{ selected: isFavorite }}
              activeOpacity={0.75}
              disabled={isLoading}
              onPress={(event) => handleActionPress(event, toggleFavorite)}
              style={[styles.favoriteButton, { backgroundColor: isFavorite ? COLORS.light_primary : COLORS.white, borderColor: isFavorite ? COLORS.primary : COLORS.light_secondary }]}
            >
              {isLoading ? <ActivityIndicator size="small" color={COLORS.primary} /> : (
                <>
                  <Icon name={isFavorite ? 'bookmark' : 'bookmark-outline'} size={17} color={COLORS.primary} />
                  <Text style={[styles.favoriteText, { color: COLORS.primary }]}>{isFavorite ? t('favorite_added_short') : t('favorite_short')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <Icon name="arrow-right" size={19} color={COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MediaItemComponent;

const styles = StyleSheet.create({
  actions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  adCard: { borderRadius: 20, flexDirection: 'row', marginBottom: 10, marginHorizontal: 16, minHeight: 116, overflow: 'hidden', padding: 12 },
  adCopy: { flex: 1, justifyContent: 'center' },
  adImage: { borderRadius: 14, height: 92, marginRight: 12, width: 86 },
  adImageFallback: { alignItems: 'center', justifyContent: 'center' },
  adLink: { fontSize: 12, fontWeight: '800', marginTop: 9 },
  adText: { color: '#ffffff', fontSize: 13, lineHeight: 18 },
  adTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800', marginBottom: 5 },
  card: { borderRadius: 20, borderWidth: 1, flexDirection: 'row', marginBottom: 10, marginHorizontal: 16, minHeight: 142, overflow: 'hidden', padding: 12 },
  copy: { flex: 1, justifyContent: 'space-between', marginLeft: 13 },
  cover: { borderRadius: 15, height: 116, width: 88 },
  editorialSurface: { backgroundColor: '#ffffff' },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  description: { fontSize: 13, lineHeight: 18, marginTop: 5 },
  engagementActions: { alignItems: 'center', flexDirection: 'row' },
  favoriteButton: { alignItems: 'center', borderRadius: 17, borderWidth: 1, flexDirection: 'row', height: 34, justifyContent: 'center', marginLeft: 10, minWidth: 78, paddingHorizontal: 10 },
  favoriteText: { fontSize: 11, fontWeight: '800', marginLeft: 4 },
  likeButton: { alignItems: 'center', borderRadius: 17, height: 34, justifyContent: 'center', width: 34 },
  likeCount: { fontSize: 12, fontWeight: '700', marginLeft: 5 },
  meta: { fontSize: 12, fontWeight: '800', marginLeft: 5 },
  metaRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 5 },
  title: { fontSize: 16, fontWeight: '800', lineHeight: 21 },
});
