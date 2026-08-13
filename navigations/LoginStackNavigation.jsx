import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OnboardScreen from "../screens/Auth";
import LoginScreen from '../screens/Auth/login';
import RegisterScreen from '../screens/Auth/register';
import ContinueRegisterScreen from '../screens/Auth/continue-register';
import PasswordResetScreen from '../screens/Auth/password-reset';
import CheckEmailOTPScreen from '../screens/Auth/check-email-otp';
import CheckPhoneOTPScreen from '../screens/Auth/check-phone-otp';
import UpdatePasswordScreen from '../screens/Auth/update-password';
import { AboutBottomTabNavigation } from "./AboutBottomTabNavigation";
import useColors from "../hooks/useColors";

const Stack = createNativeStackNavigator();

export const LoginStackNavigation = () => {
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
            <Stack.Screen name='UpdatePassword' component={UpdatePasswordScreen} />
            <Stack.Screen name='About' component={AboutBottomTabNavigation} />
        </Stack.Navigator>
    );
};