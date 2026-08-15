/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useColors from './../hooks/useColors';
import homeStyles from './../screens/style';
import { PADDING, TEXT_SIZE } from './../tools/constants';
import { Divider } from 'react-native-paper';
import LogoText from './../../assets/img/brand.svg';
import FooterComponent from './../screens/footer';

const AccountGuard = ({ userInfo, changeStatus, logout, children }) => {
    // =============== Colors ===============
    const COLORS = useColors();
    // =============== Language ===============
    const { t } = useTranslation();

    // Sécurité : si userInfo ou son status n'est pas encore chargé, on ne bloque pas (ou on peut afficher un loader)
    const statusId = userInfo?.status?.id;
    const isRestricted = [4, 5, 29].includes(statusId);

    if (!isRestricted) {
        return children;
    }

    const getContent = () => {
        switch (statusId) {
            case 4:
                return {
                    title: t('auth.status.disabled.title'),
                    message: t('auth.status.disabled.description'),
                    button: true,
                    icon: 'shield-alert-outline'
                };

            case 5:
                return {
                    title: t('auth.status.blocked.title'),
                    message: t('auth.status.blocked.description'),
                    button: false,
                    icon: 'shield-key-outline'
                };

            case 29:
                return {
                    title: t('auth.status.deleted.title'),
                    message: t('auth.status.deleted.description'),
                    button: true,
                    icon: 'trash-can-outline'
                };

            default:
                return {
                    title: t('error', { defaultValue: 'Erreur' }),
                    message: t('auth.status.unknown.description', { defaultValue: 'Statut de compte inconnu.' }),
                    button: false,
                    icon: 'help-circle-outline'
                };
        }
    };

    const content = getContent();

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 50 }}>
            {/* Brand / Title */}
            <View style={[homeStyles.authlogo, { marginBottom: PADDING.p18 }]}>
                <LogoText width={200} height={48} />
            </View>

            {/* Message Content */}
            <Icon name={content.icon} color={COLORS.danger} size={100} style={{ alignSelf: 'center', marginBottom: PADDING.p02 }} />

            <Text style={{ fontSize: TEXT_SIZE.header, fontWeight: 'bold', color: COLORS.danger, marginBottom: PADDING.p02, textAlign: 'center' }}>
                {content.title}
            </Text>

            <Text style={{ fontSize: TEXT_SIZE.paragraph, color: COLORS.black, textAlign: 'center', marginBottom: 30 }}>
                {content.message}
            </Text>

            {content.button && (
                <TouchableOpacity
                    style={[homeStyles.authButton, { backgroundColor: COLORS.primary, paddingVertical: PADDING.p02 }]}
                    onPress={() => { changeStatus(userInfo?.id, 3); }}
                >
                    <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('auth.status.disabled.link2')}</Text>
                </TouchableOpacity>
            )}

            {/* Logout */}
            <TouchableOpacity
                style={[homeStyles.authButton, { backgroundColor: COLORS.white, paddingVertical: PADDING.p02, borderWidth: 1, borderColor: COLORS.primary }]}
                onPress={logout}
            >
                <Text style={[homeStyles.authButtonText, { color: COLORS.primary }]}>{t('logout')}</Text>
            </TouchableOpacity>

            {/* Copyright */}
            <Divider style={[homeStyles.authDivider, { backgroundColor: COLORS.light_secondary }]} />
            <FooterComponent color={COLORS.dark_secondary} />
        </View>
    );
}

export default AccountGuard;