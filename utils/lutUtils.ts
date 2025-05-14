import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

// Pre-load assets for better error handling
// Only preload the CUBE file, we'll handle the JSON file differently
const tokyoDeceptionAssetModule = require("../assets/luts/TokyoDeception.CUBE");
const landscape1AssetModule = require("../assets/luts/Landscape1.cube");
const landscape2AssetModule = require("../assets/luts/Landscape2.cube");
const landscape3AssetModule = require("../assets/luts/Landscape3.cube");
const landscape4AssetModule = require("../assets/luts/Landscape4.cube");
const landscape5AssetModule = require("../assets/luts/Landscape5.cube");
const landscape6AssetModule = require("../assets/luts/Landscape6.cube");
const landscape7AssetModule = require("../assets/luts/Landscape7.cube");
const landscape8AssetModule = require("../assets/luts/Landscape8.cube");
const landscape9AssetModule = require("../assets/luts/Landscape9.cube");
const landscape10AssetModule = require("../assets/luts/Landscape10.cube");

export interface LutFilter {
	name: string;
	displayName: string;
	filePath: string;
	description?: string;
	icon: string;
	colorValue?: string; // Fallback color for filters without LUT data
	lut?: Float32Array;
	lutDimension?: number;
	isLoaded?: boolean;
}

// List of available LUT files - no need to require them now
const AVAILABLE_LUTS = [
	"TokyoDeception.CUBE",
	"Landscape1.cube",
	"Landscape2.cube",
	"Landscape3.cube",
	"Landscape4.cube",
	"Landscape5.cube",
	"Landscape6.cube",
	"Landscape7.cube",
	"Landscape8.cube",
	"Landscape9.cube",
	"Landscape10.cube",
	// Add other LUT files here as they're added to the project
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
					filePath: "luts/TokyoDeception.CUBE",
					description: "Cinematic Tokyo style with blue shadows and amber highlights",
					icon: "videocam-outline"
				},
				{
					name: "Landscape 1",
					displayName: "Landscape 1",
					filePath: "luts/Landscape1.cube",
					description: "Enhanced landscape with vibrant greens and blues",
					icon: "leaf-outline"
				},
				{
					name: "Landscape 2",
					displayName: "Landscape 2",
					filePath: "luts/Landscape2.cube",
					description: "Rich landscape colors with warm highlights",
					icon: "sunny-outline"
				},
				{
					name: "Landscape 3",
					displayName: "Landscape 3",
					filePath: "luts/Landscape3.cube",
					description: "Natural landscape with enhanced detail",
					icon: "earth-outline"
				},
				{
					name: "Landscape 4",
					displayName: "Landscape 4",
					filePath: "luts/Landscape4.cube",
					description: "Dramatic landscape with deep sky and vivid colors",
					icon: "cloudy-outline"
				},
				{
					name: "Landscape 5",
					displayName: "Landscape 5",
					filePath: "luts/Landscape5.cube",
					description: "Soft landscape with enhanced shadows",
					icon: "flower-outline"
				},
				{
					name: "Landscape 6",
					displayName: "Landscape 6",
					filePath: "luts/Landscape6.cube",
					description: "Muted landscape tones with fine detail",
					icon: "water-outline"
				},
				{
					name: "Landscape 7",
					displayName: "Landscape 7",
					filePath: "luts/Landscape7.cube",
					description: "High contrast landscape with deep greens",
					icon: "trail-sign-outline"
				},
				{
					name: "Landscape 8",
					displayName: "Landscape 8",
					filePath: "luts/Landscape8.cube",
					description: "Golden hour landscape with warm tones",
					icon: "sunny-outline"
				},
				{
					name: "Landscape 9",
					displayName: "Landscape 9",
					filePath: "luts/Landscape9.cube",
					description: "Dramatic sunset landscape tones",
					icon: "partly-sunny-outline"
				},
				{
					name: "Landscape 10",
					displayName: "Landscape 10",
					filePath: "luts/Landscape10.cube",
					description: "Cool blue landscape with enhanced clarity",
					icon: "moon-outline"
				}
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
				filePath: "luts/TokyoDeception.CUBE",
				description: "Cinematic Tokyo style with blue shadows and amber highlights",
				icon: "videocam-outline",
				isLoaded: false,
			},
			{
				name: "Landscape 1",
				displayName: "Landscape 1",
				filePath: "luts/Landscape1.cube",
				description: "Enhanced landscape with vibrant greens and blues",
				icon: "leaf-outline",
				isLoaded: false,
			},
			{
				name: "Landscape 2",
				displayName: "Landscape 2",
				filePath: "luts/Landscape2.cube",
				description: "Rich landscape colors with warm highlights",
				icon: "sunny-outline",
				isLoaded: false,
			}
			// If more filters need to be added in the fallback case, they can be added here
		];
	}
};

/**
 * Parse a .CUBE file into a Float32Array for WebGL processing
 */
export const parseCubeFile = async (
	filePath: string,
): Promise<{ lut: Float32Array; dimension: number }> => {
	try {
		// Extract the filename from the path
		const filename = filePath.split('/').pop();
		console.log(`Parsing CUBE file: ${filename}`);
		
		if (!filename || !AVAILABLE_LUTS.includes(filename)) {
			throw new Error(`LUT file not found: ${filename}. Make sure to add it to the AVAILABLE_LUTS array.`);
		}
		
		let asset: Asset;
		
		// Handle different LUT files
		if (filename === "TokyoDeception.CUBE") {
			console.log("Loading Tokyo Deception LUT");
			
			// First ensure the asset is loaded in the registry
			await Asset.loadAsync(tokyoDeceptionAssetModule);
			
			// Then create the asset reference
			asset = Asset.fromModule(tokyoDeceptionAssetModule);
			await asset.downloadAsync();
		} else if (filename === "Landscape1.cube") {
			console.log("Loading Landscape1 LUT");
			await Asset.loadAsync(landscape1AssetModule);
			asset = Asset.fromModule(landscape1AssetModule);
			await asset.downloadAsync();
		} else if (filename === "Landscape2.cube") {
			console.log("Loading Landscape2 LUT");
			await Asset.loadAsync(landscape2AssetModule);
			asset = Asset.fromModule(landscape2AssetModule);
			await asset.downloadAsync();
		} else if (filename === "Landscape3.cube") {
			console.log("Loading Landscape3 LUT");
			await Asset.loadAsync(landscape3AssetModule);
			asset = Asset.fromModule(landscape3AssetModule);
			await asset.downloadAsync();
		} else if (filename === "Landscape4.cube") {
			console.log("Loading Landscape4 LUT");
			await Asset.loadAsync(landscape4AssetModule);
			asset = Asset.fromModule(landscape4AssetModule);
			await asset.downloadAsync();
		} else if (filename === "Landscape5.cube") {
			console.log("Loading Landscape5 LUT");
			await Asset.loadAsync(landscape5AssetModule);
			asset = Asset.fromModule(landscape5AssetModule);
			await asset.downloadAsync();
		} else if (filename === "Landscape6.cube") {
			console.log("Loading Landscape6 LUT");
			await Asset.loadAsync(landscape6AssetModule);
			asset = Asset.fromModule(landscape6AssetModule);
			await asset.downloadAsync();
		} else if (filename === "Landscape7.cube") {
			console.log("Loading Landscape7 LUT");
			await Asset.loadAsync(landscape7AssetModule);
			asset = Asset.fromModule(landscape7AssetModule);
			await asset.downloadAsync();
		} else if (filename === "Landscape8.cube") {
			console.log("Loading Landscape8 LUT");
			await Asset.loadAsync(landscape8AssetModule);
			asset = Asset.fromModule(landscape8AssetModule);
			await asset.downloadAsync();
		} else if (filename === "Landscape9.cube") {
			console.log("Loading Landscape9 LUT");
			await Asset.loadAsync(landscape9AssetModule);
			asset = Asset.fromModule(landscape9AssetModule);
			await asset.downloadAsync();
		} else if (filename === "Landscape10.cube") {
			console.log("Loading Landscape10 LUT");
			await Asset.loadAsync(landscape10AssetModule);
			asset = Asset.fromModule(landscape10AssetModule);
			await asset.downloadAsync();
		} else {
			throw new Error(`LUT file ${filename} is listed in AVAILABLE_LUTS but not implemented in parseCubeFile.`);
		}
		
		console.log(`Asset loaded: ${asset.localUri}`);
		
		if (!asset || !asset.localUri) {
			throw new Error(`Failed to load LUT file: ${filePath} - no localUri available`);
		}

		// Read the .CUBE file content
		const fileContent = await FileSystem.readAsStringAsync(asset.localUri);
		console.log(`File content length: ${fileContent.length}, first 100 chars: ${fileContent.substring(0, 100)}...`);
		const lines = fileContent.split("\n");
		console.log(`Total lines in file: ${lines.length}`);

		let lutSize = 0;
		let dataStart = 0;

		// Parse the header to find the LUT size
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			console.log(`Line ${i}: '${line}'`);

			if (line.startsWith("LUT_3D_SIZE")) {
				lutSize = Number.parseInt(line.split(/\s+/)[1], 10);
				console.log(`Found LUT_3D_SIZE: ${lutSize}`);
			}

			// Find where the data section begins (after header)
			if (lutSize > 0 && line.trim() && !line.startsWith("#") && line.split(/\s+/).length >= 3) {
				dataStart = i;
				break;
			}
		}

		if (lutSize === 0) {
			// Fallback: Check for specific file patterns
			if (filename === "TokyoDeception.CUBE") {
				console.log("Falling back to hardcoded values for TokyoDeception.CUBE");
				lutSize = 32; // Known size from manual inspection
				dataStart = 3; // Known data start line from manual inspection
			} else if (filename.startsWith("Landscape")) {
				console.log(`Falling back to hardcoded values for ${filename}`);
				lutSize = 32; // Based on examining the Landscape1.cube file
				dataStart = 4; // Based on examining the Landscape1.cube file
			} else {
				throw new Error("Invalid CUBE file: LUT_3D_SIZE not found");
			}
		}

		// Create the array to hold the LUT data
		const totalEntries = lutSize * lutSize * lutSize * 3; // RGB values for each point
		const lutArray = new Float32Array(totalEntries);

		console.log(`LUT parsed successfully. Size: ${lutSize}, Data starts at line: ${dataStart}, Total entries: ${totalEntries}`);
		
		// Parse the data section and fill the array
		let dataIndex = 0;
		for (let i = dataStart; i < lines.length; i++) {
			const line = lines[i].trim();

			// Skip comments and empty lines
			if (line === "" || line.startsWith("#")) {
				continue;
			}

			// Split the line into RGB components
			const values = line.split(/\s+/).map((val) => Number.parseFloat(val));

			if (values.length >= 3) {
				lutArray[dataIndex] = values[0]; // R
				lutArray[dataIndex + 1] = values[1]; // G
				lutArray[dataIndex + 2] = values[2]; // B
				dataIndex += 3;
			}

			// Break if we've filled the array
			if (dataIndex >= totalEntries) {
				break;
			}
		}
		
		console.log(`Filled ${dataIndex / 3} LUT entries out of ${totalEntries / 3} expected`);

		return { lut: lutArray, dimension: lutSize };
	} catch (error) {
		console.error(`Error parsing CUBE file ${filePath}:`, error);
		throw error;
	}
};

/**
 * Load a LUT texture for a specific filter
 */
export const loadLutTexture = async (filter: LutFilter): Promise<LutFilter> => {
	if (!filter.filePath || filter.isLoaded) {
		return filter;
	}

	try {
		const { lut, dimension } = await parseCubeFile(filter.filePath);

		return {
			...filter,
			lut,
			lutDimension: dimension,
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