/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Spinner from 'react-native-loading-spinner-overlay';
import * as ImagePicker from 'expo-image-picker';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
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

  // =============== Refresh control ===============
  const onRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => { setLoading(false); }, 2000);
  }, []);

  // =============== Get current organization ===============
  const getOrganization = useCallback(() => {
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
  }, [organization_id, userInfo.api_token]);

  useEffect(() => {
    getOrganization();
  }, [getOrganization]);

  // =============== Handle Image Picker ===============
  const imagePick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], base64: true, mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]?.base64) {
      const asset = result.assets[0];
      setImageData(`data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`);
    }
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

      if (!response.ok || json.success === false) {
        throw new Error(json.message || 'La modification de l’organisation a échoué.');
      }

      navigation.goBack();

    } catch (error) {
      console.error('Error:', error);
    }

    setIsLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light }} edges={['top', 'bottom']}>
      {/* Spinner */}
      <Spinner visible={isLoading} />

      {/* Loader */}
      <HeaderComponent title={t('change_organization')} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: PADDING.p10, paddingHorizontal: PADDING.p05, paddingTop: PADDING.p05 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}>
        {/* Title */}
        <Text style={{ color: COLORS.dark, fontSize: 15, lineHeight: 22, marginBottom: PADDING.p05, textAlign: 'center' }}>Mettez a jour les informations visibles sur votre organisation.</Text>

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
          style={[homeStyles.authInput, { height: Math.max(120, inputDescHeight), color: COLORS.black, borderColor: COLORS.light_secondary, textAlignVertical: 'top' }]}
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
          style={[homeStyles.authInput, { height: Math.max(96, inputAddrHeight), color: COLORS.black, borderColor: COLORS.light_secondary, textAlignVertical: 'top' }]}
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
            <TextInput
              style={[homeStyles.authInput, { color: COLORS.black, width: '32%', height: 50, borderColor: COLORS.light_secondary, borderTopEndRadius: 0, borderBottomEndRadius: 0, borderRightWidth: 0 }]}
              keyboardType='phone-pad'
              value={phoneCode || ''}
              placeholder="+243"
              placeholderTextColor={COLORS.dark_secondary}
              onChangeText={setPhoneCode} />

            <TextInput
              style={[homeStyles.authInput, { color: COLORS.black, width: '68%', height: 50, borderColor: COLORS.light_secondary, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
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
        <Button style={[homeStyles.authButton, { backgroundColor: COLORS.primary }]} onPress={handleSubmit}>
          <Text style={[homeStyles.authButtonText, { color: 'white' }]}>{t('update')}</Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrganizationSettingsScreen;
