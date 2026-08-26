/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useState } from 'react';
import { Text, View, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Spinner from 'react-native-loading-spinner-overlay';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Octicons from '@expo/vector-icons/Octicons';
import Toast from 'react-native-toast-message';
import { PADDING } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import useColors from '../../hooks/useColors';

import { SafeAreaView } from 'react-native-safe-area-context';

const UpdatePasswordScreen = ({ route }) => {
  // =============== Get parameters ===============
  const { userId, formerPassword, apiToken } = route.params;
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { isLoading, changePassword } = useContext(AuthContext);
  // =============== User data ===============
  const [password, setPassword] = useState(null);
  const [confirm_password, setConfirmPassword] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  console.log('User data');
  console.log('================');
  console.log(`ID: ${userId}`);
  console.log(`API token: ${apiToken}`);
  console.log(`former password updatePW: ${formerPassword}`);
  console.log(`new password: ${password}`);
  console.log(`confirm new password: ${confirm_password}`);

  const handleUpdatePassword = async () => {
    setErrorMessage('');

    if (!password || !confirm_password) {
      const msg = t('error_message.all_fields_required') || 'Tous les champs sont obligatoires';
      setErrorMessage(msg);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: msg,
        position: 'top'
      });
      return;
    }

    const result = await changePassword(userId, apiToken, formerPassword, password, confirm_password);

    if (!result.success) {
      console.log(result.error);
      setErrorMessage(result.error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: result.error,
        position: 'top'
      });
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Succès',
      text2: result.message || 'Mot de passe mis à jour avec succès',
      position: 'top'
    });

    navigation.navigate('Login', { message: result.message });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.light }]} edges={['top']}>
      <Spinner visible={isLoading} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: PADDING.p16 }}>
        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: COLORS.dark_light }]}
          onPress={() => navigation.goBack()}
        >
          <Octicons name="chevron-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>

        {/* Header / Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: COLORS.black }]}>{t('auth.password.reset')}</Text>
          <Text style={[styles.subtitle, { color: COLORS.dark }]}>{t('auth.login.subtitle')}</Text>
        </View>

        {/* Password */}
        <View style={[styles.inputContainer, { borderColor: COLORS.dark_light || '#E2E8F0', backgroundColor: COLORS.white || '#FFFFFF' }]}>
          <TextInput
            style={[styles.input, { color: COLORS.black }]}
            value={password}
            placeholder={t('auth.password.new')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setPassword(text)}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(prev => !prev)}>
            <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} color={COLORS.dark_secondary} size={22} />
          </TouchableOpacity>
        </View>

        {/* Confirm password */}
        <View style={[styles.inputContainer, { borderColor: COLORS.dark_light || '#E2E8F0', backgroundColor: COLORS.white || '#FFFFFF' }]}>
          <TextInput
            style={[styles.input, { color: COLORS.black }]}
            value={confirm_password}
            placeholder={t('auth.confirm_password.new')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setConfirmPassword(text)}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(prev => !prev)}>
            <Icon name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} color={COLORS.dark_secondary} size={22} />
          </TouchableOpacity>
        </View>

        {/* Error Message Box */}
        {errorMessage ? (
          <View style={[styles.messageContainer, { backgroundColor: COLORS.danger_transparent || 'rgba(255, 0, 0, 0.1)' }]}>
            <Text style={[styles.messageText, { color: COLORS.danger || '#D32F2F' }]}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.success || '#10B981', marginTop: 10 }]}
          onPress={handleUpdatePassword}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>{t('update')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UpdatePasswordScreen;

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
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: PADDING.p04 || 16,
    marginBottom: PADDING.p04 || 16,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  messageContainer: {
    marginBottom: PADDING.p04 || 16,
    padding: PADDING.p03 || 12,
    borderRadius: 10,
  },
  messageText: {
    fontWeight: '400',
    fontSize: 14,
  },
});