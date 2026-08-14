import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const colorScheme = useColorScheme();
    const [theme, setTheme] = useState(colorScheme || 'light');

    useEffect(() => {
        const getTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('theme');

                if (savedTheme) {
                    let themeValue = savedTheme;

                    try {
                        const parsedTheme = JSON.parse(savedTheme);
                        if (typeof parsedTheme === 'string') {
                            themeValue = parsedTheme;
                        }
                    } catch {
                        // savedTheme is already a plain string
                    }

                    if (themeValue === 'light' || themeValue === 'dark') {
                        setTheme(themeValue);
                    }
                }
            } catch (error) {
                console.log('Error loading theme:', error);
            }
        };
        getTheme();
    }, []);

    useEffect(() => {
        if (colorScheme) {
            setTheme(colorScheme);
        }
    }, [colorScheme]);

    const toggleTheme = async (newTheme) => {
        let selectedTheme;

        if (typeof newTheme === 'string' && (newTheme === 'light' || newTheme === 'dark')) {
            selectedTheme = newTheme;
        } else {
            // Si l'argument est un Event de TouchableOpacity/Button ou indéfini
            selectedTheme = theme === 'dark' ? 'light' : 'dark';
        }

        setTheme(selectedTheme);

        try {
            await AsyncStorage.setItem('theme', selectedTheme);
        } catch (error) {
            console.log('Error saving theme:', error);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;