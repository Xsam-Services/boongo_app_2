/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PADDING } from '../tools/constants';
import i18next, { languageResources } from '../services/i18next';
import languagesList from '../services/languagesList.json'
import HeaderComponent from './header';
import useColors from '../hooks/useColors';
import homeStyles from './style';

const LanguageScreen = () => {
    // =============== Colors ===============
    const COLORS = useColors();
    // =============== Navigation ===============
    const navigation = useNavigation();
    // =============== Function to select language ===============
    const selectLanguage = (lang) => {
        i18next.changeLanguage(lang);
        navigation.goBack();
    };

    return (
        <>
            {/* Header */}
            <View style={{ backgroundColor: COLORS.white, paddingVertical: PADDING.p01 }}>
                <HeaderComponent />
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: COLORS.white, paddingHorizontal: PADDING.p01 }}>
                <SafeAreaView style={{ height: Dimensions.get('screen').height - 200, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: PADDING.p01 }}>
                    <View style={homeStyles.langView}>
                        <FlatList scrollEnabled={false} data={Object.keys(languageResources)} renderItem={({ item }) => (
                            <TouchableOpacity style={[homeStyles.langButton, { borderBottomColor: COLORS.link_color }]} onPress={() => selectLanguage(item)}>
                                <Text style={{ fontSize: 21, color: COLORS.black }}>{languagesList[item].nativeName}</Text>
                            </TouchableOpacity>
                        )} />
                    </View>
                </SafeAreaView>
            </ScrollView>
        </>
    );
};

export default LanguageScreen;