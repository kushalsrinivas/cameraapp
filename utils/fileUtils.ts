import { FILTERS } from "@/constants/CameraConfig";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

// Import LUT files handled at runtime using the asset system
// Since the PNG files may not exist yet, we won't use static imports

// Define a type for LUT file modules
type LutModule = number;

// LUT file mapping
const LUT_FILES: Record<string, LutModule | null> = {
	"luts/tokyodeception.png": null,
	"luts/chinatown.png": null,
};

// LUT file mapping for PNG files only
const PNG_LUT_FILES: Record<string, LutModule | null> = {
	"luts/tokyodeception.png": null,
	"luts/chinatown.png": null,
};

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
 * Applies a filter to an image
 * @param uri Source URI of the image
 * @param filterIndex Index of the filter to apply
 * @returns The URI of the filtered image
 */
export const applyFilterToImage = async (
	uri: string,
	filterIndex: number,
): Promise<string> => {
	// If it's the normal filter (index 0), return the original image
	if (filterIndex === 0) {
		return uri;
	}

	try {
		await ensureDirectories();

		// Create a temporary filename for the filtered image
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(2, 8);
		const filename = `filtered_${timestamp}_${randomString}.jpg`;
		const destinationUri = `${APP_DIRECTORY.TEMP}${filename}`;

		// Get the filter properties
		const filter = FILTERS[filterIndex];

		// For LUT-based filtering, we'll need to implement this in the camera component
		// since it requires gl-react Surface rendering which needs to be in a React component
		
		// For now, apply filter using basic image manipulation
		// This serves as a fallback for when LUT processing is not available
		let operations: ImageManipulator.Action[] = [];
		
		// Apply different operations based on filter type
		switch (filter.name) {
			case "Ilford HP5": 
				// Black and white filter
				operations = [
					{ resize: { width: 2000 } }, // Resize to maintain quality
					// Using unknown first before casting to Action
					{ grayscale: true } as unknown as ImageManipulator.Action
				];
				break;
				
			case "Polaroid 600":
				// Polaroid effect - use basic operations instead of blur
				operations = [
					{ resize: { width: 2000 } },
					// Remove blur operation as it's not supported in the type
				];
				break;
				
			case "Lomo LC-A":
				// Lomo effect with vignette - use basic operations instead of saturate
				operations = [
					{ resize: { width: 2000 } },
					// Remove saturate operation as it's not supported in the type
				];
				break;
				
			default:
				// Basic resize for other filters
				operations = [
					{ resize: { width: 2000 } }
				];
		}
		
		// Apply the operations
		const result = await ImageManipulator.manipulateAsync(
			uri,
			operations,
			{
				compress: 0.9,
				format: ImageManipulator.SaveFormat.JPEG,
			}
		);
		
		// Move the filtered image to temp directory
		await FileSystem.moveAsync({
			from: result.uri,
			to: destinationUri,
		});
		
		return destinationUri;
	} catch (error) {
		console.error("Error applying filter to image:", error);
		// Return original URI if filtering fails
		return uri;
	}
};

/**
 * Load a LUT filter asset from the assets directory
 * @param filePath Path to the LUT file in the assets directory
 * @returns The local URI of the loaded asset
 */
export const loadLutAsset = async (filePath: string): Promise<string | null> => {
	try {
		if (!filePath) return null;
		
		const isPngFile = filePath.toLowerCase().endsWith('.png');
		
		if (isPngFile) {
			// Handle PNG files with static imports
			const assetModule = PNG_LUT_FILES[filePath];
			
			if (!assetModule) {
				console.error(`No static import found for PNG LUT file: ${filePath}`);
				return null;
			}
			
			await Asset.loadAsync(assetModule);
			const asset = Asset.fromModule(assetModule);
			await asset.downloadAsync();
			
			if (!asset.localUri) {
				throw new Error(`Failed to load PNG LUT file: ${filePath}`);
			}
			
			return asset.localUri;
		}
		
		// For non-PNG files or if PNG handling fails
		console.log(`File format not supported: ${filePath}`);
		return null;
	} catch (error) {
		console.error("Error loading LUT asset:", error);
		return null;
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
