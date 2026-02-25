/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react';
import { Image, Linking, Pressable, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { IMAGE_SIZE, PADDING } from '../tools/constants';
import useColors from '../hooks/useColors';
import homeStyles from '../screens/style';

const NewsItemComponent = ({ item }) => {
    // =============== Colors ===============
    const COLORS = useColors();
    // =============== Navigation ===============
    const navigation = useNavigation();
    // =============== Language ===============
    const { t } = useTranslation();

    // Limit number of characters of string
    const limitCharacter = (text, count) => {
        return text.slice(0, count) + (text.length > count ? '...' : '');
    };

    // Adjust icon name
    const cleanIconName = (icon) => {
        // Separates the string by space and takes the last part, without the prefix
        const iconParts = icon.split(' ');  // Separates the prefix and the icon name
        return iconParts[iconParts.length - 1].replace(/^fa-/, '');  // Remove "fa-" if necessary
    };

    if (item.id === 'ad') {
        // If it is the "advertisement" object, we display the advertisement component
        if (item.has_promo_code) {
            <SafeAreaView style={[homeStyles.workTop, { backgroundColor: COLORS.black, marginBottom: PADDING.p00, paddingHorizontal: PADDING.p03 }]}>
                <View>
                    <Image source={{ uri: item.image_url }} style={[homeStyles.newsImage, { borderColor: COLORS.light_secondary }]} />
                </View>
                <View style={homeStyles.workDescTop}>
                    <Text style={[homeStyles.newsContent, { color: COLORS.white }]} numberOfLines={4}>{item.message}</Text>
                    {item.website_url &&
                        <TouchableOpacity style={homeStyles.linkIcon} onPress={() => navigation.navigate('Subscription', { itemId: item.realId })}>
                            <Text style={[homeStyles.link, { color: COLORS.link_color }]}>{t('see_details')} </Text>
                            <Icon name='chevron-right' size={IMAGE_SIZE.s05} color={COLORS.link_color} />
                        </TouchableOpacity>
                    }
                </View>
            </SafeAreaView>

        } else {
            if (item.website_url) {
                return (
                    <TouchableOpacity onPress={() => Linking.openURL(item.website_url)}>
                        <SafeAreaView style={[homeStyles.workTop, { backgroundColor: COLORS.black, marginBottom: PADDING.p00, paddingHorizontal: PADDING.p03 }]}>
                            <View>
                                <Image source={{ uri: item.image_url }} style={[homeStyles.newsImage, { marginLeft: 0, marginRight: 10, borderColor: COLORS.light_secondary }]} />
                            </View>
                            <View style={homeStyles.workDescTop}>
                                <Text style={[homeStyles.newsContent, { fontSize: 16, fontWeight: '700', color: COLORS.white }]} numberOfLines={1}>{item.name}</Text>
                                <Text style={[homeStyles.newsContent, { color: COLORS.white }]} numberOfLines={4}>{item.message}</Text>
                            </View>
                            <Icon name='earth' size={IMAGE_SIZE.s03} color={COLORS.dark_secondary} style={{ position: 'absolute', bottom: PADDING.p01, right: PADDING.p01 }} />
                        </SafeAreaView>
                    </TouchableOpacity>
                );

            } else {
                <SafeAreaView style={[homeStyles.workTop, { backgroundColor: COLORS.black, marginBottom: PADDING.p00, paddingHorizontal: PADDING.p03 }]}>
                    <View>
                        <Image source={{ uri: item.image_url }} style={[homeStyles.newsImage, { marginLeft: 0, marginRight: 10, borderColor: COLORS.light_secondary }]} />
                    </View>
                    <View style={homeStyles.workDescTop}>
                        <Text style={[homeStyles.newsContent, { fontSize: 16, fontWeight: '700', color: COLORS.white }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[homeStyles.newsContent, { color: COLORS.white }]} numberOfLines={4}>{item.message}</Text>
                    </View>
                </SafeAreaView>
            }
        }
    }

    return (
        <TouchableOpacity style={[homeStyles.workTop, { backgroundColor: COLORS.white, marginBottom: PADDING.p01, paddingHorizontal: PADDING.p03 }]} onPress={() => navigation.navigate('NewsData', { itemId: item.id })}>
            <View style={homeStyles.workDescTop}>
                <Text style={[homeStyles.newsContent, { color: COLORS.black }]} numberOfLines={3}>{item.work_content}</Text>
                <View style={[homeStyles.workTop, { paddingVertical: 0 }]}>
                    <View style={[homeStyles.workTop, { paddingVertical: 0 }]}>
                        <Icon name={cleanIconName(item.organization_owner.type.icon)} size={IMAGE_SIZE.s01} color={COLORS.danger} style={{ marginRight: PADDING.p00 }} />
                        <Text style={[homeStyles.newsDate, { color: COLORS.dark_secondary }]}>
                            {limitCharacter(item.organization_owner.org_name, 10)}
                        </Text>
                    </View>
                    <Text style={[homeStyles.newsDate, { color: COLORS.dark_secondary }]}>{item.updated_at_ago}</Text>
                </View>
            </View>
            <View>
                <Image source={{ uri: item.photo_url }} style={[homeStyles.newsImage, { borderColor: COLORS.light_secondary }]} />
            </View>
        </TouchableOpacity>
    );
};

export default NewsItemComponent;