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
    [refresh, setRefresh] = useState(false);
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
      console.error('Compte:', e);
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
            <View style={[s.summary, {backgroundColor: C.light_primary}]}>
              <View>
                <Text style={{color: C.dark}}>Total à régler</Text>
                <Text style={{color: C.black, fontSize: 18, fontWeight: '900'}}>
                  {u.totals_unpaid?.grand_totals || 0}{' '}
                  {u.currency?.currency_acronym}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  n.navigate('MobileSubscribe', {
                    amount: u.totals_unpaid?.grand_totals,
                    currency: u.currency?.currency_acronym,
                  })
                }
                style={[s.pay, {backgroundColor: C.primary}]}>
                <Text style={{color: '#fff', fontWeight: '900'}}>Payer</Text>
              </TouchableOpacity>
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
    margin: 16,
    padding: 15,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pay: {paddingHorizontal: 20, paddingVertical: 13, borderRadius: 14},
  profile: {alignItems: 'center', borderRadius: 22, flexDirection: 'row', margin: 16, marginBottom: 4, padding: 16},
  avatar: {borderRadius: 32, height: 64, width: 64},
  avatarFallback: {alignItems: 'center', justifyContent: 'center'},
  profileCopy: {flex: 1, marginLeft: 12},
  profileName: {fontSize: 20, fontWeight: '800'},
  profileMeta: {fontSize: 13, marginTop: 3},
});
