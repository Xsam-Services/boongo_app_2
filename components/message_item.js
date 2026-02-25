/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, Pressable, Alert, Modal, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import FileViewer from 'react-native-file-viewer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import Video from 'react-native-video';
import { API, IMAGE_SIZE, PADDING, TEXT_SIZE } from '../tools/constants';
import useColors from '../hooks/useColors';
import AudioPlayer from '../screens/audio_screen';
import homeStyles from '../screens/style';
import { Button } from 'react-native-paper';

const MessageItem = ({ item, isOwnMessage }) => {
    // =============== Colors ===============
    const COLORS = useColors();
    // =============== Navigation ===============
    const navigation = useNavigation();
    // =============== Language ===============
    const { t } = useTranslation();
    // =============== Get contexts ===============
    const { userInfo } = useContext(AuthContext);
    // =============== Get data ===============
    const [modalVisible, setModalVisible] = useState(false);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [selectedReason, setSelectedReason] = useState(null);
    const [explanation, setExplanation] = useState('');
    const [reportReasons, setReportReasons] = useState([]);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [likes, setLikes] = useState(item.likes || []);
    const [hasLiked, setHasLiked] = useState(false);

    // Redirect to the work on a specific page
    const handlePress = () => {
        if (item.doc_uri) {
            navigation.navigate('PDFViewer', {
                docUri: item.doc_uri,
                curPage: item.doc_page || 1, // First page if page number is NULL
            });
        }
    };

    const isDocMessage = item.doc_uri !== null && item.doc_uri !== ''; // Checking if this is a work document
    const hasExternalDocuments = item.documents && item.documents.length > 0;
    const hasImagesOrVideos = (item.images && item.images.length > 0) || (item.videos && item.videos.length > 0);
    const hasAudio = item.audios && item.audios.length > 0;
    const isToxic = item.user.toxic_contents && item.user.toxic_contents.some(toxic => toxic.for_message_id === item.id);

    // Rendering images and videos
    const renderImagesAndVideos = () => {
        const mediaFiles = [...(item.images || []), ...(item.videos || [])];
        const totalMedia = mediaFiles.length;

        if (totalMedia === 1) {
            return (
                <Pressable onPress={() => setSelectedMedia(mediaFiles[0])}>
                    <Image source={{ uri: mediaFiles[0].file_url }} style={{ width: '100%', height: 200, borderRadius: 10 }} />
                </Pressable>
            );
        }

        if (totalMedia === 2) {
            return (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {mediaFiles.map((media, index) => (
                        <Pressable key={index} onPress={() => setSelectedMedia(media)}>
                            <Image source={{ uri: media.file_url }} style={{ width: '48%', height: 100, borderRadius: 10 }} />
                        </Pressable>
                    ))}
                </View>
            );
        }

        if (totalMedia === 3) {
            return (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {mediaFiles.map((media, index) => (
                        <Pressable key={index} onPress={() => setSelectedMedia(media)}>
                            <Image source={{ uri: media.file_url }} style={{ width: '32%', height: 100, borderRadius: 10 }} />
                        </Pressable>
                    ))}
                </View>
            );
        }

        if (totalMedia >= 4) {
            return (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {mediaFiles.slice(0, 4).map((media, index) => (
                        <Pressable key={index} onPress={() => setSelectedMedia(media)} style={{ width: '48%', marginBottom: 10 }}>
                            <Image source={{ uri: media.file_url }} style={{ width: '100%', height: 100, borderRadius: 10 }} />
                        </Pressable>
                    ))}
                    {totalMedia > 4 && (
                        <View style={{
                            width: '48%', height: 100, backgroundColor: COLORS.dark_secondary, justifyContent: 'center', alignItems: 'center',
                            borderRadius: 10, position: 'relative'
                        }}>
                            <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: 'bold' }}>
                                +{totalMedia - 4}
                            </Text>
                        </View>
                    )}
                </View>
            );
        }
    };

    // Rendering of external documents
    const renderExternalDocuments = () => {
        if (hasExternalDocuments) {
            return item.documents.map((file, index) => (
                <Pressable key={index} onPress={() => FileViewer.open(file.file_url)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.light_secondary, borderRadius: 10, padding: PADDING.p02, marginTop: 10 }}>
                    <Text style={{ color: isOwnMessage ? COLORS.black : COLORS.white, fontSize: TEXT_SIZE.normal, fontWeight: '500' }}>
                        {file.file_name || t('document')}
                    </Text>
                    <Text
                        style={{
                            color: COLORS.primary,
                            fontSize: TEXT_SIZE.normal,
                            fontWeight: 'bold',
                            marginLeft: PADDING.p02,
                        }}
                    >
                        {t('open')}
                    </Text>
                </Pressable>
            ));
        }
        return null;
    };

    // Audio player rendering
    const renderAudioPlayer = () => {
        if (hasAudio) {
            return item.audios.map((audio, index) => (
                <AudioPlayer key={index} audioUrl={audio.file_url} color={COLORS.primary} />
            ));
        }
        return null;
    };

    // Check if the user has already liked the message
    useEffect(() => {
        setHasLiked(likes.some(like => like.user.id === userInfo.id));
    }, [likes, userInfo.id]);

    // Handle like/unlike
    const handleLike = async () => {
        const message_id = item.id;
        const user_id = userInfo.id;

        try {
            // Call the API to switch like status
            const response = await fetch(`${API.boongo_url}/message/switch_like/${message_id}/${user_id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${userInfo.api_token}`,
                    'Content-Type': 'application/json',
                },
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Une erreur est survenue');
            }

            // Update local state based on the response
            setLikes(responseData.data.likes); // Assuming likes come back in the response
            setHasLiked(responseData.data.likes.some(like => like.user.id === userInfo.id)); // Update liked status

        } catch (error) {
            Alert.alert(t('error'), t('error_message.cannot_switch_like'));
        }
    };

    // Likes rendering
    const renderLike = () => {
        return (
            <View style={{ position: 'absolute', bottom: (0 - PADDING.p03), flexDirection: 'row', alignSelf: (isOwnMessage ? 'flex-start' : 'flex-end'), alignItems: 'center', marginHorizontal: PADDING.p03 }}>
                <View style={{ width: PADDING.p10, height: PADDING.p10, backgroundColor: (hasLiked ? COLORS.danger : '#999'), padding: PADDING.p00, borderRadius: PADDING.p10 / 2 }}>
                    <Pressable onPress={handleLike}>
                        <Icon name={hasLiked ? 'cards-heart' : 'cards-heart'} size={IMAGE_SIZE.s02} color='white' />
                    </Pressable>
                </View>
                {likes.length > 0 && (
                    <Text style={{ fontSize: 12, color: COLORS.black, fontWeight: '600', marginLeft: PADDING.p00 }}>{likes.length <= 99 ? likes.length : '99+'}</Text>
                )}
            </View>
        );
    };

    // Rendering of the Modals
    const renderMediaModal = () => { // Modal media
        if (selectedMedia) {
            return (
                <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
                        {selectedMedia.type === 'video' ? (
                            <Video source={{ uri: selectedMedia.file_url }} style={{ width: '90%', height: 300 }} controls={true} resizeMode='contain' />
                        ) : (
                            <Image source={{ uri: selectedMedia.file_url }} style={{ width: '90%', height: 300, borderRadius: 10 }} />
                        )}
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={{ position: 'absolute', top: PADDING.p07, right: PADDING.p07, padding: PADDING.p01, backgroundColor: COLORS.primary, borderRadius: PADDING.p07 }}>
                            <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>X</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            );
        }
        return null;
    };

    /*
        Handle deleting/reporting
     */
    useEffect(() => {
        if (reportModalVisible) {
            // Load report reasons
            axios.get(`${API.boongo_url}/report_reason/find_by_entity/message`)
                .then(response => setReportReasons(response.data))
                .catch(err => console.error('Error loading report reasons', err));
        }
    }, [reportModalVisible]);

    // ACTION: Delete for myself
    const handleDeleteForMyself = async () => {
        try {
            await axios.put(`${API.boongo_url}/message/delete_for_myself/${userInfo.id}/${item.id}`);
        } catch (error) {
            console.error('Message deleting error:', error);
        }
    };

    // ACTION: Delete for everybody
    const handleDeleteForEverybody = async () => {
        try {
            await axios.put(`${API.boongo_url}/message/delete_for_everybody/${item.id}`);
        } catch (error) {
            console.error('Message deleting error:', error);
        }
    };

    // ACTION: Report message
    const handleReportMessage = async () => {
        if (!selectedReason) {
            Alert.alert(t('error'), t('error_message.report_reason_empty'));

            return;
        }

        try {
            await axios.post(`${API.boongo_url}/toxic_content`, {
                for_message_id: item.id,
                explanation,
                report_reason_id: selectedReason,
                user_id: userInfo.id,
            }, {
                headers: {
                    'X-localization': 'fr',
                    'Authorization': `Bearer ${userInfo.api_token}`,
                    'X-user-id': userInfo.id,
                }
            });

            Alert.alert(t('success'), t('success_message.message_reported'));

            setReportModalVisible(false);
        } catch (error) {
            console.error('Message reporting error:', error);
        }
    };

    const renderContextMenu = () => (
        <View style={{ position: 'absolute', bottom: -70, zIndex: 5, alignSelf: 'center', backgroundColor: 'white', width: 250, padding: PADDING.p01, borderRadius: PADDING.p01 }}>
            <TouchableOpacity style={[homeStyles.authButton, { marginVertical: PADDING.p00, paddingVertical: 0 }]} onPress={handleDeleteForMyself}>
                <Text style={{ color: COLORS.black }}>{t('delete.for_me')}</Text>
            </TouchableOpacity>
            {isOwnMessage && (
                <TouchableOpacity style={[homeStyles.authButton, { marginVertical: PADDING.p00, paddingVertical: 0 }]} onPress={handleDeleteForEverybody}>
                    <Text style={{ color: COLORS.black }}>{t('delete.for_everybody')}</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity style={[homeStyles.authButton, { marginVertical: PADDING.p00, paddingVertical: 0 }]} onPress={() => setReportModalVisible(true)}>
                <Text style={{ color: COLORS.black }}>{t('report')}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderReportModal = () => {
        <Modal visible={reportModalVisible} transparent={true} animationType='slide' onRequestClose={() => setReportModalVisible(false)}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
                <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
                    {/* Title */}
                    <Text style={[homeStyles.headingText, { color: COLORS.black }]}>{t('select_report_reason')}</Text>

                    {/* Reasons list */}
                    {reportReasons.map((reason) => (
                        <Pressable key={reason.id} onPress={() => setSelectedReason(reason.id)}>
                            <Text style={{ marginVertical: 5 }}>{reason.reason_content}</Text>
                        </Pressable>
                    ))}

                    {/* Description for reason selection */}
                    <TextInput
                        style={[homeStyles.authInput, { color: COLORS.black, borderColor: COLORS.light_secondary }]}
                        value={explanation}
                        placeholder={t('explanation_optional')}
                        placeholderTextColor={COLORS.dark_secondary}
                        onChangeText={text => setExplanation(text)} />

                    {/* Send or Cancel */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Button style={[homeStyles.authButton, { width: '48%', color: COLORS.warning }]} title={t('send')} onPress={handleReportMessage} />
                        <Button style={[homeStyles.authButton, { width: '48%', color: COLORS.light_secondary }]} title={t('cancel')} onPress={() => setReportModalVisible(false)} />
                    </View>
                </View>
            </View>
        </Modal>
    };

    return (
        <>
            {contextMenuVisible && renderContextMenu()}
            <View style={{ flexDirection: 'row', alignSelf: (isOwnMessage ? 'flex-end' : 'flex-start'), alignItems: 'center', marginTop: PADDING.p01 }}>
                {/* Addressee image */}
                {!isOwnMessage && item.user.avatar_url && !item.addressee_user && (
                    <Image source={{ uri: item.user.avatar_url }} style={{ width: PADDING.p12, height: PADDING.p12, borderRadius: PADDING.p12 / 2, marginRight: PADDING.p01, }} />
                )}

                {/* Sender context menu */}
                {isOwnMessage && (
                    <>
                        <Pressable onPress={() => setContextMenuVisible(true)} style={{ marginRight: PADDING.p00 }}>
                            <Icon name='dots-vertical' size={IMAGE_SIZE.s05} color={COLORS.black} />
                        </Pressable>
                    </>
                )}

                {/* Message content */}
                <View style={{ backgroundColor: (isOwnMessage ? COLORS.primary : 'rgba(0,0,0,0.1)'), borderRadius: PADDING.p01, paddingHorizontal: PADDING.p01, paddingTop: PADDING.p01, paddingBottom: PADDING.p03, marginVertical: 4, maxWidth: '65%', opacity: (isDocMessage ? 1 : 0.8), borderWidth: 1, borderColor: (isOwnMessage ? COLORS.dark_primary : 'rgba(0,0,0,0.3)') }}>
                    {isToxic ?
                        <Text style={{ color: 'white', fontSize: TEXT_SIZE.paragraph, fontStyle: 'italic' }}>
                            {item.message_content}
                        </Text>
                        :
                        <>
                            {/* 1) Displaying images/videos, external documents or audio player */}
                            {hasImagesOrVideos && renderImagesAndVideos()}
                            {renderExternalDocuments()}
                            {renderAudioPlayer()}

                            {/* 2) Displaying the message text */}
                            {item.message_content && (
                                <Text style={{ color: !isOwnMessage ? COLORS.black : 'white', fontSize: TEXT_SIZE.normal }}>
                                    {item.message_content}
                                </Text>
                            )}

                            {/* 3) Display for a note about a work */}
                            {isDocMessage && item.doc_uri ? (
                                <Pressable
                                    onPress={handlePress}
                                    style={{ flexDirection: 'column', borderWidth: 1, borderColor: COLORS.light_secondary, borderRadius: PADDING.p01 }}>
                                    <Text style={{ fontSize: TEXT_SIZE.normal, fontWeight: '500' }}>{item.doc_title}</Text>
                                    <Text style={{ fontSize: TEXT_SIZE.label }}>{`${t('page')}: ${item.doc_page}`}</Text>
                                    <Text style={{ fontSize: TEXT_SIZE.label }}>{item.doc_note}</Text>
                                </Pressable>
                            ) : null}

                            {/* 4) Displaying likes */}
                            {renderLike()}
                        </>
                    }
                </View>

                {/* Addressee context menu */}
                {!isOwnMessage && (
                    <>
                        <Pressable onPress={() => setContextMenuVisible(true)} style={{ marginRight: PADDING.p00 }}>
                            <Icon name='dots-vertical' size={IMAGE_SIZE.s05} color={COLORS.black} />
                        </Pressable>
                    </>
                )}

                {/* Modals */}
                {renderMediaModal()}
                {renderReportModal()}
            </View>
        </>
    );
};

export default MessageItem;