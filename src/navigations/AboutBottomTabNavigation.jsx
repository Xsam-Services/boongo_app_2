import React from 'react';
import {StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';

import AboutScreen from '../screens/About';
import TermsScreen from '../screens/About/terms';
import PrivacyScreen from '../screens/About/privacy';
import ContactScreen from '../screens/About/contact';
import useColors from '../hooks/useColors';

const BottomTab = createBottomTabNavigator();

const createTabBarIcon = icon =>
  function TabBarIcon({color, focused, size}) {
    return (
      <Icon
        name={focused ? icon.replace('-outline', '') : icon}
        color={color}
        size={size}
      />
    );
  };

const SCREENS = [
  {
    name: 'AboutTab',
    component: AboutScreen,
    titleKey: 'navigation.about',
    tabBarIcon: createTabBarIcon('information-outline'),
  },
  {
    name: 'Terms',
    component: TermsScreen,
    titleKey: 'navigation.terms',
    tabBarIcon: createTabBarIcon('file-check-outline'),
  },
  {
    name: 'Privacy',
    component: PrivacyScreen,
    titleKey: 'navigation.privacy',
    tabBarIcon: createTabBarIcon('shield-lock-outline'),
  },
  {
    name: 'Contact',
    component: ContactScreen,
    titleKey: 'navigation.contact',
    tabBarIcon: createTabBarIcon('message-text-outline'),
  },
];

export const AboutBottomTabNavigation = () => {
  const colors = useColors();
  const {t} = useTranslation();

  return (
    <BottomTab.Navigator
      initialRouteName="AboutTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.dark,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarStyle: [
          styles.bar,
          {
            backgroundColor: colors.white,
            borderTopColor: colors.light_secondary,
          },
        ],
      }}>
      {SCREENS.map(screen => (
        <BottomTab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={{
            title: t(screen.titleKey),
            tabBarAccessibilityLabel: t(screen.titleKey),
            tabBarIcon: screen.tabBarIcon,
          }}
        />
      ))}
    </BottomTab.Navigator>
  );
};

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 64,
    paddingTop: 6,
  },
  item: {paddingVertical: 2},
  label: {fontSize: 10, fontWeight: '700'},
});
