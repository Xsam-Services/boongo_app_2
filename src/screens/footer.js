/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
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
      <TouchableOpacity style={[styles.themeAction, { backgroundColor: COLORS.light_primary }]} onPress={handleToggleTheme} accessibilityLabel={t('dark_theme')}>
        <Icon name={theme === 'dark' ? 'weather-sunny' : 'weather-night'} size={18} color={COLORS.primary} />
        <Text style={[styles.themeLabel, { color: COLORS.black }]}>{theme === 'dark' ? 'Mode clair' : t('dark_theme')}</Text>
      </TouchableOpacity>

      {/* Copyright */}
      <Text style={{ textAlign: 'center', color: COLORS.dark_secondary, marginBottom: PADDING.p00 }}>{t('copyright', { year })} <Text style={{ fontWeight: '700' }}>Reborn</Text></Text>
      <Text style={{ textAlign: 'center', color: COLORS.dark_secondary }}>Designed by<Text style={{ color: COLORS.primary }} onPress={() => Linking.openURL('https://xsamtech.com')}> Xsam Technologies</Text></Text>
    </View>
  );
};

export default FooterComponent;

const styles = StyleSheet.create({ themeAction: { alignItems: 'center', alignSelf: 'center', borderRadius: 18, flexDirection: 'row', marginBottom: PADDING.p05, minHeight: 42, paddingHorizontal: 15 }, themeLabel: { fontSize: 13, fontWeight: '800', marginLeft: 8 } });
