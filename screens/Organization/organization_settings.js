/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Spinner from 'react-native-loading-spinner-overlay';
import DropDownPicker from 'react-native-dropdown-picker';
import ImagePicker from 'react-native-image-crop-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { API, PADDING } from '../../tools/constants';
import useColors from '../../hooks/useColors';
import homeStyles from '../style';
import HeaderComponent from '../header';

const OrganizationSettingsScreen = ({ route, navigation }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Language ===============
  const { t } = useTranslation();
  // =============== Get contexts ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get parameters ===============
  const { organization_id } = route.params;
  // =============== Get data ===============
  const [selectedOrganization, setSelectedOrganization] = useState({});
  const [orgName, setOrgName] = useState(selectedOrganization.org_name || '');
  const [orgAcronym, setOrgAcronym] = useState(selectedOrganization.org_acronym || '');
  const [orgDescription, setOrgDescription] = useState(selectedOrganization.org_description || '');
  const [inputDescHeight, setInputDescHeight] = useState(40);
  const [idNumber, setIdNumber] = useState(selectedOrganization.id_number || '');
  const [address, setAddress] = useState(selectedOrganization.address || '');
  const [inputAddrHeight, setInputAddrHeight] = useState(40);
  const [phoneCode, setPhoneCode] = useState(null);
  const [phone, setPhone] = useState(selectedOrganization.phone || '');
  const [email, setEmail] = useState(selectedOrganization.email || '');
  const [p_o_box, setPOBox] = useState(selectedOrganization.p_o_box || '');
  const [legalStatus, setLegalStatus] = useState(selectedOrganization.legal_status || '');
  const [yearOfCreation, setYearOfCreation] = useState(selectedOrganization.year_of_creation || '');
  const [websiteURL, setWebsiteURL] = useState(selectedOrganization.website_url || '');
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

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

  // =============== Refresh control ===============
  const onRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => { setLoading(false); }, 2000);
  }, []);

  // =============== Get current organization ===============
  useEffect(() => {
    getOrganization();
  }, []);

  const getOrganization = () => {
    const config = {
      method: 'GET',
      url: `${API.boongo_url}/organization/${organization_id}`,
      headers: {
        'X-localization': 'fr',
        'Authorization': `Bearer ${userInfo.api_token}`,
      }
    };

    axios(config)
      .then(res => {
        const organizationData = res.data.data;

        setSelectedOrganization(organizationData);
        setLoading(false);

        setOrgName(organizationData.org_name || '');
        setOrgAcronym(organizationData.org_acronym || '');
        setOrgDescription(organizationData.org_description || '');
        setIdNumber(organizationData.id_number || '');
        setAddress(organizationData.address || '');
        setPhone(organizationData.phone || '');
        setEmail(organizationData.email || '');
        setPOBox(organizationData.p_o_box || '');
        setLegalStatus(organizationData.legal_status || '');
        setYearOfCreation(organizationData.year_of_creation || '');
        setWebsiteURL(organizationData.website_url || '');
        setImageData(organizationData.cover_url || null);
      })
      .catch(error => {
        console.log(error);
        setLoading(false);
      });
  };

  // =============== Handle Image Picker ===============
  const imagePick = () => {
    ImagePicker.openPicker({
      width: 700,
      height: 700,
      cropping: true,
      includeBase64: true
    }).then(image => {
      setImageData(`data:${image.mime};base64,${image.data}`);
    }).catch(error => {
      console.log(`${error}`);
    });
  };

  // =============== Handle Form Submit ===============
  const handleSubmit = async () => {
    setIsLoading(true);

    const formData = new FormData();

    formData.append('id', organization_id);
    formData.append('org_name', orgName || '');
    formData.append('org_acronym', orgAcronym || '');
    formData.append('org_description', orgDescription || '');
    formData.append('id_number', idNumber || '');
    formData.append('phone', (phoneCode ? (phone ? `${phoneCode}${phone}` : null) : phone));
    formData.append('email', email || '');
    formData.append('address', address || '');
    formData.append('p_o_box', p_o_box || '');
    formData.append('legal_status', legalStatus || '');
    formData.append('year_of_creation', yearOfCreation || '');
    formData.append('website_url', websiteURL || '');
    formData.append('type_id', 34);
    formData.append('status_id', 6);
    formData.append('user_id', userInfo.id);
    formData.append('image_64', imageData || null);

    try {
      const response = await fetch(`${API.boongo_url}/organization/${organization_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-localization': 'fr',
          'Authorization': `Bearer ${userInfo.api_token}`
        },
        body: formData,
      });

      const text = await response.text();
      const json = JSON.parse(text);

      // Reset all after success
      setOrgName('');
      setOrgAcronym('');
      setOrgDescription('');
      setIdNumber('');
      setAddress('');
      setPhone('');
      setEmail('');
      setPOBox('');
      setLegalStatus('');
      setYearOfCreation('');
      setWebsiteURL('');
      setImageData('');

      console.log(json);
      navigation.navigate('OrganizationData', { organization_id: json.data.id });

    } catch (error) {
      console.error('Error:', error);
    }

    setIsLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Spinner */}
      <Spinner visible={isLoading} />

      {/* Loader */}
      <View style={{ paddingTop: PADDING.p01 }}>
        <HeaderComponent />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: PADDING.p10, paddingHorizontal: PADDING.p10 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}>
        {/* Title */}
        <Text style={[homeStyles.authTitle, { fontSize: 25, color: COLORS.black, textAlign: 'center', marginTop: 0, marginBottom: PADDING.p12 }]}>{t('change_organization')}</Text>

        {/* Logo image */}
        <View style={{ alignItems: 'center', marginVertical: PADDING.p01 }}>
          <Image style={{ width: 210, height: 210, borderRadius: 30 }} source={{ uri: imageData || selectedOrganization.cover_url }} />
          <TouchableOpacity style={{ backgroundColor: COLORS.primary, marginTop: -30, marginLeft: 140, borderRadius: 40 / 2, padding: PADDING.p01 }} onPress={imagePick}>
            <Icon name='lead-pencil' size={20} color='white' />
          </TouchableOpacity>
        </View>

        {/* Organization name */}
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('navigation.establishment.data.name')}</Text>
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={orgName || ''}
          placeholder={t('navigation.establishment.data.name')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={setOrgName} />

        {/* Acronym */}
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('navigation.establishment.data.acronym')}</Text>
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={orgAcronym || ''}
          placeholder={t('navigation.establishment.data.acronym')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={setOrgAcronym} />

        {/* Legal status */}
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('navigation.establishment.data.legal_status')}</Text>
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={legalStatus || ''}
          placeholder={t('navigation.establishment.data.legal_status')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={setLegalStatus} />

        {/* Description */}
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('navigation.establishment.data.description')}</Text>
        <TextInput
          multiline
          onContentSizeChange={(e) =>
            setInputDescHeight(e.nativeEvent.contentSize.height)
          }
          style={[homeStyles.authInput, { height: Math.max(40, inputDescHeight), color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={orgDescription || ''}
          placeholder={t('navigation.establishment.data.description')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={setOrgDescription} />

        {/* ID number */}
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('navigation.establishment.data.id_number')}</Text>
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={idNumber || ''}
          placeholder={t('navigation.establishment.data.id_number')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={setIdNumber} />

        {/* Address */}
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('navigation.establishment.data.address')}</Text>
        <TextInput
          multiline
          onContentSizeChange={(e) =>
            setInputAddrHeight(e.nativeEvent.contentSize.height)
          }
          style={[homeStyles.authInput, { height: Math.max(40, inputAddrHeight), color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={address || ''}
          placeholder={t('navigation.establishment.data.address')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={setAddress} />

        {/* Phone */}
        {selectedOrganization.phone ? (
          <>
            <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('navigation.establishment.data.phone')}</Text>
            <TextInput
              style={[homeStyles.authInput, { color: COLORS.black, height: 50, borderColor: COLORS.light_secondary, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
              keyboardType='phone-pad'
              value={phone}
              placeholder={t('navigation.establishment.data.phone')}
              placeholderTextColor={COLORS.dark_secondary}
              onChangeText={text => setPhone(text)} />
          </>
        ) : (
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
        )}

        {/* Email */}
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('navigation.establishment.data.email')}</Text>
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={email || ''}
          placeholder={t('navigation.establishment.data.email')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setEmail(text.toLowerCase())}
          autoCapitalize='none' />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: (Dimensions.get('window').width / 2) - 29 }}>
            {/* P.O. box */}
            <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('navigation.establishment.data.p_o_box')}</Text>
            <TextInput
              style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
              value={p_o_box || ''}
              placeholder={t('navigation.establishment.data.p_o_box')}
              placeholderTextColor={COLORS.dark_secondary}
              onChangeText={setPOBox} />
          </View>
          <View style={{ width: (Dimensions.get('window').width / 2) - 29 }}>
            {/* Year of creation */}
            <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('navigation.establishment.data.year_of_creation')}</Text>
            <TextInput
              keyboardType='numeric'
              maxLength={4}
              style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
              value={yearOfCreation || ''}
              placeholder={t('navigation.establishment.data.year_of_creation')}
              placeholderTextColor={COLORS.dark_secondary}
              onChangeText={setYearOfCreation} />
          </View>
        </View>

        {/* Website URL */}
        <Text style={[homeStyles.authText, { color: COLORS.dark_secondary }]}>{t('navigation.establishment.data.website_url')}</Text>
        <TextInput
          style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
          value={websiteURL || ''}
          placeholder={t('navigation.establishment.data.website_url')}
          placeholderTextColor={COLORS.dark_secondary}
          onChangeText={text => setWebsiteURL(text.toLowerCase())}
          autoCapitalize='none' />

        {/* Submit */}
        <Button style={[homeStyles.authButton, { backgroundColor: COLORS.success }]} onPress={handleSubmit}>
          <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('update')}</Text>
        </Button>
      </ScrollView>
    </View>
  );
};

export default OrganizationSettingsScreen;