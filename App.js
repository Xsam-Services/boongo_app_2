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
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { forbid } from 'react-native-secure-screen';
import Orientation from 'react-native-orientation-locker';
import TrackPlayer, { Capability, Event } from 'react-native-track-player';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PADDING } from './tools/constants';
import DrawerContent from './DrawerContent';
import Logo from './assets/img/icon.svg';
import useColors from './hooks/useColors';
import homeStyles from './screens/style';
import SplashScreen from './screens/splash_screen';
import OnboardScreen from './screens/Auth';
import RegisterScreen from './screens/Auth/register';
import CheckEmailOTPScreen from './screens/Auth/check-email-otp';
import CheckPhoneOTPScreen from './screens/Auth/check-phone-otp';
import ContinueRegisterScreen from './screens/Auth/continue-register';
import LoginScreen from './screens/Auth/login';
import PasswordResetScreen from './screens/Auth/password-reset';
import AboutScreen from './screens/About';
import TermsScreen from './screens/About/terms';
import PrivacyScreen from './screens/About/privacy';
import ContactScreen from './screens/About/contact';
import HomeScreen from './screens/Home';
import LanguageScreen from './screens/language';
import AccountScreen from './screens/Account';
import SettingsScreen from './screens/Account/settings';
import NotificationsScreen from './screens/Account/notifications';
import SearchScreen from './screens/search';
// import ChatEntityScreen from './screens/Chat/chat';
// import ChatsScreen from './screens/Chat';
// import NewChatScreen from './screens/Chat/new_chat';
// import BlockedContactsScreen from './screens/Chat/blocked_contacts';
import EstablishmentScreen from './screens/Organization/Establishment';
import AddEstablishmentScreen from './screens/Organization/Establishment/add_establishment';
import WorkDataScreen from './screens/work_data';
import AddWorkScreen from './screens/add_work';
import BookScreen from './screens/Organization/book';
import JournalScreen from './screens/Organization/journal';
import MappingScreen from './screens/Organization/mapping';
import MediaScreen from './screens/media';
import PDFViewerScreen from './screens/pdf_viewer';
import VideoPlayerScreen from './screens/video_screen';
import OrganizationDataScreen from './screens/Organization/organization_data';
import OrganizationSettingsScreen from './screens/Organization/organization_settings';
import GovernmentScreen from './screens/Organization/Government';
import AddGovernmentScreen from './screens/Organization/Government/add_government';
import EventScreen from './screens/Organization/event_data';
import QuizScreen from './screens/Organization/quiz';
import AudioScreen from './screens/audio_screen';
import SubscriptionScreen from './screens/subscriptions';
import DictionaryScreen from './screens/dictionary';
import ProfileScreen from './screens/profile';
import MobileSubscribeScreen from './screens/subscribe_mobile';
import BankCardSubscribeScreen from './screens/subscribe_bank_card';
import NewsDataScreen from './screens/news_data';

// =============== Bottom tab ===============
const BottomTab = createBottomTabNavigator();
// =============== Stack nav ===============
const Stack = createNativeStackNavigator();
// =============== Drawer ===============
const Drawer = createDrawerNavigator();

const AboutBottomTab = () => {
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

const LoginStackNav = () => {
  // =============== Colors ===============
  const COLORS = useColors();

  return (
    <Stack.Navigator
      initialRouteName='Onboard'
      screenOptions={{
        headerShown: false,
        statusBarColor: COLORS.white,
        headerTintColor: COLORS.dark_secondary
      }}>
      <Stack.Screen name='Onboard' component={OnboardScreen} />
      <Stack.Screen name='Login' component={LoginScreen} />
      <Stack.Screen name='Register' component={RegisterScreen} />
      <Stack.Screen name='ContinueRegister' component={ContinueRegisterScreen} />
      <Stack.Screen name='PasswordReset' component={PasswordResetScreen} />
      <Stack.Screen name='CheckEmailOTP' component={CheckEmailOTPScreen} />
      <Stack.Screen name='CheckPhoneOTP' component={CheckPhoneOTPScreen} />
      <Stack.Screen name='About' component={AboutBottomTab} />
    </Stack.Navigator>
  );
};

const HomeStackNav = () => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Authentication context ===============
  const { userInfo, invalidateConsultations } = useContext(AuthContext);
  // =============== Get data ===============
  const [isSearchActive, setIsSearchActive] = useState(false); // Status to know if the search is active
  const { searchQuery, setSearchQuery } = useContext(SearchContext);

  const handleSearchPress = () => {
    setIsSearchActive(true);  // Activate search mode
  };

  const handleCloseSearch = () => {
    setIsSearchActive(false);  // Close the search field
    setSearchQuery('');        // Reset the search text
  };

  return (
    <Stack.Navigator
      initialRouteName='HomeStack'
      screenOptions={{
        headerShown: false,
        statusBarColor: COLORS.white,
        headerTintColor: COLORS.dark_secondary
      }}>
      <Stack.Screen name='HomeStack' component={HomeScreen} />
      <Stack.Screen name='Language' component={LanguageScreen} />
      <Stack.Screen name='About' component={AboutBottomTab} />
      <Stack.Screen name='Dictionary' component={DictionaryScreen}
        options={{
          headerShown: true,
          headerTitle: isSearchActive ? '' : t('navigation.dictionary'),
          headerTintColor: COLORS.black,
          headerStyle: {
            backgroundColor: COLORS.white
          },
          headerTitleStyle: {
            color: COLORS.black
          },
          headerLeft: () => {
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => navigation.navigate('Home', { screen: 'HomeStack' })}>
                  <Icon name='chevron-left' size={37} color={COLORS.black} />
                </TouchableOpacity>
                {isSearchActive ? (
                  <>
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      style={[homeStyles.searchInputText, { fontSize: 18, width: Dimensions.get('window').width - 120, height: 37, color: COLORS.black, marginVertical: 0, paddingVertical: 5, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderColor: COLORS.black }]}
                      placeholder={t('search')}
                      placeholderTextColor={COLORS.secondary}
                    />
                  </>
                ) : (
                  <Icon name='book-open-blank-variant' color={COLORS.black} style={{ fontSize: 28, marginHorizontal: PADDING.p01 }} />
                )}
              </View>
            );
          },
          headerRight: () => {
            return (
              <>
                {isSearchActive ?
                  (
                    <TouchableOpacity onPress={handleCloseSearch}>
                      <Icon name='close' color={COLORS.black} style={{ fontSize: 24 }} />
                    </TouchableOpacity>
                  ) :
                  (
                    <TouchableOpacity onPress={handleSearchPress}>
                      <Icon name='magnify' color={COLORS.black} style={{ fontSize: 24 }} />
                    </TouchableOpacity>
                  )}
              </>
            );
          }
        }} />
      <Stack.Screen name='Settings' component={SettingsScreen} />
      <Stack.Screen name='Profile' component={ProfileScreen} />
      <Stack.Screen name='Account' component={AccountScreen} />
      <Stack.Screen name='Notifications' component={NotificationsScreen} />
      <Stack.Screen name='Search' component={SearchScreen} />
      {/* <Stack.Screen name='Chats' component={ChatsScreen} />
      <Stack.Screen name='NewChat' component={NewChatScreen} />
      <Stack.Screen name='ChatEntity' component={ChatEntityScreen} />
      <Stack.Screen name='BlockedContacts' component={BlockedContactsScreen} /> */}
      <Stack.Screen name='OrganizationData' component={OrganizationDataScreen} />
      <Stack.Screen name='OrganizationSettings' component={OrganizationSettingsScreen} />
      <Stack.Screen name='Establishment' component={EstablishmentScreen} />
      <Stack.Screen name='AddEstablishment' component={AddEstablishmentScreen} />
      <Stack.Screen name='Government' component={GovernmentScreen} />
      <Stack.Screen name='AddGovernment' component={AddGovernmentScreen} />
      <Stack.Screen name='Event' component={EventScreen} />
      <Stack.Screen name='Quiz' component={QuizScreen} />
      <Stack.Screen name='AddWork' component={AddWorkScreen} />
      <Stack.Screen name='Book' component={BookScreen} />
      <Stack.Screen name='Journal' component={JournalScreen} />
      <Stack.Screen name='Mapping' component={MappingScreen} />
      <Stack.Screen name='Media' component={MediaScreen} />
      <Stack.Screen name='NewsData' component={NewsDataScreen} />
      <Stack.Screen name='WorkData' component={WorkDataScreen} />
      <Stack.Screen name='PDFViewer' component={PDFViewerScreen} />
      <Stack.Screen name='Audio' component={AudioScreen} />
      <Stack.Screen name='VideoPlayer' component={VideoPlayerScreen} />
      <Stack.Screen name='Subscription' component={SubscriptionScreen} />
      <Stack.Screen name='MobileSubscribe' component={MobileSubscribeScreen} />
      <Stack.Screen name='BankCardSubscribe' component={BankCardSubscribeScreen} />
    </Stack.Navigator>
  );
};

const DrawerNav = () => {
  return (
    <Drawer.Navigator drawerContent={props => <DrawerContent {...props} />} screenOptions={{ headerShown: false }}>
      <Drawer.Screen name='Home' component={HomeStackNav} />
    </Drawer.Navigator>
  );
};

const App = () => {
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Get contexts ===============
  const { userInfo, splashLoading } = useContext(AuthContext);
  // =============== Get data ===============
  const [showSplash, setShowSplash] = useState(true);

  // ====== Gérer la durée du SplashScreen ======
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4500); // 7 secondes
    return () => clearTimeout(timer);
  }, []);

  // =============== Lock screen orientation ===============
  useEffect(() => {
    Orientation.lockToPortrait();

    return () => {
      Orientation.unlockAllOrientations();
    };
  }, []);

  // =============== Lock screen captures ===============
  useEffect(() => {
    const applySecurity = async () => {
      await forbid();
    };

    applySecurity();
  }, []);

  // =============== Setup Track Player ===============
  useEffect(() => {
    setupPlayer();

    return () => {
      TrackPlayer.reset(); // Cleaning when the component is disassembled
    };
  }, []);

  const setupPlayer = async () => {
    await TrackPlayer.setupPlayer();
    console.log('Track player setup success!');

    // Configure notification options to allow background playback
    await TrackPlayer.updateOptions({
      stopWithAppPause: true, // Stop playback when the app is paused
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SeekTo
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop
      ],
      notification: { // Notification options
        icon: 'ic_notification',
        title: t('media.title'),
        text: t('media.description'),
        largeIcon: 'ic_notification',
      }
    });

    // Add the event to handle actions on the notification
    TrackPlayer.addEventListener(Event.RemotePlay, async () => {
      await TrackPlayer.play();
    });

    TrackPlayer.addEventListener(Event.RemotePause, async () => {
      await TrackPlayer.pause();
    });

    TrackPlayer.addEventListener(Event.RemoteStop, async () => {
      await TrackPlayer.stop();
    });
  };

  if (splashLoading) {
    return <SplashScreen />;
  }

  // ====== Affichage du Splash GIF (10 secondes) ======
  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {userInfo.id ? (
        <DrawerNav />
      ) : (
        <LoginStackNav />
      )}
    </NavigationContainer>
  );
}

export default () => (
  <ThemeProvider>
    <AuthProvider>
      <SearchProvider>
        <PaperProvider>
          <App />
        </PaperProvider>
      </SearchProvider>
    </AuthProvider>
  </ThemeProvider>
);