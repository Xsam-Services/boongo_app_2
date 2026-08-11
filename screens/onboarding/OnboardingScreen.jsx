import React from "react";
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OnboardFlow } from 'react-native-onboard';

const OnboardingScreen = ({ saveFirstTime }) => {
    return (
        <OnboardFlow
            pages={[
                {
                    title: 'Toute la connaissance de la RDC à portée de main',
                    subtitle: 'Accédez à des milliers de livres, publications et médias numériques adaptés à vos besoins et à vos études.',
                    imageUri: Image.resolveAssetSource(require('../../assets/img/onboarding/reading-glasses-pana.png')).uri,
                    primaryButtonTitle: 'Suivant',
                },
                {
                    title: 'Prenez des notes & Apprenez en ligne',
                    subtitle: 'Marquez vos références directement liées aux pages de vos ouvrages et suivez des cours dispensés par des enseignants qualifiés.',
                    imageUri: Image.resolveAssetSource(require('../../assets/img/onboarding/ebook-bro.png')).uri,
                    primaryButtonTitle: 'Suivant',
                },
                {
                    title: 'Lisez sans vous ruiner',
                    subtitle: 'Ne payez plus des ouvrages complets au prix fort. Abonnez-vous pour la durée de votre choix et consultez tous vos contenus librement.',
                    imageUri: Image.resolveAssetSource(require('../../assets/img/onboarding/bookmarks-rafiki.png')).uri,
                    primaryButtonTitle: 'Commencer',
                }
            ]}
            type={'fullscreen'}
            primaryButtonStyle={{ backgroundColor: '#E74746' }}
            primaryButtonTextStyle={{ color: '#FFF', fontWeight: 'bold' }}
            paginationSelectedColor="#DB6031"
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