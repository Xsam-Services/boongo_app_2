import React from 'react';
import {WEB} from '../../tools/constants';
import AboutWebScreen from './AboutWebScreen';

export default function PrivacyScreen() {
  return (
    <AboutWebScreen
      titleKey="navigation.privacy"
      uri={`${WEB.boongo_url}/about/privacy_policy?app=yes`}
    />
  );
}
