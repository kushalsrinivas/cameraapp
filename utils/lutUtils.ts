import * as FileSystem from "expo-file-system";

// Import PNG files for LUT filters 
// No CUBE files are used anymore

export interface LutFilter {
	name: string;
	displayName: string;
	filePath: string;
	description?: string;
	icon: string;
	colorValue?: string; // Fallback color for filters without LUT data
	isLoaded?: boolean;
}

// List of available LUT files
const AVAILABLE_LUTS = [
	"tokyodeception.png",
	"chinatown.png",
	// Add other PNG LUT files here as they're added to the project
];

/**
 * Load LUT filters from the metadata JSON file
 */
export const loadLutFilters = async (): Promise<LutFilter[]> => {
	try {
		// Instead of loading filters.json as an asset, read it directly from the filesystem
		const filtersJsonPath = `${FileSystem.documentDirectory}filters.json`;
		
		// Check if we already have a copy of filters.json in the filesystem
		const fileInfo = await FileSystem.getInfoAsync(filtersJsonPath);
		
		if (!fileInfo.exists) {
			// If not, we need to manually copy our default filters.json to the filesystem
			console.log("Copying filters.json to filesystem");
			
			// Hardcoded filters from our source filters.json
			const defaultFilters = [
				{
					name: "Tokyo Deception",
					displayName: "Tokyo",
					filePath: "luts/tokyodeception.png",
					description: "Cinematic Tokyo style with blue shadows and amber highlights",
					icon: "videocam-outline"
				},
				{
					name: "Chinatown",
					displayName: "Chinatown",
					filePath: "luts/chinatown.png",
					description: "Vibrant urban look with enhanced warm tones and deep contrast",
					icon: "aperture-outline"
				}
				// Add other PNG filters here
			];
			
			// Write the JSON data to the filesystem
			await FileSystem.writeAsStringAsync(
				filtersJsonPath,
				JSON.stringify(defaultFilters)
			);
		}
		
		// Now read the filters from the filesystem
		const filtersJson = await FileSystem.readAsStringAsync(filtersJsonPath);
		const filters: LutFilter[] = JSON.parse(filtersJson);
		
		console.log("Successfully loaded filters:", filters);

		// Add a "No Filter" option at the beginning
		const allFilters = [
			{
				name: "Normal",
				displayName: "Normal",
				filePath: "",
				description: "No filter applied",
				icon: "image-outline",
				isLoaded: true,
			},
			...filters.map((filter) => ({ ...filter, isLoaded: false })),
		];

		return allFilters;
	} catch (error) {
		console.error("Error loading LUT filters:", error);
		// Return a default "No Filter" option if we can't load the filters
		return [
			{
				name: "Normal",
				displayName: "Normal",
				filePath: "",
				description: "No filter applied",
				icon: "image-outline",
				isLoaded: true,
			},
			{
				name: "Tokyo Deception",
				displayName: "Tokyo",
				filePath: "luts/tokyodeception.png",
				description: "Cinematic Tokyo style with blue shadows and amber highlights",
				icon: "videocam-outline",
				isLoaded: false,
			},
			{
				name: "Chinatown",
				displayName: "Chinatown",
				filePath: "luts/chinatown.png",
				description: "Vibrant urban look with enhanced warm tones and deep contrast",
				icon: "aperture-outline",
				isLoaded: false,
			}
			// If more filters need to be added in the fallback case, they can be added here
		];
	}
};

/**
 * Load a LUT texture for a specific filter - PNG version only
 */
export const loadLutTexture = async (filter: LutFilter): Promise<LutFilter> => {
	if (!filter.filePath || filter.isLoaded) {
		return filter;
	}

	try {
		// Just mark the filter as loaded if it has a file path
		// The actual loading of PNG LUTs will be handled in the components that use them
		return {
			...filter,
			isLoaded: true,
		};
	} catch (error) {
		console.error(`Failed to load LUT for ${filter.name}:`, error);
		// Return the filter without the LUT data
		return {
			...filter,
			isLoaded: false,
		};
	}
};