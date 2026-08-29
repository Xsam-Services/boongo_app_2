/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import useColors from '../hooks/useColors';

const WorkItemComponent = ({ item }) => {
  const COLORS = useColors();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const isAd = item.id === 'ad';
  const workImage = item.photo_url || item.images?.find(image => image.type?.alias === 'image_file')?.file_url || item.images?.find(image => image.file_url)?.file_url;

  const openAd = () => {
    if (item.has_promo_code) {
      navigation.navigate('Subscription', { itemId: item.realId });
    } else if (item.website_url) {
      Linking.openURL(item.website_url);
    }
  };

  if (isAd) {
    return (
      <TouchableOpacity activeOpacity={0.82} disabled={!item.website_url && !item.has_promo_code} style={[styles.adCard, { backgroundColor: COLORS.dark_secondary }]} onPress={openAd}>
        {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.adImage} resizeMode="cover" /> : null}
        <View style={styles.adContent}>
          {item.name ? <Text style={styles.adTitle} numberOfLines={1}>{item.name}</Text> : null}
          <Text style={styles.adText} numberOfLines={3}>{item.message}</Text>
          {item.website_url || item.has_promo_code ? <Text style={[styles.adLink, { color: COLORS.link_color }]}>{t('see_details')} <Icon name="arrow-right" size={13} /></Text> : null}
        </View>
      </TouchableOpacity>
    );
  }

  const likes = item.likes?.length || 0;
  const details = () => navigation.navigate('WorkData', { itemId: item.id });

  return (
    <TouchableOpacity activeOpacity={0.82} style={[styles.card, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]} onPress={details}>
      {workImage ? <Image source={{ uri: workImage }} style={[styles.image, { backgroundColor: COLORS.light_secondary }]} resizeMode="cover" /> : (
        <View style={[styles.image, styles.imageFallback, { backgroundColor: COLORS.light_primary }]}>
          <Icon name="book-open-page-variant-outline" size={27} color={COLORS.primary} />
        </View>
      )}
      <View style={styles.copy}>
        <Text style={[styles.title, { color: COLORS.black }]} numberOfLines={2}>{item.work_title}</Text>
        <Text style={[styles.description, { color: COLORS.dark }]} numberOfLines={3}>{item.work_content}</Text>
        <View style={styles.footer}>
          <View style={styles.likes}>
            <Icon name="heart-outline" size={16} color={COLORS.dark} />
            <Text style={[styles.likesText, { color: COLORS.dark }]}>{likes} {likes === 1 ? t('like') : t('likes')}</Text>
          </View>
          <Icon name="arrow-right" size={18} color={COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, flexDirection: 'row', marginBottom: 10, marginHorizontal: 16, minHeight: 150, overflow: 'hidden', padding: 14 },
  image: { borderRadius: 15, height: 120, width: 88 },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, justifyContent: 'space-between', marginLeft: 13 },
  title: { fontSize: 16, fontWeight: '800', lineHeight: 21 },
  description: { fontSize: 13, lineHeight: 18, marginTop: 6 },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 },
  likes: { alignItems: 'center', flexDirection: 'row' },
  likesText: { fontSize: 12, marginLeft: 5 },
  adCard: { borderRadius: 20, flexDirection: 'row', marginBottom: 10, marginHorizontal: 16, minHeight: 116, overflow: 'hidden', padding: 12 },
  adImage: { borderRadius: 14, height: 92, marginRight: 12, width: 86 },
  adContent: { flex: 1, justifyContent: 'center' },
  adTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800', marginBottom: 5 },
  adText: { color: '#ffffff', fontSize: 13, lineHeight: 18 },
  adLink: { fontSize: 12, fontWeight: '800', marginTop: 9 },
});

export default WorkItemComponent;
