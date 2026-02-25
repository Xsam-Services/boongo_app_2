/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const colorScheme = useColorScheme(); // Get system color on launch
    const [theme, setTheme] = useState(colorScheme || 'light');

    useEffect(() => {
        // Load saved theme from storage
        const getTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('theme');
                if (savedTheme) {
                    setTheme(savedTheme);
                }
            } catch (error) {
                console.log('Error loading theme:', error);
            }
        };
        getTheme();
    }, []);

    useEffect(() => {
        // set theme to system selected theme
        if (colorScheme) {
            setTheme(colorScheme);
        }
    }, [colorScheme]);

    const toggleTheme = newTheme => {
        setTheme(newTheme);
        // Save selected theme to storage
        AsyncStorage.setItem('theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
export default ThemeContext;