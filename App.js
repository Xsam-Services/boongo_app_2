/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ScreenCapture from 'expo-screen-capture';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthContext, AuthProvider } from './src/contexts/AuthContext';
import { SearchProvider } from './src/contexts/SearchContext';
import { MediaPlaybackProvider } from './src/contexts/MediaPlaybackContext';
import PersistentMediaPlayer from './src/components/persistent_media_player';
import SplashScreen from './src/screens/SplashScreen';
import AccountGuard from './src/screens/AccountGuard';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import { DrawerNavigation } from './src/navigations/DrawerNavigation';
import { LoginStackNavigation } from './src/navigations/LoginStackNavigation';
import './src/services/i18next';

const navigationRef = createNavigationContainerRef();

const App = () => {
  const { userInfo, splashLoading, isFirstTime, changeStatus, logout, saveFirstTimeCompleted } = useContext(AuthContext);

  const [showSplash, setShowSplash] = useState(true);
  const [currentRouteName, setCurrentRouteName] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4000);
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

  if (splashLoading || showSplash) {
    return <SplashScreen />;
  }

  if (isFirstTime) {
    return <OnboardingScreen saveFirstTime={saveFirstTimeCompleted} />;
  }

  const openMedia = media => {
    if (!navigationRef.isReady()) return;
    if (media.kind === 'audio') {
      navigationRef.navigate('Home', {
        screen: 'Audio',
        params: {
          audioAuthor: media.artist,
          audioId: media.id,
          audioTitle: media.title,
          audioUrl: media.uri,
          mediaCover: media.artwork,
        },
      });
    } else {
      navigationRef.navigate('Home', {
        screen: 'VideoPlayer',
        params: {
          mediaType: 'video',
          videoCover: media.artwork,
          videoId: media.id,
          videoTitle: media.title,
          videoUri: media.uri,
        },
      });
    }
  };

  const updateCurrentRoute = () => setCurrentRouteName(navigationRef.getCurrentRoute()?.name || null);

  return (
    <NavigationContainer ref={navigationRef} onReady={updateCurrentRoute} onStateChange={updateCurrentRoute}>
      {userInfo && userInfo.id ? (
        <MediaPlaybackProvider userId={userInfo.id}>
          <View style={styles.app}>
            <AccountGuard userInfo={userInfo} changeStatus={changeStatus} logout={logout}>
              <DrawerNavigation />
            </AccountGuard>
            <PersistentMediaPlayer currentRouteName={currentRouteName} onOpen={openMedia} />
          </View>
        </MediaPlaybackProvider>
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
            <Toast />
          </PaperProvider>
        </SearchProvider>
      </AuthProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);

const styles = StyleSheet.create({ app: { flex: 1 } });
