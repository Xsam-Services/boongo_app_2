/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Spinner from 'react-native-loading-spinner-overlay';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PADDING } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import FooterComponent from '../footer';
import LogoText from '../../assets/img/brand.svg';
import homeStyles from '../style';
import useColors from '../../hooks/useColors';

const LoginScreen = ({ route }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { isLoading, login } = useContext(AuthContext);
  // =============== Get data ===============
  const [username, setUsername] = useState(null);
  const [password, setPassword] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  if (route.params) {
    // =============== Get parameters ===============
    const { message } = route.params;

    return (
      <View style={{ flex: 1, backgroundColor: COLORS.white }}>
        <Spinner visible={isLoading} />

        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: PADDING.p10, paddingHorizontal: PADDING.p10 }}>
          {/* Brand / Title */}
          <View style={[homeStyles.authlogo, { marginBottom: PADDING.p10 }]}>
            <LogoText width={200} height={48} />
          </View>
          {/* <Text style={[homeStyles.authTitle, { color: COLORS.black }]}>{t('i_login')}</Text> */}

          {/* Username */}
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={username}
            placeholder={t('auth.login_username')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setUsername(text)} />

          {/* Password */}
          <View style={{ position: 'relative' }}>
            <TextInput
              style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
              value={password}
              placeholder={t('auth.password.label')}
              placeholderTextColor={COLORS.dark_secondary}
              onChangeText={text => setPassword(text)} secureTextEntry={!showPassword} />
            <TouchableOpacity style={{ position: 'absolute', top: 7, right: 7 }} onPress={() => setShowPassword(prev => !prev)}>
              <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} color={COLORS.dark_secondary} size={30} />
            </TouchableOpacity>
          </View>

          {/* Forgotten password */}
          <TouchableOpacity onPress={() => navigation.navigate('PasswordReset')}>
            <Text style={[homeStyles.authText, { textAlign: 'center', color: COLORS.link_color }]}>{t('auth.password.forgotten')}</Text>
          </TouchableOpacity>

          {/* Submit */}
          <Button style={[homeStyles.authButton, { backgroundColor: COLORS.primary }]} onPress={() => { login(username, password); }}>
            <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('login')}</Text>
          </Button>

          {message ?
            <View style={homeStyles.messageContainer}>
              <Text style={homeStyles.messageText}>{message}</Text>
            </View>
            : ''}

          {/* Register link */}
          <View style={{ marginVertical: PADDING.p05 }}>
            <Text style={[homeStyles.authText, { textAlign: 'center', color: COLORS.black }]}>{t('no_account')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[homeStyles.authText, { textAlign: 'center', color: COLORS.link_color }]}>{t('i_register')}</Text>
            </TouchableOpacity>
          </View>

          {/* Copyright */}
          <FooterComponent color={COLORS.dark_secondary} />
        </ScrollView>
      </View>
    );

  } else {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.white }}>
        <Spinner visible={isLoading} />

        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: PADDING.p16, paddingHorizontal: PADDING.p10 }}>
          {/* Brand / Title */}
          <View style={[homeStyles.authlogo, { marginTop: PADDING.p16, marginBottom: PADDING.p10 }]}>
            <LogoText width={200} height={48} />
          </View>
          {/* <Text style={[homeStyles.authTitle, { color: COLORS.black }]}>{t('i_login')}</Text> */}

          {/* Username */}
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={username}
            placeholder={t('auth.login_username')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setUsername(text)} />

          {/* Password */}
          <View style={{ position: 'relative' }}>
            <TextInput
              style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
              value={password}
              placeholder={t('auth.password.label')}
              placeholderTextColor={COLORS.dark_secondary}
              onChangeText={text => setPassword(text)} secureTextEntry={!showPassword} />
            <TouchableOpacity style={{ position: 'absolute', top: 7, right: 7 }} onPress={() => setShowPassword(prev => !prev)}>
              <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} color={COLORS.dark_secondary} size={30} />
            </TouchableOpacity>
          </View>

          {/* Forgotten password */}
          <TouchableOpacity onPress={() => navigation.navigate('PasswordReset')}>
            <Text style={[homeStyles.authText, { textAlign: 'center', color: COLORS.link_color }]}>{t('auth.password.forgotten')}</Text>
          </TouchableOpacity>

          {/* Submit */}
          <Button style={[homeStyles.authButton, { backgroundColor: COLORS.primary }]} onPress={() => { login(username, password); }}>
            <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('login')}</Text>
          </Button>

          {/* Register link */}
          <View style={{ marginVertical: PADDING.p05 }}>
            <Text style={[homeStyles.authText, { textAlign: 'center', color: COLORS.black }]}>{t('no_account')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[homeStyles.authText, { textAlign: 'center', color: COLORS.link_color }]}>{t('i_register')}</Text>
            </TouchableOpacity>
          </View>

          {/* Copyright */}
          <FooterComponent color={COLORS.dark_secondary} />
        </ScrollView>
      </View>
    );
  }
};

export default LoginScreen;