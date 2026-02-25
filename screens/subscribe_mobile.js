/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useState } from 'react'
import { View, Text, ScrollView, SafeAreaView, Dimensions, TouchableOpacity, Image, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
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

const MobileSubscribeScreen = ({ route }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get context ===============
  const { userInfo, purchase, isLoading } = useContext(AuthContext);
  // =============== Get parameters ===============
  const { amount, currency, formSubmitted } = route.params;
  // =============== Get data ===============
  const [phoneCode, setPhoneCode] = useState(null);
  const [phone, setPhone] = useState('');
  const [formattedAmount, setFormattedAmount] = useState(amount);
  // Get type "Mobile money"
  const [mobileMoneyType, setMobileMoneyType] = useState(null);

  // OPERATOR dropdown
  const [channel, setChannel] = useState(null);
  const [channelOpen, setChannelOpen] = useState(false);
  const [channelItems, setChannelItems] = useState([
    { operatorImage: require('../assets/img/operator-m-pesa.png'), label: 'M-PESA', value: 'M-Pesa' },
    { operatorImage: require('../assets/img/operator-airtel-money.png'), label: 'Airtel money', value: 'Airtel money' },
    { operatorImage: require('../assets/img/operator-orange-money.png'), label: 'Orange money', value: 'Orange money' },
    { operatorImage: require('../assets/img/operator-afrimoney.png'), label: 'Afrimoney', value: 'Afrimoney' }
  ]);

  const handleChannelChange = (item) => {
    setChannel(item.value);
  };

  useEffect(() => {
    axios({ method: 'GET', url: `${API.boongo_url}/type/search/fr/Mobile%20money` })
      .then(function (res) {
        let typeData = res.data.data;

        setMobileMoneyType(typeData);
        console.log(`${JSON.stringify(typeData)}`);
      })
      .catch(function (error) {
        console.log(error);
      });
  }, []);

  // COUNTRIES DATA dropdown
  const [countriesData, setCountriesData] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    axios({ method: 'GET', url: 'https://restcountries.com/v3.1/all?fields=cca2,idd,flags,name' })
      .then((res) => {
        // On garde une trace des codes téléphoniques uniques
        const phoneCodes = new Set();

        const countryArray = res.data.map((country) => {
          let phoneCodeData = country.idd && country.idd.root ? `${country.idd.root}${country.idd.suffixes ? `${country.idd.suffixes[0]}` : ''}` : '';
          const fmtPhoneCodeData = phoneCodeData.replace('+', '');

          // Vérifier si le code téléphonique existe déjà dans le Set
          if (phoneCodes.has(fmtPhoneCodeData)) {
            return null; // Si le code existe déjà, ignorer cet élément
          }

          // Ajouter le code téléphonique dans le Set pour éviter les doublons
          phoneCodes.add(fmtPhoneCodeData);

          return {
            value: fmtPhoneCodeData, // Le code téléphonique est unique
            label: `${country.cca2} (${fmtPhoneCodeData})`, // Affichage "CD (+243)"
            flag: country.flags.png
          };
        }).filter(item => item !== null); // Filtrer les éléments nulls

        // Trie des pays par nom (A-Z)
        countryArray.sort((a, b) => a.label.localeCompare(b.label));

        setCountriesData(countryArray);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const handleCountryChange = (item) => {
    setPhoneCode(item.value);
  };

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

  return (
    <>
      {/* Header */}
      <View style={{ backgroundColor: COLORS.white, paddingVertical: PADDING.p01 }}>
        <HeaderComponent />
      </View>

      {/* Spinner (for AuthContext requests) */}
      <Spinner visible={isLoading} />

      {/* Content */}
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: COLORS.white, paddingHorizontal: PADDING.p01 }}>
        <SafeAreaView style={{ height: Dimensions.get('screen').height - 200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: PADDING.p01 }}>
          {formSubmitted ? (
            <>
              <Image style={{ width: 150, height: 200, marginBottom: PADDING.p07 }} source={require('../assets/img/human-hand-holding-smartphone.png')} />
              <Text style={[homeStyles.cardEmptyTitle, { color: COLORS.black, textAlign: 'center', marginBottom: PADDING.p02, paddingHorizontal: PADDING.p02 }]}>{t('payment_method.mobile_money.submitted')}</Text>
              <Button style={[homeStyles.authButton, { width: 100, backgroundColor: COLORS.primary }]} onPress={() => { navigation.navigate('HomeStack'); }}>
                <Text style={[homeStyles.authButtonText, { color: 'white' }]}>OK</Text>
              </Button>
            </>
          ) : (
            <>
              {/* Image */}
              <Image style={{ width: 100, height: 100, borderRadius: 100 / 2, marginBottom: PADDING.p07 }} source={require('../assets/img/mobile_money_payment.png')} />

              {/* Title / Description */}
              <Text style={[homeStyles.cardEmptyTitle, { color: COLORS.black, textAlign: 'center', marginBottom: PADDING.p02, paddingHorizontal: PADDING.p02 }]}>{t('payment_method.mobile_money.title')}</Text>
              <Text style={{ color: COLORS.black, textAlign: 'center', paddingHorizontal: PADDING.p02 }}>{t('payment_method.mobile_money.descrciption')}</Text>

              {/* Amount */}
              <Divider style={[homeStyles.authDivider, { width: '100%', backgroundColor: COLORS.light_secondary }]} />
              <Text style={{ fontSize: TEXT_SIZE.normal, color: COLORS.dark_secondary, textAlign: 'center', marginBottom: PADDING.p00 }}>{t('amount_to_pay')}</Text>
              <Text style={{ fontSize: TEXT_SIZE.header, fontWeight: '700', color: COLORS.link_color, textAlign: 'center' }}>{`${formattedAmount} ${currency}`}</Text>
              <Divider style={[homeStyles.authDivider, { width: '100%', backgroundColor: COLORS.light_secondary }]} />

              {/* Operator */}
              <DropDownPicker
                modalTitle={t('payment_method.mobile_money.operator')}
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
                style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
                textStyle={{ fontSize: TEXT_SIZE.paragraph, color: COLORS.black }}
                placeholderStyle={{ fontSize: TEXT_SIZE.paragraph, color: COLORS.dark_secondary }}
                arrowIconStyle={{ tintColor: COLORS.dark_secondary }}
                tickIconStyle={{ tintColor: COLORS.black }}
                open={channelOpen}
                value={channel}
                placeholder={t('payment_method.mobile_money.operator')}
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

              <View style={{ flexDirection: 'row' }}>
                {/* Phone code  */}
                <DropDownPicker
                  modalTitle={t('auth.phone_code.title')}
                  disabled={countriesData.length === 0}
                  loading={countriesData.length === 0}
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
                  textStyle={{ color: COLORS.black }}
                  placeholderStyle={{ color: COLORS.black }}
                  placeholder={t('auth.phone_code.label')}
                  arrowIconStyle={{ tintColor: COLORS.black }}
                  containerStyle={{ width: '50%', height: 50 }}
                  style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary, borderTopEndRadius: 0, borderBottomEndRadius: 0, borderRightWidth: 0 }]}
                  listMode='MODAL'
                  open={open}
                  value={phoneCode}
                  items={countriesData}
                  setOpen={setOpen}
                  setValue={setPhoneCode}
                  onChangeItem={handleCountryChange}
                  renderListItem={({ item }) => {
                    return (
                      <TouchableOpacity onPress={() => { handleCountryChange(item); setOpen(false); }} style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
                        {item.flag ? (
                          <Image source={{ uri: item.flag }} style={{ width: 20, height: 15, marginRight: 10 }} />
                        ) : null}
                        <Text style={{ color: COLORS.black }}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />

                {/* Phone number */}
                <TextInput
                  style={[homeStyles.authInput, { color: COLORS.black, width: '50%', height: 50, borderColor: COLORS.light_secondary, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                  keyboardType='phone-pad'
                  value={phone}
                  placeholder={t('auth.phone')}
                  placeholderTextColor={COLORS.dark_secondary}
                  onChangeText={text => setPhone(text)} />
              </View>

              {/* Submit / Cancel */}
              <Button style={[homeStyles.authButton, { backgroundColor: COLORS.success }]}
                onPress={() => {
                  purchase(userInfo.id, mobileMoneyType.id, `${phoneCode}${phone}`, channel, WEB.boongo_url);
                  navigation.navigate('MobileSubscribe', { amount: amount, currency: currency, formSubmitted: true });
                }}>
                <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('send')}</Text>
              </Button>
              <TouchableOpacity style={[homeStyles.authCancel, { borderColor: COLORS.black }]}
                onPress={() => { navigation.navigate('BankCardSubscribe', { amount: amount, currency: currency }); }}>
                <Text style={[homeStyles.authButtonText, { color: COLORS.black }]}>{t('payment_method.mobile_money.go_bank_card')}</Text>
              </TouchableOpacity>
            </>
          )}
        </SafeAreaView>
      </ScrollView>
    </>
  );
};

export default MobileSubscribeScreen;