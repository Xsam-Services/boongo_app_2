/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import useColors from './../hooks/useColors';
import homeStyles from './../screens/style';
import { PADDING, TEXT_SIZE } from './../tools/constants';
import LogoText from './../../assets/img/brand.svg';

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
        <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.white }]} edges={['top', 'bottom']}>
            {/* Brand / Title */}
            <View style={styles.brand}>
                <LogoText width={156} height={38} />
            </View>
            <View style={[styles.card, { backgroundColor: COLORS.light_primary, borderColor: COLORS.light_secondary }]}><View style={[styles.iconSurface, { backgroundColor: COLORS.light_danger }]}><Icon name={content.icon} color={COLORS.danger} size={38} /></View><Text style={[styles.title, { color: COLORS.black }]}>{content.title}</Text><Text style={[styles.message, { color: COLORS.dark }]}>{content.message}</Text>{content.button && <TouchableOpacity style={[styles.primary, { backgroundColor: COLORS.primary }]} onPress={() => changeStatus(userInfo?.id, 3)}><Icon name="shield-check-outline" size={20} color="#ffffff" /><Text style={styles.primaryText}>{t('auth.status.disabled.link2')}</Text></TouchableOpacity>}<TouchableOpacity style={[styles.secondary, { borderColor: COLORS.light_secondary }]} onPress={logout}><Icon name="logout" size={19} color={COLORS.dark} /><Text style={[styles.secondaryText, { color: COLORS.dark }]}>{t('logout')}</Text></TouchableOpacity></View>

        </SafeAreaView>
    );
}

export default AccountGuard;

const styles = StyleSheet.create({ screen: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 28 }, brand: { marginBottom: 42 }, card: { borderRadius: 28, borderWidth: 1, padding: 24, width: '100%' }, iconSurface: { alignItems: 'center', alignSelf: 'center', borderRadius: 28, height: 56, justifyContent: 'center', width: 56 }, title: { fontSize: 25, fontWeight: '800', marginTop: 18, textAlign: 'center' }, message: { fontSize: 15, lineHeight: 23, marginTop: 10, textAlign: 'center' }, primary: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', marginTop: 24, minHeight: 54 }, primaryText: { color: '#ffffff', fontSize: 14, fontWeight: '800', marginLeft: 8 }, secondary: { alignItems: 'center', borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', marginTop: 10, minHeight: 52 }, secondaryText: { fontSize: 14, fontWeight: '800', marginLeft: 8 } });
