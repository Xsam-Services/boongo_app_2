/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useColors from '../hooks/useColors';

const FileThumbnail = ({ uri, type, title, onPress }) => {
    const COLORS = useColors();
    const isImageOrVideo = type === 'image' || type === 'video';

    return (
        <TouchableOpacity style={[styles.container, {backgroundColor: COLORS.black}]} onPress={onPress}>
            {isImageOrVideo ? (
                <Image source={{ uri }} style={styles.thumbnail} resizeMode="cover" />
            ) : (
                <View style={[styles.thumbnail, styles.iconWrapper, { backgroundColor: (type === 'audio' ? COLORS.primary : COLORS.success) }]}>
                    <Icon name={type === 'audio' ? 'music' : 'file-document'} size={30} color='white' />
                </View>
            )}

            {type === 'video' && (
                <View style={[styles.playOverlay, { backgroundColor: COLORS.danger }]}>
                    <Icon name="play-circle-outline" size={30} color='white' />
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
    iconWrapper: {
        justifyContent: 'center', alignItems: 'center',
    },
    playOverlay: {
        position: 'absolute', top: 0, left: 0, width: '100%', height: 80, display: 'flex', justifyContent: 'center', alignItems: 'center',
    },
    label: {
        fontSize: 12, marginVertical: 4, textAlign: 'center',
    },
});

export default FileThumbnail;
