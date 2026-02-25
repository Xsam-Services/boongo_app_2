/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { createContext, useEffect, useState } from 'react'
import { ToastAndroid } from 'react-native';
import * as RNLocalize from 'react-native-localize';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '../tools/constants';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // =============== Get data ===============
    const [userInfo, setUserInfo] = useState({});
    const [paymentURL, setPaymentURL] = useState('');
    const [startRegisterInfo, setStartRegisterInfo] = useState({});
    const [endRegisterInfo, setEndRegisterInfo] = useState({});
    const [registerError, setRegisterError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [splashLoading, setSplashLoading] = useState(false);
    const [pushToken, setPushToken] = useState(null);

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
                ToastAndroid.show(`Error retrieving push token: ${error}`, ToastAndroid.LONG);
                console.error(`Error retrieving push token: ${error}`);
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
            ToastAndroid.show(`${message}`, ToastAndroid.LONG);
            console.log(`${message}`);

            setIsLoading(false);
            setRegisterError(null);

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);
                setRegisterError(`${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);
                setRegisterError(t('error') + ' ' + t('error_message.no_server_response'));

            } else {
                // An error occurred while configuring the query
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
                setRegisterError(`${error}`);
            }

            setIsLoading(false);
        });
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

                ToastAndroid.show(t('error_message.missing_parameters'), ToastAndroid.LONG);

                return 'missing_parameters';
            }

            message = res.data.message;
            userData = res.data.data.user;

            emailVerified = !!userData.email_verified_at;
            phoneVerified = !!userData.phone_verified_at;

            ToastAndroid.show(`${message}`, ToastAndroid.LONG);

            setIsLoading(false);

            if (res.data.success === false) {
                ToastAndroid.show(`${message}`, ToastAndroid.LONG);
                console.log(`${message}`);
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
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);
                setRegisterError(`${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);
                setRegisterError(t('error') + ' ' + t('error_message.no_server_response'));

            } else {
                // An error occurred while configuring the query
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
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
            ToastAndroid.show(`${message}`, ToastAndroid.LONG);
            console.log(`${message}`);

            setIsLoading(false);

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);
                setRegisterError(`${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);
                setRegisterError(t('error') + ' ' + t('error_message.no_server_response'));

            } else {
                // An error occurred while configuring the query
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
                setRegisterError(`${error}`);
            }

            setIsLoading(false);
        });
    };

    const update = (id, firstname, lastname, surname, gender, birthdate, city, address_1, address_2, p_o_box, email, phone, username, password, confirm_password, country_id, currency_id, role_id, organization_id) => {
        setIsLoading(true);
        console.log(`Currency ID send: ${currency_id}`);

        axios.put(`${API.boongo_url}/user/${id}`, {
            id, firstname, lastname, surname, gender, birthdate, city, address_1, address_2, p_o_box, email, phone, username, password, confirm_password, country_id, currency_id, role_id, organization_id
        }, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}` }
        }).then(res => {
            const message = res.data.message;
            const userData = res.data.data;

            console.log(`Currency ID received: ${userData.currency.id}`);
            setUserInfo(userData);

            AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            ToastAndroid.show(`${message}`, ToastAndroid.LONG);
            console.log(`Message: ${message}`);

            setIsLoading(false);

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

            } else {
                // An error occurred while configuring the query
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
            }

            setIsLoading(false);
        });
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
            ToastAndroid.show(`${message}`, ToastAndroid.LONG);
            console.log(`${message}`);

            setIsLoading(false);

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

            } else {
                // An error occurred while configuring the query
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
            }

            setIsLoading(false);
        });
    };

    const changePassword = (id, former_password, new_password, confirm_new_password) => {
        setIsLoading(true);

        axios.put(`${API.boongo_url}/user/update_password/${id}`, {
            former_password, new_password, confirm_new_password
        }, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}` }
        }).then(res => {
            const message = res.data.message;

            ToastAndroid.show(`${message}`, ToastAndroid.LONG);
            console.log(`${message}`);

            setIsLoading(false);

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

            } else {
                // An error occurred while configuring the query
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
            }

            setIsLoading(false);
        });
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
            ToastAndroid.show(`${message}`, ToastAndroid.LONG);
            console.log(`${message}`);

            setIsLoading(false);

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

            } else {
                // An error occurred while configuring the query
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
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
            ToastAndroid.show(`${message}`, ToastAndroid.LONG);
            console.log(`${message}`);

            setIsLoading(false);

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

            } else {
                // An error occurred while configuring the query
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
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
            ToastAndroid.show(`${message}`, ToastAndroid.LONG);
            console.log(`${message}`);

            setIsLoading(false);

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

            } else {
                // An error occurred while configuring the query
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
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
                    ToastAndroid.show(`${message}`, ToastAndroid.LONG);
                    console.log(`${message}`);
                }

                setIsLoading(false);

                return isCodeActive; // Return true if the code is active
            })
            .catch(error => {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                    console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

                } else if (error.request) {
                    // The request was made but no response was received
                    ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

                } else {
                    // An error occurred while configuring the query
                    ToastAndroid.show(`${error}`, ToastAndroid.LONG);
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
            console.log(`${message}`);

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                console.log(t('error') + ' ' + t('error_message.no_server_response'));

            } else {
                // An error occurred while configuring the query
                console.log(`${error}`);
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
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                console.log(t('error') + ' ' + t('error_message.no_server_response'));

            } else {
                // An error occurred while configuring the query
                console.log(`${error}`);
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
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                console.log(t('error') + ' ' + t('error_message.no_server_response'));

            } else {
                // An error occurred while configuring the query
                console.log(`${error}`);
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
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                console.log(t('error') + ' ' + t('error_message.no_server_response'));

            } else {
                // An error occurred while configuring the query
                console.log(`${error}`);
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
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                console.log(t('error') + ' ' + t('error_message.no_server_response'));

            } else {
                // An error occurred while configuring the query
                console.log(`${error}`);
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
                ToastAndroid.show(`${message}`, ToastAndroid.LONG);

                console.log(`${message}`);
                setIsLoading(false);
            }

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

            } else {
                // An error occurred while configuring the query
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
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
                ToastAndroid.show(`${message}`, ToastAndroid.LONG);

                console.log(`${message}`);
                setIsLoading(false);
            }

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

            } else {
                // An error occurred while configuring the query
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
            }

            setIsLoading(false);
        });
    };

    const purchase = (user_id, transaction_type_id, other_phone, channel, app_url) => {
        setIsLoading(true);

        axios.post(`${API.boongo_url}/cart/purchase/${user_id}`, {
            transaction_type_id, other_phone, channel, app_url
        }, {
            headers: { 'Authorization': `Bearer ${userInfo.api_token}`, 'X-localization': getLanguage() }
        }).then(res => {
            const success = res.data.success;

            if (success) {
                const message = res.data.message;
                const userData = res.data.data.user;

                if (res.data.data.result_response.url) {
                    const paymentURLData = res.data.data.result_response.url;

                    setPaymentURL(paymentURLData);

                    AsyncStorage.setItem('paymentURL', paymentURLData);
                }

                setUserInfo(userData);

                AsyncStorage.setItem('userInfo', JSON.stringify(userData));
                ToastAndroid.show(`${message}`, ToastAndroid.LONG);

                console.log(`${message}`);
                setIsLoading(false);
            }

        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

            } else {
                // An error occurred while configuring the query
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
            }

            setIsLoading(false);
        });
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
                ToastAndroid.show(`${message}`, ToastAndroid.LONG);

                console.log(`${message}`);
                setIsLoading(false);
            }

            setIsLoading(false);
        }).catch(error => {
            if (error.response) {
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                ToastAndroid.show('Erreur de connexion au serveur', ToastAndroid.LONG);

            } else {
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
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
                ToastAndroid.show(`${message}`, ToastAndroid.LONG);

                console.log(`${message}`);
                setIsLoading(false);
            }

            setIsLoading(false);
        }).catch(error => {
            if (error.response) {
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                ToastAndroid.show('Erreur de connexion au serveur', ToastAndroid.LONG);

            } else {
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
            }

            setIsLoading(false);
        });
    };

    const login = (username, password) => {
        setIsLoading(true);

        axios.post(`${API.boongo_url}/user/login`, {
            username, password
        }).then(res => {
            const message = res.data.message;
            const userData = res.data.data;

            setUserInfo(userData);

            AsyncStorage.setItem('userInfo', JSON.stringify(userData));
            ToastAndroid.show(`${message}`, ToastAndroid.LONG);

            console.log(`${message}`);
            setIsLoading(false);
            getPushToken();
        }).catch(error => {
            if (error.response) {
                // The request was made and the server responded with a status code
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

            } else {
                // An error occurred while configuring the query
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
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
            setSplashLoading(true);

            let userInfo = await AsyncStorage.getItem('userInfo');
            userInfo = JSON.parse(userInfo);

            if (userInfo) {
                setUserInfo(userInfo);
            }

            setSplashLoading(false);

        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                ToastAndroid.show(`${error.response.data.message || error.response.data}`, ToastAndroid.LONG);
                console.log(`${error.response.status} -> ${error.response.data.message || error.response.data}`);

            } else if (error.request) {
                // The request was made but no response was received
                ToastAndroid.show(t('error') + ' ' + t('error_message.no_server_response'), ToastAndroid.LONG);

            } else {
                // An error occurred while configuring the query
                ToastAndroid.show(`${error}`, ToastAndroid.LONG);
            }

            setSplashLoading(false);
        }

        setIsLoading(true);

        AsyncStorage.removeItem('userInfo');

        setUserInfo({});
        setIsLoading(false);
    };

    useEffect(() => {
        isLoggedIn();
        getPushToken();
    }, [])

    return (
        <AuthContext.Provider
            value={{ isLoading, userInfo, paymentURL, startRegisterInfo, endRegisterInfo, registerError, splashLoading, pushToken, login, logout, resetPaymentURL, startRegister, checkOTP, endRegister, update, updateAvatar, changePassword, changeRole, changeOrganization, changeStatus, activateSubscriptionByCode, disableSubscriptionByCode, validateSubscription, invalidateSubscription, validateConsultations, invalidateConsultations, addToCart, removeFromCart, purchase, addMembership, removeMembership }}>
            {children}
        </AuthContext.Provider>
    );
}