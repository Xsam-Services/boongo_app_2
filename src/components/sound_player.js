/**
 * @author Vander Otis
 * @see https://github.com/vanotis720
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import {
    useAudioPlayer,
    useAudioPlayerStatus,
    setAudioModeAsync,
} from 'expo-audio';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { PADDING, TEXT_SIZE } from '../tools/constants';
import useColors from '../hooks/useColors';

const SoundPlayer = ({ audioUrl, title, artist, artwork, color }) => {
    // =============== Colors ===============
    const COLORS = useColors();

    // =============== Audio player ===============
    const player = useAudioPlayer({
        uri: decodeURIComponent(audioUrl),
        name: title,
        artist: artist,
        artwork: artwork,
    });

    const status = useAudioPlayerStatus(player);

    // =============== Audio mode ===============
    useEffect(() => {
        const configureAudio = async () => {
            try {
                await setAudioModeAsync({
                    playsInSilentMode: true,
                    shouldPlayInBackground: true,
                    interruptionMode: 'doNotMix',
                });
            } catch (error) {
                console.error('Failed to configure audio mode:', error);
            }
        };

        configureAudio();
    }, []);

    // =============== Play / Pause ===============
    const togglePlayback = () => {
        if (status.playing) {
            player.pause();
        } else {
            player.play();
        }
    };

    // =============== Seek ===============
    const onSliderChange = (value) => {
        player.seekTo(value);
    };

    // =============== Format duration ===============
    const formatDuration = (seconds) => {
        if (!Number.isFinite(seconds) || seconds < 0) {
            return '00:00';
        }

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const sec = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')} `;
        }

        return `${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')} `;
    };

    const position = status.currentTime || 0;
    const duration = status.duration || 0;

    return (
        <View
            style={{
                flexDirection: 'column',
                backgroundColor: COLORS.black,
                paddingVertical: PADDING.p00,
                paddingHorizontal: PADDING.p02,
            }}
        >
            {/* Track title */}
            <Text
                style={{
                    fontSize: TEXT_SIZE.label,
                    color: color,
                }}
                numberOfLines={1}
            >
                {title}
            </Text>

            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                {/* Play / Pause button */}
                <Pressable
                    onPress={togglePlayback}
                    style={{
                        marginLeft: -10,
                        marginRight: -10,
                    }}
                >
                    <Icon
                        name={status.playing ? 'pause' : 'play'}
                        size={40}
                        color={COLORS.white}
                    />
                </Pressable>

                {/* Progress Slider */}
                <Slider
                    value={position}
                    minimumValue={0}
                    maximumValue={duration || 1}
                    onSlidingComplete={onSliderChange}
                    minimumTrackTintColor={COLORS.warning}
                    maximumTrackTintColor={COLORS.light_secondary}
                    thumbTintColor={color}
                    style={{
                        width: '65%',
                    }}
                />

                {/* Time */}
                <Text style={{ color: color }}>
                    {`${formatDuration(position)} / ${formatDuration(duration)}`}
                </Text >
            </View >
        </View >
    );
};

export default SoundPlayer;