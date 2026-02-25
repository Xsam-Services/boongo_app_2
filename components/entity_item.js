/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext } from 'react';
import { View, Text, Image, Pressable, SafeAreaView, Linking, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import useColors from '../hooks/useColors';
import { IMAGE_SIZE, PADDING, TEXT_SIZE } from '../tools/constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import homeStyles from '../screens/style';

const EntityItemComponent = ({ item, entity, entity_id, entity_name, entity_profile, doc_title, doc_page, doc_note }) => {
    // =============== Colors ===============
    const COLORS = useColors();
    // =============== Language ===============
    const { t } = useTranslation();
    // =============== Navigation ===============
    const navigation = useNavigation();
    // =============== Get contexts ===============
    const { userInfo } = useContext(AuthContext);

    const handlePress = () => {
        navigation.navigate('NewChat', { chat_entity: entity, chat_entity_id: entity_id, chat_entity_name: entity_name, chat_entity_profile: entity_profile, doc_title: doc_title, doc_page: doc_page, doc_note: doc_note });
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

    switch (entity) {
        case 'user':
            return (
                <Pressable onPress={handlePress} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: PADDING.p03,
                    backgroundColor: COLORS.white
                }}>
                    <Image
                        source={{ uri: item.avatar_url }}
                        style={{
                            width: IMAGE_SIZE.s13,
                            height: IMAGE_SIZE.s13,
                            borderRadius: IMAGE_SIZE.s13 / 2,
                            marginRight: PADDING.p03,
                            borderWidth: 1,
                            borderColor: COLORS.light_secondary
                        }}
                    />
                    <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ color: COLORS.black, fontSize: TEXT_SIZE.paragraph, fontWeight: '500' }}>{item.id === userInfo.id ? t('you') : `${item.firstname} ${item.lastname}`}</Text>
                        <Text numberOfLines={1} style={{ color: COLORS.dark_secondary }}>{`@${item.username}`}</Text>
                    </View>
                    <Icon name="chevron-right" size={IMAGE_SIZE.s05} color={COLORS.black} />
                </Pressable>
            );
            break;

        case 'circle':
            return (
                <Pressable onPress={handlePress} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: PADDING.p03,
                    backgroundColor: COLORS.white
                }}>
                    <Image
                        source={{ uri: item.cover_url }}
                        style={{
                            width: IMAGE_SIZE.s13,
                            height: IMAGE_SIZE.s13,
                            borderRadius: PADDING.p00,
                            marginRight: PADDING.p03,
                            borderWidth: 1,
                            borderColor: COLORS.light_secondary
                        }}
                    />
                    <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ color: COLORS.black, fontSize: TEXT_SIZE.paragraph, fontWeight: '500' }}>{`${item.circle_name}`}</Text>
                    </View>
                    <Icon name="chevron-right" size={IMAGE_SIZE.s05} color={COLORS.black} />
                </Pressable>
            );
            break;

        case 'organization':
            return (
                <Pressable onPress={handlePress} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: PADDING.p03,
                    backgroundColor: COLORS.white
                }}>
                    <Image
                        source={{ uri: item.cover_url }}
                        style={{
                            width: IMAGE_SIZE.s13,
                            height: IMAGE_SIZE.s13,
                            borderRadius: PADDING.p00,
                            marginRight: PADDING.p03,
                            borderWidth: 1,
                            borderColor: COLORS.light_secondary
                        }}
                    />
                    <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ color: COLORS.black, fontSize: TEXT_SIZE.paragraph, fontWeight: '500' }}>{`${item.org_name}`}</Text>
                        <Text numberOfLines={2} style={{ color: COLORS.dark_secondary }}>{`${item.org_description}`}</Text>
                    </View>
                    <Icon name="chevron-right" size={IMAGE_SIZE.s05} color={COLORS.black} />
                </Pressable>
            );
            break;

        case 'event':
            return (
                <Pressable onPress={handlePress} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: PADDING.p03,
                    backgroundColor: COLORS.white
                }}>
                    <Image
                        source={{ uri: item.cover_url }}
                        style={{
                            width: IMAGE_SIZE.s13,
                            height: IMAGE_SIZE.s13,
                            borderRadius: PADDING.p00,
                            marginRight: PADDING.p03,
                            borderWidth: 1,
                            borderColor: COLORS.light_secondary
                        }}
                    />
                    <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ color: COLORS.black, fontSize: TEXT_SIZE.paragraph, fontWeight: '500' }}>{`${item.event_title}`}</Text>
                        <Text numberOfLines={2} style={{ color: COLORS.dark_secondary }}>{`${item.event_description}`}</Text>
                    </View>
                    <Icon name="chevron-right" size={IMAGE_SIZE.s05} color={COLORS.black} />
                </Pressable>
            );
            break;

        default:
            break;
    }
};

export default EntityItemComponent;