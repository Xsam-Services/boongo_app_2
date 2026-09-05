/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import useColors from '../hooks/useColors';

const FileThumbnail = ({ uri, type, title, onPress }) => {
    const COLORS = useColors();
    const isImage = type === 'image';

    return (
        <TouchableOpacity style={[styles.container, {backgroundColor: COLORS.black}]} onPress={onPress}>
            {isImage ? (
                <Image source={{ uri }} style={[styles.thumbnail, styles.editorialSurface]} resizeMode="contain" />
            ) : (
                <View style={[styles.thumbnail, styles.iconWrapper, { backgroundColor: type === 'audio' ? COLORS.primary : type === 'video' ? COLORS.danger : COLORS.success }]}>
                    <Icon name={type === 'audio' ? 'music' : type === 'video' ? 'play-circle-outline' : 'file-document'} size={30} color='white' />
                </View>
            )}

            <Text style={[styles.label, { color: COLORS.white }]}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: { height: 107, marginTop: 10, marginBottom: 0, marginLeft: 0, marginRight: 20, width: 80, borderRadius: 8, overflow: 'hidden', alignItems: 'center' },
    thumbnail: {
        width: 80, height: 80,
    },
    editorialSurface: { backgroundColor: '#ffffff' },
    iconWrapper: {
        justifyContent: 'center', alignItems: 'center',
    },
    label: {
        fontSize: 12, marginVertical: 4, textAlign: 'center',
    },
});

export default FileThumbnail;
