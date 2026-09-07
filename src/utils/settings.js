export const buildSettingsPayload = values => {
  const payload = { ...values };
  // Saving the profile without a new password must not submit an empty password.
  if (!payload.password && !payload.confirm_password) {
    delete payload.password;
    delete payload.confirm_password;
  }
  // Settings does not select a role; do not send a null role as a change.
  if (payload.role_id == null) delete payload.role_id;
  return payload;
};
