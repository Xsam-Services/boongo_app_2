import * as ScreenOrientation from 'expo-screen-orientation';

// The app is portrait-only except while a video is shown full screen.
const apply = async lock => {
  try {
    await ScreenOrientation.lockAsync(lock);
  } catch (error) {
    // Orientation locking is best effort: playback must not depend on it.
  }
};

export const lockPortrait = () => apply(ScreenOrientation.OrientationLock.PORTRAIT_UP);

export const lockLandscape = () => apply(ScreenOrientation.OrientationLock.LANDSCAPE);

// Re-allows portrait once the screen is already in landscape: the current orientation stays, but the
// native full-screen player can rotate back when its close button is pressed. Staying locked to
// landscape would trap that button.
export const allowRotation = () => apply(ScreenOrientation.OrientationLock.ALL_BUT_UPSIDE_DOWN);
