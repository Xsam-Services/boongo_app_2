import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { API } from '../tools/constants';
import HeaderComponent from './header';
import EmptyListComponent from '../components/empty_list';
import useColors from '../hooks/useColors';

const formatPrice = (amount, currency) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return `— ${currency || ''}`.trim();
  return `${new Intl.NumberFormat('fr', { maximumFractionDigits: 0 }).format(numericAmount)} ${currency || ''}`.trim();
};

const SubscriptionCard = ({ item, displayPrice, inCart, busy, onToggle, colors }) => (
  <View style={[styles.offerCard, { backgroundColor: colors.white, borderColor: colors.light_secondary }]}>
    <View style={[styles.offerIcon, { backgroundColor: colors.light_primary }]}>
      <Icon name="calendar-check-outline" size={23} color={colors.primary} />
    </View>
    <View style={styles.offerCopy}>
      <Text style={[styles.offerName, { color: colors.black }]}>{item.type?.type_name_fr || item.type?.type_name || 'Abonnement'}</Text>
      <Text style={[styles.offerPrice, { color: colors.primary }]}>{displayPrice}</Text>
    </View>
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={onToggle} style={[styles.offerAction, { backgroundColor: inCart ? colors.light_danger : colors.light_primary }]}>
      {busy ? <ActivityIndicator color={colors.primary} /> : <Icon name={inCart ? 'trash-can-outline' : 'cart-plus'} size={20} color={inCart ? colors.danger : colors.primary} />}
    </TouchableOpacity>
  </View>
);

export default function SubscriptionScreen({ route }) {
  const colors = useColors();
  const navigation = useNavigation();
  const { userInfo, activateSubscriptionByCode, addToCart, removeFromCart, isLoading } = useContext(AuthContext);
  const mode = route.params?.object === 'activation' ? 'activation' : 'subscription';
  const itemId = route.params?.itemId;
  const [subscriptions, setSubscriptions] = useState({});
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(mode === 'subscription');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [partners, setPartners] = useState([]);
  const [partnerId, setPartnerId] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const headers = useMemo(() => ({ 'X-localization': 'fr', 'X-user-id': userInfo?.id, Authorization: `Bearer ${userInfo?.api_token}` }), [userInfo?.api_token, userInfo?.id]);

  const loadSubscriptions = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API.boongo_url}/subscription`, { headers: { 'X-localization': 'fr' } });
      if (response.data?.success === false) throw new Error('Subscriptions unavailable');
      const grouped = response.data?.data || {};
      setSubscriptions(grouped);
      const targetCurrency = userInfo?.currency?.currency_acronym;
      const rateCache = new Map();
      const nextPrices = {};
      for (const [category, offers] of Object.entries(grouped)) {
        for (const offer of offers || []) {
          const sourceCurrency = offer.currency?.currency_acronym;
          let converted = Number(offer.price);
          if (sourceCurrency && targetCurrency && sourceCurrency !== targetCurrency) {
            if (!rateCache.has(sourceCurrency)) {
              const rateResponse = await axios.get(`${API.boongo_url}/currencies_rate/find_currency_rate/${sourceCurrency}/${targetCurrency}`, { headers });
              rateCache.set(sourceCurrency, Number(rateResponse.data?.data?.rate || 1));
            }
            converted *= rateCache.get(sourceCurrency);
          }
          nextPrices[`${category}-${offer.id}`] = formatPrice(converted, targetCurrency || sourceCurrency);
        }
      }
      setPrices(nextPrices);
    } catch {
      setSubscriptions({});
      setPrices({});
      setError('Impossible de charger les offres d’abonnement.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [headers, userInfo?.currency?.currency_acronym]);

  useEffect(() => {
    if (mode === 'subscription') loadSubscriptions();
  }, [loadSubscriptions, mode]);

  useEffect(() => {
    if (mode !== 'activation') return;
    let active = true;
    setLoading(true);
    axios.get(`${API.boongo_url}/partner/partners_with_activation_code/fr/Actif`, { headers })
      .then(response => { if (active) setPartners(response.data?.data || []); })
      .catch(() => { if (active) setError('Les partenaires ne sont pas disponibles pour le moment. Le code peut être utilisé sans partenaire.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [headers, mode]);

  const categories = Object.entries(subscriptions);
  const toggleOffer = (offer, inCart) => {
    setError('');
    if (inCart) {
      const cartId = userInfo?.unpaid_subscription_cart?.id;
      if (!cartId) {
        setError('Le panier d’abonnements est introuvable. Actualisez votre compte.');
        return;
      }
      removeFromCart(cartId, null, offer.id);
    } else {
      addToCart('subscription', userInfo.id, null, offer.id);
    }
  };

  const activate = async () => {
    if (!code.trim()) {
      setError('Saisissez le code d’activation.');
      return;
    }
    setSubmitting(true);
    setError('');
    const success = await activateSubscriptionByCode(userInfo.id, code.trim(), partnerId || 0);
    setSubmitting(false);
    if (!success) {
      setError('Le code n’a pas pu être activé. Vérifiez-le puis réessayez.');
      return;
    }
    if (itemId) navigation.replace('WorkData', { itemId });
    else navigation.replace('Account');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: colors.light }]}>
      <HeaderComponent title={mode === 'activation' ? 'Activer un abonnement' : 'Abonnements'} hideSearch />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={mode === 'subscription' ? <RefreshControl refreshing={refreshing} onRefresh={() => loadSubscriptions(true)} tintColor={colors.primary} /> : undefined}>
        <View style={[styles.hero, { backgroundColor: colors.light_primary }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}><Icon name={mode === 'activation' ? 'ticket-confirmation-outline' : 'star-circle-outline'} size={28} color="#fff" /></View>
          <View style={styles.heroCopy}>
            <Text style={[styles.title, { color: colors.black }]}>{mode === 'activation' ? 'Vous avez déjà un code ?' : 'Choisissez votre formule'}</Text>
            <Text style={[styles.subtitle, { color: colors.dark }]}>{mode === 'activation' ? 'Utilisez le code transmis par un partenaire.' : 'Ajoutez une formule au panier, puis payez depuis Mon espace.'}</Text>
          </View>
        </View>
        {error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.danger, backgroundColor: colors.light_danger }]}>{error}</Text> : null}
        {mode === 'activation' ? (
          <View style={[styles.formCard, { backgroundColor: colors.white, borderColor: colors.light_secondary }]}>
            <Text style={[styles.label, { color: colors.black }]}>Partenaire, si applicable</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.partnerRow}>
              {[{ id: 0, name: 'Sans partenaire' }, ...partners].map(partner => (
                <TouchableOpacity key={partner.id} onPress={() => setPartnerId(partner.id)} style={[styles.partnerChip, { backgroundColor: partnerId === partner.id ? colors.light_primary : colors.white, borderColor: partnerId === partner.id ? colors.primary : colors.light_secondary }]}><Text style={{ color: partnerId === partner.id ? colors.primary : colors.dark, fontWeight: '700' }}>{partner.name}</Text></TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.label, { color: colors.black }]}>Code d’activation</Text>
            <TextInput autoCapitalize="characters" autoCorrect={false} value={code} onChangeText={setCode} placeholder="Saisissez votre code" placeholderTextColor={colors.dark} style={[styles.input, { color: colors.black, borderColor: colors.light_secondary, backgroundColor: colors.light }]} />
            <TouchableOpacity disabled={submitting || isLoading} onPress={activate} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: submitting || isLoading ? 0.6 : 1 }]}>
              {submitting || isLoading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.primaryButtonText}>Activer</Text><Icon name="arrow-right" size={20} color="#fff" /></>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.replace('Subscription', { object: 'subscription', itemId })} style={styles.textButton}><Text style={[styles.textButtonLabel, { color: colors.primary }]}>Voir les abonnements</Text></TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.subtitle, { color: colors.dark }]}>Chargement des offres…</Text></View>
        ) : categories.length ? (
          <>
            {categories.map(([category, offers]) => (
              <View key={category} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.black }]}>{category}</Text>
                {(offers || []).map(offer => {
                  const inCart = Boolean(userInfo?.unpaid_subscriptions?.some(subscription => subscription.id === offer.id));
                  return <SubscriptionCard key={offer.id} item={offer} displayPrice={prices[`${category}-${offer.id}`] || formatPrice(offer.price, offer.currency?.currency_acronym)} inCart={inCart} busy={isLoading} onToggle={() => toggleOffer(offer, inCart)} colors={colors} />;
                })}
              </View>
            ))}
            <TouchableOpacity onPress={() => navigation.replace('Subscription', { object: 'activation', itemId })} style={[styles.secondaryButton, { borderColor: colors.primary }]}><Icon name="ticket-confirmation-outline" size={20} color={colors.primary} /><Text style={[styles.secondaryButtonText, { color: colors.primary }]}>J’ai un code d’activation</Text></TouchableOpacity>
          </>
        ) : !error ? <EmptyListComponent iconName="credit-card-outline" title="Aucune offre disponible" /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { flexGrow: 1, padding: 18, paddingBottom: 32 }, hero: { alignItems: 'center', borderRadius: 22, flexDirection: 'row', padding: 18 }, heroIcon: { alignItems: 'center', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 }, heroCopy: { flex: 1, marginLeft: 14 },
  title: { fontSize: 20, fontWeight: '800' }, subtitle: { fontSize: 14, lineHeight: 20, marginTop: 5 }, error: { borderRadius: 14, fontSize: 13, fontWeight: '600', lineHeight: 19, marginTop: 16, padding: 13 }, loading: { alignItems: 'center', gap: 10, paddingVertical: 60 }, section: { marginTop: 24 }, sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  offerCard: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', marginBottom: 10, padding: 14 }, offerIcon: { alignItems: 'center', borderRadius: 18, height: 44, justifyContent: 'center', width: 44 }, offerCopy: { flex: 1, marginHorizontal: 12 }, offerName: { fontSize: 15, fontWeight: '700' }, offerPrice: { fontSize: 16, fontWeight: '900', marginTop: 5 }, offerAction: { alignItems: 'center', borderRadius: 17, height: 42, justifyContent: 'center', width: 42 },
  formCard: { borderRadius: 22, borderWidth: 1, marginTop: 20, padding: 16 }, label: { fontSize: 14, fontWeight: '700', marginBottom: 9, marginTop: 8 }, partnerRow: { gap: 8, paddingBottom: 12 }, partnerChip: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 }, input: { borderRadius: 14, borderWidth: 1, fontSize: 16, marginBottom: 16, paddingHorizontal: 14, paddingVertical: 14 }, primaryButton: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 54 }, primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 18, minHeight: 52 }, secondaryButtonText: { fontSize: 15, fontWeight: '800' }, textButton: { alignItems: 'center', padding: 16 }, textButtonLabel: { fontWeight: '800' },
});
