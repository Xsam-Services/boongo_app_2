import qs from 'qs';
import { buildSettingsPayload } from '../src/utils/settings';

describe('settings payload', () => {
  test('does not change the password or role when saving profile details', () => {
    const payload = buildSettingsPayload({ id: 12, firstname: 'Test', password: null, confirm_password: '', role_id: null });
    expect(payload).toEqual({ id: 12, firstname: 'Test' });
  });

  test('preserves form values through URL encoding, including a phone prefix', () => {
    const values = { id: '12', firstname: 'Élodie & Test', phone: '+243000000000', birthdate: '1990-02-03', country_id: '1', currency_id: '2', organization_id: '3', address_2: '' };
    expect(qs.parse(qs.stringify(buildSettingsPayload(values)))).toEqual(values);
  });

  test('keeps an explicitly entered password and confirmation', () => {
    const payload = buildSettingsPayload({ password: 'test-only', confirm_password: 'test-only' });
    expect(payload).toEqual({ password: 'test-only', confirm_password: 'test-only' });
  });
});
