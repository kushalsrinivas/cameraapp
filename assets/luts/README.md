# LUT Filter System Documentation

This folder contains LUT (Look-Up Table) files used for applying color filters to the camera feed in real-time.

## How to Add New LUT Filters

1. **Prepare your LUT file**

   - Supported formats: `.cube` (Iridas/Adobe format)
   - Recommended size: 32x32x32 or 64x64x64
   - Place the LUT file in this directory (`assets/luts/`)

2. **Register the LUT file in `utils/lutUtils.ts`**

   Open the `utils/lutUtils.ts` file and add your new LUT file to the `AVAILABLE_LUTS` array:

   ```typescript
   const AVAILABLE_LUTS = [
     "TokyoDeception.CUBE",
     "YourNewFilter.CUBE", // Add your new file here
     // Add other LUT files here as they're added to the project
   ];
   ```

   > Note: You'll also need to update the hardcoded require in `parseCubeFile` if you're using a different LUT file.

3. **Update the filters.json file**
   Add a new entry with the following metadata:

   ```json
   {
     "name": "Filter Name",
     "displayName": "Display Name",
     "filePath": "luts/YourFilterFile.CUBE",
     "description": "Brief description of the filter's look",
     "icon": "icon-name-from-ionicons",
     "colorValue": "rgba(r, g, b, a)" // Optional fallback color
   }
   ```

   Where:

   - `name`: Unique internal name for the filter
   - `displayName`: Short name to display in the UI (keep it under 10 characters for best display)
   - `filePath`: Path to the LUT file relative to the assets directory (must match the filename listed in AVAILABLE_LUTS)
   - `description`: Brief description of the filter's visual effect
   - `icon`: Icon name from Ionicons (https://ionic.io/ionicons)
   - `colorValue`: (Optional) Fallback color for previews or if LUT fails to load

4. **Icons**
   Choose an icon name from Ionicons. Some suggestions based on filter types:
   - `film-outline`: Film-like filters
   - `image-outline`: General-purpose filters
   - `contrast-outline`: Black & white or high-contrast filters
   - `sunny-outline`: Warm filters
   - `snow-outline`: Cold filters
   - `aperture-outline`: Artistic/creative filters

## Example filter.json entry with fallback color

```json
{
  "name": "Tokyo Deception",
  "displayName": "Tokyo",
  "filePath": "luts/TokyoDeception.CUBE",
  "description": "Cinematic Tokyo style with blue shadows and amber highlights",
  "icon": "videocam-outline",
  "colorValue": "rgba(60, 100, 180, 0.25)"
}
```

## LUT Resources

Some free and commercial resources for LUT files:

- [Adobe Creative Cloud](https://creative.adobe.com/products/download/luts)
- [Lutify.me](https://lutify.me)
- [iwltbap](https://iwltbap.com)
- [RocketStock](https://www.rocketstock.com/free-after-effects-templates/35-free-luts-for-color-grading-videos/)

## Technical Implementation

The app dynamically loads the filters from the `filters.json` file at runtime, creates preview thumbnails, and allows the user to select and apply filters in real time. The actual filter application is handled by WebGL shaders through the `gl-react` and `gl-react-expo` libraries.

If a LUT file is missing or fails to load, the app will gracefully fall back to a simple filter using the specified color value.
