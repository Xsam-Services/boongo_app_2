import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Spinner from 'react-native-loading-spinner-overlay';
import DropDownPicker from 'react-native-dropdown-picker';
import { API, PADDING } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import useColors from '../../hooks/useColors';
import axios from 'axios';
import Octicons from '@expo/vector-icons/Octicons';

import { SafeAreaView } from 'react-native-safe-area-context';

const RegisterScreen = ({ route }) => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isLoading, startRegister, registerError } = useContext(AuthContext);

  const [firstname, setFirstname] = useState(null);
  const [lastname, setLastname] = useState(null);
  const [email, setEmail] = useState(null);
  const [phoneCode, setPhoneCode] = useState(null);
  const [phone, setPhone] = useState(null);
  const [city, setCity] = useState(null);
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);

  // Gestion des erreurs de validation (sur le modèle du LoginScreen)
  const [errors, setErrors] = useState({
    firstname: '',
    lastname: '',
    username: '',
    phone: '',
    city: '',
    general: '',
  });

  const { message } = route?.params || {};

  useEffect(() => {
    axios({ method: 'GET', url: `${API.boongo_url}/role/search/Membre` })
      .then(function (res) {
        let roleData = res.data.data;
        setRole(roleData);
      })
      .catch(function (error) {
        console.log(error);
      });
  }, []);

  // COUNTRIES DATA dropdown
  const [countriesData, setCountriesData] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    axios.get('https://cdn.jsdelivr.net/npm/world-countries/countries.json')
      .then((res) => {
        const phoneCodes = new Set();

        const countryArray = res.data.map((country) => {
          const root = country.idd?.root || '';
          const suffix = country.idd?.suffixes ? country.idd.suffixes[0] : '';
          const phoneCodeData = root ? `${root}${suffix}` : '';

          if (!phoneCodeData || phoneCodes.has(phoneCodeData)) {
            return null;
          }

          phoneCodes.add(phoneCodeData);

          const countryNameFr = country.name?.native?.fra?.common
            || country.translations?.fra?.common
            || country.name?.common;

          return {
            value: phoneCodeData,
            label: `${countryNameFr} (${phoneCodeData})`,
            flag: `https://flagcdn.com/w80/${country.cca2.toLowerCase()}.png`
          };
        }).filter(item => item !== null);

        countryArray.sort((a, b) => a.label.localeCompare(b.label, 'fr'));
        setCountriesData(countryArray);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const handleCountryChange = (item) => {
    setPhoneCode(item.value);
  };

  const handleSubmit = () => {
    // Réinitialisation des erreurs
    setErrors({ firstname: '', lastname: '', username: '', phone: '', city: '', general: '' });

    if (!firstname) {
      setErrors(prev => ({ ...prev, firstname: t('auth.firstname') + " est obligatoire" }));
      return;
    }
    if (!lastname) {
      setErrors(prev => ({ ...prev, lastname: t('auth.lastname') + " est obligatoire" }));
      return;
    }
    if (!username) {
      setErrors(prev => ({ ...prev, username: t('auth.username.placeholder') + " est obligatoire" }));
      return;
    }
    if (!phoneCode || !phone) {
      setErrors(prev => ({ ...prev, phone: t('auth.phone') + " est obligatoire" }));
      return;
    }
    if (!city) {
      setErrors(prev => ({ ...prev, city: t('auth.city') + " est obligatoire" }));
      return;
    }

    // Appel à l'inscription si tout est valide
    if (role) {
      startRegister(
        firstname,
        lastname,
        null,
        null,
        null,
        city,
        null,
        null,
        null,
        email,
        `${phoneCode}${phone}`,
        username,
        null,
        null,
        null,
        role.id,
        null
      );
    }

    if (!registerError) {
      navigation.navigate('CheckPhoneOTP', {
        isPasswordReset: false,
        phoneNumber: `${phoneCode}${phone}`
      });
    }
  };

  const activeError = message || errors.firstname || errors.lastname || errors.username || errors.phone || errors.city || errors.general;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.light }]} edges={['top']}>
      <Spinner visible={isLoading} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: PADDING.p16 }}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: COLORS.dark_light }]}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Octicons name="chevron-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: COLORS.black }]}>{t('i_register')}</Text>
          <Text style={[styles.subtitle, { color: COLORS.dark }]}>{t('auth.login.subtitle')}</Text>
        </View>

        <TextInput
          style={[styles.authInput, { color: COLORS.black, borderColor: COLORS.dark_light }]}
          value={firstname}
          placeholder={t('auth.firstname')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setFirstname(text)}
        />

        <TextInput
          style={[styles.authInput, { color: COLORS.black, borderColor: COLORS.dark_light }]}
          value={lastname}
          placeholder={t('auth.lastname')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setLastname(text)}
        />

        <TextInput
          style={[styles.authInput, { color: COLORS.black, borderColor: COLORS.dark_light, marginBottom: 3 }]}
          value={username}
          placeholder={t('auth.username.placeholder')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setUsername(text)}
        />
        <Text style={[styles.fieldMessage, { color: COLORS.dark_secondary }]}>{t('auth.username.message')}</Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 56,
            borderWidth: 1,
            borderColor: COLORS.dark_light || '#E2E8F0',
            borderRadius: 8,
            backgroundColor: COLORS.white || '#FFFFFF',
            overflow: 'hidden',
            marginBottom: PADDING.p04 || 16,
          }}
        >
          {/* Sélecteur d'indicatif avec recherche */}
          <View style={{ width: '50%', height: '100%' }}>
            <DropDownPicker
              modalTitle={t('auth.phone_code.title')}
              disabled={countriesData.length === 0}
              loading={countriesData.length === 0}
              modalProps={{
                presentationStyle: 'fullScreen',
                animationType: 'slide',
              }}
              modalContentContainerStyle={{
                backgroundColor: COLORS.white,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.dark_light,
              }}
              closeIconStyle={{ tintColor: COLORS.black }}
              textStyle={{ color: COLORS.black, fontSize: 14 }}
              placeholderStyle={{ color: COLORS.dark_secondary, fontSize: 14 }}
              placeholder={t('auth.phone_code.label')}
              arrowIconStyle={{ tintColor: COLORS.black }}
              containerStyle={{ height: '100%' }}
              style={{
                backgroundColor: 'transparent',
                borderWidth: 0,
                height: '100%',
                paddingHorizontal: 12,
              }}
              listMode="MODAL"
              searchable={true}
              searchPlaceholder="Rechercher un pays ou code..."
              searchTextInputStyle={{
                color: COLORS.black,
                borderColor: COLORS.dark_light || '#CBD5E1',
                borderRadius: 8,
                paddingHorizontal: 12,
                height: 44,
              }}
              searchContainerStyle={{
                borderBottomColor: COLORS.dark_light || '#E2E8F0',
                paddingVertical: 10,
                paddingHorizontal: 16,
              }}
              open={open}
              value={phoneCode}
              items={countriesData}
              setOpen={setOpen}
              setValue={setPhoneCode}
              onSelectItem={(item) => handleCountryChange(item)}
              renderListItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setPhoneCode(item.value);
                    handleCountryChange(item);
                    setOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.dark_light || '#F1F5F9',
                  }}
                >
                  {item.flag ? (
                    <Image
                      source={{ uri: item.flag }}
                      style={{
                        width: 24,
                        height: 16,
                        marginRight: 12,
                        borderRadius: 2,
                      }}
                      resizeMode="cover"
                    />
                  ) : null}
                  <Text style={{ color: COLORS.black, fontSize: 15, fontWeight: '500' }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          <View
            style={{
              width: 1,
              height: '60%',
              backgroundColor: COLORS.dark_light || '#CBD5E1',
            }}
          />

          <TextInput
            style={{
              flex: 1,
              height: '100%',
              paddingHorizontal: 12,
              color: COLORS.black,
              fontSize: 15,
            }}
            keyboardType="phone-pad"
            value={phone}
            placeholder={t('auth.phone')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={(text) => setPhone(text)}
          />
        </View>

        <TextInput
          style={[styles.authInput, { color: COLORS.black, borderColor: COLORS.dark_light }]}
          value={city}
          placeholder={t('auth.city')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setCity(text)}
        />

        <Text style={[styles.termsText, { color: COLORS.dark_secondary }]}>
          {t('terms_accept1')} <Text style={{ color: COLORS.link_color }} onPress={() => navigation.navigate('About', { screen: 'Terms' })}>{t('navigation.terms')}</Text>
          {t('terms_accept2')} <Text style={{ color: COLORS.link_color }} onPress={() => navigation.navigate('About', { screen: 'Privacy' })}>{t('navigation.privacy')}</Text>
        </Text>

        {activeError &&
          <View style={[styles.messageContainer, { backgroundColor: COLORS.danger_transparent || 'rgba(255, 0, 0, 0.1)' }]}>
            <Text style={[styles.messageText, { color: COLORS.danger || '#D32F2F' }]}>
              {activeError}
            </Text>
          </View>
        }

        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.primary, marginTop: 10 }]}
          onPress={handleSubmit}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>{t('start')}</Text>
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={[styles.signupText, { color: COLORS.black }]}>{t('have_account')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.signupButton, { color: COLORS.link_color }]}>{t('i_login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: PADDING.p04 || 24,
  },
  backButton: {
    display: 'flex',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginTop: 10,
  },
  header: {
    marginTop: PADDING.p12 || 24,
    marginBottom: PADDING.p08 || 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
  },
  authInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: PADDING.p04 || 16,
    marginBottom: PADDING.p04 || 16,
  },
  fieldMessage: {
    fontSize: 10,
    textAlign: 'right',
    marginBottom: PADDING.p04 || 8,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 15,
    lineHeight: 18,
  },
  signupContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 20,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    fontSize: 15,
  },
  signupButton: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  messageContainer: {
    marginBottom: PADDING.p04 || 16,
    padding: PADDING.p03 || 12,
    borderRadius: 10,
  },
  messageText: {
    fontWeight: '400',
    fontSize: 14,
  },
});