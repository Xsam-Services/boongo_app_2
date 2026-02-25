/**
 * @author Xanders
 * @see https://team.xsamtech.com/xanderssamoth
 */
// Use aliases to set message
export const getTranslationKeyFromAlias = (alias, entity = null) => {
    switch (alias) {
        case 'new_user_notif':
            return 'notifications.user.new';
        case 'user_back_notif':
            return 'notifications.user.back';
        case 'new_event_notif':
            return 'notifications.event.new';
        case 'event_title_changed_notif':
            return 'notifications.event.title_changed';
        case 'invited_as_speaker_notif':
            return 'notifications.event.invitation.speaker';
        case 'invitation_notif':
            if (entity == 'circle') {
                return 'notifications.circle.invitation.member';

            } else {
                return 'notifications.event.invitation.member';
            }
        case 'membership_request_notif':
            if (entity == 'circle') {
                return 'notifications.circle.request_for_membership';

            } else {
                return 'notifications.event.request_for_membership';
            }
        case 'expulsion_notif':
            if (entity == 'circle') {
                return 'notifications.circle.request_for_membership';

            } else {
                return 'notifications.event.request_for_membership';
            }
        case 'separation_notif':
            if (entity == 'circle') {
                return 'notifications.circle.separation';

            } else {
                return 'notifications.event.separation';
            }
        case 'partnership_notif':
            return 'notifications.partnership.partner';
        case 'sponsoring_notif':
            return 'notifications.partnership.sponsor';
        case 'succeed_payment_notif':
            return 'notifications.payment.succeed';
        case 'failed_payment_notif':
            return 'notifications.payment.failed';
        case 'message_in_organization_notif':
            return 'notifications.message.to_organization';
        case 'message_in_event_notif':
            return 'notifications.message.to_event';
        case 'subscription_notif':
            if (entity == 'one') {
                return 'notifications.work.subscription.one';

            } else if (entity == 'two') {
                return 'notifications.work.subscription.two';

            } else {
                return 'notifications.work.subscription.many';
            }
        case 'work_consultation_notif':
            if (entity == 'one') {
                return 'notifications.work.consultation.one';

            } else if (entity == 'two') {
                return 'notifications.work.consultation.two';

            } else {
                return 'notifications.work.consultation.many';
            }
        case 'liked_work_notif':
            if (entity == 'one') {
                return 'notifications.work.like.one';

            } else if (entity == 'two') {
                return 'notifications.work.like.two';

            } else {
                return 'notifications.work.like.many';
            }
        case 'liked_message_notif':
            if (entity == 'one') {
                return 'notifications.work.like.one';

            } else if (entity == 'two') {
                return 'notifications.work.like.two';

            } else {
                return 'notifications.work.like.many';
            }
        default:
            return 'empty_list.title'; // Fallback
    }
};

// Group similary notifications globally
export const groupNotificationsGlobally = (notifications) => {
    if (!notifications || notifications.length === 0) return [];

    const groupedMap = new Map();

    notifications.forEach((notif) => {
        let entityId = 'null';

        // Définir l'ID d'entité principal en fonction de l'alias
        switch (notif.type.alias) {
            case 'subscription_notif':
            case 'work_consultation_notif':
            case 'liked_work_notif':
            case 'liked_message_notif':
                entityId = notif.work_id || 'null';
                break;
            case 'new_event_notif':
            case 'event_title_changed_notif':
            case 'invited_as_speaker_notif':
            case 'message_in_event_notif':
                entityId = notif.event_id || 'null';
                break;
            case 'invitation_notif':
            case 'membership_request_notif':
            case 'expulsion_notif':
            case 'separation_notif':
                entityId = notif.circle_id || 'null';
                break;
            default:
                entityId = 'global'; // pour les notifs génériques
                break;
        }

        const key = `${notif.type.alias}-${entityId}`;

        if (!groupedMap.has(key)) {
            groupedMap.set(key, {
                ...notif,
                group_count: 1,
                from_users: [notif.from_user],
            });
        } else {
            const group = groupedMap.get(key);
            group.group_count += 1;
            group.from_users.push(notif.from_user);
            groupedMap.set(key, group);
        }
    });

    const result = Array.from(groupedMap.values()).map((group) => {
        const count = group.group_count;

        return {
            ...group,
            group_entity: count === 1 ? 'one' : count === 2 ? 'two' : 'many',
        };
    });

    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return result;
};
