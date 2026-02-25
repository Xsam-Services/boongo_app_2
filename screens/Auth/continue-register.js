/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, TextInput, ScrollView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Divider } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
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

const ContinueRegisterScreen = () => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Get contexts ===============
  const { isLoading, endRegister, endRegisterInfo } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  // =============== User data ===============
  const firstname = endRegisterInfo.firstname;
  const city = endRegisterInfo.city;
  const [surname, setSurname] = useState(null);
  const [address_1, setAddress1] = useState(null);
  // const [address_2, setAddress2] = useState(null);
  // const [p_o_box, setPOBox] = useState(null);
  const [password, setPassword] = useState(null);
  const [confirm_password, setConfirmPassword] = useState(null);
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
          })
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

    console.log(item.value);
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
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // Show/Hide Datepicker
  const toggleDatePicker = () => {
    setShowPicker(!showPicker);
  };

  // On change, update date value
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

  // If Platform is iOS, customize cofirmation button
  const confirmIOSDate = () => {
    setBirthdate(formatDate(date));
    toggleDatePicker();
  };

  // Format Date according to MySQL
  const formatDate = (rawDate) => {
    let date = new Date(rawDate);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    month = month < 10 ? `0${month}` : month;
    day = day < 10 ? `0${day}` : day;

    return `${year}-${month}-${day}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <Spinner visible={isLoading} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: PADDING.p16, paddingHorizontal: PADDING.p10 }}>
        {/* Brand / Title */}
        <View style={homeStyles.authlogo}>
          <LogoText width={200} height={48} />
        </View>
        <Text style={[homeStyles.authTitle, { color: COLORS.black, marginBottom: PADDING.p01 }]}>{t('welcome_title', { firstname })}</Text>
        <Text style={[homeStyles.authText, { color: COLORS.black, textAlign: 'center', marginBottom: PADDING.p12 }]}>{t('continue_register')}</Text>

        {/* Surname */}
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={surname}
          placeholder={t('auth.surname')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setSurname(text)} />

        {/* Gender  */}
        <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.gender.label')}</Text>
        <DropDownPicker
          open={genderOpen}
          value={gender}
          items={genderItems}
          setOpen={setGenderOpen}
          setValue={setGender}
          setItems={setGenderItems}
          dropDownContainerStyle={{ backgroundColor: COLORS.white }}
          textStyle={{ color: COLORS.black }}
          placeholderStyle={{ color: COLORS.black }}
          placeholder={t('auth.gender.label')}
          arrowIconStyle={{ tintColor: COLORS.black }}
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary, borderTopEndRadius: 0, borderBottomEndRadius: 0, borderRightWidth: 0 }]}
          containerStyle={{ height: 50 }}
          listMode='SCROLLVIEW' />

        {/* Birth date */}
        <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.birthdate')}</Text>
        {showPicker && (
          <DateTimePicker
            mode='date'
            display='spinner'
            value={date}
            onChange={mOnChange}
            maximumDate={new Date('2018-1-1')} />
        )}
        {showPicker && Platform.OS === 'ios' && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <TouchableOpacity style={[homeStyles.authCancel, { borderColor: COLORS.black }]} onPress={toggleDatePicker}>
              <Text style={[homeStyles.authButtonText, { color: COLORS.black }]}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[homeStyles.authButton, { backgroundColor: COLORS.primary }]} onPress={confirmIOSDate}>
              <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('confirm')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {!showPicker && (
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={birthdate}
            placeholder={t('auth.birthdate')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={setBirthdate}
            onPressIn={toggleDatePicker} />
        )}

        {/* Country  */}
        <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.country.label')}</Text>
        <Dropdown
          style={[homeStyles.authInput, { color: COLORS.black, height: 50, borderColor: COLORS.light_secondary }]}
          data={countries}
          search
          labelField='label'
          valueField='value'
          textStyle={{ color: COLORS.black }}
          itemContainerStyle={{ backgroundColor: COLORS.dark_secondary }}
          placeholder={!isFocus ? t('auth.country.title') : '...'}
          placeholderStyle={{ color: (theme === 'light' ? COLORS.dark_secondary : COLORS.secondary) }}
          selectedTextStyle={{ color: (theme === 'light' ? COLORS.dark_secondary : COLORS.secondary) }}
          searchPlaceholder={t('search')}
          maxHeight={300}
          value={country}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={handleCountryChange} />

        {/* Address 1  */}
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={address_1}
          placeholder={t('auth.address')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setAddress1(text)} />

        {/* Address 2  */}
        {/* <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={address_2}
          placeholder={t('auth.address_2')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setAddress2(text)} /> */}

        {/* P.O. box */}
        {/* <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={p_o_box}
          placeholder={t('auth.p_o_box')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setPOBox(text)} /> */}

        {/* Password */}
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={password}
          placeholder={t('auth.password.label')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setPassword(text)} secureTextEntry />

        {/* Confirm password */}
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={confirm_password}
          placeholder={t('auth.confirm_password.label')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setConfirmPassword(text)} secureTextEntry />

        {/* Submit */}
        <Button style={[homeStyles.authButton, { backgroundColor: COLORS.success }]} onPress={() => { endRegister(endRegisterInfo.id, firstname, null, surname, gender, birthdate, city, address_1, null, null, null, null, null, password, confirm_password, country.id, null, null); }}>
          <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('register')}</Text>
        </Button>

        {/* Copyright */}
        <Divider style={[homeStyles.authDivider, { backgroundColor: COLORS.light_secondary }]} />
        <FooterComponent color={COLORS.dark_secondary} />
      </ScrollView>
    </View>
  );
};

export default ContinueRegisterScreen;