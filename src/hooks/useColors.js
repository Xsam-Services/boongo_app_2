/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import { useContext } from 'react';
import ThemeContext from '../contexts/ThemeContext';

const useColors = () => {
    const { theme } = useContext(ThemeContext);
    const isLight = theme === 'light';

    return {
        // Base Brand Colors
        primary: '#3a7ced',
        primary_transparent: isLight ? 'rgba(58, 124, 237, 0.12)' : 'rgba(58, 124, 237, 0.25)',
        secondary: isLight ? '#6c757d' : '#a0a0a0',

        // Status Colors
        info: '#3dbced',
        success: '#2ba14d',
        warning: '#ecad26',
        danger: '#db3337',
        danger_transparent: isLight ? 'rgba(219, 51, 55, 0.12)' : 'rgba(219, 51, 55, 0.3)',

        // Light Variants
        light: isLight ? '#f5f6f8' : '#121212', // Background principal
        light_danger: isLight ? '#fde8e8' : '#3d1415',
        light_primary: isLight ? '#eaf2ff' : '#1a2b4c',
        light_secondary: isLight ? '#e9ecef' : '#2c2c2e',

        // Dark Variants
        dark_primary: isLight ? '#185acb' : '#5a95f5',
        dark_secondary: isLight ? '#495057' : '#cfcfcf',
        dark_success: '#076508',
        dark_danger: '#b91115',
        dark_light: isLight ? '#e3e3e3' : '#2a2a2a',

        // Contextual Neutrals
        white: isLight ? '#ffffff' : '#1e1e1e', // Cartes / Surface
        black: isLight ? '#1a1a1a' : '#f8f9fa', // Textes principaux
        dark: isLight ? '#6c757d' : '#a0a0a0',   // Textes secondaires / Sous-titres

        // System & UI
        bar_style: isLight ? 'dark-content' : 'light-content',
        link_color: isLight ? '#3a7ced' : '#649eff',
    };
};

export default useColors;