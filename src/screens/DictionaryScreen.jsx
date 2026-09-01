/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import { SearchContext } from '../contexts/SearchContext';
import useColors from '../hooks/useColors';
import { API } from '../tools/constants';

const API_BASE = 'https://api.dicolink.com/v1/mot';

const emptyResults = () => ({
  definitions: [],
  synonyms: [],
  antonyms: [],
  expressions: [],
  champlexical: [],
  citations: [],
  score: null,
});

const ResultSection = ({ title, children, COLORS }) => (
  <View style={[styles.section, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
    <Text style={[styles.sectionTitle, { color: COLORS.black }]}>{title}</Text>
    {children}
  </View>
);

const DictionaryScreen = () => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { searchQuery, setSearchQuery } = useContext(SearchContext);
  const [inputValue, setInputValue] = useState(searchQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(emptyResults);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setResults(emptyResults());
      setLoading(false);
      return;
    }

    let isActive = true;
    setLoading(true);
    setError('');

    const fetchData = async () => {
      try {
        const endpoints = ['definitions', 'synonymes', 'antonymes', 'expressions', 'champlexical', 'citations', 'scorescrabble'];
        const responses = await Promise.all(endpoints.map(endpoint => {
          const limit = endpoint === 'definitions' ? 200 : endpoint === 'scorescrabble' ? undefined : 5;

          return axios.get(`${API_BASE}/${encodeURIComponent(query)}/${endpoint}`, {
            params: { api_key: API.dicolink_key, ...(limit ? { limit } : {}) },
          }).catch(() => null);
        }));

        if (!isActive) return;

        const safe = response => !response || response.data?.error ? [] : Array.isArray(response.data) ? response.data : [response.data];
        setResults({
          definitions: safe(responses[0]),
          synonyms: safe(responses[1]),
          antonyms: safe(responses[2]),
          expressions: safe(responses[3]),
          champlexical: safe(responses[4]),
          citations: safe(responses[5]),
          score: responses[6]?.data?.score || null,
        });
      } catch (requestError) {
        if (isActive) setError(t('dictionary_error'));
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchData();
    return () => { isActive = false; };
  }, [searchQuery, t]);

  const submitSearch = () => setSearchQuery(inputValue.trim());
  const clearSearch = () => {
    setInputValue('');
    setSearchQuery('');
  };

  const renderContent = () => {
    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: COLORS.light_primary }]}>
            <Icon name="book-alphabet" size={32} color={COLORS.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: COLORS.black }]}>{t('dictionary_start_title')}</Text>
          <Text style={[styles.emptyText, { color: COLORS.dark }]}>{t('dictionary_start_description')}</Text>
        </View>
      );
    }

    if (loading) {
      return <View style={styles.loadingState}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: COLORS.light_danger }]}>
            <Icon name="alert-circle-outline" size={32} color={COLORS.danger} />
          </View>
          <Text style={[styles.emptyTitle, { color: COLORS.black }]}>{error}</Text>
        </View>
      );
    }

    const { definitions, synonyms, antonyms, expressions, champlexical, citations, score } = results;
    return (
      <ScrollView contentContainerStyle={styles.resultsContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.wordCard, { backgroundColor: COLORS.light_primary }]}>
          <Text style={[styles.word, { color: COLORS.dark_primary }]}>{searchQuery}</Text>
          <Text style={[styles.score, { color: COLORS.dark }]}>{t('dictionary_score')}: {score ?? t('dictionary_none')}</Text>
        </View>

        <ResultSection title={t('dictionary_definitions')} COLORS={COLORS}>
          {definitions.length ? definitions.map((definition, index) => (
            <View key={`definition-${index}-${definition.definition}`} style={styles.definitionRow}>
              <Text style={[styles.number, { color: COLORS.primary }]}>{index + 1}</Text>
              <Text style={[styles.resultText, { color: COLORS.black }]}>{definition.nature ? `(${definition.nature}) ` : ''}{definition.definition}</Text>
            </View>
          )) : <Text style={[styles.emptySection, { color: COLORS.dark }]}>{t('dictionary_no_definitions')}</Text>}
        </ResultSection>

        <ResultSection title={t('dictionary_synonyms')} COLORS={COLORS}>
          <Text style={[styles.resultText, { color: COLORS.black }]}>{synonyms.length ? synonyms.map(item => item.mot).join(' · ') : t('dictionary_no_synonyms')}</Text>
        </ResultSection>

        <ResultSection title={t('dictionary_antonyms')} COLORS={COLORS}>
          <Text style={[styles.resultText, { color: COLORS.black }]}>{antonyms.length ? antonyms.map(item => item.mot).join(' · ') : t('dictionary_no_antonyms')}</Text>
        </ResultSection>

        <ResultSection title={t('dictionary_expressions')} COLORS={COLORS}>
          {expressions.length ? expressions.map((item, index) => <Text key={`expression-${index}-${item.expression}`} style={[styles.resultText, styles.resultSpacing, { color: COLORS.black }]}>{item.expression} : {item.definition}</Text>) : <Text style={[styles.emptySection, { color: COLORS.dark }]}>{t('dictionary_no_expressions')}</Text>}
        </ResultSection>

        <ResultSection title={t('dictionary_lexical_field')} COLORS={COLORS}>
          <Text style={[styles.resultText, { color: COLORS.black }]}>{champlexical.length ? champlexical.map(item => item.mot).join(' · ') : t('dictionary_no_words')}</Text>
        </ResultSection>

        <ResultSection title={t('dictionary_quotes')} COLORS={COLORS}>
          {citations.length ? citations.map((item, index) => <Text key={`citation-${index}-${item.citation}`} style={[styles.resultText, styles.resultSpacing, { color: COLORS.black }]}>« {item.citation} »{item.auteur ? ` (${item.auteur})` : ''}</Text>) : <Text style={[styles.emptySection, { color: COLORS.dark }]}>{t('dictionary_no_quotes')}</Text>}
        </ResultSection>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.light }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.contextHeader}>
          <TouchableOpacity accessibilityLabel="Retour" activeOpacity={0.75} style={[styles.backButton, { backgroundColor: COLORS.light_secondary }]} onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <View style={[styles.dictionaryBadge, { backgroundColor: COLORS.light_primary }]}>
            <Icon name="book-alphabet" size={18} color={COLORS.primary} />
            <Text style={[styles.dictionaryTitle, { color: COLORS.black }]}>{t('dictionary')}</Text>
          </View>
        </View>
        <View style={[styles.searchCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
          <Icon name="magnify" size={22} color={COLORS.dark} />
          <TextInput
            accessibilityLabel={t('dictionary_search')}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t('dictionary_search')}
            placeholderTextColor={COLORS.dark}
            returnKeyType="search"
            style={[styles.searchInput, { color: COLORS.black }]}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={submitSearch}
          />
          {inputValue ? <TouchableOpacity accessibilityLabel={t('clear')} onPress={clearSearch}><Icon name="close-circle" size={21} color={COLORS.dark} /></TouchableOpacity> : null}
          <TouchableOpacity accessibilityLabel={t('search')} style={[styles.submitButton, { backgroundColor: COLORS.primary }]} onPress={submitSearch}>
            <Icon name="arrow-right" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },
  contextHeader: { alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 10 },
  backButton: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  dictionaryBadge: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 8, minHeight: 36, paddingHorizontal: 13 },
  dictionaryTitle: { fontSize: 14, fontWeight: '800' },
  searchCard: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', marginBottom: 16, marginTop: 12, minHeight: 56, paddingLeft: 16, paddingRight: 7 },
  searchInput: { flex: 1, fontSize: 15, marginHorizontal: 11, paddingVertical: 12 },
  submitButton: { alignItems: 'center', borderRadius: 14, height: 42, justifyContent: 'center', marginLeft: 8, width: 42 },
  emptyState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 64 },
  emptyIcon: { alignItems: 'center', borderRadius: 22, height: 62, justifyContent: 'center', width: 62 },
  emptyTitle: { fontSize: 19, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  emptyText: { fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  loadingState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 64 },
  resultsContent: { paddingBottom: 32 },
  wordCard: { borderRadius: 20, marginBottom: 14, padding: 18 },
  word: { fontSize: 25, fontWeight: '800' },
  score: { fontSize: 13, marginTop: 6 },
  section: { borderRadius: 18, borderWidth: 1, marginBottom: 10, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  definitionRow: { flexDirection: 'row', marginBottom: 10 },
  number: { fontSize: 14, fontWeight: '800', marginRight: 9, minWidth: 16 },
  resultText: { flex: 1, fontSize: 14, lineHeight: 20 },
  resultSpacing: { marginBottom: 9 },
  emptySection: { fontSize: 14 },
});

export default DictionaryScreen;
