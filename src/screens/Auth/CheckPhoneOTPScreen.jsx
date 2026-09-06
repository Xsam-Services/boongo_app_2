import React, { useContext, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Divider } from 'react-native-paper';
import Spinner from 'react-native-loading-spinner-overlay';
import { PADDING } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import FooterComponent from '../footer';
import useColors from '../../hooks/useColors';
import Octicons from '@expo/vector-icons/Octicons';

import { SafeAreaView } from 'react-native-safe-area-context';

const CheckPhoneOTPScreen = ({ route }) => {
  const { isPasswordReset, phoneNumber } = route.params || {};
  const COLORS = useColors();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isLoading, checkPhoneOTP, registerError } = useContext(AuthContext);

  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCheckPhoneCode = async () => {
    setErrorMessage('');

    if (!code) {
      setErrorMessage(t('auth.otp_code.placeholder') + " est obligatoire");
      return;
    }

    const result = await checkPhoneOTP(isPasswordReset, phoneNumber, code);

    if (!result.success) {

      setErrorMessage(result.error);
      return;
    }

    if (isPasswordReset) {

      navigation.navigate('UpdatePassword', {
        userId: result.data.user.id,
        apiToken: result.data.user.api_token,
        formerPassword: result.data.passwordReset.former_password
      });
    } else {


      if (!registerError) {
        navigation.navigate('ContinueRegister');
      }
    }
  };

  const activeError = errorMessage || registerError;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.light }]} edges={['top']}>
      <Spinner visible={isLoading} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: PADDING.p16 }}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: COLORS.dark_light }]}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Octicons name="chevron-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: COLORS.black }]}>
            {t('auth.otp_code.title', { reference: t('auth.phone') })}
          </Text>
          <Text style={[styles.subtitle, { color: COLORS.dark }]}>
            {t('auth.otp_code.message_phone')}
          </Text>
        </View>

        {activeError &&
          <View style={[styles.messageContainer, { backgroundColor: COLORS.danger_transparent || 'rgba(255, 0, 0, 0.1)' }]}>
            <Text style={[styles.messageText, { color: COLORS.danger || '#D32F2F' }]}>
              {activeError}
            </Text>
          </View>
        }

        <TextInput
          style={[styles.authInput, { color: COLORS.black, borderColor: COLORS.dark_light }]}
          keyboardType='numeric'
          value={code}
          placeholder={t('auth.otp_code.placeholder')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setCode(text)}
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.primary }]}
          onPress={handleCheckPhoneCode}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>{t('auth.otp_code.send')}</Text>
        </TouchableOpacity>

        <View style={[styles.warningContainer, { backgroundColor: COLORS.dark_light }]}>
          <Text style={[styles.warningText, { color: COLORS.dark }]}>
            {t('auth.otp_code.warning')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CheckPhoneOTPScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: PADDING.p04 || 24,
  },
  backButton: {
    display: 'flex',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginTop: 10,
  },
  header: {
    marginTop: PADDING.p12 || 24,
    marginBottom: PADDING.p08 || 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  authInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: PADDING.p04 || 16,
    marginBottom: PADDING.p04 || 16,
    fontSize: 20,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningContainer: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageContainer: {
    marginBottom: PADDING.p04 || 16,
    padding: PADDING.p03 || 12,
    borderRadius: 10,
  },
  messageText: {
    fontWeight: '400',
    fontSize: 14,
    textAlign: 'center',
  },
  divider: {
    marginVertical: 20,
    height: 1,
  },
});