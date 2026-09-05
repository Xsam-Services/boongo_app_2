/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/FontAwesome6';

import useColors from '../hooks/useColors';

const cleanIconName = icon => {
  if (!icon) return 'building';
  const parts = icon.split(' ');
  return parts[parts.length - 1].replace(/^fa-/, '');
};

const NewsItemComponent = ({ item }) => {
  const COLORS = useColors();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const isAd = item.id === 'ad';
  const organization = item.organization_owner?.org_name || item.organization?.org_name;
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
          {item.website_url || item.has_promo_code ? <Text style={[styles.adLink, { color: COLORS.link_color }]}>{t('see_details')} <Icon name="arrow-right" size={12} /></Text> : null}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.82} style={[styles.card, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]} onPress={() => navigation.navigate('NewsData', { itemId: item.id })}>
      <View style={styles.copy}>
        {organization ? (
          <View style={styles.metaRow}>
            <Icon name={cleanIconName(item.organization_owner?.type?.icon)} size={12} color={COLORS.primary} />
            <Text style={[styles.organization, { color: COLORS.dark }]} numberOfLines={1}>{organization}</Text>
          </View>
        ) : null}
        <Text style={[styles.content, { color: COLORS.black }]} numberOfLines={4}>{item.work_content}</Text>
        <View style={styles.footer}>
          <Text style={[styles.date, { color: COLORS.dark }]}>{item.updated_at_ago}</Text>
          <View style={styles.detailLink}>
            <Text style={[styles.detailText, { color: COLORS.primary }]}>{t('see_details')}</Text>
            <Icon name="arrow-right" size={12} color={COLORS.primary} />
          </View>
        </View>
      </View>
      {workImage ? <Image source={{ uri: workImage }} style={[styles.image, styles.editorialSurface]} resizeMode="contain" /> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, flexDirection: 'row', marginBottom: 10, marginHorizontal: 16, minHeight: 126, overflow: 'hidden', padding: 14 },
  copy: { flex: 1, justifyContent: 'space-between', paddingRight: 12 },
  metaRow: { alignItems: 'center', flexDirection: 'row' },
  organization: { flex: 1, fontSize: 12, fontWeight: '700', marginLeft: 6 },
  content: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  date: { fontSize: 12 },
  detailLink: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  detailText: { fontSize: 12, fontWeight: '800' },
  image: { borderRadius: 14, height: 96, width: 92 },
  editorialSurface: { backgroundColor: '#ffffff' },
  adCard: { borderRadius: 20, flexDirection: 'row', marginBottom: 10, marginHorizontal: 16, minHeight: 116, overflow: 'hidden', padding: 12 },
  adImage: { borderRadius: 14, height: 92, marginRight: 12, width: 86 },
  adContent: { flex: 1, justifyContent: 'center' },
  adTitle: { color: '#ffffff', fontSize: 15, fontWeight: '800', marginBottom: 5 },
  adText: { color: '#ffffff', fontSize: 13, lineHeight: 18 },
  adLink: { fontSize: 12, fontWeight: '800', marginTop: 9 },
});

export default NewsItemComponent;
