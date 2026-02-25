/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react'
import { SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { WEB } from '../../tools/constants';

const AboutScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView source={{ uri: `${WEB.boongo_url}/about?app=yes` }} />
    </SafeAreaView>
  );
}

export default AboutScreen;