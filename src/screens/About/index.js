import React from 'react';
import {WEB} from '../../tools/constants';
import AboutWebScreen from './AboutWebScreen';

export default function AboutScreen() {
  return (
    <AboutWebScreen
      titleKey="navigation.about"
      uri={`${WEB.boongo_url}/about?app=yes`}
    />
  );
}
