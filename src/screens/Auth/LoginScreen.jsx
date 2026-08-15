import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Spinner from 'react-native-loading-spinner-overlay';
import { PADDING } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import useColors from '../../hooks/useColors';

import { SafeAreaView } from 'react-native-safe-area-context';
import Octicons from '@expo/vector-icons/Octicons';

const LoginScreen = ({ route }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const { isLoading, login } = useContext(AuthContext);

  const [username, setUsername] = useState(null);
  const [password, setPassword] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    login: "",
    password: "",
    general: "",
  });

  const { message } = route?.params || {};

  const handleForgotPassword = () => {
    navigation.navigate("PasswordReset");
  };

  const handleSubmit = () => {
    setErrors({ login: "", password: "", general: "" });

    if (!username) {
      setErrors({ login: t('auth.login_username') + " est obligatoire ", password: "", general: "" });
      return;
    }
    if (!password) {
      setErrors({ login: t('auth.password.label') + " est obligatoire ", password: "", general: "" });
      return;
    }

    login(username, password);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.light }]} edges={['top']}>
      <Spinner visible={isLoading} />

      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: COLORS.dark_light }]}
        onPress={() => {
          navigation.goBack();
        }}
      >
        <Octicons name="chevron-left" size={24} color={COLORS.dark} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, { color: COLORS.black }]}>{t('auth.login.title')}</Text>
        <Text style={[styles.subtitle, { color: COLORS.dark }]}>{t('auth.login.subtitle')}</Text>
      </View>

      {(message || errors.login || errors.password) &&
        <View style={[styles.messageContainer, { backgroundColor: COLORS.danger_transparent }]}>
          <Text style={[styles.messageText, { color: COLORS.danger }]}>
            {message || errors.login || errors.password}
          </Text>
        </View>
      }

      <TextInput
        style={[styles.authInput, { color: COLORS.black, borderColor: COLORS.dark_light }]}
        value={username}
        placeholder={t('auth.login_username')}
        placeholderTextColor={COLORS.dark_secondary}
        onChangeText={text => setUsername(text)}
        keyboardType='ascii-capable'
        autoCapitalize='none'
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.authInput, { color: COLORS.black, borderColor: COLORS.dark_light }]}
          value={password}
          placeholder={t('auth.password.label')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setPassword(text)} secureTextEntry={!showPassword}
        />
        <TouchableOpacity style={styles.passwordIconContainer} onPress={() => setShowPassword(prev => !prev)}>
          <Octicons name={showPassword ? 'eye-closed' : 'eye'} size={26} color={COLORS.dark_secondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.forgotPasswordContainer}
        onPress={handleForgotPassword}
      >
        <Text style={[styles.forgotPasswordText, { color: COLORS.link_color }]}>
          {t('auth.password.forgotten')} ?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.primary }]} onPress={handleSubmit}>
        <Text style={[styles.buttonText, { color: 'white' }]}>{t('login')}</Text>
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={[styles.signupText, { color: COLORS.black }]}>{t('no_account')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.signupButton, { color: COLORS.link_color }]}>{t('i_register')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default LoginScreen;

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
  },
  header: {
    marginTop: PADDING.p17 || 64,
    marginBottom: PADDING.p08 || 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
  },
  authInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: PADDING.p04 || 16,
    marginBottom: PADDING.p04 || 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordIconContainer: {
    position: 'absolute',
    top: 15,
    right: 10
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  forgotPasswordText: {
    textAlign: "right",
    marginBottom: 10,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 20,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    fontSize: 15,
  },
  signupButton: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  messageContainer: {
    marginBottom: PADDING.p04,
    padding: PADDING.p03,
    borderRadius: 10
  },
  messageText: {
    fontWeight: '400',
  },
});