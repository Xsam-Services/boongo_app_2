/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView, ScrollView, RefreshControl, TextInput, ToastAndroid } from 'react-native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import { useTranslation } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Spinner from 'react-native-loading-spinner-overlay';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { API, PADDING, TEXT_SIZE } from '../tools/constants';
import homeStyles from '../screens/style';
import useColors from '../hooks/useColors';
import HeaderComponent from './header';
import EmptyListComponent from '../components/empty_list';

const SubscriptionScreen = ({ route }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get context ===============
  const { userInfo, activateSubscriptionByCode, addToCart, removeFromCart, isLoading } = useContext(AuthContext);
  // =============== Get parameters ===============
  const { object, itemId } = route.params;
  // =============== Get data ===============
  const [subscriptions, setSubscriptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({});

  // ================= Handlers =================
  const onRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  useEffect(() => {
    getSubscription();
  }, []);

  useEffect(() => {
    if (Object.keys(subscriptions).length > 0) {
      Object.keys(subscriptions).forEach((categoryName) => {
        subscriptions[categoryName].forEach((item) => {
          const subscriptionId = `${categoryName}-${item.id}`;
          if (!prices[subscriptionId]) {
            getPrice(item.price, item.currency.currency_acronym, subscriptionId);
          }
        });
      });
    }
  }, [subscriptions]);

  // Get system language
  const getLanguage = () => {
    const locales = RNLocalize.getLocales();

    if (locales && locales.length > 0) {
      return locales[0].languageCode;
    }

    return 'fr';
  };

  // Get all subscription
  const getSubscription = () => {
    axios
      .get(`${API.boongo_url}/subscription`, { headers: { 'X-localization': 'fr' } })
      .then((res) => {
        if (res.data.success && res.data.data) {
          setSubscriptions(res.data.data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      });
  };

  // Get price according to user currency
  const getPrice = (price, currency_acronym, id) => {
    const userLang = getLanguage();

    // Apply language-specific formatting
    const formattedPrice = price.toLocaleString(userLang, {
      style: 'decimal',
      useGrouping: true,
      minimumFractionDigits: 0, // No digits after the decimal point
      maximumFractionDigits: 0, // No digits after the decimal point
    });

    if (currency_acronym === userInfo.currency.currency_acronym) {
      setPrices((prevPrices) => ({ ...prevPrices, [id]: `${formattedPrice} ${userInfo.currency.currency_acronym}` }));

    } else {
      const url = `${API.boongo_url}/currencies_rate/find_currency_rate/${currency_acronym}/${userInfo.currency.currency_acronym}`;
      const mHeaders = {
        'X-localization': 'fr',
        Authorization: `Bearer ${userInfo.api_token}`,
      };

      axios.get(url, { headers: mHeaders }).then((response) => {
        if (response.data.success && response.data.data) {
          const responseData = response.data.data;
          const userPrice = price * responseData.rate;
          const formattedUserPrice = userPrice.toLocaleString(userLang, {
            style: 'decimal',
            useGrouping: true,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          });

          setPrices((prevPrices) => ({ ...prevPrices, [id]: `${formattedUserPrice} ${userInfo.currency.currency_acronym}` }));
        }
      })
        .catch((error) => {
          console.error('Erreur lors de la récupération du taux de change', error);
        });
    }
  };

  const renderCategory = ({ item, index }) => (
    <View style={{ marginVertical: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.link_color }}>
        {item}
      </Text>
      <FlatList
        data={subscriptions[item]}
        keyExtractor={(subItem) => subItem.id.toString()}
        renderItem={({ item: subItem }) => (
          <SubscriptionItem
            item={subItem}
            categoryName={item}
            prices={prices}
            getPrice={getPrice}
            userInfo={userInfo}
          />
        )}
        ListEmptyComponent={<Text>{t('empty_list.title')}</Text>}
      />
    </View>
  );

  const categories = Object.keys(subscriptions);

  const SubscriptionItem = ({ item, categoryName, prices, getPrice, userInfo }) => {
    const subscriptionId = `${categoryName}-${item.id}`;
    const price = prices[subscriptionId];
    // Check if user has added subscription in the cart
    const isInCart = userInfo.unpaid_subscriptions && userInfo.unpaid_subscriptions.some(subscription => subscription.id === item.id);

    useEffect(() => {
      if (!prices[subscriptionId]) {
        getPrice(item.price, item.currency.currency_acronym, subscriptionId);
      }
    }, [prices, item, categoryName, subscriptionId, getPrice]);

    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.light_secondary }}>
        <View style={{ flexDirection: 'column' }}>
          <Text style={{ flex: 2, color: COLORS.dark_secondary }}>{item.type.type_name}</Text>
          <Text style={{ flex: 1, fontWeight: '500', color: COLORS.black }}>{price ? price : <ActivityIndicator size="small" />}</Text>
        </View>
        {isInCart ?
          <TouchableOpacity style={[homeStyles.workCmd, { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.light_secondary }]}
            onPress={() => { removeFromCart(userInfo.unpaid_subscription_cart.id, null, item.id); }}
          >
            <Icon name="window-close" size={20} color={COLORS.danger} />
            <Text style={{ color: COLORS.danger, fontWeight: '600', marginLeft: PADDING.p00 }}>{t('withdraw_from_cart')}</Text>
          </TouchableOpacity>
          :
          <TouchableOpacity style={[homeStyles.workCmd, { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.light_secondary }]}
            onPress={() => { addToCart('subscription', userInfo.id, null, item.id); }}
          >
            <Icon name="plus" size={20} color={COLORS.success} />
            <Text style={{ color: COLORS.success, fontWeight: '600', marginLeft: PADDING.p00 }}>{t('add_to_cart')}</Text>
          </TouchableOpacity>
        }
      </View>
    );
  };

  const ObjectScreen = () => {
    // If "object" parameter is "subscription", show subscriptions list
    if (object == 'subscription') {
      return (
        <FlatList
          style={{ marginBottom: PADDING.p04 }}
          data={categories}
          scrollEnabled={false}
          nestedScrollEnabled
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderCategory}
          ListHeaderComponent={() => {
            return (
              <>
                <Text style={[homeStyles.cardEmptyTitle, { color: COLORS.black, textAlign: 'center', paddingHorizontal: PADDING.p02 }]}>{t('subscription.title')}</Text>
                <TouchableOpacity style={[homeStyles.authButton, { width: 250, backgroundColor: COLORS.primary, alignSelf: 'center', marginBottom: 10 }]} onPress={() => navigation.navigate('Subscription', { object: 'activation', itemId: itemId })}>
                  <Text style={{ fontSize: TEXT_SIZE.paragraph, fontWeight: '300', color: 'white', textAlign: 'center' }}>{t('activation.link')}</Text>
                </TouchableOpacity>
              </>
            );
          }}
          ListEmptyComponent={<EmptyListComponent iconName="credit-card-outline" title={t('empty_list.title')} description={t('empty_list.description_subscription')} />}
        />
      );

      // Otherwise, show activation code form
    } else {
      const [code, setCode] = useState('');

      // PARTNER dropdown
      const [partnerIsFocus, setPartnerIsFocus] = useState(false);
      const [partner, setPartner] = useState(null);
      const [partners, setPartners] = useState([]);

      useEffect(() => {
        const config = {
          method: 'GET',
          url: `${API.boongo_url}/partner/partners_with_activation_code/fr/Actif`,
          headers: {
            'X-localization': 'fr',
            'X-user-id': userInfo.id,
            Authorization: `Bearer ${userInfo.api_token}`,
          }
        };

        axios(config)
          .then(function (response) {
            const count = Object.keys(response.data.data).length;
            let partnerArray = [];

            for (let i = 0; i < count; i++) {
              partnerArray.push({
                value: response.data.data[i].id,
                label: response.data.data[i].name
              })
            }

            setPartners(partnerArray);
          })
          .catch(function (error) {
            console.log(error);
          });
      }, []);

      // Subscribe by activation code
      const handleActivateSubscription = async () => {
        if (!code.trim()) {
          ToastAndroid.show(t('activation.code.error'), ToastAndroid.LONG);

          return;
        }

        console.log('Partenaire sélectionné :', partner);

        // Call the activation function, with `await` to wait for the response
        const success = await activateSubscriptionByCode(userInfo.id, code, partner ? partner : 0);

        console.log(`User has activation code :`, success);

        if (success) {
          navigation.navigate('WorkData', { itemId: itemId }); // Redirect to "WorkData"

        } else {
          console.log(`Erreur lors de l’activation ou code inactif`);
        }
      };

      return (
        <>
          <Text style={[homeStyles.cardEmptyTitle, { color: COLORS.black, textAlign: 'center', paddingHorizontal: PADDING.p02 }]}>{t('activation.title')}</Text>
          <Text style={{ color: COLORS.black, textAlign: 'center', marginBottom: PADDING.p04, paddingHorizontal: PADDING.p02 }}>{t('activation.description')}</Text>

          {/* Partner  */}
          {/* <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('activation.partner.label')}</Text> */}
          <Dropdown
            style={[homeStyles.authInput, { height: 50 }]}
            borderColor={COLORS.dark_secondary}
            textStyle={{ color: COLORS.black }}
            selectedTextStyle={{ color: COLORS.black }}
            placeholderStyle={{ color: COLORS.dark_secondary }}
            arrowIconStyle={{ tintColor: COLORS.black }}
            data={partners}
            search
            labelField='label'
            valueField='value'
            placeholder={!partnerIsFocus ? t('activation.partner.description') : '...'}
            searchPlaceholder={t('search')}
            maxHeight={300}
            value={partner}
            onFocus={() => setPartnerIsFocus(true)}
            onBlur={() => setPartnerIsFocus(false)}
            onChange={item => {
              setPartner(item.value);
              setPartnerIsFocus(false);
            }} />

          {/* Activation code */}
          {/* <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('activation.code.label')}</Text> */}
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={code}
            placeholder={t('activation.code.placeholder')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setCode(text)} />

          {/* Submit */}
          <Button style={[homeStyles.authButton, { backgroundColor: COLORS.primary, marginTop: 16 }]} onPress={handleActivateSubscription}>
            <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('send')}</Text>
          </Button>

          {/* Return to subscriptions */}
          <TouchableOpacity style={[homeStyles.authButton, { width: 250, backgroundColor: COLORS.success, alignSelf: 'center', marginBottom: 10 }]} onPress={() => navigation.navigate('Subscription', { object: 'subscription', itemId: itemId })}>
            <Text style={{ fontSize: TEXT_SIZE.paragraph, fontWeight: '300', color: 'white', textAlign: 'center' }}>{t('subscription.back')}</Text>
          </TouchableOpacity>
        </>
      );
    }
  };

  return (
    <>
      {/* Header */}
      <View style={{ backgroundColor: COLORS.white, paddingVertical: PADDING.p01 }}>
        <HeaderComponent />
      </View>

      {/* Spinner (for AuthContext requests) */}
      <Spinner visible={isLoading} />

      {/* Content */}
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: COLORS.white, paddingHorizontal: PADDING.p01 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}>
        <SafeAreaView style={{ padding: PADDING.p01 }}>
          <ObjectScreen />
        </SafeAreaView>
      </ScrollView>
    </>
  );
};

export default SubscriptionScreen;
