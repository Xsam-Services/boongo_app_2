/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useState } from 'react'
import { View, Text, ScrollView, SafeAreaView, Dimensions, TouchableOpacity, Image, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { WebView } from 'react-native-webview';
import { Button, Divider } from 'react-native-paper';
import * as RNLocalize from 'react-native-localize';
import DropDownPicker from 'react-native-dropdown-picker';
import Spinner from 'react-native-loading-spinner-overlay';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { API, PADDING, TEXT_SIZE, WEB } from '../tools/constants';
import HeaderComponent from './header';
import useColors from '../hooks/useColors';
import homeStyles from './style';

const BankCardSubscribeScreen = ({ route }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get context ===============
  const { userInfo, paymentURL, purchase, isLoading } = useContext(AuthContext);
  // =============== Get parameters ===============
  const { amount, currency } = route.params;
  // =============== Get data ===============
  const [formattedAmount, setFormattedAmount] = useState(amount);

  // =============== Get system language ===============
  const getLanguage = () => {
    const locales = RNLocalize.getLocales();

    if (locales && locales.length > 0) {
      return locales[0].languageCode;
    }

    return 'fr';
  };

  useEffect(() => {
    const userLang = getLanguage();

    // Apply language-specific formatting
    const readableAmount = formattedAmount.toLocaleString(userLang, {
      style: 'decimal',
      useGrouping: true,
      minimumFractionDigits: 0, // No digits after the decimal point
      maximumFractionDigits: 0, // No digits after the decimal point
    });

    setFormattedAmount(readableAmount);
  }, []);

  const ObjectScreen = () => {
    // If payment is performed, show webview
    if (paymentURL !== '' && typeof paymentURL === 'string') {
      return (
        <SafeAreaView style={{ flex: 1 }}>
          <WebView source={{ uri: paymentURL }} />
        </SafeAreaView>
      );

    // Otherwise, show bank card form
    } else {
      // =============== Get data ===============
      const [cardNumber, setCardNumber] = useState(null);
      const [cvc, setCvc] = useState(null);
      const [cardName, setCardName] = useState('');
      const [email, setEmail] = useState('');
      const [showPayPalData, setShowPayPalData] = useState(false);
      const [showCardData, setShowCardData] = useState(false);
      // Get type "Bank card"
      const [bankCardType, setBankCardType] = useState(null);

      // OPERATOR dropdown
      const [channel, setChannel] = useState(null);
      const [channelOpen, setChannelOpen] = useState(false);
      const [channelItems, setChannelItems] = useState([
        { operatorImage: require('../assets/img/operator-flexpay.png'), label: 'FlexPaie', value: 'FlexPaie' },
        { operatorImage: require('../assets/img/operator-multipay.png'), label: 'Multipay', value: 'Multipay' },
        { operatorImage: require('../assets/img/operator-paypal.png'), label: 'PayPal', value: 'PayPal' },
        { operatorImage: require('../assets/img/operator-visa-mastercard.png'), label: t('payment_method.bank_card.use_card'), value: t('payment_method.bank_card.use_card') }
      ]);

      const handlePay = (user_id, transaction_type_id, channel, app_url) => {
        if (channel === 'PayPal') {
          return;

        } else if (channel === t('payment_method.bank_card.use_card')) {
          return;

        } else {
          purchase(user_id, transaction_type_id, null, channel, app_url);
        }

        if (!paymentURL) {
          navigation.navigate('BankCardSubscribe', { amount: amount, currency: currency });
        }
      };

      const handleChannelChange = (item) => {
        setChannel(item.value);

        if (item.value === 'PayPal') {
          setShowPayPalData(true);
          setShowCardData(false);

        } else if (item.value === t('payment_method.bank_card.use_card')) {
          setShowCardData(true);
          setShowPayPalData(false);

        } else {
          setShowCardData(false);
          setShowPayPalData(false);
        }
      };

      useEffect(() => {
        axios({ method: 'GET', url: `${API.boongo_url}/type/search/fr/Carte%20bancaire` })
          .then(function (res) {
            let typeData = res.data.data;

            setBankCardType(typeData);
            console.log(`${JSON.stringify(typeData)}`);
          })
          .catch(function (error) {
            console.log(error);
          });
      }, []);

      return (
        <SafeAreaView style={{ height: 'auto', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: PADDING.p01 }}>
          {/* Image */}
          <Image style={{ width: 100, height: 100, borderRadius: 100 / 2, marginBottom: PADDING.p07 }} source={require('../assets/img/bank_card_payment.png')} />

          {/* Title / Description */}
          <Text style={[homeStyles.cardEmptyTitle, { color: COLORS.black, textAlign: 'center', marginBottom: PADDING.p02, paddingHorizontal: PADDING.p02 }]}>{t('payment_method.bank_card.title')}</Text>

          {/* Amount */}
          <Divider style={{ width: '100%', backgroundColor: COLORS.light_secondary, marginBottom: PADDING.p07 }} />
          <Text style={{ fontSize: TEXT_SIZE.normal, color: COLORS.dark_secondary, textAlign: 'center', marginBottom: PADDING.p00 }}>{t('amount_to_pay')}</Text>
          <Text style={{ fontSize: TEXT_SIZE.header, fontWeight: '700', color: COLORS.link_color, textAlign: 'center' }}>{`${formattedAmount} ${currency}`}</Text>
          <Divider style={[homeStyles.authDivider, { width: '100%', backgroundColor: COLORS.light_secondary }]} />

          {/* Operator */}
          <DropDownPicker
            modalTitle={t('payment_method.bank_card.operator')}
            modalTitleStyle={{
              color: COLORS.dark_secondary,
              borderBottomColor: COLORS.dark_secondary
            }}
            modalProps={{
              presentationStyle: 'fullScreen', // optional
              animationType: 'slide',
            }}
            modalContentContainerStyle={{
              backgroundColor: COLORS.white,
              borderTopWidth: 0,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.light_secondary,
            }}
            closeIconStyle={{
              tintColor: COLORS.black
            }}
            style={[homeStyles.authInput, { color: COLORS.black, marginBottom: PADDING.p02, borderColor: COLORS.light_secondary }]}
            textStyle={{ fontSize: TEXT_SIZE.paragraph, color: COLORS.black }}
            placeholderStyle={{ fontSize: TEXT_SIZE.paragraph, color: COLORS.dark_secondary }}
            arrowIconStyle={{ tintColor: COLORS.dark_secondary }}
            tickIconStyle={{ tintColor: COLORS.black }}
            open={channelOpen}
            value={channel}
            placeholder={t('payment_method.bank_card.operator')}
            placeholderTextColor={COLORS.dark_secondary}
            listMode='MODAL'
            items={channelItems}
            setOpen={setChannelOpen}
            setValue={setChannel}
            setItems={setChannelItems}
            onChangeItem={handleChannelChange}
            renderListItem={({ item }) => {
              return (
                <TouchableOpacity onPress={() => { handleChannelChange(item); setChannelOpen(false); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
                  {item.operatorImage ? (
                    <Image source={item.operatorImage} style={{ width: 50, height: 50, marginRight: 10 }} />
                  ) : null}
                  <Text style={{ color: COLORS.black }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* PayPal data */}
          {showPayPalData && (
            <View style={{ flexDirection: 'column' }}>
              {/* Email */}
              <TextInput
                style={[homeStyles.authInput, { color: COLORS.black, width: Dimensions.get('window').width - 40, height: 50, borderColor: COLORS.light_secondary }]}
                keyboardType='email-address'
                value={email}
                placeholder={t('auth.email')}
                placeholderTextColor={COLORS.dark_secondary}
                onChangeText={text => setEmail(text)} />
            </View>
          )}

          {/* Credit card data */}
          {showCardData && (
            <View style={{ padding: 20, borderWidth: 1, borderColor: COLORS.light_secondary, borderRadius: PADDING.p00 }}>
              <Text style={{ color: COLORS.warning, textAlign: 'center', marginBottom: PADDING.p02, paddingHorizontal: PADDING.p02 }}>{t('payment_method.bank_card.descrciption')}</Text>
              <View style={{ flexDirection: 'column' }}>
                {/* Name on the card */}
                <TextInput
                  style={[homeStyles.authInput, { color: COLORS.black, width: Dimensions.get('window').width - 80, height: 50, marginBottom: 3, borderColor: COLORS.light_secondary }]}
                  value={cardName}
                  placeholder={t('payment_method.bank_card.name_on_card')}
                  placeholderTextColor={COLORS.dark_secondary}
                  onChangeText={text => setCardName(text)} />

                {/* Card number */}
                <Text style={{ color: COLORS.dark_secondary, width: '100%', paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('payment_method.bank_card.card_number.label')}</Text>
                <TextInput
                  style={[homeStyles.authInput, { color: COLORS.black, width: Dimensions.get('window').width - 80, height: 50, marginBottom: 3, borderColor: COLORS.light_secondary }]}
                  keyboardType='number-pad'
                  value={cardNumber}
                  placeholder={t('payment_method.bank_card.card_number.placeholder')}
                  placeholderTextColor={COLORS.dark_secondary}
                  onChangeText={text => setCardNumber(text)} />
              </View>

              <View style={{ flexDirection: 'row' }}>
                {/* Expiration  */}
                <View style={{ width: '68%', flexDirection: 'column', marginRight: '2%' }}>
                  <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('payment_method.bank_card.expiration.label')}</Text>
                  <TextInput
                    style={[homeStyles.authInput, { color: COLORS.black, height: 50, borderColor: COLORS.light_secondary }]}
                    keyboardType='number-pad'
                    value={cardNumber}
                    placeholder={t('payment_method.bank_card.expiration.placeholder')}
                    placeholderTextColor={COLORS.dark_secondary}
                    onChangeText={text => setCardNumber(text)} />
                </View>

                {/* CVC */}
                <View style={{ width: '30%', flexDirection: 'column' }}>
                  <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('payment_method.bank_card.cvc')}</Text>
                  <TextInput
                    style={[homeStyles.authInput, { color: COLORS.black, height: 50, borderColor: COLORS.light_secondary }]}
                    value={cvc}
                    placeholder={t('payment_method.bank_card.cvc')}
                    placeholderTextColor={COLORS.dark_secondary}
                    onChangeText={text => setCvc(text)} />
                </View>
              </View>
            </View>
          )}

          {/* Submit / Cancel */}
          <Button style={[homeStyles.authButton, { backgroundColor: COLORS.success }]}
            onPress={() => { handlePay(userInfo.id, bankCardType.id, channel, WEB.boongo_url); }}>
            <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('send')}</Text>
          </Button>
          <TouchableOpacity style={[homeStyles.authCancel, { borderColor: COLORS.black }]} onPress={() => navigation.navigate('MobileSubscribe', { amount: amount, currency: currency })}>
            <Text style={[homeStyles.authButtonText, { color: COLORS.black }]}>{t('payment_method.bank_card.go_mobile_money')}</Text>
          </TouchableOpacity>
        </SafeAreaView>
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
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: COLORS.white, paddingHorizontal: PADDING.p01, paddingBottom: PADDING.p10 }}>
        <ObjectScreen />
      </ScrollView>
    </>
  );
};

export default BankCardSubscribeScreen;