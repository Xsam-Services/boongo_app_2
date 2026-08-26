/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useState } from 'react'
import { Text, TouchableOpacity, View, TextInput, ScrollView, Platform, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import DropDownPicker from 'react-native-dropdown-picker';
import Spinner from 'react-native-loading-spinner-overlay';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { API, PADDING } from '../../tools/constants';
import useColors from '../../hooks/useColors';
import homeStyles from '../style';
import HeaderComponent from '../header';

const SettingsScreen = () => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Navigation ===============
  const navigation = useNavigation();
  // =============== Get contexts ===============
  const { userInfo, isLoading, updateAvatar, update, changeStatus } = useContext(AuthContext);
  // =============== Get data ===============
  const [firstname, setFirstname] = useState(userInfo.firstname);
  const [lastname, setLastname] = useState(userInfo.lastname);
  const [surname, setSurname] = useState(userInfo.surname);
  const [city, setCity] = useState(userInfo.city);
  const [address_1, setAddress1] = useState(userInfo.address_1);
  const [address_2, setAddress2] = useState(userInfo.address_2);
  const [p_o_box, setPOBox] = useState(userInfo.p_o_box);
  const [email, setEmail] = useState(userInfo.email);
  const [phone, setPhone] = useState(userInfo.phone);
  const [username, setUsername] = useState(userInfo.username);
  const [password, setPassword] = useState(null);
  const [confirm_password, setConfirmPassword] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const imagePick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      console.warn('Media library permission is required to update the avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      mediaTypes: ['images'],
      quality: 0.8,
    });

    const asset = result.canceled ? null : result.assets?.[0];

    if (asset?.base64) {
      updateAvatar(userInfo.id, `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`);
    }
  };

  // COUNTRY dropdown
  const [countryIsFocus, setCountryIsFocus] = useState(false);
  const [country, setCountry] = useState(userInfo.country ? userInfo.country.id : null);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const config = {
      method: 'GET',
      url: `${API.boongo_url}/country`,
      headers: {
        'X-localization': 'fr',
        'X-user-id': userInfo.id,
        Authorization: `Bearer ${userInfo.api_token}`,
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
  }, [userInfo.api_token, userInfo.id]);

  // ORGANIZATION dropdown
  const [organizationIsFocus, setOrganizationIsFocus] = useState(false);
  const [organization, setOrganization] = useState(userInfo.last_organization ? userInfo.last_organization.id : null);
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    const config = {
      method: 'GET',
      url: `${API.boongo_url}/organization`,
      headers: {
        'X-localization': 'fr',
        'X-user-id': userInfo.id,
        Authorization: `Bearer ${userInfo.api_token}`,
      }
    };

    axios(config)
      .then(function (response) {
        const count = Object.keys(response.data.data).length;
        let organizationArray = [];

        for (let i = 0; i < count; i++) {
          organizationArray.push({
            value: response.data.data[i].id,
            label: response.data.data[i].org_name
          })
        }

        setOrganizations(organizationArray);
      })
      .catch(function (error) {
        console.log(error);
      });
  }, [userInfo.api_token, userInfo.id]);

  // GENDER dropdown
  const [genderOpen, setGenderOpen] = useState(false);
  const [gender, setGender] = useState(userInfo.gender);
  const [genderItems, setGenderItems] = useState([
    { label: t('auth.gender.male'), value: 'M' },
    { label: t('auth.gender.female'), value: 'F' }
  ]);

  const handleGenderChange = (item) => {
    setGender(item.value);
  };

  // CURRENCY dropdown
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currency, setCurrency] = useState(userInfo.currency ? userInfo.currency.id : null);
  const [currencyItems, setCurrencyItems] = useState([]);

  useEffect(() => {
    const config = {
      method: 'GET',
      url: `${API.boongo_url}/currency`,
      headers: {
        'X-localization': 'fr',
        'X-user-id': userInfo.id,
        Authorization: `Bearer ${userInfo.api_token}`,
      }
    };

    axios(config)
      .then(function (response) {
        const count = Object.keys(response.data.data).length;
        let currencyArray = [];

        for (let i = 0; i < count; i++) {
          currencyArray.push({
            value: response.data.data[i].id,
            label: `${response.data.data[i].currency_name} (${response.data.data[i].currency_acronym})`
          })
        }

        setCurrencyItems(currencyArray);
      })
      .catch(function (error) {
        console.log(error);
      });
  }, [userInfo.api_token, userInfo.id]);

  // BIRTH DATE date-picker
  const [birthdate, setBirthdate] = useState(userInfo.birthdate);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light }}>
      <Spinner visible={isLoading} />

      <HeaderComponent title={t('navigation.settings.title')} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profil photo */}
        <View style={[styles.avatarSection, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
          <Image style={styles.avatar} source={{ uri: userInfo.avatar_url }} />
          <TouchableOpacity style={[styles.avatarEditButton, { backgroundColor: COLORS.primary }]} onPress={imagePick}>
            <Icon name='lead-pencil' size={20} color='white' />
          </TouchableOpacity>
        </View>

        {/* Personal infos */}
        <View style={[styles.formCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
          {/* Organization  */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.organization.label')}</Text>
          <Dropdown
            style={[styles.select, { backgroundColor: COLORS.light_secondary }]}
            borderColor="transparent"
            textStyle={{ color: COLORS.black }}
            itemContainerStyle={{ backgroundColor: COLORS.dark_secondary }}
            itemTextStyle={{ color: COLORS.white }}
            placeholderStyle={{ color: COLORS.black }}
            arrowIconStyle={{ tintColor: COLORS.black }}
            data={organizations}
            search
            labelField='label'
            valueField='value'
            placeholder={!organizationIsFocus ? t('auth.organization.label') : '...'}
            searchPlaceholder={t('search')}
            maxHeight={300}
            value={organization}
            onFocus={() => setOrganizationIsFocus(true)}
            onBlur={() => setOrganizationIsFocus(false)}
            onChange={item => {
              setOrganization(item.value);
              setOrganizationIsFocus(false);
            }} />

          {/* First name */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.firstname')}</Text>
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={firstname}
            placeholder={t('auth.firstname')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setFirstname(text)} />

          {/* Last name */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.lastname')}</Text>
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={lastname}
            placeholder={t('auth.lastname')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setLastname(text)} />

          {/* Surname */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.surname')}</Text>
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={surname}
            placeholder={t('auth.surname')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setSurname(text)} />

          {/* Username */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.username.label')}</Text>
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={username}
            placeholder={t('auth.username.label')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setUsername(text)} />

          {/* Gender  */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.gender.label')}</Text>
          <DropDownPicker
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            modalContentContainerStyle={{ backgroundColor: COLORS.white, zIndex: 1000 }}
            searchContainerStyle={{ borderColor: COLORS.dark_secondary, zIndex: 1000 }}
            textStyle={{ color: COLORS.black }}
            closeIconStyle={{ tintColor: COLORS.black }}
            placeholderStyle={{ color: COLORS.black }}
            arrowIconStyle={{ tintColor: COLORS.dark_secondary }}
            open={genderOpen}
            value={gender}
            placeholder={t('auth.gender.label')}
            placeholderTextColor={COLORS.dark_secondary}
            items={genderItems}
            setOpen={setGenderOpen}
            setValue={setGender}
            setItems={setGenderItems}
            onChangeItem={handleGenderChange}
            listMode="MODAL" />

          {/* Birth date */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.birthdate')}</Text>
          {showPicker && (
            <DateTimePicker
              mode='date'
              style={{ color: COLORS.black }}
              display='spinner'
              value={date}
              onChange={mOnChange}
              maximumDate={new Date('2018-1-1')} />
          )}
          {showPicker && Platform.OS === 'ios' && (
            <View style={styles.dateActions}>
              <TouchableOpacity style={[styles.dateAction, { backgroundColor: COLORS.light_secondary }]} onPress={toggleDatePicker}>
                <Text style={{ fontSize: 14, color: COLORS.black, textAlign: 'center' }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dateAction, { backgroundColor: COLORS.primary }]} onPress={confirmIOSDate}>
                <Text style={[homeStyles.authButtonText, { color: '#ffffff' }]}>{t('confirm')}</Text>
              </TouchableOpacity>
            </View>
          )}
          {!showPicker && (
            <TextInput
              style={[styles.select, { backgroundColor: COLORS.light_secondary, color: COLORS.black }]}
              value={birthdate}
              placeholder={t('auth.birthdate')}
              onChangeText={setBirthdate}
              onPressIn={toggleDatePicker} />
          )}

          {/* Country  */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.country.label')}</Text>
          <Dropdown
            style={[styles.select, { backgroundColor: COLORS.light_secondary }]}
            borderColor="transparent"
            textStyle={{ color: COLORS.black }}
            itemContainerStyle={{ backgroundColor: COLORS.white }}
            placeholderStyle={{ color: COLORS.black }}
            arrowIconStyle={{ tintColor: COLORS.black }}
            data={countries}
            search
            labelField='label'
            valueField='value'
            placeholder={!countryIsFocus ? t('auth.country.label') : '...'}
            searchPlaceholder={t('search')}
            maxHeight={300}
            value={country}
            onFocus={() => setCountryIsFocus(true)}
            onBlur={() => setCountryIsFocus(false)}
            onChange={item => {
              setCountry(item.value);
              setCountryIsFocus(false);
            }} />

          {/* City  */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.city')}</Text>
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={city}
            placeholder={t('auth.city')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setCity(text)} />

          {/* Address 1  */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.address_1')}</Text>
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={address_1}
            placeholder={t('auth.address_1')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setAddress1(text)} />

          {/* Address 2  */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.address_2')}</Text>
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={address_2}
            placeholder={t('auth.address_2')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setAddress2(text)} />

          {/* P.O. box */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.p_o_box')}</Text>
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={p_o_box}
            placeholder={t('auth.p_o_box')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setPOBox(text)} />

          {/* E-mail */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.email')}</Text>
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={email}
            placeholder={t('auth.email')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setEmail(text)} />

          {/* Phone number */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.phone')}</Text>
          <TextInput
            style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
            value={phone}
            placeholder={t('auth.phone')}
            placeholderTextColor={COLORS.dark_secondary}
            onChangeText={text => setPhone(text)} />

          {/* Currency  */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('work.currency.title')}</Text>
          <DropDownPicker
            style={[styles.select, { backgroundColor: COLORS.light_secondary }]}
            modalContentContainerStyle={[styles.currencyModal, { backgroundColor: COLORS.white }]}
            modalTitle={t('work.currency.label')}
            modalTitleStyle={{ color: COLORS.black, fontSize: 19, fontWeight: '700' }}
            searchContainerStyle={styles.currencySearchContainer}
            searchTextInputStyle={[styles.currencySearchInput, { backgroundColor: COLORS.light, color: COLORS.black, borderColor: COLORS.light_secondary }]}
            listItemContainerStyle={[styles.currencyListItem, { borderBottomColor: COLORS.light_secondary }]}
            listItemLabelStyle={{ color: COLORS.black, fontSize: 15 }}
            selectedItemContainerStyle={{ backgroundColor: COLORS.light_primary }}
            selectedItemLabelStyle={{ color: COLORS.dark_primary, fontWeight: '700' }}
            textStyle={{ color: COLORS.black }}
            closeIconStyle={{ tintColor: COLORS.black }}
            placeholderStyle={{ color: COLORS.black }}
            arrowIconStyle={{ tintColor: COLORS.dark_secondary }}
            open={currencyOpen}
            value={currency}
            placeholder={t('work.currency.label')}
            placeholderTextColor={COLORS.dark_secondary}
            items={currencyItems}
            setOpen={setCurrencyOpen}
            setValue={setCurrency}
            setItems={setCurrencyItems}
            onChangeValue={setCurrency}
            searchable
            searchPlaceholder={t('search')}
            searchPlaceholderTextColor={COLORS.dark}
            listMode="MODAL" />

          {/* Password */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.password.label')}</Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
              value={password}
              placeholder={t('auth.password.label')}
              placeholderTextColor={COLORS.dark_secondary}
              onChangeText={text => setPassword(text)} secureTextEntry={!showPassword} />
            <TouchableOpacity style={{ position: 'absolute', top: 9, right: 7 }} onPress={() => setShowPassword(prev => !prev)}>
              <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} color={COLORS.dark_secondary} size={30} />
            </TouchableOpacity>
          </View>

          {/* Confirm password */}
          <Text style={{ color: COLORS.dark_secondary, paddingVertical: 5, paddingHorizontal: PADDING.horizontal }}>{t('auth.confirm_password.label')}</Text>
          <View style={{ position: 'relative' }}>
            <TextInput
              style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
              value={confirm_password}
              placeholder={t('auth.confirm_password.label')}
              placeholderTextColor={COLORS.dark_secondary}
              onChangeText={text => setConfirmPassword(text)} secureTextEntry={!showConfirmPassword} />
            <TouchableOpacity style={{ position: 'absolute', top: 9, right: 7 }} onPress={() => setShowConfirmPassword(prev => !prev)}>
              <Icon name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} color={COLORS.dark_secondary} size={30} />
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <Button style={[homeStyles.authButton, { backgroundColor: COLORS.primary, marginTop: 16 }]} onPress={() => {
            update(userInfo.id, firstname, lastname, surname, gender, birthdate, city, address_1, address_2, p_o_box, email, phone, username, password, confirm_password, country, currency, null, organization);
            navigation.navigate('Account');
          }}>
            <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('update')}</Text>
          </Button>
        </View>

        {/* Account management */}
        <View style={[styles.formCard, { backgroundColor: COLORS.white, borderColor: COLORS.light_secondary }]}>
          {/* Disable account */}
          <Button style={[homeStyles.authButton, { backgroundColor: COLORS.warning, marginVertical: PADDING.p00 }]} onPress={() => {
            changeStatus(userInfo.id, 4);
            navigation.navigate('HomeStack');
          }}>
            <Text style={[homeStyles.authButtonText, { color: 'black' }]}>{t('auth.status.disabled.link1')}</Text>
          </Button>
          <Button style={[homeStyles.authButton, { backgroundColor: COLORS.danger, marginVertical: PADDING.p00 }]} onPress={() => {
            changeStatus(userInfo.id, 29);
            navigation.navigate('HomeStack');
          }}>
            <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('auth.status.deleted.link1')}</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SettingsScreen;

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 36 },
  avatarSection: { alignItems: 'center', borderRadius: 24, borderWidth: 1, marginBottom: 16, paddingVertical: 20 },
  avatar: { borderRadius: 80, height: 160, width: 160 },
  avatarEditButton: { alignItems: 'center', borderRadius: 20, justifyContent: 'center', marginLeft: 104, marginTop: -30, height: 40, width: 40 },
  formCard: { borderRadius: 20, borderWidth: 1, marginBottom: 16, padding: 20 },
  select: { borderRadius: 12, borderWidth: 0, height: 52, marginBottom: 10, paddingHorizontal: 16 },
  dateActions: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  dateAction: { alignItems: 'center', borderRadius: 14, flex: 1, justifyContent: 'center', minHeight: 48 },
  currencyModal: { borderRadius: 24, margin: 16, overflow: 'hidden', paddingTop: 8 },
  currencySearchContainer: { borderBottomWidth: 0, paddingHorizontal: 16, paddingVertical: 8 },
  currencySearchInput: { borderRadius: 12, borderWidth: 1, height: 46, paddingHorizontal: 14 },
  currencyListItem: { borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 56, paddingHorizontal: 20 },
});
