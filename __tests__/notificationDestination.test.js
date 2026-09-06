import { notificationDestination } from '../src/utils/notificationDestination';

describe('notificationDestination', () => {
  test('opens a work only from a real work relation', () => {
    expect(notificationDestination({ work_id: 12 })).toEqual({
      name: 'WorkData',
      params: { itemId: 12 },
    });
    expect(notificationDestination({ like: { for_work_id: 9 } })).toEqual({
      name: 'WorkData',
      params: { itemId: 9 },
    });
  });

  test('does not use a notification or like id as a work id', () => {
    expect(notificationDestination({ id: 42, like_id: 7 })).toBeNull();
  });

  test('supports stored work and event destinations', () => {
    expect(notificationDestination({ screen: 'WorkData', entity_id: '8' })).toEqual({
      name: 'WorkData',
      params: { itemId: '8' },
    });
    expect(notificationDestination({ screen: 'Event', entity_id: 3 })).toEqual({
      name: 'Event',
      params: { event_id: 3 },
    });
  });

  test('blocks unsupported or invalid destinations', () => {
    expect(notificationDestination({ screen: 'NewChat', entity_id: 1 })).toBeNull();
    expect(notificationDestination({ screen: 'WorkData', entity_id: '../1' })).toBeNull();
  });

  test('falls back safely for account notifications', () => {
    expect(notificationDestination({ screen: 'Settings' })).toEqual({ name: 'Settings' });
    expect(notificationDestination({ screen: 'Subscription' })).toEqual({ name: 'Account' });
  });
});
