import React from 'react';
import ContentLibraryScreen from './ContentLibraryScreen';

const JournalScreen = () => (
  <ContentLibraryScreen
    categoryGroup="Catégorie pour œuvre"
    emptyDescriptionKey="empty_list.description_mags"
    emptyIcon="newspaper-variant-outline"
    title="Articles"
    workType="Article"
  />
);

export default JournalScreen;
