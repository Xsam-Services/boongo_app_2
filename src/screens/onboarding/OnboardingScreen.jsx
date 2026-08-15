import React, { useState, useRef } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    SafeAreaView
} from 'react-native';
import { useTranslation } from "react-i18next";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import useColors from "../../hooks/useColors";

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ saveFirstTime }) => {
    const { t } = useTranslation();
    const COLORS = useColors();

    const [currentIndex, setCurrentIndex] = useState(0);
    const slidesRef = useRef(null);

    const slides = [
        {
            id: '1',
            title: t('welcome_description.work.title'),
            subtitle: t('welcome_description.work.subtitle'),
            image: require('../../../assets/img/onboarding/publish-article-online.png'),
            buttonText: 'Suivant',
        },
        {
            id: '2',
            title: t('welcome_description.establishment.title'),
            subtitle: t('welcome_description.establishment.subtitle'),
            image: require('../../../assets/img/onboarding/digitalize-college.png'),
            buttonText: 'Suivant',
        },
        {
            id: '3',
            title: t('welcome_description.government.title'),
            subtitle: t('welcome_description.government.subtitle'),
            image: require('../../../assets/img/onboarding/public-establishment.png'),
            buttonText: 'Commencer',
        }
    ];

    const viewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
        } else {
            saveFirstTime();
        }
    };

    const renderItem = ({ item }) => (
        <View style={[styles.slide, { width }]}>
            <Image
                source={item.image}
                style={styles.image}
                resizeMode="contain"
            />
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: COLORS.black }]}>
                    {item.title}
                </Text>
                <Text style={[styles.subtitle, { color: COLORS.dark }]}>
                    {item.subtitle}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: COLORS.light }]}>
            {/* Header with Skip Button */}
            <View style={styles.header}>
                {currentIndex < slides.length - 1 && (
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={saveFirstTime}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name="close"
                            size={30}
                            color={COLORS.dark}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Carousel */}
            <View style={styles.sliderContainer}>
                <FlatList
                    data={slides}
                    renderItem={renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={viewConfig}
                    ref={slidesRef}
                />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.paginationContainer}>
                    {slides.map((_, index) => (
                        <View
                            key={index.toString()}
                            style={[
                                styles.dot,
                                { backgroundColor: currentIndex === index ? COLORS.primary : COLORS.light_secondary },
                                currentIndex === index && styles.activeDot
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: COLORS.primary }]}
                    activeOpacity={0.8}
                    onPress={handleNext}
                >
                    <Text style={styles.buttonText}>
                        {slides[currentIndex].buttonText}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
    },
    skipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '500',
        marginRight: 4,
    },
    sliderContainer: {
        flex: 3,
    },
    slide: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    image: {
        width: width * 0.8,
        height: width * 0.8,
        marginBottom: 30,
    },
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    footer: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
    },
    dot: {
        height: 8,
        width: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    activeDot: {
        width: 20,
    },
    button: {
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default OnboardingScreen;