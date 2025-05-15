import { useColorScheme } from "@/hooks/useColorScheme";
import { ensureDirectories } from "@/utils/fileUtils";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Camera from "expo-camera";
import { useFonts } from "expo-font";
import * as MediaLibrary from "expo-media-library";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Request necessary permissions and initialize file system on app start
  useEffect(() => {
    (async () => {
      // Request permissions
      await Camera.useCameraPermissions();
      await MediaLibrary.requestPermissionsAsync();

      // Ensure file directories are created
      try {
        await ensureDirectories();
        console.log("App directories initialized successfully");
      } catch (error) {
        console.error("Failed to initialize app directories:", error);
      }
    })();
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
