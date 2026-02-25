/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext } from 'react';
import { Linking, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PADDING } from '../tools/constants';
import ThemeContext from '../contexts/ThemeContext';
import useColors from '../hooks/useColors';
import homeStyles from './style';

const FooterComponent = ({ color }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Handle theme ===============
  const { theme, toggleTheme } = useContext(ThemeContext);

  const handleToggleTheme = () => {
    const newTheme = (theme === 'light' ? 'dark' : 'light');

    toggleTheme(newTheme);
  };

  // =============== Get data ===============
  const d = new Date();
  let year = d.getFullYear();

  return (
    <View>
      {/* Dark mode */}
      <View style={[homeStyles.langButton, { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', justifyContent: 'space-between', width: 230, marginBottom: PADDING.p05, borderWidth: 1, borderColor: COLORS.light_secondary }]}>
        <View style={{ flexDirection: 'row' }}>
          <Text style={[homeStyles.cardLabelSettings, { color: COLORS.black }]}>{t('dark_theme')}</Text>
        </View>
        <Switch value={theme === 'dark'} onValueChange={handleToggleTheme} trackColor={{ false: COLORS.black, true: COLORS.primary }} thumbColor={COLORS.light} />
      </View>

      {/* Copyright */}
      <Text style={{ textAlign: 'center', color: COLORS.dark_secondary, marginBottom: PADDING.p00 }}>{t('copyright', { year })} <Text style={{ fontWeight: '700' }}>Reborn</Text></Text>
      <Text style={{ textAlign: 'center', color: COLORS.dark_secondary }}>Designed by<Text style={{ color: COLORS.primary }} onPress={() => Linking.openURL('https://xsamtech.com')}> Xsam Technologies</Text></Text>
    </View>
  );
};

export default FooterComponent;