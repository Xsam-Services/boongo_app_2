/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import i18next, { languageResources } from '../services/i18next';
import languagesList from '../services/languagesList.json';
import HeaderComponent from './header';
import useColors from '../hooks/useColors';

const LanguageScreen = () => {
  const COLORS = useColors();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const activeLanguage = i18next.language?.split('-')[0];
  const languages = Object.keys(languageResources);

  const selectLanguage = lang => {
    i18next.changeLanguage(lang);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.light }]} edges={['top', 'bottom']}>
      <HeaderComponent title={t('language.title')} />
      <FlatList
        data={languages}
        keyExtractor={item => item}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.intro}>
            <Text style={[styles.title, { color: COLORS.black }]}>{t('language.headline')}</Text>
            <Text style={[styles.subtitle, { color: COLORS.dark }]}>{t('language.description')}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const language = languagesList[item];
          const isSelected = item === activeLanguage;

          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              activeOpacity={0.75}
              style={[
                styles.languageCard,
                {
                  backgroundColor: isSelected ? COLORS.light_primary : COLORS.white,
                  borderColor: isSelected ? COLORS.primary : COLORS.light_secondary,
                },
              ]}
              onPress={() => selectLanguage(item)}
            >
              <View style={[styles.languageBadge, { backgroundColor: isSelected ? COLORS.primary : COLORS.light_secondary }]}>
                <Text style={[styles.languageCode, { color: isSelected ? '#ffffff' : COLORS.dark_secondary }]}>{item.toUpperCase()}</Text>
              </View>
              <View style={styles.languageCopy}>
                <Text style={[styles.languageName, { color: COLORS.black }]}>{language.nativeName}</Text>
                <Text style={[styles.languageLabel, { color: COLORS.dark }]}>{language.name}</Text>
              </View>
              {isSelected ? <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.primary} /> : <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.dark} />}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 36 },
  intro: { marginBottom: 20, paddingHorizontal: 4 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  languageCard: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', marginBottom: 10, minHeight: 76, paddingHorizontal: 14 },
  languageBadge: { alignItems: 'center', borderRadius: 16, height: 44, justifyContent: 'center', width: 44 },
  languageCode: { fontSize: 12, fontWeight: '800', letterSpacing: 0.7 },
  languageCopy: { flex: 1, marginLeft: 13 },
  languageName: { fontSize: 16, fontWeight: '700' },
  languageLabel: { fontSize: 13, marginTop: 3 },
});

export default LanguageScreen;
