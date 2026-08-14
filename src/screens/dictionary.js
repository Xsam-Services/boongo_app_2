/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { SearchContext } from '../contexts/SearchContext';
import useColors from '../hooks/useColors';
import homeStyles from './style';
import { API, PADDING } from '../tools/constants';

const API_BASE = "https://api.dicolink.com/v1/mot";

const DictionaryScreen = () => {
  const COLORS = useColors();
  const { searchQuery } = useContext(SearchContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState({
    definitions: [],
    synonyms: [],
    antonyms: [],
    expressions: [],
    champlexical: [],
    citations: [],
    score: null,
  });

  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) return;

    setLoading(true);
    setError("");
    setResults({
      definitions: [],
      synonyms: [],
      antonyms: [],
      expressions: [],
      champlexical: [],
      citations: [],
      score: null,
    });

    const fetchData = async () => {
      try {
        const endpoints = [
          'definitions',
          'synonymes',
          'antonymes',
          'expressions',
          'champlexical',
          'citations',
          'scorescrabble',
        ];

        const requests = endpoints.map(endpoint =>
          axios.get(`${API_BASE}/${searchQuery}/${endpoint}?api_key=${API.dicolink_key}&${endpoint === 'scorescrabble' ? '' : (endpoint !== 'definitions' ? 'limit=5' : 'limit=200')}`).catch(() => null)
        );

        const [
          defRes,
          synRes,
          antRes,
          expRes,
          champRes,
          citRes,
          scoreRes,
        ] = await Promise.all(requests);

        // GESTION AUTOMATIQUE : si { error: "pas de résultats" }
        const safe = (res) => {
          if (!res || res.data?.error) return [];
          return Array.isArray(res.data) ? res.data : [res.data];
        };

        setResults({
          definitions: safe(defRes),
          synonyms: safe(synRes),
          antonyms: safe(antRes),
          expressions: safe(expRes),
          champlexical: safe(champRes),
          citations: safe(citRes),
          score: scoreRes?.data?.score || null,
        });

      } catch (e) {
        setError("Erreur lors de la récupération des données");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery]);

  if (!searchQuery) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
        <View style={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: PADDING.p07
        }}>
          <Icon name="alpha-i-circle-outline" size={50} color={COLORS.black} />
          <Text style={[homeStyles.dicoMessage, { color: COLORS.black }]}>
            Recherche un mot dans le dictionnaire
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
        <View style={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <ActivityIndicator size={50} color={COLORS.info} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
        <View style={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: PADDING.p07
        }}>
          <Icon name="alert-outline" size={50} color={COLORS.black} />
          <Text style={[homeStyles.dicoMessage, { color: COLORS.black }]}>
            {error}
          </Text>
        </View>
      </View>
    );
  }

  const {
    definitions,
    synonyms,
    antonyms,
    expressions,
    champlexical,
    citations,
    score
  } = results;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* MOT */}
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.link_color }}>{searchQuery}</Text>

        {/* SCORE */}
        <Text style={{ fontSize: 16, marginTop: 5, color: COLORS.black }}>
          <Text style={{ fontWeight: '500' }}>Score scrabble</Text> : {score ?? "Aucun"}
        </Text>


        {/* DÉFINITIONS */}
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.black, textDecorationLine: 'underline', marginTop: 20 }}>Définitions</Text>
        {definitions.length === 0 ? (
          <Text style={{ color: COLORS.black }}>Aucune définition</Text>
        ) : (
          definitions.map((d, i) => (
            <View key={`champ-${i}-${d.definition}`} style={{ flexDirection: 'row', marginVertical: 5 }}>
              <Text style={{ marginRight: 6, fontSize: 16, color: COLORS.black }}>{i + 1}.</Text>
              <Text style={{ color: COLORS.black, maxWidth: '95%' }}>({d.nature}) {d.definition}</Text>
            </View>
          ))
        )}

        {/* SYNONYMES */}
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.black, textDecorationLine: 'underline', marginTop: 25, marginBottom: 5 }}>Synonymes</Text>
        {synonyms.length === 0 ? (
          <Text style={{ color: COLORS.black }}>Aucun synonyme</Text>
        ) : (
          synonyms.map((m, i) => (
            <View key={`champ-${i}-${m.mot}`} style={{ flexDirection: 'row' }}>
              <Text style={{ marginRight: 6, fontSize: 16, color: COLORS.black }}>•</Text>
              <Text style={{ color: COLORS.black }}>{m.mot}</Text>
            </View>
          ))
        )}

        {/* ANTONYMES */}
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.black, textDecorationLine: 'underline', marginTop: 25, marginBottom: 5 }}>Antonymes</Text>
        {antonyms.length === 0 ? (
          <Text style={{ color: COLORS.black }}>Aucun antonyme</Text>
        ) : (
          antonyms.map((m, i) => (
            <View key={`champ-${i}-${m.mot}`} style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ marginRight: 6, fontSize: 16, color: COLORS.black }}>•</Text>
              <Text style={{ color: COLORS.black }}>{m.mot}</Text>
            </View>
          ))
        )}

        {/* EXPRESSIONS */}
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.black, textDecorationLine: 'underline', marginTop: 25, marginBottom: 5 }}>Expressions</Text>
        {expressions.length === 0 ? (
          <Text style={{ color: COLORS.black }}>Aucune expression</Text>
        ) : (
          expressions.map((exp, i) => (
            <View key={`champ-${i}-${exp.expression}`} style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ marginRight: 6, fontSize: 16, color: COLORS.black }}>•</Text>
              <Text style={{ color: COLORS.black }}>{exp.expression} : {exp.definition}</Text>
            </View>
          ))
        )}

        {/* CHAMP LEXICAL */}
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.black, textDecorationLine: 'underline', marginTop: 25, marginBottom: 5 }}>Champ lexical</Text>
        {champlexical.length === 0 ? (
          <Text style={{ color: COLORS.black }}>Aucun mot</Text>
        ) : (
          champlexical.map((m, i) => (
            <View key={`champ-${i}-${m.mot}`} style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ marginRight: 6, fontSize: 16, color: COLORS.black }}>•</Text>
              <Text style={{ color: COLORS.black }}>{m.mot}</Text>
            </View>
          ))
        )}

        {/* CITATIONS */}
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.black, textDecorationLine: 'underline', marginTop: 25, marginBottom: 5 }}>Citations</Text>
        {citations.length === 0 ? (
          <Text style={{ color: COLORS.black }}>Aucune citation</Text>
        ) : (
          citations.map((c, i) => (
            <View key={`champ-${i}-${c.citation}`} style={{ flexDirection: 'row', marginBottom: 2 }}>
              <Text style={{ marginRight: 6, fontSize: 16, color: COLORS.black }}>•</Text>
              <Text style={{ color: COLORS.black }}>« {c.citation} » (<Text style={{ fontWeight: '500' }}>{c.auteur}</Text>)</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DictionaryScreen;
