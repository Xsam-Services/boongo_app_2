import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import qs from 'qs';
import {AuthContext} from '../../contexts/AuthContext';
import EmptyListComponent from '../../components/empty_list';
import WorkItemComponent from '../../components/work_item';
import UserItemComponent from '../../components/user_item';
import HeaderComponent from '../header';
import useColors from '../../hooks/useColors';
import {API} from '../../tools/constants';
import {formatPaymentAmount} from '../../utils/payment';
const T = [
  ['works', 'Mes œuvres', 'book-open-page-variant-outline'],
  ['cart', 'Panier', 'cart-outline'],
  ['subscribers', 'Abonnés', 'account-heart-outline'],
];
export default function AccountScreen() {
  const C = useColors(),
    n = useNavigation(),
    {userInfo: u, removeFromCart} = useContext(AuthContext),
    [tab, setTab] = useState('works'),
    [data, setData] = useState([]),
    [cats, setCats] = useState([]),
    [cat, setCat] = useState(0),
    [load, setLoad] = useState(true),
    [refresh, setRefresh] = useState(false),
    [checkoutTotals, setCheckoutTotals] = useState({}),
    [checkoutTotalsLoading, setCheckoutTotalsLoading] = useState(false);
  const h = useMemo(
    () => ({
      'X-localization': 'fr',
      'X-user-id': u?.id,
      Authorization: `Bearer ${u?.api_token}`,
    }),
    [u?.id, u?.api_token],
  );
  const get = useCallback(async () => {
    if (!u?.id) return;
    setLoad(true);
    try {
      if (tab === 'cart')
        setData([
          ...(u.unpaid_consultations || []).map(x => ({
            ...x,
            k: 'consultation',
          })),
          ...(u.unpaid_subscriptions || []).map(x => ({
            ...x,
            k: 'subscription',
          })),
        ]);
      else {
        const r =
          tab === 'works'
            ? await axios.post(
                `${API.boongo_url}/work/filter_by_categories`,
                qs.stringify({'categories_ids[0]': cat, user_id: u.id}),
                {headers: h},
              )
            : await axios.get(
                `${API.boongo_url}/user/works_subscribers/${u.id}`,
                {headers: h},
              );
        setData(r.data?.data || []);
      }
    } catch (e) {

      setData([]);
    } finally {
      setLoad(false);
    }
  }, [tab, cat, u, h]);
  useEffect(() => {
    get();
  }, [get]);
  useEffect(() => {
    axios
      .get(
        `${API.boongo_url}/category/find_by_group/${encodeURIComponent(
          'Catégorie pour œuvre',
        )}`,
        {headers: h},
      )
      .then(r =>
        setCats([{id: 0, category_name: 'Toutes'}, ...(r.data?.data || [])]),
      )
      .catch(() => {});
  }, [h]);
  const change = x => {
    if (x !== tab) {
      setData([]);
      setLoad(true);
      setTab(x);
    }
  };
  const checkoutGroups = useMemo(
    () => [
      {
        key: 'subscription',
        items: u?.unpaid_subscriptions || [],
        priceKey: 'price',
      },
      {
        key: 'consultation',
        items: u?.unpaid_consultations || [],
        priceKey: 'consultation_price',
      },
    ].filter(group => group.items.length > 0),
    [
      u?.unpaid_consultations,
      u?.unpaid_subscriptions,
    ],
  );

  useEffect(() => {
    if (tab !== 'cart' || !checkoutGroups.length) {
      setCheckoutTotals({});
      setCheckoutTotalsLoading(false);
      return;
    }

    let active = true;
    const convertTotals = async () => {
      const targetCurrency = u?.currency?.currency_acronym;
      const rateCache = new Map();
      const totals = {};

      setCheckoutTotalsLoading(true);
      try {
        const rawServerTotal = u?.totals_unpaid?.grand_totals;
        const serverTotal = Number(rawServerTotal);
        if (rawServerTotal != null && Number.isFinite(serverTotal) && targetCurrency) {
          if (active) setCheckoutTotals({grand: {amount: serverTotal, currency: targetCurrency}});
          return;
        }

        for (const group of checkoutGroups) {
          let amount = 0;
          let currency = targetCurrency;
          const sourceCurrencies = new Set();

          for (const item of group.items) {
            const sourceCurrency = item.currency?.currency_acronym;
            sourceCurrencies.add(sourceCurrency || '');
            let itemAmount = Number(item[group.priceKey] || 0);
            if (!Number.isFinite(itemAmount) || (itemAmount && !sourceCurrency)) {
              throw new Error('Invalid cart amount');
            }

            if (sourceCurrency && targetCurrency && sourceCurrency !== targetCurrency) {
              const rateKey = `${sourceCurrency}:${targetCurrency}`;
              if (!rateCache.has(rateKey)) {
                const response = await axios.get(
                  `${API.boongo_url}/currencies_rate/find_currency_rate/${sourceCurrency}/${targetCurrency}`,
                  {headers: h},
                );
                const rate = Number(response.data?.data?.rate);
                if (!Number.isFinite(rate) || rate <= 0) throw new Error('Invalid currency rate');
                rateCache.set(rateKey, rate);
              }
              itemAmount *= rateCache.get(rateKey);
            }
            amount += itemAmount;
          }

          if (!targetCurrency) {
            const knownCurrencies = [...sourceCurrencies].filter(Boolean);
            currency = knownCurrencies.length === 1 ? knownCurrencies[0] : '';
            if (knownCurrencies.length > 1) throw new Error('Missing target currency');
          }
          totals[group.key] = {amount, currency};
        }
        const currencies = new Set(Object.values(totals).map(total => total.currency));
        if (currencies.size !== 1) throw new Error('Mixed cart currencies');
        totals.grand = {
          amount: Object.values(totals).reduce((sum, total) => sum + total.amount, 0),
          currency: [...currencies][0],
        };
        if (active) setCheckoutTotals(totals);
      } catch {
        if (active) setCheckoutTotals({});
      } finally {
        if (active) setCheckoutTotalsLoading(false);
      }
    };

    convertTotals();
    return () => {
      active = false;
    };
  }, [checkoutGroups, h, tab, u?.currency?.currency_acronym, u?.totals_unpaid?.grand_totals]);
  const render = ({item}) =>
    tab === 'works' ? (
      <WorkItemComponent item={item} />
    ) : tab === 'subscribers' ? (
      <UserItemComponent item={item} />
    ) : (
      <View
        style={[
          s.card,
          {backgroundColor: C.white, borderColor: C.light_secondary},
        ]}>
        <View style={{flex: 1}}>
          <Text style={{color: C.primary, fontWeight: '800'}}>
            {item.k === 'subscription' ? 'ABONNEMENT' : 'CONSULTATION'}
          </Text>
          <Text
            style={{
              color: C.black,
              fontSize: 16,
              fontWeight: '800',
              marginTop: 4,
            }}>
            {item.k === 'subscription' ? item.type?.type_name : item.work_title}
          </Text>
          <Text style={{color: C.dark, marginTop: 4}}>
            {item.k === 'subscription' ? item.price : item.consultation_price}{' '}
            {item.currency?.currency_acronym}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            removeFromCart(
              item.k === 'subscription'
                ? u.unpaid_subscription_cart?.id
                : u.unpaid_consultation_cart?.id,
              item.k === 'consultation' ? item.id : null,
              item.k === 'subscription' ? item.id : null,
            )
          }
          style={[s.remove, {backgroundColor: C.light_danger}]}>
          <Icon name="trash-can-outline" color={C.danger} size={20} />
        </TouchableOpacity>
      </View>
    );
  return (
    <SafeAreaView
      style={[s.screen, {backgroundColor: C.light}]}
      edges={['top']}>
      <HeaderComponent title="Mon espace" hideSearch accountActions />
      <View style={[s.profile, {backgroundColor: C.light_primary}]}>
        {u.avatar_url ? <Image source={{uri: u.avatar_url}} style={s.avatar} /> : <View style={[s.avatar, s.avatarFallback, {backgroundColor: C.primary}]}><Icon name="account" size={30} color="#fff" /></View>}
        <View style={s.profileCopy}><Text style={[s.profileName, {color: C.black}]} numberOfLines={1}>{[u.firstname, u.lastname].filter(Boolean).join(' ') || u.username}</Text><Text style={[s.profileMeta, {color: C.dark}]} numberOfLines={1}>{u.email || u.phone || `@${u.username}`}</Text></View>
      </View>
      <View style={[s.tabs, {borderBottomColor: C.light_secondary}]}>
        {T.map(([k, l, i]) => (
          <TouchableOpacity
            key={k}
            onPress={() => change(k)}
            style={[s.tab, tab === k && {borderBottomColor: C.primary}]}>
            <Icon name={i} size={18} color={tab === k ? C.primary : C.dark} />
            <Text
              style={{
                color: tab === k ? C.primary : C.dark,
                fontSize: 11,
                fontWeight: '800',
                marginTop: 4,
              }}>
              {l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'works' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.chipsRail}
          contentContainerStyle={s.chips}>
          {cats.map(x => (
            <TouchableOpacity
              key={x.id}
              onPress={() => setCat(x.id)}
              style={[
                s.chip,
                {
                  backgroundColor: cat === x.id ? C.primary : C.white,
                  borderColor: cat === x.id ? C.primary : C.light_secondary,
                },
              ]}>
              <Text
                style={{
                  color: cat === x.id ? '#fff' : C.black,
                  fontWeight: '700',
                }}>
                {x.category_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <FlatList
        data={data}
        key={tab}
        renderItem={render}
        keyExtractor={(x, i) => String(x.id || i)}
        contentContainerStyle={data.length ? s.list : s.empty}
        refreshControl={
          <RefreshControl
            refreshing={refresh}
            onRefresh={async () => {
              setRefresh(true);
              await get();
              setRefresh(false);
            }}
            tintColor={C.primary}
          />
        }
        ListHeaderComponent={
          tab === 'cart' && data.length ? (
            <View style={s.checkoutGroups}>
              <View style={[s.summary, {backgroundColor: C.light_primary}]}>
                <View style={s.summaryCopy}>
                  <Text style={[s.summaryLabel, {color: C.dark}]}>Total du panier</Text>
                  <Text style={[s.summaryAmount, {color: C.black}]}>
                    {checkoutTotalsLoading
                      ? 'Conversion…'
                      : checkoutTotals.grand
                        ? formatPaymentAmount(checkoutTotals.grand.amount, checkoutTotals.grand.currency)
                        : 'Montant calculé au paiement'}
                  </Text>
                  <Text style={[s.summaryCount, {color: C.dark}]}>
                    {data.length} {data.length > 1 ? 'éléments' : 'élément'}
                  </Text>
                </View>
                <TouchableOpacity
                  disabled={checkoutTotalsLoading}
                  onPress={() =>
                    n.navigate('MobileSubscribe', {
                      amount: checkoutTotals.grand?.amount,
                      currency: checkoutTotals.grand?.currency,
                    })
                  }
                  style={[
                    s.pay,
                    {
                      backgroundColor: C.primary,
                      opacity: checkoutTotalsLoading ? 0.45 : 1,
                    },
                  ]}>
                  <Text style={s.payText}>Payer</Text>
                  <Icon name="arrow-right" color="#fff" size={18} />
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          load ? (
            <View style={s.loader}>
              <ActivityIndicator color={C.primary} />
            </View>
          ) : (
            <EmptyListComponent
              iconName={
                tab === 'cart'
                  ? 'cart-outline'
                  : 'book-open-page-variant-outline'
              }
              title="La liste est vide"
            />
          )
        }
      />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  screen: {flex: 1},
  tabs: {flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth},
  tab: {
    flex: 1,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  chipsRail: {flexGrow: 0, flexShrink: 0, height: 72},
  chips: {alignItems: 'center', gap: 8, paddingHorizontal: 14},
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  list: {paddingBottom: 32},
  empty: {flexGrow: 1},
  loader: {paddingTop: 70, alignItems: 'center'},
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  remove: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    marginHorizontal: 16,
    padding: 15,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkoutGroups: {gap: 10, marginBottom: 6, marginTop: 16},
  summaryCopy: {flex: 1},
  summaryLabel: {fontSize: 13, fontWeight: '700'},
  summaryAmount: {fontSize: 18, fontWeight: '900', marginTop: 2},
  summaryCount: {fontSize: 12, marginTop: 2},
  pay: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  payText: {color: '#fff', fontWeight: '900'},
  profile: {alignItems: 'center', borderRadius: 22, flexDirection: 'row', margin: 16, marginBottom: 4, padding: 16},
  avatar: {borderRadius: 32, height: 64, width: 64},
  avatarFallback: {alignItems: 'center', justifyContent: 'center'},
  profileCopy: {flex: 1, marginLeft: 12},
  profileName: {fontSize: 20, fontWeight: '800'},
  profileMeta: {fontSize: 13, marginTop: 3},
});
