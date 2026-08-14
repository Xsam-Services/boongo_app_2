/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useState } from 'react'
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ScreenCapture from 'expo-screen-capture';
import * as SplashScreenManager from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';

import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthContext, AuthProvider } from './src/contexts/AuthContext';
import { SearchProvider } from './src/contexts/SearchContext';
import SplashScreen from './src/screens/SplashScreen';
import AccountGuard from './src/screens/AccountGuard';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
// import { DrawerNavigation } from './src/navigations/DrawerNavigation';
import { LoginStackNavigation } from './src/navigations/LoginStackNavigation';

import './src/services/i18next';


const App = () => {
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
          {/* <DrawerNavigation /> */}
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