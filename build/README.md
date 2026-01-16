# Build Resources

This folder contains resources used during the Dev Janitor application build process.

## Icon Files

electron-builder will automatically generate platform-specific icons from the source files in this folder.

### Current Files

- `icon.svg` - Vector icon source (512x512 viewBox)
- `entitlements.mac.plist` - macOS entitlements for code signing

### Generating Icons

electron-builder can automatically convert SVG to platform-specific formats. However, for best results, you may want to provide pre-generated icons:

#### Option 1: Let electron-builder handle it (Recommended)

electron-builder will automatically convert `icon.svg` to the required formats during build.

#### Option 2: Manual generation

If you need more control over the icon appearance, generate the following files:

**For Windows (.ico):**
```bash
# Using ImageMagick
convert -background none -resize 256x256 icon.svg icon.ico

# Or use online tools like https://icoconvert.com/
```

**For macOS (.icns):**
```bash
# On macOS, create an iconset folder
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
```

**For Linux (.png):**
```bash
# Using ImageMagick
convert -background none -resize 512x512 icon.svg icon.png
```

### Icon Requirements

| Platform | Format | Recommended Sizes |
|----------|--------|-------------------|
| Windows  | .ico   | 16, 32, 48, 64, 128, 256 |
| macOS    | .icns  | 16, 32, 64, 128, 256, 512, 1024 |
| Linux    | .png   | 512x512 |

## Entitlements (macOS)

The `entitlements.mac.plist` file defines the capabilities requested by the app on macOS:

- **JIT compilation**: Required for Electron
- **Unsigned executable memory**: Required for Electron
- **Library validation disabled**: Required for Electron
- **Network client**: For auto-update functionality
- **File access**: For tool detection functionality

## Code Signing

### macOS

To sign the app for distribution:

1. Obtain an Apple Developer certificate
2. Set environment variables:
   ```bash
   export CSC_LINK=/path/to/certificate.p12
   export CSC_KEY_PASSWORD=your-password
   ```
3. Run the build: `npm run build:mac`

### Windows

To sign the app for distribution:

1. Obtain a code signing certificate
2. Set environment variables:
   ```bash
   export CSC_LINK=/path/to/certificate.pfx
   export CSC_KEY_PASSWORD=your-password
   ```
3. Run the build: `npm run build:win`

## Auto-Update

The application is configured to use GitHub Releases for auto-updates. To enable:

1. Update `electron-builder.json5` with your GitHub repository details
2. Create a GitHub release with the built artifacts
3. The app will automatically check for updates on startup
