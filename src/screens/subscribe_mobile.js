import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

const OPERATORS = [
  { image: require('../../assets/img/operator-m-pesa.png'), label: 'M-PESA', value: 'M-Pesa' },
  { image: require('../../assets/img/operator-airtel-money.png'), label: 'Airtel Money', value: 'Airtel money' },
  { image: require('../../assets/img/operator-orange-money.png'), label: 'Orange Money', value: 'Orange money' },
  { image: require('../../assets/img/operator-afrimoney.png'), label: 'Afrimoney', value: 'Afrimoney' },
];

export default function MobileSubscribeScreen({ route }) {
  const colors = useColors();
  const navigation = useNavigation();
  const { userInfo, purchase, resetPaymentURL, isLoading } = useContext(AuthContext);
  const { amount, currency, cartId, entity } = route.params || {};
  const initialPhone = useMemo(() => {
    const code = userInfo?.country?.country_phone_code || '';
    const number = userInfo?.phone || '';
    if (number.startsWith('+')) return number;
    return code || number ? `+${code}${number}` : '';
  }, [userInfo?.country?.country_phone_code, userInfo?.phone]);
  const [phone, setPhone] = useState(initialPhone);
  const [channel, setChannel] = useState('');
  const [transactionTypeId, setTransactionTypeId] = useState(null);
  const [loadingType, setLoadingType] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
    axios.get(`${API.boongo_url}/type/search/fr/${encodeURIComponent('Mobile money')}`)
      .then(response => {
        if (active) setTransactionTypeId(response.data?.data?.id || null);
      })
      .catch(() => {
        if (active) setError('Le paiement mobile n’est pas disponible pour le moment.');
      })
      .finally(() => {
        if (active) setLoadingType(false);
      });
    return () => { active = false; };
  }, []);

  const displayAmount = formatPaymentAmount(amount, currency);

  const submit = async () => {
    const normalizedPhone = phone.replace(/[^+\d]/g, '');
    if (!cartId || !entity) setError('Le panier à payer est introuvable. Revenez à Mon espace.');
    else if (!channel) setError('Choisissez un opérateur.');
    else if (!/^\+?\d{8,15}$/.test(normalizedPhone)) setError('Saisissez un numéro de téléphone valide avec son indicatif.');
    else if (!transactionTypeId) setError('Le moyen de paiement est encore indisponible. Réessayez.');
    else {
      setError('');
      setSubmitting(true);
      const result = await purchase(cartId, entity, transactionTypeId, normalizedPhone, channel, WEB.boongo_url);
      setSubmitting(false);
      if (!result.success) setError(result.error || 'Le paiement n’a pas pu être initialisé.');
      else if (result.url) {
        const nextUrl = safePaymentUrl(result.url);
        if (nextUrl) setGatewayUrl(nextUrl);
        else setError('L’adresse sécurisée du prestataire est invalide.');
      } else setSubmitted(true);
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
      <HeaderComponent title="Paiement mobile" hideSearch />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets
      >
        <View style={[styles.amountCard, { backgroundColor: colors.light_primary }]}>
          <View style={[styles.amountIcon, { backgroundColor: colors.primary }]}><Icon name="cellphone-check" size={28} color="#fff" /></View>
          <Text style={[styles.amountLabel, { color: colors.dark }]}>Montant à payer</Text>
          <Text style={[styles.amount, { color: colors.black }]}>{displayAmount}</Text>
        </View>

        {submitted ? (
          <View style={[styles.successCard, { backgroundColor: colors.white, borderColor: colors.light_secondary }]}>
            <Icon name="check-decagram" size={58} color={colors.success} />
            <Text style={[styles.title, { color: colors.black }]}>Demande envoyée</Text>
            <Text style={[styles.description, { color: colors.dark }]}>Confirmez la transaction sur votre téléphone. La validation peut prendre quelques instants.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Account')} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={styles.primaryButtonText}>Retour à Mon espace</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.formCard, { backgroundColor: colors.white, borderColor: colors.light_secondary }]}>
            <Text style={[styles.title, { color: colors.black }]}>Choisissez votre opérateur</Text>
            <Text style={[styles.description, { color: colors.dark }]}>Le numéro doit être associé à un compte Mobile Money actif.</Text>
            <View style={styles.operatorGrid}>
              {OPERATORS.map(operator => (
                <TouchableOpacity key={operator.value} onPress={() => setChannel(operator.value)} style={[styles.operator, { backgroundColor: channel === operator.value ? colors.light_primary : colors.light, borderColor: channel === operator.value ? colors.primary : colors.light_secondary }]}>
                  <Image source={operator.image} style={styles.operatorImage} resizeMode="contain" />
                  <Text style={[styles.operatorLabel, { color: channel === operator.value ? colors.primary : colors.black }]}>{operator.label}</Text>
                  {channel === operator.value ? <Icon name="check-circle" size={18} color={colors.primary} /> : null}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.black }]}>Numéro avec indicatif</Text>
            <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="+243…" placeholderTextColor={colors.dark} style={[styles.input, { color: colors.black, backgroundColor: colors.light, borderColor: colors.light_secondary }]} />
            {error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.danger, backgroundColor: colors.light_danger }]}>{error}</Text> : null}
            <TouchableOpacity disabled={submitting || isLoading || loadingType} onPress={submit} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: submitting || isLoading || loadingType ? 0.6 : 1 }]}>
              {submitting || isLoading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.primaryButtonText}>Continuer</Text><Icon name="arrow-right" size={20} color="#fff" /></>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.replace('BankCardSubscribe', { amount, currency, cartId, entity })} style={[styles.secondaryButton, { borderColor: colors.primary }]}><Icon name="credit-card-outline" size={20} color={colors.primary} /><Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Payer autrement</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, keyboardAvoidingView: { flex: 1 }, content: { flexGrow: 1, padding: 18, paddingBottom: 32 }, amountCard: { alignItems: 'center', borderRadius: 24, padding: 20 }, amountIcon: { alignItems: 'center', borderRadius: 24, height: 48, justifyContent: 'center', marginBottom: 12, width: 48 }, amountLabel: { fontSize: 13, fontWeight: '700' }, amount: { fontSize: 25, fontWeight: '900', marginTop: 4 },
  formCard: { borderRadius: 22, borderWidth: 1, marginTop: 18, padding: 16 }, title: { fontSize: 19, fontWeight: '800', textAlign: 'center' }, description: { fontSize: 14, lineHeight: 20, marginTop: 7, textAlign: 'center' }, operatorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 18 }, operator: { alignItems: 'center', borderRadius: 16, borderWidth: 1, flexBasis: '47%', flexDirection: 'row', minHeight: 62, padding: 10 }, operatorImage: { height: 34, marginRight: 7, width: 34 }, operatorLabel: { flex: 1, fontSize: 12, fontWeight: '700' }, label: { fontSize: 14, fontWeight: '700', marginBottom: 8 }, input: { borderRadius: 14, borderWidth: 1, fontSize: 16, paddingHorizontal: 14, paddingVertical: 14 }, error: { borderRadius: 13, fontSize: 13, fontWeight: '600', lineHeight: 18, marginTop: 12, padding: 12 },
  primaryButton: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 18, minHeight: 54, paddingHorizontal: 18 }, primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' }, secondaryButton: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 10, minHeight: 52 }, secondaryButtonText: { fontSize: 15, fontWeight: '800' },
  successCard: { alignItems: 'center', borderRadius: 22, borderWidth: 1, marginTop: 18, padding: 24 }, webView: { flex: 1 }, webLoader: { flex: 1 }, closePayment: { alignItems: 'center', borderRadius: 16, borderWidth: 1, margin: 12, padding: 14 },
});
