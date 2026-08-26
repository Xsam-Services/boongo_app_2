import React from "react";
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from '@expo/vector-icons/MaterialCommunityIcons';

import AboutScreen from '../screens/About';
import TermsScreen from '../screens/About/terms';
import PrivacyScreen from '../screens/About/privacy';
import ContactScreen from '../screens/About/contact';
import useColors from "../hooks/useColors";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Logo from '../../assets/img/icon.svg';
import { PADDING } from '../tools/constants';

const BottomTab = createBottomTabNavigator();

export const AboutBottomTabNavigation = () => {
    // =============== Colors ===============
    const COLORS = useColors();
    // =============== Navigation ===============
    const navigation = useNavigation();
    // =============== Language ===============
    const { t } = useTranslation();

    return (
        <BottomTab.Navigator
            initialRouteName='AboutTab'
            screenOptions={{
                tabBarActiveTintColor: COLORS.black,
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    paddingTop: PADDING.p00,
                },
                tabBarShowLabel: false,
                headerStyle: {
                    backgroundColor: COLORS.white,
                },
                headerTitleStyle: {
                    color: COLORS.black,
                },
                headerLeft: () => {
                    return (
                        <>
                            <TouchableOpacity onPress={() => navigation.navigate('Home', { screen: 'HomeStack' })}>
                                <Icon name='chevron-left' size={37} color={COLORS.black} />
                            </TouchableOpacity>
                            <Logo width={30} height={30} style={{ marginRight: PADDING.p01 }} />
                        </>
                    );
                },
            }}>
            <BottomTab.Screen
                name='AboutTab' component={AboutScreen}
                options={{
                    title: t('navigation.about'),
                    tabBarLabel: t('navigation.about'),
                    tabBarIcon: ({ color, size, focused }) => (
                        focused ?
                            <Icon name='help-circle' color={COLORS.black} size={size} />
                            :
                            <Icon name='help-circle-outline' color={color} size={size} />
                    ),
                }}
            />
            <BottomTab.Screen
                name='Terms' component={TermsScreen}
                options={{
                    title: t('navigation.terms'),
                    tabBarLabel: t('navigation.terms'),
                    tabBarIcon: ({ color, size, focused }) => (
                        focused ?
                            <Icon name='file-check' color={COLORS.black} size={size} />
                            :
                            <Icon name='file-check-outline' color={color} size={size} />
                    ),
                }}
            />
            <BottomTab.Screen
                name='Privacy' component={PrivacyScreen}
                options={{
                    title: t('navigation.privacy'),
                    tabBarLabel: t('navigation.privacy'),
                    tabBarIcon: ({ color, size, focused }) => (
                        focused ?
                            <Icon name='shield-star' color={COLORS.black} size={size} />
                            :
                            <Icon name='shield-star-outline' color={color} size={size} />
                    ),
                }}
            />
            <BottomTab.Screen
                name='Contact' component={ContactScreen}
                options={{
                    title: t('navigation.contact'),
                    tabBarLabel: t('navigation.contact'),
                    tabBarIcon: ({ color, size, focused }) => (
                        focused ?
                            <Icon name='phone' color={COLORS.black} size={size} />
                            :
                            <Icon name='phone-outline' color={color} size={size} />
                    ),
                }}
            />
        </BottomTab.Navigator>
    );
}
