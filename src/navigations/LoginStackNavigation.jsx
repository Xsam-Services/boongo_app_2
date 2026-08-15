import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WelcomeScreen from "../screens/Auth/WelcomeScreen";
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ContinueRegisterScreen from '../screens/Auth/ContinueRegisterScreen';
import PasswordResetScreen from '../screens/Auth/PasswordResetScreen';
import CheckEmailOTPScreen from '../screens/Auth/CheckEmailOTPScreen';
import CheckPhoneOTPScreen from '../screens/Auth/CheckPhoneOTPScreen';
import UpdatePasswordScreen from '../screens/Auth/UpdatePasswordScreen';
import { AboutBottomTabNavigation } from "./AboutBottomTabNavigation";
import useColors from "../hooks/useColors";

const Stack = createNativeStackNavigator();

export const LoginStackNavigation = () => {
    const COLORS = useColors();

    return (
        <Stack.Navigator
            initialRouteName='WelcomeScreen'
            screenOptions={{
                headerShown: false,
                statusBarColor: COLORS.white,
                headerTintColor: COLORS.dark_secondary
            }}>
            <Stack.Screen name='WelcomeScreen' component={WelcomeScreen} />
            <Stack.Screen name='Login' component={LoginScreen} />
            <Stack.Screen name='Register' component={RegisterScreen} />
            <Stack.Screen name='ContinueRegister' component={ContinueRegisterScreen} />
            <Stack.Screen name='PasswordReset' component={PasswordResetScreen} />
            <Stack.Screen name='CheckEmailOTP' component={CheckEmailOTPScreen} />
            <Stack.Screen name='CheckPhoneOTP' component={CheckPhoneOTPScreen} />
            <Stack.Screen name='UpdatePassword' component={UpdatePasswordScreen} />
            <Stack.Screen name='About' component={AboutBottomTabNavigation} />
        </Stack.Navigator>
    );
};