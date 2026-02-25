/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CallScreen = ({ localStream, remoteStream, onHangup }) => {
    const [localSrc, setLocalSrc] = useState(null);
    const [remoteSrc, setRemoteSrc] = useState(null);

    useEffect(() => {
        if (localStream) setLocalSrc(localStream.toURL());
        if (remoteStream) setRemoteSrc(remoteStream.toURL());
    }, [localStream, remoteStream]);

    return (
        <View style={styles.container}>
            {remoteSrc ? (
                <RTCView streamURL={remoteSrc} style={styles.remoteVideo} objectFit="cover" />
            ) : (
                <View style={[styles.remoteVideo, styles.waiting]}>
                    <Text style={{ color: '#fff' }}>En attente...</Text>
                </View>
            )}

            {localSrc && (
                <RTCView streamURL={localSrc} style={styles.localVideo} objectFit="cover" />
            )}

            <TouchableOpacity style={styles.hangupBtn} onPress={onHangup}>
                <Icon name="phone-hangup" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    remoteVideo: { flex: 1 },
    localVideo: {
        position: 'absolute',
        bottom: 80,
        right: 15,
        width: 120,
        height: 160,
        borderRadius: 8,
        overflow: 'hidden',
    },
    hangupBtn: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        backgroundColor: 'red',
        borderRadius: 40,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    waiting: { justifyContent: 'center', alignItems: 'center' },
});

export default CallScreen;
