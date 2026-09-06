import React, { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { API, WEB } from '../tools/constants';
import HeaderComponent from './header';
import useColors from '../hooks/useColors';
import { formatPaymentAmount, safePaymentUrl } from '../utils/payment';

const PROVIDERS = [
  { image: require('../../assets/img/operator-flexpay.png'), label: 'FlexPay', value: 'FlexPaie' },
  { image: require('../../assets/img/operator-multipay.png'), label: 'Multipay', value: 'Multipay' },
  { image: require('../../assets/img/operator-paypal.png'), label: 'PayPal', value: 'PayPal' },
  { image: require('../../assets/img/operator-visa-mastercard.png'), label: 'Carte Visa / Mastercard', value: 'Carte bancaire' },
];

export default function BankCardSubscribeScreen({ route }) {
  const colors = useColors();
  const navigation = useNavigation();
  const { purchase, resetPaymentURL, isLoading } = useContext(AuthContext);
  const { amount, currency, cartId, entity } = route.params || {};
  const [provider, setProvider] = useState('');
  const [transactionTypeId, setTransactionTypeId] = useState(null);
  const [loadingType, setLoadingType] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [gatewayUrl, setGatewayUrl] = useState('');
  const [error, setError] = useState('');
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      resetPaymentURL();
    }
  }, [resetPaymentURL]);

  useEffect(() => {
    let active = true;
    axios.get(`${API.boongo_url}/type/search/fr/${encodeURIComponent('Carte bancaire')}`)
      .then(response => {
        if (active) setTransactionTypeId(response.data?.data?.id || null);
      })
      .catch(() => {
        if (active) setError('Le paiement par carte n’est pas disponible pour le moment.');
      })
      .finally(() => {
        if (active) setLoadingType(false);
      });
    return () => { active = false; };
  }, []);

  const submit = async () => {
    if (!cartId || !entity) setError('Le panier à payer est introuvable. Revenez à Mon espace.');
    else if (!provider) setError('Choisissez un prestataire de paiement.');
    else if (!transactionTypeId) setError('Le moyen de paiement est encore indisponible. Réessayez.');
    else {
      setError('');
      setSubmitting(true);
      const result = await purchase(cartId, entity, transactionTypeId, null, provider, WEB.boongo_url);
      setSubmitting(false);
      if (!result.success) setError(result.error || 'Le paiement n’a pas pu être initialisé.');
      else {
        const nextUrl = safePaymentUrl(result.url);
        if (nextUrl) setGatewayUrl(nextUrl);
        else setError('Le prestataire n’a pas renvoyé de page de paiement sécurisée.');
      }
    }
  };

  if (gatewayUrl) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: colors.light }]}>
        <HeaderComponent title="Paiement sécurisé" hideSearch />
        <WebView source={{ uri: gatewayUrl }} style={styles.webView} startInLoadingState renderLoading={() => <ActivityIndicator color={colors.primary} style={styles.webLoader} />} />
        <TouchableOpacity onPress={() => { resetPaymentURL(); navigation.navigate('Account'); }} style={[styles.closePayment, { borderColor: colors.primary }]}><Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Revenir à Mon espace</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: colors.light }]}>
      <HeaderComponent title="Paiement" hideSearch />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.amountCard, { backgroundColor: colors.light_primary }]}>
          <View style={[styles.amountIcon, { backgroundColor: colors.primary }]}><Icon name="shield-check-outline" size={28} color="#fff" /></View>
          <Text style={[styles.amountLabel, { color: colors.dark }]}>Montant à payer</Text>
          <Text style={[styles.amount, { color: colors.black }]}>{formatPaymentAmount(amount, currency)}</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.white, borderColor: colors.light_secondary }]}>
          <Text style={[styles.title, { color: colors.black }]}>Choisissez un prestataire</Text>
          <Text style={[styles.description, { color: colors.dark }]}>Vos informations bancaires seront saisies directement sur la page sécurisée du prestataire. Boongo ne les collecte pas.</Text>
          <View style={styles.providerList}>
            {PROVIDERS.map(item => (
              <TouchableOpacity key={item.value} onPress={() => setProvider(item.value)} style={[styles.provider, { backgroundColor: provider === item.value ? colors.light_primary : colors.light, borderColor: provider === item.value ? colors.primary : colors.light_secondary }]}>
                <Image source={item.image} resizeMode="contain" style={styles.providerImage} />
                <Text style={[styles.providerLabel, { color: provider === item.value ? colors.primary : colors.black }]}>{item.label}</Text>
                <Icon name={provider === item.value ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={provider === item.value ? colors.primary : colors.dark} />
              </TouchableOpacity>
            ))}
          </View>
          {error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.danger, backgroundColor: colors.light_danger }]}>{error}</Text> : null}
          <TouchableOpacity disabled={submitting || isLoading || loadingType} onPress={submit} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: submitting || isLoading || loadingType ? 0.6 : 1 }]}>
            {submitting || isLoading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.primaryButtonText}>Ouvrir le paiement sécurisé</Text><Icon name="open-in-new" size={19} color="#fff" /></>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.replace('MobileSubscribe', { amount, currency, cartId, entity })} style={[styles.secondaryButton, { borderColor: colors.primary }]}><Icon name="cellphone" size={20} color={colors.primary} /><Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Payer par Mobile Money</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { flexGrow: 1, padding: 18, paddingBottom: 32 }, amountCard: { alignItems: 'center', borderRadius: 24, padding: 20 }, amountIcon: { alignItems: 'center', borderRadius: 24, height: 48, justifyContent: 'center', marginBottom: 12, width: 48 }, amountLabel: { fontSize: 13, fontWeight: '700' }, amount: { fontSize: 25, fontWeight: '900', marginTop: 4 },
  formCard: { borderRadius: 22, borderWidth: 1, marginTop: 18, padding: 16 }, title: { fontSize: 19, fontWeight: '800', textAlign: 'center' }, description: { fontSize: 14, lineHeight: 20, marginTop: 7, textAlign: 'center' }, providerList: { gap: 10, marginTop: 18 }, provider: { alignItems: 'center', borderRadius: 16, borderWidth: 1, flexDirection: 'row', minHeight: 68, padding: 12 }, providerImage: { height: 42, marginRight: 12, width: 56 }, providerLabel: { flex: 1, fontSize: 14, fontWeight: '700' }, error: { borderRadius: 13, fontSize: 13, fontWeight: '600', lineHeight: 18, marginTop: 14, padding: 12 },
  primaryButton: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 18, minHeight: 54, paddingHorizontal: 14 }, primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' }, secondaryButton: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 10, minHeight: 52 }, secondaryButtonText: { fontSize: 14, fontWeight: '800' },
  webView: { flex: 1 }, webLoader: { flex: 1 }, closePayment: { alignItems: 'center', borderRadius: 16, borderWidth: 1, margin: 12, padding: 14 },
});
