/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import FaIcon from '@expo/vector-icons/FontAwesome6';
import { getTranslationKeyFromAlias } from './../utils/notificationMapper';
import useColors from '../hooks/useColors';

const NotificationItemComponent = ({ item, onPress }) => {
    // =============== Colors ===============
    const COLORS = useColors();
    // =============== Language ===============
    const { t } = useTranslation();

    // =============== First letter uppercase ===============
    const ucfirst = (str) => {
        if (!str) return str;

        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // =============== Message ===============
    let message = '';

    if (item.text_content) {
        // ✅ Notification already read: use text_content
        message = t(item.text_content, {
            username: `${item.from?.firstname} ${item.from?.lastname}`,
            event_title: item.event?.event_title,
            organisation_name: item.organization?.org_name,
            circle_name: item.circle?.circle_name,
            count: item.group_count || 1,
        });
    } else {
        // 🔁 Unread notification: dynamically rebuild
        let entity = null;

        if (['subscription_notif', 'work_consultation_notif', 'liked_work_notif', 'liked_message_notif'].includes(item.type.alias)) {
            entity = item.group_entity || 'one';

        } else if (item.circle_id) {
            entity = 'cercle';

        } else if (item.event_id) {
            entity = 'event';
        }

        const translationKey = getTranslationKeyFromAlias(item.type.alias, entity);

        message = t(translationKey, {
            username: `${item.from?.firstname} ${item.from?.lastname}`,
            event_title: item.event?.event_title,
            organisation_name: item.organization?.org_name,
            circle_name: item.circle?.circle_name,
            count: item.group_count || 1,
        });
    }

    // Adjust icon name
    const cleanIconName = (icon) => {
        // Separates the string by space and takes the last part, without the prefix
        const iconParts = icon.split(' ');  // Separates the prefix and the icon name
        return iconParts[iconParts.length - 1].replace(/^fa-/, '');  // Remove "fa-" if necessary
    };

    const icon = item.type?.icon || item.icon;

    return (
        <TouchableOpacity style={[styles.card, { backgroundColor: COLORS.white }]} onPress={() => onPress(item)} activeOpacity={0.75}>
            {item.type ? <View style={[styles.unreadDot, { backgroundColor: COLORS.info }]} /> : null}
            <View style={[styles.iconContainer, { backgroundColor: COLORS.light_primary }]}>
                <FaIcon name={cleanIconName(icon)} size={20} color={COLORS.primary} />
            </View>
            <View style={styles.content}>
                <Text style={[styles.message, { color: COLORS.black }]} numberOfLines={3}>{message}</Text>
                <Text style={[styles.date, { color: COLORS.dark_secondary }]}>{ucfirst(item.created_at_explicit)}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', marginBottom: 10, minHeight: 88, padding: 14 },
    iconContainer: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', marginRight: 12, width: 36 },
    content: { flex: 1, paddingRight: 8 },
    message: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
    date: { fontSize: 12, marginTop: 6 },
    unreadDot: { borderRadius: 4, height: 8, position: 'absolute', right: 14, top: 14, width: 8 },
});

export default NotificationItemComponent;
