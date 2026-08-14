/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import { useContext } from 'react';
import ThemeContext from '../contexts/ThemeContext';

const useColors = () => {
    const { theme } = useContext(ThemeContext);

    return {
        primary: '#3a7ced',
        primary_transparent: 'rgba(0, 89, 255, 0.3)',
        secondary: '#d3d3d3',
        info: '#3dbced',
        success: '#2ba14d',
        warning: '#ecad26',
        danger: '#db3337',
        danger_transparent: 'rgba(219, 51, 55, 0.2)',
        light: theme === 'light' ? '#e9e9e9' : '#666',
        light_danger: '#dbbbbf',
        light_primary: '#99aaff',
        light_secondary: theme === 'light' ? '#d0d0d0' : '#555',
        dark_primary: '#185acb',
        dark_secondary: '#777',
        dark_success: '#076508',
        dark_danger: '#b91115',
        dark_light: '#e3e3e3',
        night_danger: 'rgb(80, 0, 0)',
        night_primary: 'rgb(1, 35, 63)',
        white: theme === 'light' ? '#fff' : '#222',
        black: theme === 'light' ? '#222' : '#fff',
        dark: theme === 'light' ? '#777' : '#c3c3c3',
        bar_style: theme === 'light' ? 'dark-content' : 'light-content',
        link_color: theme === 'light' ? '#0f6fec' : '#006fff',
    };
};

export default useColors;