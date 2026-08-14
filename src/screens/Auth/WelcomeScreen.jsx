import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemeContext from '../../contexts/ThemeContext';
import useColors from '../../hooks/useColors';
import { PADDING } from '../../tools/constants';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const ILLUSTRATIONS = {
  light: require('../../../assets/img/auth/BNRDC-dark.png'),
  dark: require('../../../assets/img/auth/BNRDC-white.png'),
};

const OnboardScreen = () => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const illustrationSource = theme === 'dark' ? ILLUSTRATIONS.dark : ILLUSTRATIONS.light;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: COLORS.light }]}
      edges={['top']}
    >
      <StatusBar barStyle={COLORS.bar_style} />

      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: COLORS.black }]}>
          {t('auth.welcome.title')}
        </Text>
        <Text style={[styles.subtitle, { color: COLORS.dark }]}>
          {t('auth.welcome.subtitle')}
        </Text>
      </View>

      <View style={styles.illustrationContainer}>
        <Image
          source={illustrationSource}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      <View style={[styles.bottomCard, { backgroundColor: COLORS.dark_light }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.primary }]}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: '#ffffff' }]}>
            {t('i_register') || 'Create account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: COLORS.black,
              borderColor: COLORS.dark,
              borderWidth: 1
            }
          ]}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: COLORS.light_secondary }]}>
            {t('i_login') || 'Already have an account ?'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[styles.themeButton, { backgroundColor: COLORS.white }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="theme-light-dark"
              size={22}
              color={COLORS.black}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OnboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: PADDING.p04 || 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  illustration: {
    width: width * 0.85,
    height: '100%',
  },
  bottomCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: PADDING.p04 || 24,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 14,
    // Elevation & Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  themeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});