/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useState } from 'react';
import { Text, View, TextInput, ScrollView, ToastAndroid } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Button, Divider } from 'react-native-paper';
import Spinner from 'react-native-loading-spinner-overlay';
import { PADDING } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import FooterComponent from '../footer';
import LogoText from '../../assets/img/brand.svg';
import useColors from '../../hooks/useColors';
import homeStyles from '../style';

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

  const handleUpdatePassword = async () => {
    console.log('User data');
    console.log('================');
    console.log(`ID: ${userId}`);
    console.log(`API token: ${apiToken}`);
    console.log(`former password: ${formerPassword}`);
    console.log(`new password: ${password}`);
    console.log(`confirm new password: ${confirm_password}`);

    const result = await changePassword(userId, apiToken, formerPassword, password, confirm_password);

    if (!result.success) {
      console.log(result.error);
      ToastAndroid.show(result.error, ToastAndroid.LONG);

      return;
    }

    navigation.navigate('Login', { message: result.message });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <Spinner visible={isLoading} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: PADDING.p16, paddingHorizontal: PADDING.p10 }}>
        {/* Brand / Title */}
        <View style={homeStyles.authlogo}>
          <LogoText width={200} height={48} />
        </View>
        <Text style={[homeStyles.authTitle, { color: COLORS.black, marginBottom: PADDING.p12 }]}>{t('auth.password.reset')}</Text>

        {/* Password */}
        <View style={{ position: 'relative' }}>
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={password}
            placeholder={t('auth.password.new')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setPassword(text)} secureTextEntry={!showPassword} />
          <TouchableOpacity style={{ position: 'absolute', top: 9, right: 7 }} onPress={() => setShowPassword(prev => !prev)}>
            <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} color={COLORS.dark_secondary} size={30} />
          </TouchableOpacity>
        </View>

        {/* Confirm password */}
        <View style={{ position: 'relative' }}>
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={confirm_password}
            placeholder={t('auth.confirm_password.new')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setConfirmPassword(text)} secureTextEntry={!showConfirmPassword} />
          <TouchableOpacity style={{ position: 'absolute', top: 9, right: 7 }} onPress={() => setShowConfirmPassword(prev => !prev)}>
            <Icon name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} color={COLORS.dark_secondary} size={30} />
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <Button style={[homeStyles.authButton, { backgroundColor: COLORS.success }]} onPress={handleUpdatePassword}>
          <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('update')}</Text>
        </Button>

        {/* Copyright */}
        <Divider style={[homeStyles.authDivider, { backgroundColor: COLORS.light_secondary }]} />
        <FooterComponent color={COLORS.dark_secondary} />
      </ScrollView>
    </View>
  );
};

export default UpdatePasswordScreen;