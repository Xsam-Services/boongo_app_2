/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext } from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../contexts/AuthContext';
import { IMAGE_SIZE } from '../tools/constants';
import useColors from '../hooks/useColors';

const FloatingActionsButton = () => {
    // =============== Colors ===============
    const COLORS = useColors();
    // =============== Language ===============
    const { t } = useTranslation();
    // =============== Navigation ===============
    const navigation = useNavigation();
    // =============== Get contexts ===============
    const { userInfo } = useContext(AuthContext);
    // =============== Get data ===============
    const firstValue = useSharedValue(30);
    const secondValue = useSharedValue(30);
    const thirdValue = useSharedValue(30);
    const fourthValue = useSharedValue(30);
    const firstWidth = useSharedValue(60);
    const secondWidth = useSharedValue(60);
    const thirdWidth = useSharedValue(60);
    const fourthWidth = useSharedValue(60);
    const isOpen = useSharedValue(false);
    const opacity = useSharedValue(0);
    const progress = useDerivedValue(() =>
        isOpen.value ? withTiming(1) : withTiming(0),
    );

    const handlePress = () => {
        const config = {
            easing: Easing.bezier(0.68, -0.6, 0.32, 1.6),
            duration: 500,
        };

        if (isOpen.value) {
            firstWidth.value = withTiming(60, { duration: 100 }, finish => {
                if (finish) {
                    firstValue.value = withTiming(30, config);
                }
            });

            secondWidth.value = withTiming(60, { duration: 100 }, finish => {
                if (finish) {
                    secondValue.value = withDelay(50, withTiming(30, config));
                }
            });

            thirdWidth.value = withTiming(60, { duration: 100 }, finish => {
                if (finish) {
                    thirdValue.value = withDelay(100, withTiming(30, config));
                }
            });

            fourthWidth.value = withTiming(60, { duration: 100 }, finish => {
                if (finish) {
                    fourthValue.value = withDelay(130, withTiming(30, config));
                }
            });

            opacity.value = withTiming(0, { duration: 100 });

        } else {
            firstValue.value = withDelay(300, withSpring(80));
            secondValue.value = withDelay(200, withSpring(160));
            thirdValue.value = withDelay(100, withSpring(240));
            fourthValue.value = withSpring(320);
            firstWidth.value = withDelay(1300, withSpring(250));
            secondWidth.value = withDelay(1200, withSpring(250));
            thirdWidth.value = withDelay(1100, withSpring(250));
            fourthWidth.value = withDelay(1000, withSpring(250));
            opacity.value = withDelay(1200, withSpring(1));
        }

        isOpen.value = !isOpen.value;
    };

    const opacityText = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    const firstWidthStyle = useAnimatedStyle(() => {
        return {
            width: firstWidth.value,
        };
    });

    const secondWidthStyle = useAnimatedStyle(() => {
        return {
            width: secondWidth.value,
        };
    });

    const thirdWidthStyle = useAnimatedStyle(() => {
        return {
            width: thirdWidth.value,
        };
    });

    const fourthWidthStyle = useAnimatedStyle(() => {
        return {
            width: fourthWidth.value,
        };
    });

    const firstIcon = useAnimatedStyle(() => {
        const scale = interpolate(
            firstValue.value,
            [30, 80],
            [0, 1],
            Extrapolation.CLAMP,
        );

        return {
            bottom: firstValue.value,
            transform: [{ scale: scale }],
        };
    });

    const secondIcon = useAnimatedStyle(() => {
        const scale = interpolate(
            secondValue.value,
            [30, 160],
            [0, 1],
            Extrapolation.CLAMP,
        );

        return {
            bottom: secondValue.value,
            transform: [{ scale: scale }],
        };
    });

    const thirdIcon = useAnimatedStyle(() => {
        const scale = interpolate(
            thirdValue.value,
            [30, 240],
            [0, 1],
            Extrapolation.CLAMP,
        );

        return {
            bottom: thirdValue.value,
            transform: [{ scale: scale }],
        };
    });

    const fourthIcon = useAnimatedStyle(() => {
        const scale = interpolate(
            fourthValue.value,
            [30, 320],
            [0, 1],
            Extrapolation.CLAMP,
        );

        return {
            bottom: fourthValue.value,
            transform: [{ scale: scale }],
        };
    });

    const plusIcon = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${progress.value * 45}deg` }],
        };
    });

    return (
        <View style={styles.container}>
            {/* New message */}
            {/* <Animated.View style={[styles.contentContainer, fourthIcon, fourthWidthStyle, { backgroundColor: COLORS.primary }]}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => { navigation.navigate('Chats'); handlePress(); }}>
                    <View style={styles.iconContainer}>
                        <Icon name='chat-plus' size={IMAGE_SIZE.s06} color='white' />
                    </View>
                    <Animated.Text style={[styles.text, opacityText]}>{t('chat.new')}</Animated.Text>
                </TouchableOpacity>
            </Animated.View> */}

            {/* Add a work */}
            <Animated.View style={[styles.contentContainer, thirdIcon, thirdWidthStyle, { backgroundColor: COLORS.success }]}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => { navigation.navigate('AddWork', { owner: 'user', ownerId: userInfo.id }); handlePress(); }}>
                    <View style={styles.iconContainer}>
                        <Icon name='book-arrow-right' size={IMAGE_SIZE.s06} color='white' />
                    </View>
                    <Animated.Text style={[styles.text, opacityText]}>{t('work.publish_new')}</Animated.Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Add a establishment */}
            <Animated.View style={[styles.contentContainer, secondIcon, secondWidthStyle, { backgroundColor: COLORS.warning }]}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => { navigation.navigate('AddEstablishment'); handlePress(); }}>
                    <View style={styles.iconContainer}>
                        <Icon name='bank' size={IMAGE_SIZE.s06} color='white' />
                    </View>
                    <Animated.Text style={[styles.text, opacityText]}>{t('navigation.establishment.new')}</Animated.Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Add a government */}
            <Animated.View style={[styles.contentContainer, firstIcon, firstWidthStyle, { backgroundColor: COLORS.danger }]}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => { navigation.navigate('AddGovernment'); handlePress(); }}>
                    <View style={styles.iconContainer}>
                        <Icon name='city-variant' size={IMAGE_SIZE.s06} color='white' />
                    </View>
                    <Animated.Text style={[styles.text, opacityText]}>{t('navigation.government.new')}</Animated.Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Trigger button */}
            <Pressable style={[styles.contentContainer, { backgroundColor: COLORS.primary }]} onPress={() => { handlePress(); }}>
                <Animated.View style={[styles.iconContainer, plusIcon]}>
                    <Icon name='plus' size={IMAGE_SIZE.s06} color='white' />
                </Animated.View>
            </Pressable>
        </View>
    );
};

export default FloatingActionsButton;

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        position: 'absolute',
        bottom: 30,
        right: 20,
        zIndex: 999,
        width: 60,
        height: 60,
    },
    contentContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        zIndex: 997,
        width: 60,
        height: 60,
        borderRadius: 50,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    iconContainer: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        width: 26,
        height: 26,
    },
    text: {
        color: 'white',
        fontSize: 15,
    },
});
