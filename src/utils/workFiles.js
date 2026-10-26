import axios from 'axios';

import { API } from '../tools/constants';
import { compareByPosition, isDefaultCover } from './mediaCollection';

export { isDefaultCover };

const EXTENSIONS = {
  audio: ['mp3', 'wav', 'm4a', 'aac'],
  document: ['pdf'],
  image: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
};

export const ACCEPTED_EXTENSIONS = Object.values(EXTENSIONS).flat();

const extensionOf = name => String(name || '').split('.').pop().toLowerCase();

export const getFileKind = ({ name, type } = {}) => {
  const mime = String(type || '').toLowerCase();
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'document';

  const extension = extensionOf(name);
  return Object.keys(EXTENSIONS).find(kind => EXTENSIONS[kind].includes(extension)) || 'document';
};

const authHeaders = token => ({ 'X-localization': 'fr', Authorization: `Bearer ${token}` });

export const fetchWork = async (workId, token) => {
  const response = await axios.get(`${API.boongo_url}/work/${workId}`, { headers: authHeaders(token) });
  return response.data?.data || null;
};

const KIND_ORDER = ['audio', 'video', 'image', 'document'];

/** Every file of a work except its cover, grouped by kind and ordered by position then id. */
export const listWorkFiles = work => {
  const cover = work?.photo_url;
  const withKind = (files, kind) => (files || []).map(file => ({ ...file, kind: kind || (file.is_video ? 'video' : 'image') }));
  const all = [
    ...withKind(work?.audios, 'audio'),
    ...withKind(work?.documents, 'document'),
    // The server uses the last image sent as the work cover. Only the cover file itself (no title) is hidden:
    // an image the user sent with a title stays in the list so it can be removed.
    ...withKind(work?.images).filter(file => file.file_url !== cover || Boolean(String(file.part_title || '').trim())),
  ];
  return KIND_ORDER.flatMap(kind => all.filter(file => file.kind === kind).sort(compareByPosition));
};

export const deleteWorkFile = (fileId, token) => axios.delete(`${API.boongo_url}/file/${fileId}`, { headers: authHeaders(token) });

export const uploadWorkCover = (workId, cover, token) => axios.put(
  `${API.boongo_url}/work/add_image/${workId}`,
  `work_id=${workId}&file_name=${encodeURIComponent(cover.name)}&image_64=${encodeURIComponent(cover.value)}`,
  { headers: { ...authHeaders(token), 'Content-Type': 'application/x-www-form-urlencoded' } },
);

/** Audio tracks and video episodes are the ones that are ordered and can have their own cover. */
export const isBatchKind = kind => kind === 'audio' || kind === 'video';

const fileObject = file => ({ name: file.name || `fichier.${extensionOf(file.uri) || 'bin'}`, type: file.type || 'application/octet-stream', uri: file.uri });

/**
 * One request for several files of a work: the arrays are aligned by index.
 * entries: [{ file: { name, type, uri }, title, position, mediaLength, cover: { name, type, uri } | null }]
 */
export const buildBatchForm = ({ workId, entries }) => {
  const form = new FormData();
  form.append('work_id', String(workId));
  entries.forEach((entry, index) => {
    const title = entry.title ? entry.title.trim() : '';
    // Images and documents have no "Track N" fallback, and an untitled image could be mistaken for the work cover.
    const storedTitle = title || (isBatchKind(getFileKind(entry.file)) ? '' : String(entry.file.name || '').replace(/\.[a-z0-9]{2,5}$/i, ''));
    form.append('files_urls[]', fileObject(entry.file));
    form.append('files_names[]', title || entry.file.name || '');
    form.append('part_titles[]', storedTitle);
    form.append('positions[]', String(Number.isFinite(entry.position) ? entry.position : index + 1));
    form.append('media_lengths[]', String(Number.isFinite(entry.mediaLength) && entry.mediaLength > 0 ? Math.round(entry.mediaLength) : 0));
    if (entry.cover?.uri) form.append(`part_covers[${index}]`, fileObject({ type: 'image/jpeg', ...entry.cover }));
  });
  return form;
};

const withProgress = (onProgress, extra = {}) => ({
  headers: { ...extra.headers, 'Content-Type': 'multipart/form-data' },
  maxBodyLength: Infinity,
  onUploadProgress: event => {
    if (onProgress && event.total) onProgress(Math.min(1, event.loaded / event.total));
  },
});

/** Sends files of any type in one call (the server sets the type); the answer is the whole work, files included. */
export const uploadWorkBatch = async ({ workId, entries, token, onProgress }) => {
  const response = await axios.post(`${API.boongo_url}/work/upload_files`, buildBatchForm({ workId, entries }), withProgress(onProgress, { headers: authHeaders(token) }));
  if (response.data?.success === false) throw new Error(response.data.message || 'Envoi impossible.');
  return response.data?.data || null;
};

export const nextPosition = (files, kind) => {
  const same = (files || []).filter(file => file.kind === kind);
  const highest = same.reduce((max, file) => Math.max(max, Number(file.position) || 0), 0);
  return Math.max(highest, same.length) + 1;
};

/**
 * Position changes needed to move a file one step up (-1) or down (+1) among the files of its kind.
 * Returns [{ id, position }] for every file whose position changes, or [] when it cannot move.
 */
export const computeMove = (files, fileId, direction) => {
  const target = (files || []).find(file => String(file.id) === String(fileId));
  if (!target || !isBatchKind(target.kind)) return [];

  const same = files.filter(file => file.kind === target.kind).sort(compareByPosition);
  const from = same.findIndex(file => String(file.id) === String(fileId));
  const to = from + direction;
  if (from < 0 || to < 0 || to >= same.length) return [];

  const reordered = [...same];
  [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
  return reordered
    .map((file, index) => ({ id: file.id, position: index + 1, current: Number(file.position) }))
    .filter(change => change.position !== change.current)
    .map(({ id, position }) => ({ id, position }));
};

export const updateFilePosition = (fileId, position, token) => axios.put(
  `${API.boongo_url}/file/${fileId}`,
  { id: fileId, position },
  { headers: authHeaders(token) },
);

/** Changes the cover of one file (a data URI). The server leaves the type and name of the file untouched. */
export const updateFileCover = (fileId, imageBase64, token) => axios.put(
  `${API.boongo_url}/file/${fileId}`,
  { id: fileId, part_cover_image64: imageBase64 },
  { headers: authHeaders(token) },
);
