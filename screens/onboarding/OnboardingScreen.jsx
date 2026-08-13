import React from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OnboardFlow } from 'react-native-onboard';
import useColors from "../../hooks/useColors";

const OnboardingScreen = ({ saveFirstTime }) => {
    const { t } = useTranslation();
    const COLORS = useColors();

    return (
        <OnboardFlow
            pages={[
                {
                    title: t('welcome_description.work.title'),
                    subtitle: t('welcome_description.work.subtitle'),
                    imageUri: Image.resolveAssetSource(require('../../assets/img/onboarding/publish-article-online.png')).uri,
                    primaryButtonTitle: 'Suivant',
                },
                {
                    title: t('welcome_description.establishment.title'),
                    subtitle: t('welcome_description.establishment.subtitle'),
                    imageUri: Image.resolveAssetSource(require('../../assets/img/onboarding/digitalize-college.png')).uri,
                    primaryButtonTitle: 'Suivant',
                },
                {
                    title: t('welcome_description.government.title'),
                    subtitle: t('welcome_description.government.subtitle'),
                    imageUri: Image.resolveAssetSource(require('../../assets/img/onboarding/public-establishment.png')).uri,
                    primaryButtonTitle: 'Commencer',
                }
            ]}
            type={'fullscreen'}
            primaryButtonStyle={{ backgroundColor: COLORS.primary }}
            primaryButtonTextStyle={{ color: '#FFF', fontWeight: 'bold' }}
            paginationSelectedColor={COLORS.primary}
            onDone={() => {
                console.log('Onboarding completed');
                saveFirstTime()
            }}
        />
    );
}

export default OnboardingScreen;

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});