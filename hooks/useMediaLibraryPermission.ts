import * as MediaLibrary from 'expo-media-library';
import { useEffect, useState } from 'react';

export function useMediaLibraryPermission() {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.getPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  async function requestPermission() {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    const granted = status === 'granted';
    setHasPermission(granted);
    return granted;
  }

  return {
    hasPermission,
    requestPermission,
  };
} 