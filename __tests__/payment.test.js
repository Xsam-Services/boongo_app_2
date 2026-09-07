import {formatPaymentAmount, purchaseUrl, safePaymentUrl} from '../src/utils/payment';

describe('payment helpers', () => {
  test('uses the purchase route documented in Postman', () => {
    expect(purchaseUrl('https://boongo7.com/api', 123, 'consultation')).toBe(
      'https://boongo7.com/api/cart/purchase/123/consultation',
    );
    expect(purchaseUrl('https://boongo7.com/api/', 123, 'subscription')).toBe(
      'https://boongo7.com/api/cart/purchase/123/subscription',
    );
  });

  test('accepts only secure gateway URLs', () => {
    expect(safePaymentUrl('https://pay.example.com/session/123')).toBe(
      'https://pay.example.com/session/123',
    );
    expect(safePaymentUrl('http://pay.example.com/session/123')).toBe('');
    expect(safePaymentUrl(['java', 'script:alert(1)'].join(''))).toBe('');
    expect(safePaymentUrl('not a URL')).toBe('');
  });

  test('formats a valid amount and handles a missing one', () => {
    expect(formatPaymentAmount(12500, 'CDF')).toContain('12');
    expect(formatPaymentAmount(12500, 'CDF')).toContain('CDF');
    expect(formatPaymentAmount(undefined, 'CDF')).toBe(
      'Montant calculé automatiquement',
    );
  });
});
