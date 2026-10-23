import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { AuthContext } from '../contexts/AuthContext';
import { useMediaPlayback } from '../contexts/MediaPlaybackContext';
import { getMediaProgressKey, getProgressSummary } from '../utils/mediaProgress';

/**
 * Local playback progress of a list of media, as { [id]: { completed, position, ratio } }.
 * It reloads when the screen gets focus and whenever another media starts, so the list reflects
 * what was just saved for the previous one.
 */
const useMediaProgress = items => {
  const { userInfo } = useContext(AuthContext);
  const { activeMedia } = useMediaPlayback();
  const [progress, setProgress] = useState({});
  const userId = userInfo?.id;
  const ids = useMemo(() => (items || []).map(item => item.id).join('|'), [items]);

  const load = useCallback(async () => {
    const list = items || [];
    if (!list.length) {
      setProgress({});
      return;
    }

    try {
      const pairs = await AsyncStorage.multiGet(list.map(item => getMediaProgressKey(userId, item)));
      const next = {};
      list.forEach((item, index) => {
        const summary = getProgressSummary(pairs[index]?.[1]);
        if (summary.ratio > 0) next[item.id] = summary;
      });
      setProgress(next);
    } catch {
      setProgress({});
    }
    // `items` is tracked through `ids`: callers usually rebuild the array on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [activeMedia?.id, load]);

  return progress;
};

export default useMediaProgress;
