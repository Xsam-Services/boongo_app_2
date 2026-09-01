import React from 'react';
import ContentLibraryScreen from './ContentLibraryScreen';

const MappingScreen = () => (
  <ContentLibraryScreen
    categoryGroup="Catégorie pour carte"
    emptyDescriptionKey="empty_list.description_maps"
    emptyIcon="map-outline"
    isMap
    title="Cartes"
    workType="Carte géographique"
  />
);

export default MappingScreen;
