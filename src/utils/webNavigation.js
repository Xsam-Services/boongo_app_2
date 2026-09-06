export const isBoongoWebUrl = value => {
  if (value === 'about:blank') return true;

  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'boongo7.com' || url.hostname.endsWith('.boongo7.com'))
    );
  } catch {
    return false;
  }
};

export const isSupportedExternalUrl = value => {
  try {
    const url = new URL(value);
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol);
  } catch {
    return false;
  }
};
