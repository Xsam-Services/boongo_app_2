/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import useColors from '../hooks/useColors';
import EmptyListIllustration from '../../assets/img/empty-list-search.svg';

const EmptyListComponent = ({ iconName, title }) => {
    const COLORS = useColors();

    return (
        <View style={styles.container}>
            <View style={[styles.card, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
                <EmptyListIllustration width={248} height={196} />
                {iconName &&
                    <View style={[styles.iconBadge, { backgroundColor: COLORS.light_secondary }]}>
                        <Icon name={iconName} size={18} color={COLORS.primary} />
                    </View>
                }
                {title &&
                    <Text style={[styles.title, { color: COLORS.dark }]}>{title}</Text>
                }
            </View>
        </View>
    );
};

export default EmptyListComponent;

const styles = StyleSheet.create({
    card: {
        alignItems: 'center',
        borderRadius: 28,
        borderWidth: 1,
        maxWidth: 360,
        paddingHorizontal: 24,
        paddingVertical: 24,
        width: '100%',
    },
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 330,
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    iconBadge: {
        alignItems: 'center',
        borderRadius: 18,
        height: 36,
        justifyContent: 'center',
        marginTop: -12,
        width: 36,
    },
    title: {
        fontSize: 19,
        fontWeight: '800',
        marginTop: 16,
        textAlign: 'center',
    },
});
