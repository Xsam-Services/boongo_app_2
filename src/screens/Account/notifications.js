/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, FlatList, RefreshControl, Dimensions, TouchableOpacity, ToastAndroid, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { API, IMAGE_SIZE, PADDING, WEB } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import { getTranslationKeyFromAlias, groupNotificationsGlobally } from '../../utils/notificationMapper';
import NotificationItemComponent from '../../components/notification_item';
import EmptyListComponent from '../../components/empty_list';
import HeaderComponent from '../header';
import homeStyles from '../style';
import useColors from '../../hooks/useColors';

const NotificationsScreen = () => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get data ===============
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [rawUnreadNotifications, setRawUnreadNotifications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [readNotifications, setReadNotifications] = useState([]);
  const [combinedNotifications, setCombinedNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef(null);

  const mHeaders = {
    'X-localization': 'fr',
    'X-user-id': userInfo.id,
    'Authorization': `Bearer ${userInfo.api_token}`
  };

  // =============== Handle "scroll top" button ===============
  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    const isAtTop = contentOffset.y === 0;

    setShowBackToTop(!isAtTop);
  };

  const scrollToTop = () => {
    flatListRef.current.scrollToOffset({ offset: 0, animated: true });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchRecentNotifications();
    await fetchOldNotifications(1);
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (!isLoading && page < lastPage) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOldNotifications(nextPage);
    }
  };

  // =============== Handle on notification press ===============
  const handleNotificationPress = async (item) => {
    const isUnread = !item.text_content;

    let redirectScreen = '';
    let redirectURL = '';
    let redirectParams = {};
    let translationKey = '';

    if (isUnread) {
      // ========== Déterminer l'entité pour la traduction ==========
      let entity = null;

      if (['subscription_notif', 'work_consultation_notif', 'liked_work_notif', 'liked_message_notif'].includes(item.type.alias)) {
        entity = item.group_entity || 'one';

      } else if (item.circle_id) {
        entity = 'circle';

      } else if (item.event_id) {
        entity = 'event';
      }

      // ========== Traduction dynamique ==========
      translationKey = getTranslationKeyFromAlias(item.type.alias, entity);

      // ========== Déterminer la redirection ==========
      if (item.work_id || item.like_id) {
        redirectScreen = 'WorkData';
        redirectParams = { itemId: item.work_id || item.id };
        redirectURL = `${WEB.boongo_url}/works/${item.work_id}`;

      } else if (item.event_id) {
        redirectScreen = 'Event';
        redirectParams = { event_id: item.event_id };
        redirectURL = `${WEB.boongo_url}/events/${item.event_id}`;

      } else if (item.circle_id) {
        redirectScreen = 'ChatEntity';
        redirectURL = `${WEB.boongo_url}/messages/${item.circle_id}`;

      } else {
        redirectScreen = 'About';
        redirectURL = `${WEB.boongo_url}/about/terms_of_use`;
      }

      if (!redirectScreen) {
        redirectScreen = 'Account';
        redirectURL = `${WEB.boongo_url}/account`;
      }

      // ========== Trouver l'entité clé (work_id, like_id, event_id, circle_id) ==========
      let entityKey = null;
      let entityValue = null;

      if (item.work_id) {
        entityKey = 'work_id';
        entityValue = item.work_id;

      } else if (item.like_id) {
        entityKey = 'like_id';
        entityValue = item.like_id;

      } else if (item.event_id) {
        entityKey = 'event_id';
        entityValue = item.event_id;

      } else if (item.circle_id) {
        entityKey = 'circle_id';
        entityValue = item.circle_id;
      }

      // ========== Filtrer les notifications similaires non lues ==========
      const matchingNotifs = rawUnreadNotifications.filter((notif) => {
        const sameAlias = notif.type.alias === item.type.alias;
        const sameWork = item.work_id && notif.work_id === item.work_id;
        const sameLike = item.like_id && notif.like_id === item.like_id;
        const sameEvent = item.event_id && notif.event_id === item.event_id;
        const sameCircle = item.circle_id && notif.circle_id === item.circle_id;

        return sameAlias && (sameWork || sameLike || sameEvent || sameCircle);
      });

      const ids = matchingNotifs.map((n) => n.id).join(',');

      console.log('🔔 IDs à marquer comme lus :', ids);

      // 🔁 Marquer comme lue côté API (commenté pour l’instant)
      try {
        /*
        await axios.put(`${API.boongo_url}/notification/switch_status/${ids}/23`, {
          text_content: translationKey,
          screen: redirectScreen,
          redirect_url: redirectURL,
        }, {
          headers: mHeaders
        });
  
        // Mettre à jour le state local
        const updated = notifications.filter(n => !matchingNotifs.includes(n));
        setNotifications(updated);
  
        // Recharger les notifications lues
        fetchOldNotifications(1);
        */
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la notification:', error);
      }
    }

    // ========== Redirection ==========
    try {
      if (isUnread) {
        navigation.navigate(redirectScreen, redirectParams);

      } else {
        if (item.screen === 'WorkData') {
          navigation.navigate('WorkData', { itemId: item.entity_id });

        } else if (item.screen === 'Event') {
          navigation.navigate('Event', { event_id: item.entity_id });

        } else if (item.screen === 'ChatEntity') {
          navigation.navigate('ChatEntity');

        } else {
          navigation.navigate(item.screen || 'Account');
        }
      }
    } catch (error) {
      ToastAndroid.show(`Erreur navigation vers « ${redirectScreen} » ${error}`);
      console.warn('Erreur navigation vers', redirectScreen, error);
      navigation.navigate('Account'); // Fallback
    }
  };

  // =============== Load real-time notifications ===============
  const fetchRecentNotifications = async () => {
    setIsLoading(true);

    try {
      const response = await axios.get(`${API.boongo_url}/notification/select_by_status_user/22/${userInfo.id}`, { headers: mHeaders });
      const notificationData = response.data.data;

      // ⏺️ We keep the originals ungrouped
      setRawUnreadNotifications(notificationData);

      // ⏺️ And we normally group for display
      const grouped = groupNotificationsGlobally(notificationData);

      setNotifications(grouped);
    } catch (error) {
      console.error('Erreur lors du fetch des notifications récentes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // =============== Load old paginated notifications (optional if you want infinite scroll) ===============
  const fetchOldNotifications = async (pageToFetch = 1) => {
    try {
      const response = await axios.get(`${API.boongo_url}/read_notification/select_by_user/${userInfo.id}?page=${pageToFetch}`, { headers: mHeaders });

      if (pageToFetch === 1) {
        setReadNotifications(response.data.data);

      } else {
        setReadNotifications(prev => [...prev, ...response.data.data]);
      }

      setLastPage(response.data.lastPage);
      setCount(response.data.count);
    } catch (error) {
      console.error('Erreur lors du fetch des notifications lues:', error);
    }
  };

  useEffect(() => {
    fetchRecentNotifications();
    fetchOldNotifications(1);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecentNotifications();
      fetchOldNotifications(page);
    }, 10000); // toutes les 10 sec

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const merged = [...notifications, ...readNotifications];

    setCombinedNotifications(merged);
  }, [notifications, readNotifications]);

  return (
    <>
      {/* Header */}
      <View style={{ paddingVertical: PADDING.p01, backgroundColor: COLORS.white }}>
        <HeaderComponent title={t('navigation.notification')} />
      </View>

      {/* Content */}
      <View style={{ flex: 1, backgroundColor: COLORS.light_secondary }}>
        {showBackToTop && (
          <TouchableOpacity style={[homeStyles.floatingButton, { backgroundColor: COLORS.warning }]} onPress={scrollToTop}>
            <Icon name='chevron-double-up' size={IMAGE_SIZE.s09} style={{ color: 'black' }} />
          </TouchableOpacity>
        )}

        <SafeAreaView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={[homeStyles.cardEmpty, { height: Dimensions.get('window').height - 40, marginLeft: 0, paddingHorizontal: 2 }]}>
            <FlatList
              ref={flatListRef}
              data={combinedNotifications}
              keyExtractor={(item, index) => `${item.id || 'no-id'}-${index}`}
              renderItem={({ item }) => (<NotificationItemComponent item={item} onPress={handleNotificationPress} />)}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.1}
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingTop: 0 }}
              windowSize={10}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} progressViewOffset={0} />}
              ListEmptyComponent={<EmptyListComponent iconName='bell-outline' title={t('empty_list.title')} description='' />}
              ListFooterComponent={() =>
                isLoading ? (
                  <Text style={{ color: COLORS.black, textAlign: 'center', padding: PADDING.p01 }}>{t('loading')}</Text>
                ) : null
              }
            />
          </View>
        </SafeAreaView>
      </View>
    </>
  )
}

export default NotificationsScreen