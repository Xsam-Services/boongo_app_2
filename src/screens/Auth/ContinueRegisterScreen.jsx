import React, { useContext, useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, TextInput, ScrollView, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import Spinner from 'react-native-loading-spinner-overlay';
import DropDownPicker from 'react-native-dropdown-picker';
import { API, PADDING } from '../../tools/constants';
import { AuthContext } from '../../contexts/AuthContext';
import useColors from '../../hooks/useColors';
import axios from 'axios';
import Octicons from '@expo/vector-icons/Octicons';

import { SafeAreaView } from 'react-native-safe-area-context';

const ContinueRegisterScreen = () => {
  const COLORS = useColors();
  const { t } = useTranslation();
  const { isLoading, endRegister, endRegisterInfo, registerError } = useContext(AuthContext);

  const firstname = endRegisterInfo?.firstname || '';
  const city = endRegisterInfo?.city || '';

  const [surname, setSurname] = useState(null);
  const [address_1, setAddress1] = useState(null);
  const [password, setPassword] = useState(null);
  const [confirm_password, setConfirmPassword] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation errors
  const [errorMessage, setErrorMessage] = useState('');

  // COUNTRY dropdown
  const [isFocus, setIsFocus] = useState(false);
  const [country, setCountry] = useState(null);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const config = {
      method: 'GET',
      url: `${API.boongo_url}/country`,
      headers: {
        'X-localization': 'fr'
      }
    };

    axios(config)
      .then(function (response) {
        const count = Object.keys(response.data.data).length;
        let countryArray = [];

        for (let i = 0; i < count; i++) {
          countryArray.push({
            value: response.data.data[i].id,
            label: response.data.data[i].country_name
          });
        }

        setCountries(countryArray);
      })
      .catch(function (error) {

      });
  }, []);

  const handleCountryChange = (item) => {
    setCountry(item.value);
    setIsFocus(false);
  };

  // GENDER dropdown
  const [genderOpen, setGenderOpen] = useState(false);
  const [gender, setGender] = useState(null);
  const [genderItems, setGenderItems] = useState([
    { label: t('auth.gender.male'), value: 'M' },
    { label: t('auth.gender.female'), value: 'F' }
  ]);

  // BIRTH DATE date-picker
  const [birthdate, setBirthdate] = useState(null);
  const [date, setDate] = useState(new Date('2000-01-01'));
  const [showPicker, setShowPicker] = useState(false);

  const toggleDatePicker = () => {
    setShowPicker(!showPicker);
  };

  const mOnChange = ({ type }, selectedDate) => {
    if (type === 'set') {
      const currentDate = selectedDate;
      setDate(currentDate);

      if (Platform.OS === 'android') {
        toggleDatePicker();
        setBirthdate(formatDate(currentDate));
      }
    } else {
      toggleDatePicker();
    }
  };

  const confirmIOSDate = () => {
    setBirthdate(formatDate(date));
    toggleDatePicker();
  };

  const formatDate = (rawDate) => {
    let d = new Date(rawDate);
    let year = d.getFullYear();
    let month = d.getMonth() + 1;
    let day = d.getDate();

    month = month < 10 ? `0${month}` : month;
    day = day < 10 ? `0${day}` : day;

    return `${year}-${month}-${day}`;
  };

  const handleSubmit = () => {
    setErrorMessage('');

    if (!gender) {
      setErrorMessage(t('auth.gender.label') + " est obligatoire");
      return;
    }
    if (!birthdate) {
      setErrorMessage(t('auth.birthdate') + " est obligatoire");
      return;
    }
    if (!country) {
      setErrorMessage(t('auth.country.title') + " est obligatoire");
      return;
    }
    if (!password) {
      setErrorMessage(t('auth.password.label') + " est obligatoire");
      return;
    }
    if (password !== confirm_password) {
      setErrorMessage("Les mots de passe ne correspondent pas");
      return;
    }

    endRegister(
      endRegisterInfo.id,
      firstname,
      null,
      surname,
      gender,
      birthdate,
      city,
      address_1,
      null,
      null,
      null,
      null,
      null,
      password,
      confirm_password,
      country,
      null,
      null
    );
  };

  const activeError = errorMessage || registerError;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.light }]} edges={['top']}>
      <Spinner visible={isLoading} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: PADDING.p16 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: COLORS.black }]}>
            {t('welcome_title', { firstname })}
          </Text>
          <Text style={[styles.subtitle, { color: COLORS.dark }]}>
            {t('continue_register')}
          </Text>
        </View>

        {activeError &&
          <View style={[styles.messageContainer, { backgroundColor: COLORS.danger_transparent || 'rgba(255, 0, 0, 0.1)' }]}>
            <Text style={[styles.messageText, { color: COLORS.danger || '#D32F2F' }]}>
              {activeError}
            </Text>
          </View>
        }

        <TextInput
          style={[styles.authInput, { color: COLORS.black, borderColor: COLORS.dark_light }]}
          value={surname}
          placeholder={t('auth.surname')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setSurname(text)}
        />

        <View style={{ zIndex: 2, marginBottom: PADDING.p04 || 16 }}>
          <DropDownPicker
            open={genderOpen}
            value={gender}
            items={genderItems}
            setOpen={setGenderOpen}
            setValue={setGender}
            setItems={setGenderItems}
            style={{
              backgroundColor: COLORS.white,
              borderColor: COLORS.dark_light,
              borderWidth: 1,
              borderRadius: 8,
              height: 56,
              minHeight: 56,
            }}
            containerStyle={{
              height: 56,
              marginBottom: 0,
            }}
            dropDownContainerStyle={{
              backgroundColor: COLORS.white,
              borderColor: COLORS.dark_light,
              borderWidth: 1,
              borderRadius: 8,
            }}
            textStyle={{ color: COLORS.black, fontSize: 16 }}
            placeholderStyle={{ color: COLORS.dark_secondary }}
            placeholder={t('auth.gender.label')}
            arrowIconStyle={{ tintColor: COLORS.black }}
            listMode='SCROLLVIEW'
          />
        </View>

        {showPicker && (
          <DateTimePicker
            mode='date'
            display='spinner'
            value={date}
            onChange={mOnChange}
            maximumDate={new Date('2018-1-1')}
          />
        )}
        {showPicker && Platform.OS === 'ios' && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
            <TouchableOpacity style={[styles.cancelButton, { borderColor: COLORS.dark }]} onPress={toggleDatePicker}>
              <Text style={[styles.buttonText, { color: COLORS.black }]}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.primary, width: '48%' }]} onPress={confirmIOSDate}>
              <Text style={[styles.buttonText, { color: 'white' }]}>{t('confirm')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {!showPicker && (
          <TextInput
            style={[styles.authInput, { color: COLORS.black, borderColor: COLORS.dark_light }]}
            value={birthdate}
            placeholder={t('auth.birthdate')}
            placeholderTextColor={COLORS.dark_secondary}
            editable={false}
            onPressIn={toggleDatePicker}
            onPressOut={toggleDatePicker}
          />
        )}

        {/* Country */}
        <View style={{ zIndex: 1, marginBottom: PADDING.p04 || 16 }}>
          <Dropdown
            style={{
              backgroundColor: COLORS.white,
              borderColor: COLORS.dark_light,
              borderWidth: 1,
              borderRadius: 8,
              height: 56,
              paddingHorizontal: 16,
            }}
            containerStyle={{
              backgroundColor: COLORS.white,
              borderColor: COLORS.dark_light,
              borderWidth: 1,
              borderRadius: 8,
              marginTop: 4,
            }}
            inputSearchStyle={{
              height: 45,
              borderRadius: 8,
              borderColor: COLORS.dark_light,
              color: COLORS.black,
            }}
            data={countries}
            search
            labelField='label'
            valueField='value'
            textStyle={{ color: COLORS.black, fontSize: 16 }}
            itemContainerStyle={{
              backgroundColor: COLORS.white,
            }}
            itemTextStyle={{
              color: COLORS.black,
            }}
            activeColor={COLORS.dark_light}
            placeholder={!isFocus ? t('auth.country.title') : '...'}
            placeholderStyle={{ color: COLORS.dark_secondary, fontSize: 16 }}
            selectedTextStyle={{ color: COLORS.black, fontSize: 16 }}
            searchPlaceholder={t('search')}
            maxHeight={300}
            value={country}
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
            onChange={handleCountryChange}
          />
        </View>

        <TextInput
          style={[styles.authInput, { color: COLORS.black, borderColor: COLORS.dark_light }]}
          value={address_1}
          placeholder={t('auth.address')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setAddress1(text)}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.authInput, { color: COLORS.black, borderColor: COLORS.dark_light }]}
            value={password}
            placeholder={t('auth.password.label')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setPassword(text)}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity style={styles.passwordIconContainer} onPress={() => setShowPassword(prev => !prev)}>
            <Octicons name={showPassword ? 'eye-closed' : 'eye'} size={24} color={COLORS.dark_secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.authInput, { color: COLORS.black, borderColor: COLORS.dark_light }]}
            value={confirm_password}
            placeholder={t('auth.confirm_password.label')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setConfirmPassword(text)}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity style={styles.passwordIconContainer} onPress={() => setShowConfirmPassword(prev => !prev)}>
            <Octicons name={showConfirmPassword ? 'eye-closed' : 'eye'} size={24} color={COLORS.dark_secondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.primary, marginTop: 10 }]}
          onPress={handleSubmit}
        >
          <Text style={[styles.buttonText, { color: 'white' }]}>{t('register')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ContinueRegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: PADDING.p04 || 24,
  },
  header: {
    marginTop: PADDING.p12 || 24,
    marginBottom: PADDING.p08 || 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
  },
  authInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: PADDING.p04 || 16,
    marginBottom: PADDING.p04 || 16,
    justifyContent: 'center',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordIconContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButton: {
    width: '48%',
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
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
    textAlign: 'center',
  },
  divider: {
    marginVertical: 20,
    height: 1,
  },
});