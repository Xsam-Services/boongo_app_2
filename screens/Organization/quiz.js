/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext } from 'react'
import { View, ScrollView, SafeAreaView } from 'react-native'
import { WebView } from 'react-native-webview';
import { AuthContext } from '../../contexts/AuthContext';
import { API, PADDING } from '../../tools/constants';
import HeaderComponent from '../header';
import useColors from '../../hooks/useColors';

const QuizScreen = ({ route }) => {
  // =============== Colors ===============
  const COLORS = useColors();
  // =============== Get context ===============
  const { userInfo } = useContext(AuthContext);
  // =============== Get parameters ===============
  const { courseName } = route.params;
  // =============== Get data ===============

  return (
    <>
      {/* Header */}
      <View style={{ backgroundColor: COLORS.white, paddingVertical: PADDING.p01 }}>
        <HeaderComponent />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: COLORS.white, paddingHorizontal: PADDING.p01, paddingBottom: PADDING.p10 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <WebView source={{ uri: `https://baquiz.xsamtech.com/?apikey=${API.baquiz_key}&userid=${userInfo.id}&course=${courseName}` }} />
        </SafeAreaView>
      </ScrollView>
    </>
  );
};

export default QuizScreen;