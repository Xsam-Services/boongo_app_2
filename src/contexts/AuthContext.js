/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { createContext, useEffect, useState } from 'react'
import { ToastAndroid } from 'react-native';
import * as RNLocalize from 'react-native-localize';
import axios from 'axios';
import qs from 'qs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { API } from '../tools/constants';
import { purchaseUrl } from '../utils/payment';
import { buildSettingsPayload } from '../utils/settings';

export const AuthContext = createContext();
let onboardingCompletedCache = null;

export const AuthProvider = ({ children }) => {
    // =============== Get data ===============
    const [userInfo, setUserInfo] = useState({});
    const [paymentURL, setPaymentURL] = useState('');
    const [startRegisterInfo, setStartRegisterInfo] = useState({});
    const [endRegisterInfo, setEndRegisterInfo] = useState({});
    const [registerError, setRegisterError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [splashLoading, setSplashLoading] = useState(true);
    const [pushToken, setPushToken] = useState(null);

    const [isFirstTime, setIsFirstTime] = useState(true);

    const checkFirstTimeUser = async () => {
        // await AsyncStorage.removeItem("onboardingCompleted");
        try {
            // Use cached value if available to avoid AsyncStorage read
            const onboardingCompleted =
                onboardingCompletedCache !== null
                    ? onboardingCompletedCache
                    : await AsyncStorage.getItem("onboardingCompleted");

            if (onboardingCompletedCache === null) {
                onboardingCompletedCache = onboardingCompleted;
            }

            setIsFirstTime(onboardingCompleted !== "true");
        } catch (error) {

            setIsFirstTime(true);
        }
    };

    const saveFirstTimeCompleted = async () => {
        try {
            await AsyncStorage.setItem("onboardingCompleted", "true");
            onboardingCompletedCache = "true";
            setIsFirstTime(false);
        } catch (error) {

        }
    };

    // Get system language
    const getLanguage = () => {
        const locales = RNLocalize.getLocales();

        if (locales && locales.length > 0) {
            return locales[0].languageCode;
        }

        return 'fr';
    };

    const getPushToken = async () => {
        try {
            const token = await messaging().getToken();

            setPushToken(token);
            await AsyncStorage.setItem('pushToken', token);

        } catch (error) {
            // If the user is logged in and the token does not exist, display the error
            if (userInfo && Object.keys(userInfo).length > 0) {
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: `Error retrieving push token: ${error}`,
                    position: 'top'
                });

            }
            // If the user is logged out, do not display anything
        }
    };

    const startRegister = (firstname, lastname, surname, gender, birthdate, city, address_1, address_2, p_o_box, email, phone, username, password, confirm_password, country_id, role_id, organization_id) => {
        setIsLoading(true);
        setRegisterError(null);

        axios.post(`${API.boongo_url}/user`, {
            firstname, lastname, surname, gender, birthdate, city, address_1, address_2, p_o_box, email, phone, username, password, confirm_password, country_id, role_id, organization_id
        }).then(res => {
            const message = res.data.message;
            const userData = res.data.data.user;

            setStartRegisterInfo(userData);

            AsyncStorage.setItem('startRegisterInfo', JSON.stringify(userData));
            Toast.show({
                type: 'success',
                text1: 'Succès',
                text2: message,
                position: 'top'
            });


            setIsLoading(false);
            setRegisterError(null);

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: error.response.data?.message || error.response.data,
                    position: 'top'
                });

                setRegisterError(`${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: t('error') + ' ' + t('error_message.no_server_response') || 'Une erreur s\'est produite',
                    position: 'top'
                });
                setRegisterError(t('error') + ' ' + t('error_message.no_server_response'));

            } else {
                // An error occurred while configuring the query
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: error || 'Une erreur s\'est produite',
                    position: 'top'
                });
                setRegisterError(`${error}`);
            }

            setIsLoading(false);
        });
    };

    const checkPhoneOTP = async (isPasswordReset, phone, token) => {
        if (typeof isPasswordReset !== 'boolean' || !phone || !token) {
            Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: t('error_message.missing_parameters'),
                position: 'top'
            });

            return {
                success: false,
                error: 'missing_parameters'
            };
        }

        setIsLoading(true);

        try {
            const res = await axios.post(
                `${API.boongo_url}/password_reset/check_token/phone`,
                { phone, token }
            );

            const message = res.data.message;
            const userData = res.data.data.user;
            const passwordResetData = res.data.data.password_reset;

            Toast.show({
                type: 'success',
                text1: 'Information',
                text2: message,
                position: 'top'
            });

            if (!res.data.success) {

                setRegisterError(message);

                return {
                    success: false,
                    error: message
                };
            }

            setRegisterError(null);

            await AsyncStorage.removeItem('startRegisterInfo');

            setStartRegisterInfo({});

            if (!isPasswordReset) {
                await AsyncStorage.setItem('endRegisterInfo', JSON.stringify(userData));

                setEndRegisterInfo(userData);
            }

            return {
                success: true,
                data: {
                    user: userData,
                    passwordReset: passwordResetData
                }
            };

        } catch (error) {

            let message;

            if (error.response) {
                message = error.response.data.message || error.response.data;

            } else if (error.request) {
                message = t('error') + ' ' + t('error_message.no_server_response');

            } else {
                message = error.message;
            }

            Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: message,
                position: 'top'
            });
            setRegisterError(message);

            return {
                success: false,
                error: message
            };

        } finally {

            setIsLoading(false);

        }
    };

    const checkOTP = async (email, phone, token) => {
        setIsLoading(true);

        try {
            let res;
            let userData;
            let message;
            let emailVerified = false;
            let phoneVerified = false;

            if (email) {
                res = await axios.post(`${API.boongo_url}/password_reset/check_token/email`, { email, token });

            } else if (phone) {
                res = await axios.post(`${API.boongo_url}/password_reset/check_token/phone`, { phone, token });

            } else {
                setIsLoading(false);

                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: t('error_message.missing_parameters'),
                    position: 'top'
                });

                return 'missing_parameters';
            }

            message = res.data.message;
            userData = res.data.data.user;

            emailVerified = !!userData.email_verified_at;
            phoneVerified = !!userData.phone_verified_at;

            Toast.show({
                type: 'info',
                text1: 'Information',
                text2: message,
                position: 'top'
            });

            setIsLoading(false);

            if (res.data.success === false) {
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: message,
                    position: 'top'
                });

                setRegisterError(`${message}`);

            } else {
                setRegisterError(null);

                // === Email first ===
                if (email) {
                    // === User has phone ===
                    if (userData.phone) {
                        // Phone is verified
                        if (phoneVerified) {
                            // Everything is good, we save "endRegisterInfo"
                            await AsyncStorage.removeItem('startRegisterInfo');
                            await AsyncStorage.setItem('endRegisterInfo', JSON.stringify(userData));

                            setStartRegisterInfo({});
                            setEndRegisterInfo(userData);

                            return 'done';

                            // Phone NOT yet verified
                        } else {
                            // We do NOT save "endRegisterInfo"
                            return 'phone_not_validated';
                        }

                        // === User hasn't phone ===
                    } else {
                        // We can save "endRegisterInfo" directly
                        await AsyncStorage.removeItem('startRegisterInfo');
                        await AsyncStorage.setItem('endRegisterInfo', JSON.stringify(userData));

                        setStartRegisterInfo({});
                        setEndRegisterInfo(userData);

                        return 'done';
                    }
                }

                // === Phone first ===
                if (phone) {
                    // === User has email ===
                    if (userData.email) {
                        // Email is verified
                        if (emailVerified) {
                            // Everything is good, we save "endRegisterInfo"
                            await AsyncStorage.removeItem('startRegisterInfo');
                            await AsyncStorage.setItem('endRegisterInfo', JSON.stringify(userData));

                            setStartRegisterInfo({});
                            setEndRegisterInfo(userData);

                            return 'done';

                            // Phone NOT yet verified
                        } else {
                            // We do NOT save "endRegisterInfo"
                            return 'email_not_validated';
                        }

                        // === User hasn't email ===
                    } else {
                        // We can save "endRegisterInfo" directly
                        await AsyncStorage.removeItem('startRegisterInfo');
                        await AsyncStorage.setItem('endRegisterInfo', JSON.stringify(userData));

                        setStartRegisterInfo({});
                        setEndRegisterInfo(userData);

                        return 'done';
                    }
                }
            }

        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: error.response.data.message || error.response.data,
                    position: 'top'
                });

                setRegisterError(`${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: t('error') + ' ' + t('error_message.no_server_response'),
                    position: 'top'
                });
                setRegisterError(t('error') + ' ' + t('error_message.no_server_response'));

            } else {
                // An error occurred while configuring the query
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: `${error}`,
                    position: 'top'
                });
                setRegisterError(`${error}`);
            }

            setIsLoading(false);

            return 'error';
        }
    };

    const endRegister = (id, firstname, lastname, surname, gender, birthdate, city, address_1, address_2, p_o_box, email, phone, username, password, confirm_password, country_id, role_id, organization_id) => {
        setIsLoading(true);

        axios.put(`${API.boongo_url}/user/${id}`, {
            id, firstname, lastname, surname, gender, birthdate, city, address_1, address_2, p_o_box, email, phone, username, password, confirm_password, country_id, role_id, organization_id
        }, {
            headers: { 'Authorization': `Bearer ${endRegisterInfo.api_token}` }
        }).then(res => {
            const message = res.data.message;
            const userData = res.data.data;

            setEndRegisterInfo({});
            setUserInfo(userData);

            AsyncStorage.removeItem('endRegisterInfo');
            AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            Toast.show({
                type: 'success',
                text1: 'Succès',
                text2: message,
                position: 'top'
            });


            setIsLoading(false);

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: error.response.data.message || error.response.data,
                    position: 'top'
                });

                setRegisterError(`${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: t('error') + ' ' + t('error_message.no_server_response'),
                    position: 'top'
                });
                setRegisterError(t('error') + ' ' + t('error_message.no_server_response'));

            } else {
                // An error occurred while configuring the query
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: `${error}`,
                    position: 'top'
                });
                setRegisterError(`${error}`);
            }

            setIsLoading(false);
        });
    };

    const update = async (id, firstname, lastname, surname, gender, birthdate, city, address_1, address_2, p_o_box, email, phone, username, password, confirm_password, country_id, currency_id, role_id, organization_id) => {
        setIsLoading(true);
        try {
            const payload = buildSettingsPayload({
                id, firstname, lastname, surname, gender, birthdate, city,
                address_1, address_2, p_o_box, email, phone, username,
                password, confirm_password, country_id, currency_id, role_id, organization_id
            });
            const res = await axios.put(`${API.boongo_url}/user/${id}`, qs.stringify(payload), {
                headers: {
                    Authorization: `Bearer ${userInfo.api_token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-localization': getLanguage()
                }
            });
            if (res.data?.success === false || !res.data?.data?.id) {
                throw new Error(res.data?.message || 'Les paramètres n’ont pas pu être enregistrés.');
            }
            const userData = { ...userInfo, ...res.data.data };
            await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            setUserInfo(userData);
            Toast.show({ type: 'success', text1: 'Succès', text2: res.data.message, position: 'top' });
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Les paramètres n’ont pas pu être enregistrés.';
            Toast.show({ type: 'error', text1: 'Erreur', text2: message, position: 'top' });
            return { success: false, error: message };
        } finally {
            setIsLoading(false);
        }
    };

    const updateAvatar = (user_id, image_64) => {
        setIsLoading(true);

        axios.put(`${API.boongo_url}/user/update_avatar_picture/${user_id}`, {
            user_id, image_64
        }, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}` }
        }).then(res => {
            const message = res.data.message;
            const userData = res.data.data;

            setUserInfo(userData);

            AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            Toast.show({
                type: 'success',
                text1: 'Succès',
                text2: message,
                position: 'top'
            });


            setIsLoading(false);

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: error.response.data.message || error.response.data,
                    position: 'top'
                });


            } else if (error.request) {
                // The request was made but no response was received
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: t('error') + ' ' + t('error_message.no_server_response'),
                    position: 'top'
                });

            } else {
                // An error occurred while configuring the query
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: `${error}`,
                    position: 'top'
                });
            }

            setIsLoading(false);
        });
    };

    const changePassword = async (id, api_token, former_password, new_password, confirm_new_password) => {
        if (!id || !api_token || !former_password || !new_password || !confirm_new_password) {
            Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: t('error_message.missing_parameters'),
                position: 'top'
            });

            return {
                success: false,
                error: 'missing_parameters'
            };
        }

        setIsLoading(true);

        try {
            const res = await axios.put(
                `${API.boongo_url}/user/update_password/${id}`,
                {
                    former_password,
                    new_password,
                    confirm_new_password
                },
                {
                    headers: {
                        Authorization: `Bearer ${api_token}`
                    }
                }
            );

            const message = res.data.message;

            Toast.show({
                type: 'success',
                text1: 'Succès',
                text2: message,
                position: 'top'
            });


            return {
                success: true,
                message: message
            };

        } catch (error) {

            let message;

            if (error.response) {
                message = error.response.data.message || error.response.data;


            } else if (error.request) {
                message = t('error') + ' ' + t('error_message.no_server_response');

            } else {
                message = error.message;
            }

            Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: message,
                position: 'top'
            });

            return {
                success: false,
                error: message
            };

        } finally {

            setIsLoading(false);

        }
    };

    const changeRole = (action, user_id, role_id) => {
        setIsLoading(true);

        axios.put(`${API.boongo_url}/user/update_role/${action}/${user_id}`, { role_id }, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}` }
        }).then(res => {
            const message = res.data.message;
            const userData = res.data.data;

            setUserInfo(userData);

            AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            Toast.show({
                type: 'success',
                text1: 'Succès',
                text2: message,
                position: 'top'
            });


            setIsLoading(false);

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: error.response.data.message || error.response.data,
                    position: 'top'
                });


            } else if (error.request) {
                // The request was made but no response was received
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: t('error') + ' ' + t('error_message.no_server_response'),
                    position: 'top'
                });

            } else {
                // An error occurred while configuring the query
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: `${error}`,
                    position: 'top'
                });
            }

            setIsLoading(false);
        });
    };

    const changeOrganization = (user_id, organization_id) => {
        setIsLoading(true);

        axios.put(`${API.boongo_url}/user/update_organization/${user_id}`, { organization_id }, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}` }
        }).then(res => {
            const message = res.data.message;
            const userData = res.data.data;

            setUserInfo(userData);

            AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            Toast.show({
                type: 'success',
                text1: 'Succès',
                text2: message,
                position: 'top'
            });


            setIsLoading(false);

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: error.response.data.message || error.response.data,
                    position: 'top'
                });


            } else if (error.request) {
                // The request was made but no response was received
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: t('error') + ' ' + t('error_message.no_server_response'),
                    position: 'top'
                });

            } else {
                // An error occurred while configuring the query
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: `${error}`,
                    position: 'top'
                });
            }

            setIsLoading(false);
        });
    };

    const changeStatus = (user_id, status_id) => {
        setIsLoading(true);

        axios.put(`${API.boongo_url}/user/switch_status/${user_id}/${status_id}`, null, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}` }
        }).then(res => {
            const message = res.data.message;
            const userData = res.data.data;

            setUserInfo(userData);

            AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            Toast.show({
                type: 'success',
                text1: 'Succès',
                text2: message,
                position: 'top'
            });


            setIsLoading(false);

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: error.response.data.message || error.response.data,
                    position: 'top'
                });


            } else if (error.request) {
                // The request was made but no response was received
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: t('error') + ' ' + t('error_message.no_server_response'),
                    position: 'top'
                });

            } else {
                // An error occurred while configuring the query
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: `${error}`,
                    position: 'top'
                });
            }

            setIsLoading(false);
        });
    };

    const activateSubscriptionByCode = async (user_id, code, partner_id) => {
        setIsLoading(true);

        // Retourne toujours une promesse
        return axios.put(`${API.boongo_url}/activation_code/activate_subscription/${user_id}/${code}/${partner_id}`, null, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}` }
        })
            .then(res => {
                const message = res.data.message;
                const userData = res.data.data.user;
                const isCodeActive = userData.has_active_code; // Check here if the code has been activated

                if (isCodeActive) {
                    setUserInfo(userData);
                    AsyncStorage.setItem('userInfo', JSON.stringify(userData));
                    Toast.show({
                        type: 'success',
                        text1: 'Succès',
                        text2: message,
                        position: 'top'
                    });

                }

                setIsLoading(false);

                return isCodeActive; // Return true if the code is active
            })
            .catch(error => {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    Toast.show({
                        type: 'error',
                        text1: 'Erreur',
                        text2: error.response.data.message || error.response.data,
                        position: 'top'
                    });


                } else if (error.request) {
                    // The request was made but no response was received
                    Toast.show({
                        type: 'error',
                        text1: 'Erreur',
                        text2: t('error') + ' ' + t('error_message.no_server_response'),
                        position: 'top'
                    });

                } else {
                    // An error occurred while configuring the query
                    Toast.show({
                        type: 'error',
                        text1: 'Erreur',
                        text2: `${error}`,
                        position: 'top'
                    });
                }

                setIsLoading(false);

                // If an error occurs, we return false
                return false;
            });
    };

    const disableSubscriptionByCode = (user_id) => {
        axios.put(`${API.boongo_url}/activation_code/disable_subscription/${user_id}`, null, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}` }
        }).then(res => {
            const message = res.data.message;
            const userData = res.data.data;

            setUserInfo(userData);

            AsyncStorage.setItem('userInfo', JSON.stringify(userData));


        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code


            } else if (error.request) {
                // The request was made but no response was received


            } else {
                // An error occurred while configuring the query

            }
        });
    };

    const validateSubscription = (user_id) => {
        axios.put(`${API.boongo_url}/subscription/validate_subscription/${user_id}`, null, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}` }
        }).then(res => {
            const success = res.data.success;

            if (success) {
                const userData = res.data.data;

                setUserInfo(userData);

                AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            }

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code


            } else if (error.request) {
                // The request was made but no response was received


            } else {
                // An error occurred while configuring the query

            }
        });
    };

    const invalidateSubscription = (user_id) => {
        axios.put(`${API.boongo_url}/subscription/invalidate_subscription/${user_id}`, null, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}` }
        }).then(res => {
            const success = res.data.success;

            if (success) {
                const userData = res.data.data;

                setUserInfo(userData);

                AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            }

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code


            } else if (error.request) {
                // The request was made but no response was received


            } else {
                // An error occurred while configuring the query

            }
        });
    };

    const validateConsultations = (user_id) => {
        axios.put(`${API.boongo_url}/work/validate_consultations/${user_id}`, null, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}` }
        }).then(res => {
            const success = res.data.success;

            if (success) {
                const userData = res.data.data;

                setUserInfo(userData);

                AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            }

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code


            } else if (error.request) {
                // The request was made but no response was received


            } else {
                // An error occurred while configuring the query

            }
        });
    };

    const invalidateConsultations = (user_id) => {
        axios.put(`${API.boongo_url}/work/invalidate_consultations/${user_id}`, null, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}` }
        }).then(res => {
            const success = res.data.success;

            if (success) {
                const userData = res.data.data;

                setUserInfo(userData);

                AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            }

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code


            } else if (error.request) {
                // The request was made but no response was received


            } else {
                // An error occurred while configuring the query

            }
        });
    };

    const addToCart = (entity, user_id, work_id, subscription_id) => {
        setIsLoading(true);

        axios.post(`${API.boongo_url}/cart/add_to_cart/${entity}`, { user_id, work_id, subscription_id }, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}`, 'X-localization': getLanguage(), }
        }).then(res => {
            const success = res.data.success;

            if (success) {
                const message = res.data.message;
                const userData = res.data.data;

                setUserInfo(userData);

                AsyncStorage.setItem('userInfo', JSON.stringify(userData));
                Toast.show({
                    type: 'success',
                    text1: 'Succès',
                    text2: message,
                    position: 'top'
                });


                setIsLoading(false);
            }

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: error.response.data.message || error.response.data,
                    position: 'top'
                });


            } else if (error.request) {
                // The request was made but no response was received
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: t('error') + ' ' + t('error_message.no_server_response'),
                    position: 'top'
                });

            } else {
                // An error occurred while configuring the query
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: `${error}`,
                    position: 'top'
                });
            }

            setIsLoading(false);
        });
    };

    const removeFromCart = (cart_id, work_id, subscription_id) => {
        setIsLoading(true);

        axios.put(`${API.boongo_url}/cart/remove_from_cart/${cart_id}`, { work_id, subscription_id }, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}` }
        }).then(res => {
            const success = res.data.success;

            if (success) {
                const message = res.data.message;
                const userData = res.data.data;

                setUserInfo(userData);

                AsyncStorage.setItem('userInfo', JSON.stringify(userData));
                Toast.show({
                    type: 'success',
                    text1: 'Succès',
                    text2: message,
                    position: 'top'
                });


                setIsLoading(false);
            }

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: error.response.data.message || error.response.data,
                    position: 'top'
                });


            } else if (error.request) {
                // The request was made but no response was received
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: t('error') + ' ' + t('error_message.no_server_response'),
                    position: 'top'
                });

            } else {
                // An error occurred while configuring the query
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: `${error}`,
                    position: 'top'
                });
            }

            setIsLoading(false);
        });
    };

    const purchase = async (cart_id, entity, transaction_type_id, other_phone, channel, app_url) => {
        if (!cart_id || !entity || !transaction_type_id || !channel) {
            return { success: false, error: t('error_message.missing_parameters') };
        }

        setIsLoading(true);
        setPaymentURL('');
        await AsyncStorage.removeItem('paymentURL');

        try {
            const res = await axios.post(
                purchaseUrl(API.boongo_url, cart_id, entity),
                qs.stringify({ transaction_type_id, other_phone, channel, app_url }),
                {
                    headers: {
                        'Authorization': `Bearer ${userInfo.api_token}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json',
                        'X-localization': getLanguage()
                    }
                }
            );
            if (res.data?.success === false) {
                throw new Error(res.data?.message || 'Le paiement n’a pas pu être initialisé.');
            }

            const message = res.data?.message || 'Paiement initialisé.';
            const userData = res.data?.data?.user;
            const paymentURLData = res.data?.data?.result_response?.url || '';

            if (paymentURLData) {
                setPaymentURL(paymentURLData);
                await AsyncStorage.setItem('paymentURL', paymentURLData);
            }
            if (userData) {
                setUserInfo(userData);
                await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            }
            Toast.show({ type: 'success', text1: 'Succès', text2: message, position: 'top' });
            return { success: true, message, url: paymentURLData };
        } catch (error) {
            const message = typeof error.response?.data?.message === 'string'
                ? error.response.data.message
                : error.request
                    ? t('error_message.no_server_response')
                    : 'Le paiement n’a pas pu être initialisé.';
            Toast.show({ type: 'error', text1: 'Erreur', text2: message, position: 'top' });
            return { success: false, error: message };
        } finally {
            setIsLoading(false);
        }
    };

    const addMembership = (user_id, event_id) => {
        setIsLoading(true);

        // If user is not a member, add membership
        axios.put(`${API.boongo_url}/user/update_user_membership/event/${event_id}/add/${user_id}`, null, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}`, 'X-localization': getLanguage() }
        }).then(res => {
            // Update membership status
            const success = res.data.success;

            if (success) {
                const message = res.data.message;
                const userData = res.data.data;

                setUserInfo(userData);

                AsyncStorage.setItem('userInfo', JSON.stringify(userData));
                Toast.show({
                    type: 'success',
                    text1: 'Succès',
                    text2: message,
                    position: 'top'
                });


                setIsLoading(false);
            }

            setIsLoading(false);
        }).catch(error => {
            if (error.response) {
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: error.response.data.message || error.response.data,
                    position: 'top'
                });


            } else if (error.request) {
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: 'Erreur de connexion au serveur',
                    position: 'top'
                });

            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: `${error}`,
                    position: 'top'
                });
            }

            setIsLoading(false);
        });
    };

    const removeMembership = (user_id, event_id) => {
        setIsLoading(true);

        // If user is already member, withdraw membership
        axios.put(`${API.boongo_url}/user/update_user_membership/event/${event_id}/remove/${user_id}`, null, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}`, 'X-localization': getLanguage() }
        }).then(res => {
            // Update membership status
            const success = res.data.success;

            if (success) {
                const message = res.data.message;
                const userData = res.data.data;

                setUserInfo(userData);

                AsyncStorage.setItem('userInfo', JSON.stringify(userData));
                Toast.show({
                    type: 'success',
                    text1: 'Succès',
                    text2: message,
                    position: 'top'
                });


                setIsLoading(false);
            }

            setIsLoading(false);
        }).catch(error => {
            if (error.response) {
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: error.response.data.message || error.response.data,
                    position: 'top'
                });


            } else if (error.request) {
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: 'Erreur de connexion au serveur',
                    position: 'top'
                });

            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: `${error}`,
                    position: 'top'
                });
            }

            setIsLoading(false);
        });
    };

    const login = (username, password) => {
        setIsLoading(true);

        axios.post(`${API.boongo_url}/user/login`, {
            username, password
        }).then(async res => {
            const message = res.data.message;
            const userData = res.data.data;

            await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            setUserInfo(userData);
            Toast.show({
                type: 'success',
                text1: message,
                position: 'top'
            });


            setIsLoading(false);
            getPushToken();
        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: error.response.data?.message || 'Une erreur s\'est produite',
                    position: 'top'
                });


            } else if (error.request) {
                // The request was made but no response was received
                let errorMessage = t('error') + ' ' + t('error_message.no_server_response');
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: errorMessage || 'Une erreur s\'est produite',
                    position: 'top'
                });
            } else {
                // An error occurred while configuring the query
                Toast.show({
                    type: 'error',
                    text1: 'Erreur',
                    text2: error || 'Une erreur s\'est produite',
                    position: 'top'
                });
            }

            setIsLoading(false);
        });
    };

    const logout = () => {
        setIsLoading(true);

        AsyncStorage.removeItem('userInfo');
        AsyncStorage.removeItem('pushToken');
        AsyncStorage.removeItem('paymentURL');

        setUserInfo({});
        setPaymentURL('');
        setPushToken(null);
        setIsLoading(false);
    };

    const resetPaymentURL = () => {
        AsyncStorage.removeItem('paymentURL');

        setPaymentURL('');
    };

    const isLoggedIn = async () => {
        try {
            const storedUserInfo = await AsyncStorage.getItem('userInfo');

            if (storedUserInfo) {
                const parsedUserInfo = JSON.parse(storedUserInfo);

                if (parsedUserInfo?.id && parsedUserInfo?.api_token) {
                    setUserInfo(parsedUserInfo);
                } else {
                    await AsyncStorage.removeItem('userInfo');
                    setUserInfo({});
                }
            }

        } catch (error) {

            await AsyncStorage.removeItem('userInfo');
            setUserInfo({});
        } finally {
            setSplashLoading(false);
        }
    };

    useEffect(() => {
        const initializeApp = async () => {
            await Promise.all([checkFirstTimeUser(), isLoggedIn()]);
        };

        initializeApp();
    }, [])

    return (
        <AuthContext.Provider
            value={{
                isFirstTime, isLoading, userInfo, paymentURL, startRegisterInfo, endRegisterInfo, registerError, splashLoading, pushToken, login, logout, resetPaymentURL, startRegister, checkPhoneOTP, checkOTP, endRegister, update, updateAvatar, changePassword, changeRole, changeOrganization, changeStatus, activateSubscriptionByCode, disableSubscriptionByCode, validateSubscription, invalidateSubscription, validateConsultations, invalidateConsultations, addToCart, removeFromCart, purchase, addMembership, removeMembership, saveFirstTimeCompleted,
            }}>
            {children}
        </AuthContext.Provider>
    );
}
