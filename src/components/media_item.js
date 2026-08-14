/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext } from 'react';
import { Dimensions, Image, Linking, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../contexts/AuthContext';
import { IMAGE_SIZE, PADDING } from '../tools/constants';
import useColors from '../hooks/useColors';
import homeStyles from '../screens/style';

const MediaItemComponent = ({ item }) => {
    // =============== Colors ===============
    const COLORS = useColors();
    // =============== Navigation ===============
    const navigation = useNavigation();
    // =============== Language ===============
    const { t } = useTranslation();
    // =============== Get contexts ===============
    const { userInfo, isLoading, addToCart, removeFromCart } = useContext(AuthContext);
    // Check if user has added work in the cart
    const isInCart = userInfo.favorite_works && userInfo.favorite_works.some(work => work.id === item.id);

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
                <Image source={{ uri: item.photo_url }} style={[homeStyles.workImage, { height: Dimensions.get('window').width / 3, borderColor: COLORS.light_secondary }]} onPress={() => navigation.navigate('WorkData', { itemId: item.id })} />
            </View>
            <View style={homeStyles.workDescTop}>
                <Text style={[homeStyles.workDescText, { fontWeight: '400', color: COLORS.black }]} numberOfLines={3}>{item.work_title}</Text>
                {/* <Text style={[homeStyles.workContent, { color: COLORS.black }]} numberOfLines={3} onPress={() => navigation.navigate('WorkData', { itemId: item.id })}>{item.work_content}</Text> */}
                <TouchableOpacity style={homeStyles.linkIcon} onPress={() => navigation.navigate('WorkData', { itemId: item.id })}>
                    <Text style={[homeStyles.link, { color: COLORS.link_color }]}>{t('see_details')} </Text>
                    <Icon name='chevron-right' size={IMAGE_SIZE.s05} color={COLORS.link_color} />
                </TouchableOpacity>
                {isInCart ? (
                    <TouchableOpacity style={homeStyles.linkIcon} onPress={() => { removeFromCart(userInfo.favorite_works_cart.id, item.id, null); }} disabled={isLoading}>
                        <Icon name='check' size={IMAGE_SIZE.s05} color={COLORS.success} />
                        <Text style={[homeStyles.link, { fontWeight: '400', color: COLORS.success }]}>{t('already_selected')} </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={homeStyles.linkIcon} onPress={() => { addToCart('favorite', userInfo.id, item.id, null); }} disabled={isLoading}>
                        <Icon name='plus' size={IMAGE_SIZE.s05} color={COLORS.danger} />
                        <Text style={[homeStyles.link, { fontWeight: '400', color: COLORS.danger }]}>{t('add_to_favorite')} </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default MediaItemComponent;