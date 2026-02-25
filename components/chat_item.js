/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useColors from '../hooks/useColors';
import { IMAGE_SIZE, PADDING, TEXT_SIZE } from '../tools/constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ChatItemComponent = ({ item }) => {
    // =============== Colors ===============
    const COLORS = useColors();
    const navigation = useNavigation();

    const handlePress = () => {
        navigation.navigate('NewChat', {
            chat_entity: item.chat_entity,
            chat_entity_id: item.chat_entity_id,
            chat_entity_name: item.chat_entity_name,
            chat_entity_profile: item.chat_entity_profile,
        });
    };

    const name =
        item.chat_entity_name && item.chat_entity_name !== 'undefined'
            ? item.chat_entity_name
            : 'Utilisateur inconnu';

    const avatar =
        item.chat_entity_profile && item.chat_entity_profile !== 'null'
            ? item.chat_entity_profile
            : 'https://cdn-icons-png.flaticon.com/512/847/847969.png'; // Default avatar

    const lastMsg = item.lastMessage?.message_content || 'Aucun message';
    const latestAt = item.latest_at
        ? new Date(item.latest_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: PADDING.p03,
                backgroundColor: COLORS.white,
                borderBottomWidth: 0.6,
                borderBottomColor: COLORS.light_secondary,
            }}
        >
            <Image
                source={{ uri: avatar }}
                style={{
                    width: IMAGE_SIZE.s13,
                    height: IMAGE_SIZE.s13,
                    borderRadius: IMAGE_SIZE.s13 / 2,
                    marginRight: PADDING.p03,
                    borderWidth: 1,
                    borderColor: COLORS.light_secondary,
                }}
            />
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text
                        numberOfLines={1}
                        style={{
                            color: COLORS.black,
                            fontSize: TEXT_SIZE.paragraph,
                            fontWeight: 'bold',
                        }}
                    >
                        {name}
                    </Text>
                    <Text numberOfLines={1} style={{ color: COLORS.dark_secondary }}>
                        {latestAt}
                    </Text>
                </View>
                <Text
                    numberOfLines={1}
                    style={{ fontSize: TEXT_SIZE.label, color: COLORS.dark_secondary }}
                >
                    {lastMsg}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default ChatItemComponent;