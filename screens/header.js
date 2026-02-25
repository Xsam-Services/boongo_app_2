/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Image, Dimensions } from 'react-native';
import { t } from 'i18next';
import { DrawerActions, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FaIcon from 'react-native-vector-icons/FontAwesome6';
import { PADDING, TEXT_SIZE } from '../tools/constants';
import Logo from '../assets/img/icon.svg';
import LogoText from '../assets/img/text.svg';
import homeStyles from './style';
import useColors from '../hooks/useColors';
import { AuthContext } from '../contexts/AuthContext';

const HeaderComponent = ({ title }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Navigation ===============
  const navigation = useNavigation();
  const route = useRoute();

  if (route.name === 'HomeStack' || route.name === 'Media') {
    return (
      <>
        {/* Status bar */}
        <StatusBar barStyle='light-content' backgroundColor={COLORS.danger} />

        {/* Content */}
        <View style={[homeStyles.headerBanner, { backgroundColor: COLORS.white }]}>
          {/* Brand */}
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
              <Icon name='menu' size={28} color={COLORS.black} />
            </TouchableOpacity>
            <LogoText width={120} height={32} style={{ marginLeft: PADDING.p01 }} />
            {title ?
              <Text style={{ fontSize: 20, fontWeight: '500', color: COLORS.black }}>{title}</Text>
              : ''}
          </View>

          {/* Right links */}
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Icon name='magnify' size={28} color={COLORS.black} />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginLeft: PADDING.p03 }} onPress={() => navigation.navigate('Dictionary')}>
              <Icon name='book-open-blank-variant' size={28} color={COLORS.black} />
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  if (route.name === 'Establishment' || route.name === 'Government') {
    return (
      <>
        {/* Status bar */}
        <StatusBar barStyle='light-content' backgroundColor={COLORS.danger} />

        {/* Content */}
        <View style={[homeStyles.headerBanner, { backgroundColor: COLORS.white }]}>
          {/* Brand */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name='chevron-left' size={37} color={COLORS.black} />
            </TouchableOpacity>
            <Logo width={30} height={30} style={{ marginRight: PADDING.p01 }} />
            {title ?
              <Text style={{ fontSize: 20, fontWeight: '500', color: COLORS.black }}>{title}</Text>
              : ''}
          </View>

          {/* Right links */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={{ marginLeft: PADDING.p03 }} onPress={() => navigation.navigate('Dictionary')}>
              <Icon name='book-open-blank-variant' size={28} color={COLORS.black} />
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  if (route.name === 'Account') {
    const { userInfo } = useContext(AuthContext);

    // Adjust icon name
    const cleanIconName = (icon) => {
      // Separates the string by space and takes the last part, without the prefix
      const iconParts = icon.split(' ');  // Separates the prefix and the icon name
      return iconParts[iconParts.length - 1].replace(/^fa-/, '');  // Remove "fa-" if necessary
    };

    return (
      <>
        {/* Status bar */}
        <StatusBar barStyle='light-content' backgroundColor={COLORS.danger} />

        {/* Content */}
        <View style={{ backgroundColor: COLORS.white }}>
          {/* Username */}
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={{ position: 'absolute', left: 7, top: -7, zIndex: 10 }} onPress={() => navigation.goBack()}>
              <Icon name='chevron-left' size={37} color={COLORS.black} />
            </TouchableOpacity>
            <Text style={{ width: '100%', fontSize: 16, fontWeight: '400', textAlign: 'center', color: COLORS.danger }}>{`@${userInfo.username}`}</Text>
            <View style={{ flexDirection: 'row', position: 'absolute', right: 10, top: 3, zIndex: 10 }}>
              <TouchableOpacity style={{ marginRight: PADDING.p01 }} onPress={() => navigation.navigate('Notifications')}>
                <Icon name='bell-outline' size={23} color={COLORS.black} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Icon name='cog-outline' size={23} color={COLORS.black} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile */}
          <View style={{ flexDirection: 'row', width: Dimensions.get('window').width, justifyContent: 'flex-start', alignItems: 'flex-start', paddingTop: PADDING.p02, paddingHorizontal: PADDING.p02 }}>
            <Image style={{ width: 100, height: 100, borderRadius: 50, marginRight: PADDING.p02 }} source={{ uri: userInfo.avatar_url }} />
            <View style={{ flexDirection: 'column', paddingTop: PADDING.p02 }}>
              <Text style={{ fontSize: 20, fontWeight: '500', color: COLORS.black, maxWidth: '90%' }}>{`${userInfo.firstname} ${userInfo.lastname}`}</Text>
              {userInfo.email &&
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                  <Icon name='email' size={16} color={COLORS.black} style={{ marginTop: 1, marginRight: PADDING.p00 }} />
                  <Text style={{ fontSize: 13, fontWeight: '400', color: COLORS.black, maxWidth: '75%' }}>
                    {userInfo.email}
                  </Text>
                </View>
              }
              {userInfo.phone &&
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                  <Icon name='phone' size={16} color={COLORS.black} style={{ marginTop: 1, marginRight: PADDING.p00 }} />
                  <Text style={{ fontSize: 13, fontWeight: '400', color: COLORS.black, maxWidth: '75%' }}>
                    {userInfo.phone}
                  </Text>
                </View>
              }
              {userInfo.address_1 &&
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                  <Icon name='map-marker' size={16} color={COLORS.black} style={{ marginTop: 1, marginRight: PADDING.p00 }} />
                  <Text style={{ fontSize: 13, fontWeight: '400', color: COLORS.black, maxWidth: '75%' }}>
                    {userInfo.address_1}
                  </Text>
                </View>
              }
              {userInfo.last_organization ?
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                  {userInfo.last_organization.type && (
                    <FaIcon name={cleanIconName(userInfo.last_organization.type.icon)} size={16} color={COLORS.black} style={{ marginTop: 1, marginRight: PADDING.p00 }} />
                  )}
                  <Text style={{ fontSize: 13, fontWeight: '400', color: COLORS.black, maxWidth: '75%' }}>
                    {userInfo.last_organization.org_name}
                  </Text>
                </View> :
                <TouchableOpacity style={[homeStyles.authButton, { width: 210, backgroundColor: COLORS.danger, marginTop: 8, paddingHorizontal: PADDING.p02 }]} onPress={() => navigation.navigate('Settings')}>
                  <Text style={{ fontSize: TEXT_SIZE.label, fontWeight: '400', color: 'white', textAlign: 'center' }}>
                    {t('auth.organization.new')}
                  </Text>
                </TouchableOpacity>
              }
            </View>
          </View>
        </View>
      </>
    );
  }

  if (route.name === 'WorkData' ||
    route.name === 'NewsData' ||
    route.name === 'VideoPlayer' ||
    route.name === 'Audio' ||
    route.name === 'PDFViewerContent' ||
    route.name === 'Summary' ||
    route.name === 'Subscription' ||
    route.name === 'MobileSubscribe' ||
    route.name === 'BankCardSubscribe' ||
    route.name === 'Language' ||
    route.name === 'Chats') {
    return (
      <>
        {/* Status bar */}
        <StatusBar barStyle='light-content' backgroundColor={COLORS.danger} />

        {/* Content */}
        <View style={[homeStyles.headerBanner, { backgroundColor: COLORS.white }]}>
          {/* Brand */}
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name='chevron-left' size={34} color={COLORS.black} style={{ marginTop: -5 }} />
            </TouchableOpacity>
            <LogoText width={115} height={31} style={{ marginLeft: PADDING.p01 }} />
            {title ?
              <Text style={{ fontSize: 20, fontWeight: '500', color: COLORS.black }}>{title}</Text>
              : ''}
          </View>

          {/* Right links */}
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Icon name='magnify' size={28} color={COLORS.black} />
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  if (route.name === 'OrganizationSettings') {
    return (
      <>
        {/* Status bar */}
        <StatusBar barStyle='dark-content' backgroundColor={COLORS.warning} />

        {/* Content */}
        <View style={[homeStyles.headerBanner, { backgroundColor: COLORS.white }]}>
          {/* Brand */}
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name='chevron-left' size={34} color={COLORS.black} style={{ marginTop: -5 }} />
            </TouchableOpacity>
            <LogoText width={115} height={31} style={{ marginLeft: PADDING.p01 }} />
            {title ?
              <Text style={{ fontSize: 20, fontWeight: '500', color: COLORS.black }}>{title}</Text>
              : ''}
          </View>
        </View>
      </>
    );
  }

  if (route.name === 'Notifications') {
    return (
      <>
        {/* Status bar */}
        <StatusBar barStyle='dark-content' backgroundColor={COLORS.primary} />

        {/* Content */}
        <View style={[homeStyles.headerBanner, { backgroundColor: COLORS.white }]}>
          {/* Brand */}
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name='chevron-left' size={34} color={COLORS.black} style={{ marginTop: -5 }} />
            </TouchableOpacity>
            <Logo width={30} height={30} style={{ marginRight: PADDING.p01 }} />
            {title ?
              <Text style={{ fontSize: 20, fontWeight: '500', color: COLORS.black }}>{title}</Text>
              : ''}
          </View>
          <TouchableOpacity style={{ alignSelf: 'flex-end' }}>
            <Icon name='dots-vertical' size={34} color={COLORS.black} style={{ marginTop: -5, marginRight: -5 }} />
          </TouchableOpacity>
        </View>
      </>
    );
  }
};

export default HeaderComponent;