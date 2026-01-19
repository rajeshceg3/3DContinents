const config = {
    // Colors - Refined Ethereal Pastel Palette
    colors: {
        background: 0xF9F7F2, // Creamy Off-White (Softer than pure white)
        globe: 0x3E4C5E,      // Soft Slate Blue (Matte finish base)
        globeEmissive: 0x0A0E14, // Deep subtle glow
        atmosphere: 0xB8C1EC, // Periwinkle Mist
        sun: 0xFFF9E6,        // Soft Warm White
        grid: 0x6B7A8F,       // Muted Steel Blue
        continent: 0xF2E9E1,  // Alabaster base
        continentHover: 0xFFD166, // Soft Gold
        star: 0xFFFFFF,
        particle: 0xEAB8D5,   // Dusty Pink particles
        rim: 0xA7C7E7,        // Pastel Blue rim light

        // Harmonized Pastel Continent Colors
        africa: 0xE6CBAD,      // Sand/Biscuit
        australia: 0xF4A6A6,   // Dusty Rose
        antarctica: 0xEBFBFB,  // Glacial White
        europe: 0xA8D8EA,      // Soft Sky
        asia: 0xAA96DA,        // Muted Lavender
        northAmerica: 0xC4E0C4,// Sage Green
        southAmerica: 0xFFD3B6,// Peach
    },

    // Scene Settings
    scene: {
        cameraFOV: 40, // Narrower FOV for a more cinematic/orthographic feel
        cameraNear: 0.1,
        cameraFar: 1000,
        cameraPos: { x: 0, y: 14, z: 24 }, // Cinematic high angle
        ambientIntensity: 0.6, // Higher ambient for softer shadows
        sunPosition: { x: 60, y: 40, z: 30 },
        sunIntensity: 1.8, // Balanced key light
    },

    // Globe Settings
    globe: {
        radius: 5,
        segments: 128,
        bumpScale: 0.06, // Smoother, porcelain-like
    },

    // UI Animation Timing (seconds)
    timing: {
        introDuration: 3.0, // Slower, more majestic intro
        zoomDuration: 2.0,
        hoverDuration: 0.5,
    }
};

export default config;
