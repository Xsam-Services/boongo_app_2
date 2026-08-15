/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
import React, { createContext, useState, useContext } from 'react';

// Create the context for likes
const LikesContext = createContext();

// Provide context for managing likes
export const LikesProvider = ({ children }) => {
    const [likesData, setLikesData] = useState({});

    // Update likes for a given work
    const updateLikes = (workId, newLikes) => {
        setLikesData(prev => ({ ...prev, [workId]: newLikes }));
    };

    return (
        <LikesContext.Provider value={{ likesData, updateLikes }}>
            {children}
        </LikesContext.Provider>
    );
};

// Hook to access the context
export const useLikes = () => useContext(LikesContext);
