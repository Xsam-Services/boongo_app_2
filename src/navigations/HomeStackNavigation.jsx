/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from '../screens/Home/HomeScreen';
import LanguageScreen from '../screens/language';
import DictionaryScreen from '../screens/dictionary';
import SettingsScreen from '../screens/Account/settings';
import ProfileScreen from '../screens/profile';
import AccountScreen from '../screens/Account';
import NotificationsScreen from '../screens/Account/notifications';
import SearchScreen from '../screens/SearchScreen';
import OrganizationDataScreen from '../screens/Organization/organization_data';
import OrganizationSettingsScreen from '../screens/Organization/organization_settings';
import EstablishmentScreen from '../screens/Organization/Establishment';
import AddEstablishmentScreen from '../screens/Organization/Establishment/add_establishment';
import GovernmentScreen from '../screens/Organization/Government';
import AddGovernmentScreen from '../screens/Organization/Government/add_government';
import EventScreen from '../screens/Organization/event_data';
import QuizScreen from '../screens/Organization/quiz';
import AddWorkScreen from '../screens/add_work';
import BookScreen from '../screens/Organization/book';
import JournalScreen from '../screens/Organization/journal';
import MappingScreen from '../screens/Organization/mapping';
import MediaScreen from '../screens/media';
import WorkDataScreen from '../screens/work_data';
import NewsDataScreen from '../screens/news_data';
import PDFViewerScreen from '../screens/pdf_viewer';
import AudioScreen from '../screens/audio_screen';
import VideoPlayerScreen from '../screens/video_screen';
import SubscriptionScreen from '../screens/subscriptions';
import MobileSubscribeScreen from '../screens/subscribe_mobile';
import BankCardSubscribeScreen from '../screens/subscribe_bank_card';

import useColors from "../hooks/useColors";
import { AboutBottomTabNavigation } from "./AboutBottomTabNavigation";

const Stack = createNativeStackNavigator();

export const HomeStackNavigation = () => {
    // =============== Colors ===============
    const COLORS = useColors();
    return (
        <Stack.Navigator
            initialRouteName='HomeStack'
            screenOptions={{
                headerShown: false,
                statusBarColor: COLORS.white,
                headerTintColor: COLORS.dark_secondary
            }}>
            <Stack.Screen name="HomeStack" component={HomeScreen} />
            <Stack.Screen name="Language" component={LanguageScreen} />
            <Stack.Screen name="About" component={AboutBottomTabNavigation} />
            <Stack.Screen name="Dictionary" component={DictionaryScreen} />
            <Stack.Screen name='Settings' component={SettingsScreen} />
            <Stack.Screen name='Profile' component={ProfileScreen} />
            <Stack.Screen name='Account' component={AccountScreen} />
            <Stack.Screen name='Notifications' component={NotificationsScreen} />
            <Stack.Screen name='Search' component={SearchScreen} />
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
