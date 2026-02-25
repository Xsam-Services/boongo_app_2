/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext } from 'react';
import { View, Text, Image } from 'react-native';
import { Title } from 'react-native-paper';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import FaIcon from 'react-native-vector-icons/FontAwesome6';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PADDING, TEXT_SIZE } from './tools/constants';
import { AuthContext } from './contexts/AuthContext';
import FooterComponent from './screens/footer';
import homeStyles from './screens/style';
import useColors from './hooks/useColors';

const DrawerList = [
    { icon: 'home-outline', label: 'navigation.home.title', navigateTo: 'HomeStack', toScreen: null },
    { icon: 'account-outline', label: 'navigation.account.title', navigateTo: 'Account', toScreen: null },
    { icon: 'bank-outline', label: 'navigation.establishment.title', navigateTo: 'Establishment', toScreen: null },
    { icon: 'city-variant-outline', label: 'navigation.government.title', navigateTo: 'Government', toScreen: null },
    { icon: 'image-multiple-outline', label: 'navigation.media.title', navigateTo: 'Media', toScreen: null },
    { icon: 'cog-outline', label: 'navigation.settings.title', navigateTo: 'Settings', toScreen: null },
    { icon: 'help-circle-outline', label: 'navigation.about', navigateTo: 'About', toScreen: 'Contact' }
];

const DrawerLayout = ({ icon, label, navigateTo, toScreen }) => {
    // =============== Colors ===============
    const COLORS = useColors();
    // =============== Navigation ===============
    const navigation = useNavigation();
    // =============== Language ===============
    const { t } = useTranslation();

    return (
        <DrawerItem
            label={t(label)}
            icon={({ color, size }) => <Icon name={icon} color={COLORS.black} size={size} />}
            labelStyle={{ fontSize: TEXT_SIZE.paragraph, color: COLORS.black }}
            onPress={() => {
                if (toScreen != null) {
                    navigation.navigate(navigateTo, { screen: toScreen });

                } else {
                    navigation.navigate(navigateTo);
                }
            }}
        />
    );
};

const DrawerItems = props => {
    return DrawerList.map((el, i) => {
        return (
            <DrawerLayout key={i}
                icon={el.icon}
                label={el.label}
                navigateTo={el.navigateTo} />
        );
    });
};

const DrawerContent = (props) => {
    // =============== Colors ===============
    const COLORS = useColors();
    // =============== Language ===============
    const { t } = useTranslation();
    // =============== Get data ===============
    const { userInfo, logout } = useContext(AuthContext);

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.white, borderTopRightRadius: 15, borderBottomRightRadius: 15 }}>
            <DrawerContentScrollView {...props}>
                <View style={homeStyles.drawerCurrentUser}>
                    <View style={{ marginTop: 5 }}>
                        <Image style={{ width: 60, height: 60, borderRadius: 30 }} source={{ uri: userInfo.avatar_url }} />
                    </View>
                    <View style={{ marginLeft: PADDING.p01, flexDirection: 'column' }}>
                        <Title style={[homeStyles.drawerTitle, { color: COLORS.black }]}>{userInfo.firstname + ' ' + userInfo.lastname}</Title>
                        <Text style={{ fontSize: TEXT_SIZE.label, color: COLORS.warning }}>@{userInfo.username}</Text>
                    </View>
                </View>
                <View style={homeStyles.drawerSection}>
                    <DrawerItems />
                    <View style={homeStyles.drawerFooter}>
                        <DrawerItem
                            icon={() => <FaIcon name='power-off' color='white' size={18} />}
                            label={t('logout')} labelStyle={{ fontSize: TEXT_SIZE.paragraph, color: 'white' }}
                            style={{ backgroundColor: COLORS.primary, marginBottom: PADDING.p05 }}
                            onPress={logout} />
                        <FooterComponent />
                    </View>
                </View>
            </DrawerContentScrollView>
        </View>
    );
};

export default DrawerContent;