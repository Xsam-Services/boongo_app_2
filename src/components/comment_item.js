/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react';
import { Image, Linking, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { IMAGE_SIZE, PADDING } from '../tools/constants';
import useColors from '../hooks/useColors';
import homeStyles from '../screens/style';

const CommentItemComponent = ({ item }) => {
    // =============== Colors ===============
    const COLORS = useColors();
    // =============== Navigation ===============
    const navigation = useNavigation();
    // =============== Language ===============
    const { t } = useTranslation();

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
        <View style={{ backgroundColor: COLORS.white, marginBottom: PADDING.p00, padding: PADDING.p03 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={{ uri: item.user.avatar_url }} style={{ width: IMAGE_SIZE.s13, height: IMAGE_SIZE.s13, borderRadius: IMAGE_SIZE.s13 / 2, marginRight: PADDING.p03, borderWidth: 1, borderColor: COLORS.light_secondary }} onPress={() => navigation.navigate('Profile', { user_id: item.user.id })} />
                <Text style={{ color: COLORS.black }}>{`${item.user.firstname} ${item.user.lastname}`}</Text>
            </View>
            <View>
                <Text style={[homeStyles.workContent, { color: COLORS.black }]}>{item.message_content}</Text>
            </View>
        </View>
    );
};

export default CommentItemComponent;