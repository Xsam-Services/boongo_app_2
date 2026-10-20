import axios from 'axios';

import { API } from '../tools/constants';

// Ids of the "Type de fichier" group, used when the list cannot be fetched.
export const DEFAULT_FILE_TYPE_IDS = { audio: 8, document: 7, image: 6 };

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

export const mapFileTypeIds = types => {
  const find = alias => (types || []).find(item => item.alias === alias)?.id;
  return {
    audio: find('audio_file') ?? DEFAULT_FILE_TYPE_IDS.audio,
    document: find('document_file') ?? DEFAULT_FILE_TYPE_IDS.document,
    image: find('image_file') ?? DEFAULT_FILE_TYPE_IDS.image,
  };
};

// The server stores photos and videos under the same "image_file" type.
const FIELDS_BY_KIND = {
  audio: ['audio_file_url', 'audio_file_type_id', 'audio'],
  document: ['document_file_url', 'document_file_type_id', 'document'],
  image: ['video_file_url', 'image_file_type_id', 'image'],
  video: ['video_file_url', 'image_file_type_id', 'image'],
};

export const buildUploadForm = ({ workId, file, title, typeIds = DEFAULT_FILE_TYPE_IDS }) => {
  const kind = getFileKind(file);
  const [fileField, typeField, typeKey] = FIELDS_BY_KIND[kind];
  const form = new FormData();
  form.append('work_id', String(workId));
  form.append(typeField, String(typeIds[typeKey]));
  form.append(fileField, { name: file.name || `fichier.${extensionOf(file.uri) || 'bin'}`, type: file.type || 'application/octet-stream', uri: file.uri });
  if (title && title.trim()) form.append('part_title', title.trim());
  return form;
};

export const isDefaultCover = url => !url || /\/assets\/img\/cover\.png/.test(String(url));

const authHeaders = token => ({ 'X-localization': 'fr', Authorization: `Bearer ${token}` });

export const fetchWork = async (workId, token) => {
  const response = await axios.get(`${API.boongo_url}/work/${workId}`, { headers: authHeaders(token) });
  return response.data?.data || null;
};

/** Every file of a work except its cover, in upload order. */
export const listWorkFiles = work => {
  const cover = work?.photo_url;
  const withKind = (files, kind) => (files || []).map(file => ({ ...file, kind: kind || (file.is_video ? 'video' : 'image') }));
  return [
    ...withKind(work?.audios, 'audio'),
    ...withKind(work?.documents, 'document'),
    ...withKind(work?.images).filter(file => file.file_url !== cover),
  ].sort((first, second) => Number(first.id) - Number(second.id));
};

export const uploadWorkFile = async ({ workId, file, title, typeIds, token, onProgress }) => {
  const response = await axios.post(`${API.boongo_url}/work/upload_files`, buildUploadForm({ workId, file, title, typeIds }), {
    headers: { ...authHeaders(token), 'Content-Type': 'multipart/form-data' },
    maxBodyLength: Infinity,
    onUploadProgress: event => {
      if (onProgress && event.total) onProgress(Math.min(1, event.loaded / event.total));
    },
  });
  if (response.data?.success === false) throw new Error(response.data.message || 'Envoi impossible.');
  return response.data?.data || null;
};

export const deleteWorkFile = (fileId, token) => axios.delete(`${API.boongo_url}/file/${fileId}`, { headers: authHeaders(token) });

export const uploadWorkCover = (workId, cover, token) => axios.put(
  `${API.boongo_url}/work/add_image/${workId}`,
  `work_id=${workId}&file_name=${encodeURIComponent(cover.name)}&image_64=${encodeURIComponent(cover.value)}`,
  { headers: { ...authHeaders(token), 'Content-Type': 'application/x-www-form-urlencoded' } },
);
