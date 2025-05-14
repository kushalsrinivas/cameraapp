import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

// Create the app's permanent directories
export const APP_DIRECTORY = {
	IMAGES: `${FileSystem.documentDirectory}images/`,
	EDITS: `${FileSystem.documentDirectory}edits/`,
	TEMP: `${FileSystem.cacheDirectory}temp/`,
};

/**
 * Ensures all required app directories exist
 */
export const ensureDirectories = async (): Promise<void> => {
	try {
		// Create directories if they don't exist
		for (const dir of Object.values(APP_DIRECTORY)) {
			const dirInfo = await FileSystem.getInfoAsync(dir);
			if (!dirInfo.exists) {
				await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
			}
		}
	} catch (error) {
		console.error("Error creating app directories:", error);
		throw error;
	}
};

/**
 * Moves an image from a temporary location to a permanent storage location
 * @param uri Source URI of the image (can be from camera, image picker, etc.)
 * @param quality Optional quality for the saved image (0-1)
 * @returns The URI of the image in its permanent location
 */
export const saveImagePermanently = async (
	uri: string,
	quality = 0.9,
): Promise<string> => {
	try {
		await ensureDirectories();

		// Create a stable filename based on timestamp and a random string
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(2, 8);
		const filename = `image_${timestamp}_${randomString}.jpg`;
		const destinationUri = `${APP_DIRECTORY.IMAGES}${filename}`;

		// Use ImageManipulator to ensure we get a stable file format
		// This also solves issues with content:// URIs on Android
		const result = await ImageManipulator.manipulateAsync(
			uri,
			[], // No manipulations
			{
				compress: quality,
				format: ImageManipulator.SaveFormat.JPEG,
			},
		);

		// Move the file to permanent storage
		await FileSystem.moveAsync({
			from: result.uri,
			to: destinationUri,
		});

		return destinationUri;
	} catch (error) {
		console.error("Error saving image permanently:", error);
		throw error;
	}
};

/**
 * Validates that a file exists and is accessible
 * @param uri URI of the file to validate
 * @returns Boolean indicating if the file exists and is accessible
 */
export const validateFileExists = async (uri: string): Promise<boolean> => {
	try {
		const fileInfo = await FileSystem.getInfoAsync(uri);
		return fileInfo.exists;
	} catch (error) {
		console.error("Error validating file:", error);
		return false;
	}
};

/**
 * Deletes a file if it exists
 * @param uri URI of the file to delete
 * @returns Boolean indicating if deletion was successful
 */
export const deleteFile = async (uri: string): Promise<boolean> => {
	try {
		const fileExists = await validateFileExists(uri);
		if (fileExists) {
			await FileSystem.deleteAsync(uri);
			return true;
		}
		return false;
	} catch (error) {
		console.error("Error deleting file:", error);
		return false;
	}
};

/**
 * Cleans up temporary files in the app's temp directory
 */
export const cleanupTempFiles = async (): Promise<void> => {
	try {
		const tempDir = APP_DIRECTORY.TEMP;
		const dirInfo = await FileSystem.getInfoAsync(tempDir);

		if (dirInfo.exists) {
			await FileSystem.deleteAsync(tempDir);
			await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
		}
	} catch (error) {
		console.error("Error cleaning up temp files:", error);
	}
};
