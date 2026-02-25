/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import TrackPlayer, { Capability, Event, useTrackPlayerEvents } from 'react-native-track-player';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PADDING, TEXT_SIZE } from '../tools/constants';
import useColors from '../hooks/useColors';

const SoundPlayer = ({ audioUrl, title, artist, artwork, color }) => {
    // =============== Colors ===============
    const COLORS = useColors();
    // =============== Get data ===============
    const [isPlaying, setIsPlaying] = useState(false); // Player state
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);

    // =============== Initializing the player and notifications ===============
    useEffect(() => {
        // Configure the player when the app starts
        const setupPlayer = async () => {
            await TrackPlayer.setupPlayer();
            console.log('Player is ready!');

            // Add capabilities to the player to control buttons in the notification
            await TrackPlayer.updateOptions({
                stopWithAppPause: true,
                capabilities: [
                    Capability.Play,
                    Capability.Pause,
                    Capability.Stop,
                    Capability.SeekTo
                ],
                compactCapabilities: [
                    Capability.Play,
                    Capability.Pause,
                    Capability.Stop
                ],
            });
        };

        setupPlayer();

        return () => {
            TrackPlayer.reset(); // Cleaning when the component is disassembled
        };
    }, []);

    // =============== Progress bar handling ===============
    useEffect(() => {
        const interval = setInterval(async () => {
            const progress = await TrackPlayer.getProgress();

            setPosition(progress.position);
            setDuration(progress.duration);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // =============== Function to start reading ===============
    const playAudio = async () => {
        const decodedAudioUrl = decodeURIComponent(audioUrl);

        await TrackPlayer.add({
            id: 'trackId',
            url: decodedAudioUrl,
            title: title,
            artist: artist,
            artwork: artwork, // Image for notification
        });

        await TrackPlayer.play();
        setIsPlaying(true);
    };

    // =============== Pause function ===============
    const pauseAudio = async () => {
        await TrackPlayer.pause();
        setIsPlaying(false);
    };

    // =============== Function to format duration ===============
    const formatDuration = (seconds) => {
        let hours = Math.floor(seconds / 3600);
        let minutes = Math.floor((seconds % 3600) / 60);
        let sec = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}`; // hh:mm:ss
        } else if (minutes > 0) {
            return `${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}`; // mm:ss
        } else {
            return `00:${String(sec).padStart(2, '0')}`; // ss
        }
    };

    // =============== Progress bar change handler ===============
    const onSliderChange = async (value) => {
        await TrackPlayer.seekTo(value);
        setPosition(value);
    };

    return (
        <View style={{ flexDirection: 'column', backgroundColor: COLORS.black, paddingVertical: PADDING.p00, paddingHorizontal: PADDING.p02 }}>
            {/* Track title */}
            <Text style={{ fontSize: TEXT_SIZE.label, color: color }} numberOfLines={1}>{title}</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Play/Pause button */}
                <Pressable onPress={isPlaying ? pauseAudio : playAudio} style={{ marginLeft: -10, marginRight: -10 }}>
                    <Icon name={isPlaying ? 'pause' : 'play'} size={40} color={COLORS.white} />
                </Pressable>

                {/* Progress Slider */}
                <Slider
                    value={position}
                    minimumValue={0}
                    maximumValue={duration}
                    onValueChange={onSliderChange}
                    minimumTrackTintColor={COLORS.warning}
                    maximumTrackTintColor={COLORS.light_secondary}
                    thumbTintColor={color}
                    style={{ width: '65%' }} />
                <Text style={{ color: color }}>{`${formatDuration(position)} / ${formatDuration(duration)}`}</Text>
            </View>
        </View>
    );
};

export default SoundPlayer;
