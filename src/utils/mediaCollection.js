const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m3u8', '.mpd'];

export const isVideoFile = url => VIDEO_EXTENSIONS.some(extension => url?.toLowerCase().includes(extension));

// The API answers with its default image when a file or a work has no cover of its own.
export const isDefaultCover = url => !url || /\/assets\/img\/cover\.png/.test(String(url));

export const formatDuration = seconds => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = value => String(value).padStart(2, '0');

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
};

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

// Explicit positions first (ascending), then the files without one by id.
const compareByPosition = (first, second) => {
  const a = Number(first.position);
  const b = Number(second.position);
  const hasA = first.position !== null && first.position !== undefined && Number.isFinite(a);
  const hasB = second.position !== null && second.position !== undefined && Number.isFinite(b);
  if (hasA && hasB && a !== b) return a - b;
  if (hasA !== hasB) return hasA ? -1 : 1;
  const idA = Number(first.id);
  const idB = Number(second.id);
  return Number.isFinite(idA) && Number.isFinite(idB) ? idA - idB : 0;
};

const toItem = (file, index, kind, work, labels, workCover) => {
  const partTitle = typeof file.part_title === 'string' ? file.part_title.trim() : '';
  const fallbackLabel = kind === 'audio' ? labels.audio : labels.video;
  // The API fills file_name with the work title when none is given, which would label every item identically.
  const fromFileName = fileNameTitle(file.file_name);
  const fileNameIsWorkTitle = fromFileName.toLowerCase() === String(work?.work_title || '').trim().toLowerCase();

  return {
    artist: work?.author || '',
    artwork: (!isDefaultCover(file.part_cover_url) && file.part_cover_url) || workCover || undefined,
    duration: parseDuration(file.media_length),
    id: String(file.id || file.file_url),
    kind,
    partTitle,
    title: partTitle || (fileNameIsWorkTitle ? '' : fromFileName) || `${fallbackLabel} ${index + 1}`,
    uri: file.file_url,
    workId: work?.id,
  };
};

/**
 * Splits the files of a work into an audio album and a video series.
 * Order follows the files' position when set, then their id.
 */
export const buildCollections = (work, options = {}) => {
  const labels = { audio: 'Piste', video: 'Épisode', ...options.labels };
  const workCover = options.workCover || work?.photo_url;
  const withUrl = file => Boolean(file?.file_url);

  const audioFiles = [...(work?.audios || [])].filter(withUrl).sort(compareByPosition);
  const videoFiles = [...(work?.images || [])].filter(file => withUrl(file) && isVideoFile(file.file_url)).sort(compareByPosition);

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

export const hasPlayableMedia = collections => (
  (collections?.audioTracks?.length || 0) > 0 || (collections?.videoEpisodes?.length || 0) > 0
);

/**
 * Where "play" should start in a list: the first item left half-way, else the first one not
 * finished yet, else the beginning. `resuming` tells whether the user already started the list.
 */
export const pickResumeIndex = (items, progress) => {
  const list = items || [];
  const partial = list.findIndex(item => {
    const entry = progress?.[item.id];
    return Boolean(entry) && !entry.completed && entry.ratio > 0;
  });
  if (partial >= 0) return { index: partial, resuming: true };

  const unfinished = list.findIndex(item => !progress?.[item.id]?.completed);
  if (unfinished < 0) return { index: 0, resuming: false };
  return { index: unfinished, resuming: unfinished > 0 };
};
