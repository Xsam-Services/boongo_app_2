/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Linking, ToastAndroid, TouchableOpacity, Image } from 'react-native';
import { Button, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Spinner from 'react-native-loading-spinner-overlay';
import DropDownPicker from 'react-native-dropdown-picker';
import { API, PADDING } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import ThemeContext from '../../contexts/ThemeContext';
import FooterComponent from '../footer';
import LogoText from '../../assets/img/brand.svg';
import useColors from '../../hooks/useColors';
import homeStyles from '../style';
import axios from 'axios';

const PasswordResetScreen = () => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { isLoading } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  // =============== Get data ===============
  const [phoneCode, setPhoneCode] = useState(null);
  const [phone, setPhone] = useState(null);

  // COUNTRIES DATA dropdown
  const [loading, setLoading] = useState(false);
  const [countriesData, setCountriesData] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    axios({ method: 'GET', url: 'https://restcountries.com/v3.1/all?fields=cca2,idd,flags,name' })
      .then((res) => {
        // On garde une trace des codes téléphoniques uniques
        const phoneCodes = new Set();

        const countryArray = res.data.map((country) => {
          const phoneCodeData = country.idd && country.idd.root ? `${country.idd.root}${country.idd.suffixes ? `${country.idd.suffixes[0]}` : ''}` : '';

          // Vérifier si le code téléphonique existe déjà dans le Set
          if (phoneCodes.has(phoneCodeData)) {
            return null; // Si le code existe déjà, ignorer cet élément
          }

          // Ajouter le code téléphonique dans le Set pour éviter les doublons
          phoneCodes.add(phoneCodeData);

          return {
            value: phoneCodeData, // Le code téléphonique est unique
            label: `${country.cca2} (${phoneCodeData})`, // Affichage "CD (+243)"
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

  const HandleSearchPhone = async () => {
    if (!phoneCode || !phone) {
      ToastAndroid.show(t('error_message.phone'), ToastAndroid.LONG);
      return;
    }

    setLoading(true);
    console.log(`Phone number: ${phoneCode}${phone}`);

    try {
      const res = await axios.get(
        `${API.boongo_url}/password_reset/search_by_phone/${phoneCode}${phone}`
      );

      const message = res.data.message;

      console.log(`API response: ${message}`);

      if (!res.data.success) {
        ToastAndroid.show(message, ToastAndroid.LONG);
        return;
      }

      navigation.navigate('CheckPhoneOTP', {
        isPasswordReset: true,
        phoneNumber: `${phoneCode}${phone}`
      });
      setLoading(false);

    } catch (error) {

      let message;

      if (error.response) {
        message = error.response.data.message || error.response.data;

      } else if (error.request) {
        message = t('error') + ' ' + t('error_message.no_server_response');

      } else {
        message = error.message;
      }

      setLoading(false);
      ToastAndroid.show(message, ToastAndroid.LONG);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <Spinner visible={loading} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: PADDING.p16, paddingHorizontal: PADDING.p10 }}>
        {/* Brand / Title */}
        <View style={homeStyles.authlogo}>
          <LogoText width={200} height={48} />
        </View>
        <Text style={[homeStyles.authTitle, { color: COLORS.black }]}>{t('auth.password.forgotten')}</Text>

        {/* Phone number */}
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
        <Button style={[homeStyles.authButton, { backgroundColor: COLORS.danger }]} onPress={HandleSearchPhone}>
          <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('send')}</Text>
        </Button>
        <TouchableOpacity style={[homeStyles.authCancel, { borderColor: COLORS.black }]} onPress={() => navigation.navigate('Login')}>
          <Text style={[homeStyles.authButtonText, { color: COLORS.black }]}>{t('cancel')}</Text>
        </TouchableOpacity>

        {/* Copyright */}
        <Divider style={[homeStyles.authDivider, { backgroundColor: COLORS.light_secondary }]} />
        <FooterComponent color={COLORS.dark_secondary} />
      </ScrollView>
    </View>
  );
};

export default PasswordResetScreen;