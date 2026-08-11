/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useState } from 'react'
import { AuthContext, AuthProvider } from './contexts/AuthContext';
import { SearchContext, SearchProvider } from './contexts/SearchContext';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from './contexts/ThemeContext';
import { Dimensions, TextInput, TouchableOpacity, View } from 'react-native';

import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as ScreenCapture from 'expo-screen-capture';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PADDING } from './tools/constants';
import DrawerContent from './DrawerContent';
import Logo from './assets/img/icon.svg';
import useColors from './hooks/useColors';
import homeStyles from './screens/style';
import SplashScreen from './screens/splash_screen';
import AccountGuard from './AccountGuard';

import * as SplashScreenManager from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingScreen from './screens/onboarding/OnboardingScreen';
import { HomeStackNavigation } from './screens/navigations/HomeStackNavigation';
import { AboutBottomTabNavigation } from './screens/navigations/AboutBottomTabNavigation';
import { DrawerNavigation } from './screens/navigations/DrawerNavigation';
import { LoginStackNavigation } from './screens/navigations/LoginStackNavigation';


const App = () => {
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Get contexts ===============
  const { userInfo, splashLoading, isFirstTime, changeStatus, logout, saveFirstTimeCompleted } = useContext(AuthContext);
  // =============== Get data ===============
  const [showSplash, setShowSplash] = useState(true);

  // ====== Gérer la durée du SplashScreen ======
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4500); // 7 secondes
    return () => clearTimeout(timer);
  }, []);

  // Vander Otis
  // Replaced react-native-secure-screen with Expo ScreenCapture
  // to prevent screen captures across the entire application.
  useEffect(() => {
    const preventScreenCapture = async () => {
      await ScreenCapture.preventScreenCaptureAsync();
    };

    preventScreenCapture();

    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  if (splashLoading) {
    return <SplashScreen />;
  }

  // ====== Affichage du Splash GIF (10 secondes) ======
  if (showSplash) {
    return <SplashScreen />;
  }

  if (isFirstTime) {
    return <OnboardingScreen saveFirstTime={saveFirstTimeCompleted} />;
  }

  return (
    <NavigationContainer>
      {userInfo.id ? (
        <AccountGuard userInfo={userInfo} changeStatus={changeStatus} logout={logout}>
          <DrawerNavigation />
        </AccountGuard>
      ) : (
        <LoginStackNavigation />
      )}
    </NavigationContainer>
  );
}

export default () => (
  <SafeAreaProvider>
    <ThemeProvider>
      <AuthProvider>
        <SearchProvider>
          <PaperProvider>
            <App />
          </PaperProvider>
        </SearchProvider>
      </AuthProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);