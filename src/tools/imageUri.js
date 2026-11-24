import { WEB } from './constants';

/**
 * Normalise une URL d'image renvoyée par l'API pour qu'iOS l'accepte :
 * - URL relative → préfixée par le domaine du site
 * - http:// → https:// (App Transport Security bloque le HTTP en clair)
 * - caractères espaces/accents → encodés (iOS refuse les URL invalides)
 */
export const imageUri = (url) => {
    if (!url || typeof url !== 'string') return null;

    let u = url.trim();

    if (u.startsWith('//')) u = `https:${u}`;
    else if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = `${WEB.boongo_url}/${u.replace(/^\/+/, '')}`;

    u = u.replace(/^http:\/\//i, 'https://');

    try {
        return encodeURI(decodeURI(u));
    } catch (e) {
        return encodeURI(u);
    }
};
