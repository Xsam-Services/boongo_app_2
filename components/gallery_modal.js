/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useEffect, useState, useRef } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Image, Dimensions, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import ImageViewer from 'react-native-image-zoom-viewer';
import Slider from '@react-native-community/slider';
import useColors from '../hooks/useColors';

const { width, height } = Dimensions.get('window');

const GalleryModal = ({ visible, index = 0, files = [], onClose }) => {
    const COLORS = useColors();

    const safeIndex = Number.isInteger(index) && index >= 0 && index < files.length ? index : 0;
    const [currentIndex, setCurrentIndex] = useState(safeIndex);
    const [isPlaying, setIsPlaying] = useState(true);
    const [videoProgress, setVideoProgress] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const videoRef = useRef(null);

    const currentFile = files[currentIndex] || {};

    const mediaSources = files.map(file => ({ url: file.uri }));

    useEffect(() => {
        if (!visible) {
            setCurrentIndex(safeIndex);
            setIsPlaying(true);
            setVideoProgress(0);
        }
    }, [visible]);

    const formatTime = seconds => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' + s : s}`;
    };

    return (
        <Modal visible={visible} transparent>
            <View style={[styles.container, { backgroundColor: COLORS.black }]}>
                <TouchableOpacity
                    onPress={onClose}
                    style={[styles.closeBtn, { backgroundColor: COLORS.dark_secondary }]}
                >
                    <Icon name="close" size={28} color={COLORS.white} />
                </TouchableOpacity>

                <ImageViewer
                    imageUrls={mediaSources}
                    index={currentIndex}
                    enableSwipeDown
                    onSwipeDown={onClose}
                    renderIndicator={() => null}
                    backgroundColor="black"
                    onChange={newIndex => {
                        setCurrentIndex(newIndex);
                        setIsPlaying(true);
                        setVideoProgress(0);
                    }}
                    renderImage={() => {
                        const file = files[currentIndex];
                        const uri = encodeURI(file?.uri || '');
                        const isVideo = file?.type === 'video';

                        if (isVideo) {
                            return (
                                <View style={styles.videoContainer}>
                                    <Video
                                        ref={videoRef}
                                        source={{ uri: uri }}
                                        style={StyleSheet.absoluteFill}
                                        resizeMode="contain"
                                        paused={!isPlaying}
                                        onProgress={({ currentTime }) => setVideoProgress(currentTime)}
                                        onLoad={({ duration }) => setVideoDuration(duration)}
                                        onError={e => console.log('Video error:', e)}
                                    />

                                    {/* Controls */}
                                    <View style={styles.controls}>
                                        <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)}>
                                            <Icon
                                                name={isPlaying ? 'pause-circle' : 'play-circle'}
                                                size={40}
                                                color={COLORS.white}
                                            />
                                        </TouchableOpacity>

                                        <View style={styles.progressRow}>
                                            <Text style={styles.timeText}>{formatTime(videoProgress)}</Text>
                                            <Slider
                                                style={{ flex: 1 }}
                                                minimumValue={0}
                                                maximumValue={videoDuration}
                                                value={videoProgress}
                                                minimumTrackTintColor={COLORS.white}
                                                maximumTrackTintColor={COLORS.dark_secondary}
                                                onSlidingComplete={val => {
                                                    videoRef.current?.seek(val);
                                                    setVideoProgress(val);
                                                }}
                                            />
                                            <Text style={styles.timeText}>{formatTime(videoDuration)}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        }

                        return (
                            <Image
                                source={{ uri }}
                                style={{ width, height, resizeMode: 'contain' }}
                            />
                        );
                    }}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    closeBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 5,
        borderRadius: 19,
    },
});

export default GalleryModal;
