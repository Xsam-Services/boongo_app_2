/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Button, Divider } from 'react-native-paper';
import Spinner from 'react-native-loading-spinner-overlay';
import DropDownPicker from 'react-native-dropdown-picker';
import { API, PADDING } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import FooterComponent from '../footer';
import LogoText from '../../assets/img/brand.svg';
import useColors from '../../hooks/useColors';
import homeStyles from '../style';
import axios from 'axios';

const RegisterScreen = () => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { isLoading, startRegister, registerError } = useContext(AuthContext);
  // =============== Get data ===============
  const [firstname, setFirstname] = useState(null);
  const [lastname, setLastname] = useState(null);
  const [email, setEmail] = useState(null);
  const [phoneCode, setPhoneCode] = useState(null);
  const [phone, setPhone] = useState(null);
  const [city, setCity] = useState(null);
  const [username, setUsername] = useState(null);
  // Get role "Membre"
  const [role, setRole] = useState(null);

  useEffect(() => {
    axios({ method: 'GET', url: `${API.boongo_url}/role/search/Membre` })
      .then(function (res) {
        let roleData = res.data.data;

        setRole(roleData);
        console.log(`${JSON.stringify(roleData)}`);
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

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <Spinner visible={isLoading} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: PADDING.p16, paddingHorizontal: PADDING.p10 }}>
        {/* Brand / Title */}
        <View style={[homeStyles.authlogo, { marginBottom: PADDING.p10 }]}>
          <LogoText width={200} height={48} />
        </View>
        {/* <Text style={[homeStyles.authTitle, { color: COLORS.black }]}>{t('i_register')}</Text> */}

        {/* First name */}
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={firstname}
          placeholder={t('auth.firstname')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setFirstname(text)} />

        {/* Last name */}
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={lastname}
          placeholder={t('auth.lastname')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setLastname(text)} />

        {/* Username */}
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary, marginBottom: 3 }]}
          value={username}
          placeholder={t('auth.username.placeholder')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setUsername(text)} />
        <Text style={{ fontSize: 12, color: COLORS.dark_secondary, letterSpacing: 0.5, textAlign: 'right', marginBottom: PADDING.p02 }}>{t('auth.username.message')}</Text>

        {/* E-mail */}
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={email}
          placeholder={t('auth.email')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setEmail(text.toLowerCase())}
          autoCapitalize='none' />

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

        {/* City  */}
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={city}
          placeholder={t('auth.city')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setCity(text)} />

        {/* Submit / Cancel */}
        <Button style={[homeStyles.authButton, { backgroundColor: COLORS.success }]}
          onPress={() => {
            startRegister(firstname, lastname, null, null, null, city, null, null, null, email, (phoneCode && phone ? `${phoneCode}${phone}` : null), username, null, null, null, role.id, null);

            if (!registerError) {
              if (email && phone) {
                navigation.navigate('CheckEmailOTP', { emailAddress: email, phoneNumber: (phoneCode && phone ? `${phoneCode}${phone}` : null) });

              } else {
                if (email) {
                  navigation.navigate('CheckEmailOTP', { emailAddress: email, phoneNumber: (phoneCode && phone ? `${phoneCode}${phone}` : null) });
                }

                if (phone) {
                  navigation.navigate('CheckPhoneOTP', { emailAddress: email, phoneNumber: (phoneCode && phone ? `${phoneCode}${phone}` : null) });
                }
              }
            }
          }}>
          <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('start')}</Text>
        </Button>
        <TouchableOpacity style={[homeStyles.authCancel, { borderColor: COLORS.black }]} onPress={() => navigation.navigate('Login')}>
          <Text style={[homeStyles.authButtonText, { color: COLORS.black }]}>{t('cancel')}</Text>
        </TouchableOpacity>

        {/* Terms accept */}
        <Text style={[homeStyles.authTermsText, { color: COLORS.dark_secondary }]}>
          {t('terms_accept1')} <Text style={{ color: COLORS.link_color }} onPress={() => navigation.navigate('About', { screen: 'Terms' })}>{t('navigation.terms')}</Text>
          {t('terms_accept2')} <Text style={{ color: COLORS.link_color }} onPress={() => navigation.navigate('About', { screen: 'Privacy' })}>{t('navigation.privacy')}</Text>
        </Text>

        {/* Copyright */}
        <Divider style={[homeStyles.authDivider, { backgroundColor: COLORS.light_secondary }]} />
        <FooterComponent color={COLORS.dark_secondary} />
      </ScrollView>
    </View>
  );
};

export default RegisterScreen;