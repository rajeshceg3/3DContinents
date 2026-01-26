const config = {
    // Colors - Refined Ethereal Pastel Palette
    colors: {
        background: 0xF9F8F6, // Warm Alabaster
        globe: 0x2C3A47,      // Deep Matte Slate (Slightly darker for contrast)
        globeEmissive: 0x0A0E14,
        atmosphere: 0xC5CAE9, // Soft Periwinkle
        sun: 0xFFF5E1,        // Champagne White
        grid: 0x576574,       // Muted Steel
        continent: 0xEFEBE9,  // Porcelain
        continentHover: 0xE2B982, // Muted Gold
        star: 0xFFFFFF,
        particle: 0xF8BBD0,   // Pastel Pink
        rim: 0x90CAF9,        // Soft Blue Rim

        // Harmonized Pastel Continent Colors
        africa: 0xD7CCC8,      // Warm Taupe
        australia: 0xF8BBD0,   // Dusty Rose
        antarctica: 0xF5F5F5,  // Pure Ice
        europe: 0xBBDEFB,      // Pale Sky
        asia: 0xD1C4E9,        // Muted Lavender
        northAmerica: 0xC8E6C9,// Pale Sage
        southAmerica: 0xFFCCBC,// Soft Apricot
    },

    // Scene Settings
    scene: {
        cameraFOV: 35, // Even more cinematic/telephoto
        cameraNear: 0.1,
        cameraFar: 1000,
        cameraPos: { x: 0, y: 12, z: 26 }, // Adjusted for new FOV
        ambientIntensity: 0.7, // Softer fill
        sunPosition: { x: 50, y: 30, z: 40 },
        sunIntensity: 1.6, // Balanced key light
    },

    // Globe Settings
    globe: {
        radius: 5,
        segments: 128,
        bumpScale: 0.04, // Smoother finish
    },

    // UI Animation Timing (seconds)
    timing: {
        introDuration: 2.5,
        zoomDuration: 1.8,
        hoverDuration: 0.4,
    }
};

export default config;
