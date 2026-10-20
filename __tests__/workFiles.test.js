import { buildUploadForm, getFileKind, isDefaultCover, listWorkFiles, mapFileTypeIds } from '../src/utils/workFiles';

// React Native's FormData accepts { uri, name, type } file objects; Node's does not, so use a minimal stand-in.
global.FormData = class FakeFormData {
  constructor() {
    this._parts = [];
  }

  append(key, value) {
    this._parts.push([key, value]);
  }
};

const fields = form => Object.fromEntries(form._parts);

describe('getFileKind', () => {
  it('prefers the mime type and falls back to the extension', () => {
    expect(getFileKind({ name: 'a.mp4', type: 'video/mp4' })).toBe('video');
    expect(getFileKind({ name: 'a.bin', type: 'audio/mpeg' })).toBe('audio');
    expect(getFileKind({ name: 'photo.JPG' })).toBe('image');
    expect(getFileKind({ name: 'clip.mov', type: 'application/octet-stream' })).toBe('video');
    expect(getFileKind({ name: 'cours.pdf' })).toBe('document');
    expect(getFileKind({})).toBe('document');
  });
});

describe('mapFileTypeIds', () => {
  it('maps aliases to ids and keeps defaults for missing ones', () => {
    expect(mapFileTypeIds([{ alias: 'audio_file', id: 80 }])).toEqual({ audio: 80, document: 7, image: 6 });
  });
});

describe('buildUploadForm', () => {
  it('sends videos with the photo/video type like the work uploader expects', () => {
    const form = fields(buildUploadForm({ workId: 38, file: { name: 'e1.mp4', type: 'video/mp4', uri: 'file:///e1.mp4' } }));

    expect(form.work_id).toBe('38');
    expect(form.image_file_type_id).toBe('6');
    expect(form.video_file_url).toMatchObject({ name: 'e1.mp4', type: 'video/mp4', uri: 'file:///e1.mp4' });
    expect(form.part_title).toBeUndefined();
  });

  it('uses the audio and document fields and trims the part title', () => {
    const audio = fields(buildUploadForm({ workId: 1, file: { name: 'a.mp3', type: 'audio/mpeg', uri: 'file:///a.mp3' }, title: '  Intro  ' }));
    const doc = fields(buildUploadForm({ workId: 1, file: { name: 'c.pdf', type: 'application/pdf', uri: 'file:///c.pdf' } }));

    expect(audio.audio_file_type_id).toBe('8');
    expect(audio.audio_file_url.uri).toBe('file:///a.mp3');
    expect(audio.part_title).toBe('Intro');
    expect(doc.document_file_type_id).toBe('7');
    expect(doc.document_file_url.name).toBe('c.pdf');
  });
});

describe('listWorkFiles', () => {
  it('lists files by id without the cover image', () => {
    const files = listWorkFiles({
      photo_url: 'https://cdn/cover.png',
      audios: [{ id: 5, file_url: 'https://cdn/a.mp3' }],
      documents: [{ id: 4, file_url: 'https://cdn/d.pdf' }],
      images: [
        { id: 7, file_url: 'https://cdn/cover.png', is_video: false },
        { id: 3, file_url: 'https://cdn/e.mp4', is_video: true },
        { id: 6, file_url: 'https://cdn/p.png', is_video: false },
      ],
    });

    expect(files.map(file => [file.id, file.kind])).toEqual([[3, 'video'], [4, 'document'], [5, 'audio'], [6, 'image']]);
  });
});

describe('isDefaultCover', () => {
  it('recognises the server placeholder', () => {
    expect(isDefaultCover('https://boongo7.com/assets/img/cover.png')).toBe(true);
    expect(isDefaultCover('')).toBe(true);
    expect(isDefaultCover('https://cdn.cloudfront.net/images/works/35/abc.png')).toBe(false);
  });
});
