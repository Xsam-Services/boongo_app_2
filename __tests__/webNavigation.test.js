import {
  isBoongoWebUrl,
  isSupportedExternalUrl,
} from '../src/utils/webNavigation';

describe('web navigation helpers', () => {
  test('keeps only secure Boongo pages inside the application', () => {
    expect(isBoongoWebUrl('https://boongo7.com/about')).toBe(true);
    expect(isBoongoWebUrl('https://help.boongo7.com/article')).toBe(true);
    expect(isBoongoWebUrl('http://boongo7.com/about')).toBe(false);
    expect(isBoongoWebUrl('https://boongo7.com.example.org/about')).toBe(false);
  });

  test('allows supported links to be delegated to the device', () => {
    expect(isSupportedExternalUrl('https://example.org')).toBe(true);
    expect(isSupportedExternalUrl('mailto:support@example.org')).toBe(true);
    expect(isSupportedExternalUrl('tel:+243000000000')).toBe(true);
    expect(
      isSupportedExternalUrl(['java', 'script:alert(1)'].join('')),
    ).toBe(false);
  });
});
