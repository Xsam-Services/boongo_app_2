import React, { useCallback, useContext, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { API } from '../../tools/constants';
import useColors from '../../hooks/useColors';
import HeaderComponent from '../header';
import EmptyListComponent from '../../components/empty_list';
import NotificationItemComponent from '../../components/notification_item';
import { notificationDestination } from '../../utils/notificationDestination';

export default function NotificationsScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const { userInfo } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(null);
  const request = useRef(0);
  const busy = useRef(false);
  const openingRef = useRef(false);
  const pagination = useRef({ page: 1, lastPage: 1 });
  const { id, api_token: token } = userInfo || {};

  const load = useCallback(async (mode = 'initial') => {
    if (!id || !token) {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      setError('Votre session doit être actualisée pour charger les notifications.');
      return;
    }
    if (mode === 'more' && busy.current) return;
    const version = ++request.current;
    busy.current = true;
    setError('');
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    if (mode === 'more') setLoadingMore(true);
    const page = mode === 'more' ? pagination.current.page + 1 : 1;
    const headers = { 'X-localization': 'fr', 'X-user-id': id, Authorization: `Bearer ${token}` };
    try {
      const [unread, history] = await Promise.all([
        mode === 'more' ? Promise.resolve(null) : axios.get(`${API.boongo_url}/notification/select_by_status_user/22/${id}`, { headers }),
        axios.get(`${API.boongo_url}/read_notification/select_by_user/${id}?page=${page}`, { headers }),
      ]);
      if (version !== request.current) return;
      if (history.data?.success === false || unread?.data?.success === false) throw new Error('Notifications indisponibles');
      const older = (history.data?.data || []).map(item => ({ ...item, unread: false, key: `read:${item.id}` }));
      const recent = (unread?.data?.data || []).map(item => ({ ...item, unread: true, key: `unread:${item.id}` }));
      setItems(current => Array.from(new Map([...(mode === 'more' ? current : recent), ...older].map(item => [item.key, item])).values()));
      pagination.current = { page, lastPage: Number(history.data?.lastPage || 1) };
    } catch {
      if (version === request.current) setError('Impossible de charger les notifications. Réessayez.');
    } finally {
      if (version === request.current) {
        busy.current = false;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  }, [id, token]);

  useFocusEffect(useCallback(() => {
    load();
    return () => { request.current += 1; busy.current = false; };
  }, [load]));

  const open = async item => {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpening(item.key);
    setError('');
    try {
      if (item.unread) {
        const response = await axios.put(`${API.boongo_url}/notification/switch_status/${item.id}/23`, null, {
          headers: { 'X-localization': 'fr', 'X-user-id': id, Authorization: `Bearer ${token}` },
        });
        if (response.data?.success === false) throw new Error('Statut non enregistré');
        setItems(current => current.map(row => row.key === item.key ? { ...row, unread: false } : row));
      }
      const destination = notificationDestination(item);
      if (destination) navigation.navigate(destination.name, destination.params);
      else Alert.alert('Notification', 'Le contenu associé n’est pas disponible dans cette version de l’application.');
    } catch {
      setError('La lecture de cette notification n’a pas pu être enregistrée. Réessayez en la touchant.');
    } finally {
      openingRef.current = false;
      setOpening(null);
    }
  };
  const unreadCount = items.filter(item => item.unread).length;
  const visible = filter === 'unread' ? items.filter(item => item.unread) : items;
  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: colors.light }]}>
      <HeaderComponent title="Notifications" hideSearch />
      <View style={styles.intro}>
        <Text style={[styles.title, { color: colors.black }]}>Votre activité</Text>
        <Text style={[styles.hint, { color: colors.dark }]}>Retrouvez les nouvelles de vos œuvres et de votre communauté.</Text>
      </View>
      <View style={styles.filters}>
        {[['all', 'Toutes'], ['unread', `Non lues (${unreadCount})`]].map(([key, label]) => (
          <TouchableOpacity key={key} accessibilityRole="button" accessibilityState={{ selected: filter === key }} onPress={() => setFilter(key)} style={[styles.filter, { backgroundColor: filter === key ? colors.light_primary : colors.white, borderColor: filter === key ? colors.primary : colors.light_secondary }]}>
            <Text style={[styles.filterText, { color: filter === key ? colors.primary : colors.dark }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <View accessibilityLiveRegion="polite" style={styles.error}><Text style={{ color: colors.danger }}>{error}</Text><TouchableOpacity accessibilityRole="button" onPress={() => load('refresh')}><Text style={[styles.retry, { color: colors.primary }]}>Réessayer le chargement</Text></TouchableOpacity></View> : null}
      {loading ? <View style={styles.loader}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.hint, { color: colors.dark }]}>Chargement des notifications…</Text></View> : (
        <FlatList data={visible} keyExtractor={item => item.key} renderItem={({ item }) => <NotificationItemComponent item={item} onPress={open} busy={opening === item.key} disabled={opening !== null} />}
          showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} tintColor={colors.primary} />}
          onEndReached={() => { if (filter === 'all' && !error && pagination.current.page < pagination.current.lastPage) load('more'); }} onEndReachedThreshold={0.3}
          ListEmptyComponent={!error ? <EmptyListComponent iconName="bell-check-outline" title={filter === 'unread' ? 'Vous êtes à jour' : 'Aucune notification'} /> : null}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={styles.footerLoader} /> : null} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, intro: { paddingHorizontal: 20, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: '800' }, hint: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  filters: { flexDirection: 'row', gap: 10, padding: 20 }, filter: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 11 }, filterText: { fontSize: 14, fontWeight: '700' },
  list: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24 }, loader: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { paddingHorizontal: 20, paddingBottom: 16 }, retry: { fontWeight: '700', paddingVertical: 12 }, footerLoader: { marginVertical: 16 },
});
