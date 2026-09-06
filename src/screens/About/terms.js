import React from 'react';
import {WEB} from '../../tools/constants';
import AboutWebScreen from './AboutWebScreen';

export default function TermsScreen() {
  return (
    <AboutWebScreen
      titleKey="navigation.terms"
      uri={`${WEB.boongo_url}/about/terms_of_use?app=yes`}
    />
  );
}
