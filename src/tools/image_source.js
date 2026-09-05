const IMAGE_URI_PATTERN = /^(https?:\/\/|file:\/\/|content:\/\/|data:image\/)/i;

export const sanitizeImageUri = uri => {
  if (typeof uri !== 'string') return null;

  const value = uri.trim();
  if (!value || !IMAGE_URI_PATTERN.test(value)) return null;

  try {
    // Backend file names may contain spaces or a stray percent character.
    return encodeURI(value.replace(/%(?![0-9a-f]{2})/gi, '%25'));
  } catch (error) {
    console.warn('URL d’image ignorée car invalide:', uri);
    return null;
  }
};

export const toImageSource = source => {
  if (typeof source === 'number') return source;

  const uri = sanitizeImageUri(source?.uri || source);
  return uri ? { uri } : null;
};
