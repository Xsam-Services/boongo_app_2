export function notificationDestination(item) {
  const validId = value => /^[1-9]\d*$/.test(String(value ?? ''));
  const workId = item.work_id || item.work?.id || item.like?.for_work_id || (item.screen === 'WorkData' ? item.entity_id : null);
  if (validId(workId)) return { name: 'WorkData', params: { itemId: workId } };
  const eventId = item.event_id || item.event?.id || (item.screen === 'Event' ? item.entity_id : null);
  if (validId(eventId)) return { name: 'Event', params: { event_id: eventId } };
  if (['Account', 'Settings', 'Subscription'].includes(item.screen)) {
    // Subscription requires purchase parameters; a notification alone cannot supply them.
    return { name: item.screen === 'Subscription' ? 'Account' : item.screen };
  }
  return null;
}
