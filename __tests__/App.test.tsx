/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../src/navigations/DrawerNavigation', () => ({ DrawerNavigation: () => null }));
jest.mock('../src/navigations/LoginStackNavigation', () => ({ LoginStackNavigation: () => null }));
jest.mock('../src/screens/AccountGuard', () => ({ children }) => children);
jest.mock('../src/screens/onboarding/OnboardingScreen', () => () => null);

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
