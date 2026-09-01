import React from 'react';
import ContentLibraryScreen from './ContentLibraryScreen';

const BookScreen = () => (
  <ContentLibraryScreen
    categoryGroup="Catégorie pour œuvre"
    emptyDescriptionKey="empty_list.description_books"
    emptyIcon="book-open-page-variant-outline"
    title="Ouvrages"
    workType="Ouvrage"
  />
);

export default BookScreen;
