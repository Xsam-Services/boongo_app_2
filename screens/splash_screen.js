/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { PADDING } from '../tools/constants';
import FooterComponent from './footer';
import useColors from '../hooks/useColors';
import LogoText from '../assets/img/brand.svg';
import homeStyles from './style';

const SplashScreen = () => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50, backgroundColor: COLORS.white }}>
      <View style={{ marginBottom: 20, paddingHorizontal: 100 }}>
        <LogoText width={300} height={72} />
        <Text style={[homeStyles.slogan, { color: COLORS.black }]}>{t('slogan')}</Text>
      </View>

      <ActivityIndicator size='large' color={COLORS.link_color} />

      <Divider style={[homeStyles.authDivider, { marginTop: PADDING.p07 }]} />
      <FooterComponent color={COLORS.dark_secondary} />
    </View>
  );
};

export default SplashScreen;