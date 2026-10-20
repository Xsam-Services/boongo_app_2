const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m3u8', '.mpd'];

export const isVideoFile = url => VIDEO_EXTENSIONS.some(extension => url?.toLowerCase().includes(extension));

const identityOf = media => String(media?.id || media?.uri || 'unknown');

const parseDuration = value => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : 0;

  const text = String(value).trim();
  if (text.includes(':')) {
    const seconds = text.split(':').reduce((total, part) => total * 60 + (Number(part) || 0), 0);
    return seconds > 0 ? seconds : 0;
  }

  const numeric = Number(text);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
};

const fileNameTitle = fileName => {
  const name = String(fileName || '').trim().replace(/\.[a-z0-9]{2,5}$/i, '');
  return name || '';
};

const compareById = (first, second) => {
  const a = Number(first.id);
  const b = Number(second.id);
  return Number.isFinite(a) && Number.isFinite(b) ? a - b : 0;
};

const toItem = (file, index, kind, work, labels, workCover) => {
  const partTitle = typeof file.part_title === 'string' ? file.part_title.trim() : '';
  const fallbackLabel = kind === 'audio' ? labels.audio : labels.video;

  return {
    artist: work?.author || '',
    artwork: file.part_cover_url || workCover || undefined,
    duration: parseDuration(file.media_length),
    id: String(file.id || file.file_url),
    kind,
    partTitle,
    title: partTitle || fileNameTitle(file.file_name) || `${fallbackLabel} ${index + 1}`,
    uri: file.file_url,
    workId: work?.id,
  };
};

/**
 * Splits the files of a work into an audio album and a video series.
 * Order follows the API (ascending file id) because no explicit order field exists yet.
 */
export const buildCollections = (work, options = {}) => {
  const labels = { audio: 'Piste', video: 'Épisode', ...options.labels };
  const workCover = options.workCover || work?.photo_url;
  const withUrl = file => Boolean(file?.file_url);

  const audioFiles = [...(work?.audios || [])].filter(withUrl).sort(compareById);
  const videoFiles = [...(work?.images || [])].filter(file => withUrl(file) && isVideoFile(file.file_url)).sort(compareById);

  return {
    audioTracks: audioFiles.map((file, index) => toItem(file, index, 'audio', work, labels, workCover)),
    videoEpisodes: videoFiles.map((file, index) => toItem(file, index, 'video', work, labels, workCover)),
  };
};

export const isCollection = collections => (
  (collections?.audioTracks?.length || 0) > 1 || (collections?.videoEpisodes?.length || 0) > 1
);

/**
 * Locates the active media inside a queue. A queue that does not contain the
 * active media is considered stale and yields no neighbours.
 */
export const resolveQueuePosition = (items, activeMedia) => {
  const index = activeMedia ? (items || []).findIndex(item => identityOf(item) === identityOf(activeMedia)) : -1;
  if (index < 0) return { index: -1, next: null, nextIndex: -1, previous: null, previousIndex: -1, total: 0 };

  return {
    index,
    next: items[index + 1] || null,
    nextIndex: index + 1 < items.length ? index + 1 : -1,
    previous: items[index - 1] || null,
    previousIndex: index > 0 ? index - 1 : -1,
    total: items.length,
  };
};
