import { buildBatchForm, computeMove, getFileKind, isBatchKind, isDefaultCover, listWorkFiles, nextPosition } from '../src/utils/workFiles';

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

describe('buildBatchForm', () => {
  const entries = [
    { file: { name: 'a.mp3', type: 'audio/mpeg', uri: 'file:///a.mp3' }, title: '  Intro  ', position: 2, mediaLength: 184.6, cover: { name: 'c.jpg', uri: 'file:///c.jpg' } },
    { file: { name: 'b.mp4', type: 'video/mp4', uri: 'file:///b.mp4' }, title: '', position: 3, mediaLength: 0, cover: null },
  ];
  const all = form => form._parts.reduce((acc, [key, value]) => ({ ...acc, [key]: [...(acc[key] || []), value] }), {});

  it('sends aligned arrays with the title, position and length of each file', () => {
    const form = all(buildBatchForm({ workId: 9, entries }));

    expect(form.work_id).toEqual(['9']);
    expect(form['files_urls[]'].map(file => file.name)).toEqual(['a.mp3', 'b.mp4']);
    expect(form['part_titles[]']).toEqual(['Intro', '']);
    expect(form['files_names[]']).toEqual(['Intro', 'b.mp4']);
    expect(form['positions[]']).toEqual(['2', '3']);
    expect(form['media_lengths[]']).toEqual(['185', '0']);
  });

  it('attaches covers by index only where there is one', () => {
    const form = all(buildBatchForm({ workId: 9, entries }));

    expect(form['part_covers[0]']).toHaveLength(1);
    expect(form['part_covers[0]'][0]).toMatchObject({ name: 'c.jpg', type: 'image/jpeg', uri: 'file:///c.jpg' });
    expect(form['part_covers[1]']).toBeUndefined();
  });
});

describe('buildBatchForm titles for images and documents', () => {
  it('falls back to the file name for an untitled image or pdf, but not for audio or video', () => {
    const form = buildBatchForm({
      workId: 1,
      entries: [
        { file: { name: 'photo.png', type: 'image/png', uri: 'file:///p.png' } },
        { file: { name: 'cours.pdf', type: 'application/pdf', uri: 'file:///c.pdf' } },
        { file: { name: 'a.mp3', type: 'audio/mpeg', uri: 'file:///a.mp3' } },
      ],
    });
    const titles = form._parts.filter(([key]) => key === 'part_titles[]').map(([, value]) => value);

    expect(titles).toEqual(['photo', 'cours', '']);
  });
});

describe('batch helpers', () => {
  it('only audio and video are ordered and can have their own cover', () => {
    expect(['audio', 'video'].every(isBatchKind)).toBe(true);
    expect(['image', 'document'].some(isBatchKind)).toBe(false);
  });

  it('gives the next position among files of the same kind', () => {
    const files = [{ kind: 'audio', position: 1 }, { kind: 'audio', position: 4 }, { kind: 'video', position: 9 }];
    expect(nextPosition(files, 'audio')).toBe(5);
    expect(nextPosition([], 'video')).toBe(1);
    expect(nextPosition([{ kind: 'audio' }, { kind: 'audio' }], 'audio')).toBe(3);
  });
});

describe('computeMove', () => {
  const files = [
    { id: 1, kind: 'audio', position: 1 },
    { id: 2, kind: 'audio', position: 2 },
    { id: 3, kind: 'audio', position: 3 },
    { id: 9, kind: 'video', position: 1 },
  ];

  it('swaps with the neighbour and only reports changed positions', () => {
    expect(computeMove(files, 2, -1)).toEqual([{ id: 2, position: 1 }, { id: 1, position: 2 }]);
    expect(computeMove(files, 2, 1)).toEqual([{ id: 3, position: 2 }, { id: 2, position: 3 }]);
  });

  it('does not move past the ends, across kinds or documents', () => {
    expect(computeMove(files, 1, -1)).toEqual([]);
    expect(computeMove(files, 3, 1)).toEqual([]);
    expect(computeMove(files, 9, 1)).toEqual([]);
    expect(computeMove([{ id: 5, kind: 'document' }], 5, 1)).toEqual([]);
  });

  it('numbers files that had no position yet', () => {
    const loose = [{ id: 1, kind: 'audio' }, { id: 2, kind: 'audio' }];
    expect(computeMove(loose, 2, -1)).toEqual([{ id: 2, position: 1 }, { id: 1, position: 2 }]);
  });
});

describe('listWorkFiles', () => {
  it('groups files by kind, orders them by position and drops the cover image', () => {
    const files = listWorkFiles({
      photo_url: 'https://cdn/cover.png',
      audios: [{ id: 5, file_url: 'https://cdn/a.mp3', position: 2 }, { id: 8, file_url: 'https://cdn/b.mp3', position: 1 }],
      documents: [{ id: 4, file_url: 'https://cdn/d.pdf' }],
      images: [
        { id: 7, file_url: 'https://cdn/cover.png', is_video: false },
        { id: 3, file_url: 'https://cdn/e.mp4', is_video: true },
        { id: 6, file_url: 'https://cdn/p.png', is_video: false },
      ],
    });

    expect(files.map(file => [file.id, file.kind])).toEqual([[8, 'audio'], [5, 'audio'], [3, 'video'], [6, 'image'], [4, 'document']]);
  });

  it('keeps a titled image that the server also uses as the work cover', () => {
    const files = listWorkFiles({
      photo_url: 'https://cdn/p.png',
      images: [
        { id: 1, file_url: 'https://cdn/old-cover.png', part_title: null },
        { id: 2, file_url: 'https://cdn/p.png', part_title: 'Image libre' },
      ],
    });

    expect(files.map(file => file.id)).toEqual([1, 2]);
    expect(listWorkFiles({ photo_url: 'https://cdn/c.png', images: [{ id: 3, file_url: 'https://cdn/c.png', part_title: '' }] })).toEqual([]);
  });
});

describe('isDefaultCover', () => {
  it('recognises the server placeholder', () => {
    expect(isDefaultCover('https://boongo7.com/assets/img/cover.png')).toBe(true);
    expect(isDefaultCover('')).toBe(true);
    expect(isDefaultCover('https://cdn.cloudfront.net/images/works/35/abc.png')).toBe(false);
  });
});
