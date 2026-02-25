/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Linking, ToastAndroid, TouchableOpacity } from 'react-native';
import { Button, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import Spinner from 'react-native-loading-spinner-overlay';
import { PADDING, PHONE } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import ThemeContext from '../../contexts/ThemeContext';
import FooterComponent from '../footer';
import LogoText from '../../assets/img/brand.svg';
import useColors from '../../hooks/useColors';
import homeStyles from '../style';
import axios from 'axios';

const sendWhatsAppMessage = async (message) => {
  const phoneNumber = PHONE.admin;
  const text = encodeURIComponent(message);
  const url = `whatsapp://send?phone=${phoneNumber}&text=${text}`;

  try {
    await Linking.openURL(url);

  } catch (error) {
    // An error occurred while configuring the query
    ToastAndroid.show(`${error.message}`, ToastAndroid.LONG);
  }
};

const PasswordResetScreen = () => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { isLoading, login } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  // =============== Get data ===============
  const [phone, setPhone] = useState('');
  // COUNTRY dropdown
  const [isFocus, setIsFocus] = useState(false);
  const [country, setCountry] = useState('');
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    axios({ method: 'GET', url: 'https://restcountries.com/v3.1/all' })
      .then(function (response) {
        const count = Object.keys(response.data).length;
        let countryArray = [];

        for (let i = 0; i < count; i++) {
          const countryData = response.data[i];

          countryArray.push({
            value: countryData.name.common,
            label: countryData.name.common,
            phoneCode: countryData.idd.root ? `${countryData.idd.root}${(countryData.idd.suffixes[0] ? `${countryData.idd.suffixes[0]}` : '')}` : ''
          });
        }

        setCountries(countryArray);
      })
      .catch(function (error) {
        console.log(error);
      });
  }, []);

  const handleCountryChange = (item) => {
    setCountry(item.value);
    setIsFocus(false);
    setPhone(item.phoneCode); // Updates the phone field with the phone code
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <Spinner visible={isLoading} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: PADDING.p16, paddingHorizontal: PADDING.p10 }}>
        {/* Brand / Title */}
        <View style={homeStyles.authlogo}>
          <LogoText width={200} height={48} />
        </View>
        <Text style={[homeStyles.authTitle, { color: COLORS.black }]}>{t('auth.password.forgotten')}</Text>

        {/* Country  */}
        <Text style={{ color: COLORS.dark_secondary, paddingVertical: PADDING.p00, paddingHorizontal: PADDING.p01 }}>{t('auth.country.label')}</Text>
        <Dropdown
          style={[homeStyles.authInput, { color: COLORS.black, height: 50, borderColor: COLORS.light_secondary }]}
          data={countries}
          search
          labelField='label'
          valueField='value'
          placeholder={!isFocus ? t('auth.country.title') : '...'}
          placeholderStyle={{ color: (theme === 'light' ? COLORS.dark_secondary : COLORS.secondary) }}
          selectedTextStyle={{ color: (theme === 'light' ? COLORS.dark_secondary : COLORS.secondary) }}
          searchPlaceholder={t('search')}
          maxHeight={300}
          value={country}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={handleCountryChange} />

        {/* Phone number */}
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          keyboardType='phone-pad'
          value={phone}
          placeholder={t('auth.phone')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setPhone(text)} />

        {/* Submit / Cancel */}
        <Button style={[homeStyles.authButton, { backgroundColor: COLORS.danger }]} onPress={() => { sendWhatsAppMessage("Bonjour.\n\nJe voudrais modifier mon mot de passe.\n\nMon n° de téléphone : " + phone); }} disabled={phone.trim() === ''}>
          <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('send')}</Text>
        </Button>
        <TouchableOpacity style={[homeStyles.authCancel, { borderColor: COLORS.black }]} onPress={() => navigation.navigate('Login')}>
          <Text style={[homeStyles.authButtonText, { color: COLORS.black }]}>{t('cancel')}</Text>
        </TouchableOpacity>

        {/* Message */}
        <View style={homeStyles.messageContainer}>
          <Text style={homeStyles.messageText}>{t('auth.password.reset_message')}</Text>
        </View>

        {/* Copyright */}
        <Divider style={[homeStyles.authDivider, { backgroundColor: COLORS.light_secondary }]} />
        <FooterComponent color={COLORS.dark_secondary} />
      </ScrollView>
    </View>
  );
};

export default PasswordResetScreen;