const config = {
    // Colors
    colors: {
        background: 0xFDFBF7, // Creamy Warm White (from broken Config)
        globe: 0x1a1a2e, // Deep Blue/Black for contrast
        globeEmissive: 0x000000,
        atmosphere: 0xE6E6FA, // Lavender (from broken Config)
        sun: 0xffddaa,
        grid: 0x4a4a6a,
        continent: 0xe0e0e0, // Default white/grey
        continentHover: 0xE6A8D7, // Pastel Pink (from broken Config)
        star: 0xffffff,
        particle: 0x00ffff,
        rim: 0x4444ff,

        // Specific continent colors if needed (optional usage)
        africa: 0xFFCCB6,
        australia: 0xF8C8DC,
        antarctica: 0xE6F2F2,
        europe: 0xB5EAD7,
        asia: 0xC7CEEA,
        northAmerica: 0xE2F0CB,
        southAmerica: 0xFFDAC1,
    },

    // Scene Settings
    scene: {
        cameraFOV: 45,
        cameraNear: 0.1,
        cameraFar: 1000,
        cameraPos: { x: 0, y: 15, z: 25 },
        ambientIntensity: 0.6,
        sunPosition: { x: 50, y: 20, z: 10 },
        sunIntensity: 1.5,
    },

    // Globe Settings
    globe: {
        radius: 5,
        segments: 64,
        bumpScale: 0.05,
    },

    // UI Animation Timing (seconds)
    timing: {
        introDuration: 3,
        zoomDuration: 1.5,
        hoverDuration: 0.3,
    }
};

export default config;
