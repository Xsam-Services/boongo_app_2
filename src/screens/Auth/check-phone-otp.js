/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useState } from 'react';
import { View, Text, TextInput, ScrollView, ToastAndroid } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Button, Divider } from 'react-native-paper';
import Spinner from 'react-native-loading-spinner-overlay';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { PADDING, TEXT_SIZE } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import FooterComponent from '../footer';
import LogoText from '../../../assets/img/brand.svg';
import useColors from '../../hooks/useColors';
import homeStyles from '../style';

import { SafeAreaView } from 'react-native-safe-area-context';

const CheckPhoneOTPScreen = ({ route }) => {
  // =============== Get parameters ===============
  // const { emailAddress, phoneNumber } = route.params;
  const { isPasswordReset, phoneNumber } = route.params;
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { isLoading, checkPhoneOTP, registerError } = useContext(AuthContext);
  // =============== Get data ===============
  const [code, setCode] = useState('');

  const handleCheckPhoneCode = async () => {
    // const result = await checkOTP(emailAddress, phoneNumber, code);

    // if (!registerError) {
    //   if (result === 'email_not_validated') {
    //     navigation.navigate('CheckEmailOTP', { emailAddress: emailAddress, phoneNumber: phoneNumber });

    //   } else {
    //     navigation.navigate('ContinueRegister');
    //   }
    // }
    const result = await checkPhoneOTP(isPasswordReset, phoneNumber, code);

    if (!result.success) {
      console.log(result.error);
      ToastAndroid.show(result.error, ToastAndroid.LONG);

      return;
    }

    if (isPasswordReset) {
      console.log(`Former password CheckOTP: ${result.data.passwordReset.former_password}`);
      navigation.navigate('UpdatePassword', { userId: result.data.user.id, apiToken: result.data.user.api_token, formerPassword: result.data.passwordReset.former_password });

    } else {
      console.log(registerError);

      if (!registerError) {
        navigation.navigate('ContinueRegister');
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }} edges={['top']}>
      <Spinner visible={isLoading} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: PADDING.p16, paddingHorizontal: PADDING.p10 }}>
        {/* Brand / Title */}
        <View style={homeStyles.authlogo}>
          <LogoText width={200} height={48} />
        </View>
        <Text style={[homeStyles.authTitle, { color: COLORS.black }]}>{t('auth.otp_code.title', { reference: t('auth.phone') })}</Text>

        <Icon name='phone' color={COLORS.black} size={50} style={{ alignSelf: 'center' }} />
        <Text style={{ color: COLORS.black, textAlign: 'center', marginBottom: PADDING.p05 }}>{t('auth.otp_code.message_phone')}</Text>

        {/* Code to check */}
        <TextInput
          style={[homeStyles.authInput, { fontSize: TEXT_SIZE.title, color: COLORS.black, textAlign: 'center', borderColor: COLORS.light_secondary }]}
          keyboardType='numeric'
          value={code}
          placeholder={t('auth.otp_code.placeholder')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setCode(text)} />

        <Button style={[homeStyles.authButton, { backgroundColor: COLORS.success }]} onPress={handleCheckPhoneCode}>
          <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('auth.otp_code.send')}</Text>
        </Button>

        {/* Message */}
        <View style={homeStyles.messageContainer}>
          <Text style={[homeStyles.messageText, { fontSize: TEXT_SIZE.paragraph, textAlign: 'center', paddingHorizontal: PADDING.p12 }]}>{t('auth.otp_code.warning')}</Text>
        </View>

        {/* Copyright */}
        <Divider style={[homeStyles.authDivider, { backgroundColor: COLORS.light_secondary }]} />
        <FooterComponent color={COLORS.dark_secondary} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default CheckPhoneOTPScreen;