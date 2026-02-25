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

const WorkItemComponent = ({ item }) => {
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
        <View style={[homeStyles.workTop, { backgroundColor: COLORS.white, marginBottom: PADDING.p00, padding: PADDING.p03 }]}>
            <View>
                <Image source={{ uri: item.photo_url }} style={[homeStyles.workImage, { borderColor: COLORS.light_secondary }]} onPress={() => navigation.navigate('WorkData', { itemId: item.id })} />
            </View>
            <View style={homeStyles.workDescTop}>
                <Text style={[homeStyles.workTitle, { color: COLORS.black }]} numberOfLines={2} onPress={() => navigation.navigate('WorkData', { itemId: item.id })}>{item.work_title}</Text>
                <Text style={[homeStyles.workContent, { color: COLORS.black }]} numberOfLines={3} onPress={() => navigation.navigate('WorkData', { itemId: item.id })}>{item.work_content}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: PADDING.p00 }}>
                    <Icon name='heart-outline' size={IMAGE_SIZE.s04} color={COLORS.dark_secondary} style={{ marginRight: PADDING.p00 }} />
                    <Text style={{ fontWeight: '400', color: COLORS.dark_secondary }}>{`${item.likes ? item.likes.length : 0 } ${item.likes ? (item.likes.length > 1 ? t('likes') : t('like')) : t('like')}`}</Text>
                </View>
                <TouchableOpacity style={homeStyles.linkIcon} onPress={() => navigation.navigate('WorkData', { itemId: item.id })}>
                    <Text style={[homeStyles.link, { color: COLORS.link_color }]}>{t('see_details')} </Text>
                    <Icon name='chevron-right' size={IMAGE_SIZE.s05} color={COLORS.link_color} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default WorkItemComponent;