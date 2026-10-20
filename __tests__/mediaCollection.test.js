import { buildCollections, isCollection, isVideoFile, resolveQueuePosition } from '../src/utils/mediaCollection';

const work = {
  id: 7,
  author: 'Artiste',
  photo_url: 'https://cdn/cover.jpg',
  audios: [
    { id: 12, file_url: 'https://cdn/b.mp3', file_name: 'b-track.mp3', part_title: '  Deuxième  ', part_cover_url: 'https://cdn/b.jpg', media_length: '00:03:05' },
    { id: 11, file_url: 'https://cdn/a.mp3', file_name: 'a-track.mp3', media_length: 90 },
    { id: 13, file_url: 'https://cdn/c.mp3' },
  ],
  images: [
    { id: 21, file_url: 'https://cdn/photo.jpg' },
    { id: 23, file_url: 'https://cdn/e2.mp4', part_title: 'Finale' },
    { id: 22, file_url: 'https://cdn/e1.mp4' },
  ],
};

describe('buildCollections', () => {
  it('orders tracks by id and resolves titles, artwork and durations', () => {
    const { audioTracks } = buildCollections(work);

    expect(audioTracks.map(track => track.id)).toEqual(['11', '12', '13']);
    expect(audioTracks.map(track => track.title)).toEqual(['a-track', 'Deuxième', 'Piste 3']);
    expect(audioTracks.map(track => track.duration)).toEqual([90, 185, 0]);
    expect(audioTracks[0].artwork).toBe('https://cdn/cover.jpg');
    expect(audioTracks[1].artwork).toBe('https://cdn/b.jpg');
    expect(audioTracks[0]).toMatchObject({ artist: 'Artiste', kind: 'audio', uri: 'https://cdn/a.mp3', workId: 7 });
  });

  it('keeps only video files as episodes and uses localized fallback labels', () => {
    const { videoEpisodes } = buildCollections(work, { labels: { video: 'Episode' } });

    expect(videoEpisodes.map(episode => episode.id)).toEqual(['22', '23']);
    expect(videoEpisodes.map(episode => episode.title)).toEqual(['Episode 1', 'Finale']);
    expect(videoEpisodes.every(episode => episode.kind === 'video')).toBe(true);
  });

  it('handles works without files', () => {
    expect(buildCollections(null)).toEqual({ audioTracks: [], videoEpisodes: [] });
    expect(isCollection(buildCollections({ audios: [{ id: 1, file_url: 'x.mp3' }] }))).toBe(false);
    expect(isCollection(buildCollections(work))).toBe(true);
  });
});

describe('isVideoFile', () => {
  it('detects streaming and container formats', () => {
    expect(isVideoFile('https://cdn/a.M3U8?token=1')).toBe(true);
    expect(isVideoFile('https://cdn/a.jpg')).toBe(false);
    expect(isVideoFile(undefined)).toBe(false);
  });
});

describe('resolveQueuePosition', () => {
  const items = [{ id: '1' }, { id: '2' }, { id: '3' }];

  it('returns the neighbours of the active media', () => {
    expect(resolveQueuePosition(items, { id: 2 })).toMatchObject({ index: 1, nextIndex: 2, previousIndex: 0, total: 3 });
    expect(resolveQueuePosition(items, { id: '1' })).toMatchObject({ index: 0, nextIndex: 1, previousIndex: -1 });
    expect(resolveQueuePosition(items, { id: '3' })).toMatchObject({ index: 2, nextIndex: -1, next: null });
  });

  it('treats a queue without the active media as empty', () => {
    expect(resolveQueuePosition(items, { id: '9' }).index).toBe(-1);
    expect(resolveQueuePosition(items, null).total).toBe(0);
    expect(resolveQueuePosition([], { id: '1' }).index).toBe(-1);
  });
});
