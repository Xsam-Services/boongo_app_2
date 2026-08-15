/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import ln from '../locales/ln.json';

export const languageResources = {
    en: {translation: en},
    fr: {translation: fr},
    ln: {translation: ln}
}

i18next.use(initReactI18next).init({
    compatibilityJSON: 'v3',
    lng: 'fr',
    fallbackLng: 'en',
    resources: languageResources
});

export default i18next;