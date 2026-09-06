/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Spinner from 'react-native-loading-spinner-overlay';
import DropDownPicker from 'react-native-dropdown-picker';
import Toast from 'react-native-toast-message';
import { API, PADDING } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import ThemeContext from '../../contexts/ThemeContext';
import useColors from '../../hooks/useColors';
import axios from 'axios';
import Octicons from '@expo/vector-icons/Octicons';

import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [errorMessage, setErrorMessage] = useState('');

  // COUNTRIES DATA dropdown
  const [loading, setLoading] = useState(false);
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

      });
  }, []);

  const handleCountryChange = (item) => {
    setPhoneCode(item.value);
  };

  const HandleSearchPhone = async () => {
    setErrorMessage('');

    if (!phoneCode || !phone) {
      const msg = t('error_message.phone');
      setErrorMessage(msg);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: msg,
        position: 'top'
      });
      return;
    }

    setLoading(true);


    try {
      const res = await axios.get(
        `${API.boongo_url}/password_reset/search_by_phone/${phoneCode}${phone}`
      );

      const message = res.data.message;



      if (!res.data.success) {
        setErrorMessage(message);
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: message,
          position: 'top'
        });
        setLoading(false);
        return;
      }

      setLoading(false);
      navigation.navigate('CheckPhoneOTP', {
        isPasswordReset: true,
        phoneNumber: `${phoneCode}${phone}`
      });

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
      setErrorMessage(message);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: message,
        position: 'top'
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.light }]} edges={['top']}>
      <Spinner visible={loading || isLoading} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: PADDING.p16 }}>
        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: COLORS.dark_light }]}
          onPress={() => navigation.goBack()}
        >
          <Octicons name="chevron-left" size={24} color={COLORS.dark} />
        </TouchableOpacity>

        {/* Header / Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: COLORS.black }]}>{t('auth.password.forgotten')}</Text>
          <Text style={[styles.subtitle, { color: COLORS.dark }]}>{t('auth.login.subtitle')}</Text>
        </View>

        {/* Phone number container */}
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
          {/* Phone code picker */}
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

          {/* Phone input */}
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

        {/* Error Message Box */}
        {errorMessage ? (
          <View style={[styles.messageContainer, { backgroundColor: COLORS.danger_transparent || 'rgba(255, 0, 0, 0.1)' }]}>
            <Text style={[styles.messageText, { color: COLORS.danger || '#D32F2F' }]}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.primary || COLORS.danger, marginTop: 10 }]}
          onPress={HandleSearchPhone}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>{t('send')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PasswordResetScreen;

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
  cancelButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
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