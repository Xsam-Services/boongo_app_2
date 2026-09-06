import React from 'react';
import {WEB} from '../../tools/constants';
import AboutWebScreen from './AboutWebScreen';

export default function ContactScreen() {
  return (
    <AboutWebScreen
      titleKey="navigation.contact"
      uri={`${WEB.boongo_url}/about/contact?app=yes`}
    />
  );
}
