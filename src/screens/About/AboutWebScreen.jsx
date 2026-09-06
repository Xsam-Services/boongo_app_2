import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {WebView} from 'react-native-webview';

import HeaderComponent from '../header';
import useColors from '../../hooks/useColors';
import {
  isBoongoWebUrl,
  isSupportedExternalUrl,
} from '../../utils/webNavigation';

export default function AboutWebScreen({titleKey, uri}) {
  const colors = useColors();
  const {t} = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const retry = () => {
    setError('');
    setLoading(true);
    setReloadKey(value => value + 1);
  };

  const handleNavigation = useCallback(request => {
    if (isBoongoWebUrl(request.url)) return true;

    if (isSupportedExternalUrl(request.url)) {
      Linking.openURL(request.url).catch(() => {
        setError('Impossible d’ouvrir ce lien sur votre appareil.');
      });
    }
    return false;
  }, []);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.screen, {backgroundColor: colors.light}]}>
      <HeaderComponent title={t(titleKey)} hideSearch />
      <View style={styles.browser}>
        {!error ? (
          <WebView
            key={reloadKey}
            source={{uri}}
            style={{backgroundColor: colors.light}}
            onLoadStart={() => {
              setError('');
              setLoading(true);
            }}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('Cette page est momentanément indisponible.');
            }}
            onHttpError={event => {
              if (event.nativeEvent.statusCode >= 400) {
                setLoading(false);
                setError('Cette page est momentanément indisponible.');
              }
            }}
            onShouldStartLoadWithRequest={handleNavigation}
            allowsBackForwardNavigationGestures
            javaScriptEnabled
          />
        ) : (
          <View style={[styles.errorCard, {backgroundColor: colors.white, borderColor: colors.light_secondary}]}>
            <View style={[styles.errorIcon, {backgroundColor: colors.light_danger}]}>
              <Icon name="wifi-alert" size={30} color={colors.danger} />
            </View>
            <Text style={[styles.errorTitle, {color: colors.black}]}>Page indisponible</Text>
            <Text accessibilityLiveRegion="polite" style={[styles.errorText, {color: colors.dark}]}>
              {error}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={retry}
              style={[styles.retryButton, {backgroundColor: colors.primary}]}>
              <Icon name="reload" size={19} color="#ffffff" />
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}
        {loading && !error ? (
          <View pointerEvents="none" style={[styles.loader, {backgroundColor: colors.light}]}>
            <View style={[styles.loaderIcon, {backgroundColor: colors.light_primary}]}>
              <ActivityIndicator color={colors.primary} />
            </View>
            <Text style={[styles.loaderText, {color: colors.dark}]}>Chargement de la page…</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1},
  browser: {flex: 1},
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderIcon: {
    alignItems: 'center',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  loaderText: {fontSize: 14, fontWeight: '600', marginTop: 12},
  errorCard: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    margin: 20,
    padding: 26,
  },
  errorIcon: {
    alignItems: 'center',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  errorTitle: {fontSize: 20, fontWeight: '800', marginTop: 16},
  errorText: {fontSize: 14, lineHeight: 20, marginTop: 7, textAlign: 'center'},
  retryButton: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    minHeight: 50,
    paddingHorizontal: 22,
  },
  retryText: {color: '#ffffff', fontSize: 15, fontWeight: '800'},
});
