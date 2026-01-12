const config = {
    // Colors - Ethereal Pastel Palette
    colors: {
        background: 0xFDFBF7, // Warm Cream
        globe: 0x2E2B44,      // Deep Indigo (provides contrast for pastels)
        globeEmissive: 0x111122, // Subtle night glow
        atmosphere: 0x9370DB, // Medium Purple (creates a soft violet halo)
        sun: 0xFFF5E1,        // Warm White Sun
        grid: 0x555577,       // Soft Slate for grid lines
        continent: 0xFFFFFF,  // Default base
        continentHover: 0xFFD700, // Gold glow on hover
        star: 0xFFFFFF,
        particle: 0xE6A8D7,   // Pink particles
        rim: 0x87CEEB,        // Sky Blue rim light

        // Specific pastel continent colors
        africa: 0xFFCCB6,      // Peach
        australia: 0xF8C8DC,   // Pastel Rose
        antarctica: 0xE0F7FA,  // Icy Cyan
        europe: 0xB5EAD7,      // Mint
        asia: 0xC7CEEA,        // Periwinkle
        northAmerica: 0xE2F0CB,// Pale Green
        southAmerica: 0xFFDAC1,// Apricot
    },

    // Scene Settings
    scene: {
        cameraFOV: 45,
        cameraNear: 0.1,
        cameraFar: 1000,
        cameraPos: { x: 0, y: 12, z: 22 }, // Slightly closer/lower for immersion
        ambientIntensity: 0.4, // Softer ambient
        sunPosition: { x: 50, y: 30, z: 20 },
        sunIntensity: 2.0, // Brighter key light
    },

    // Globe Settings
    globe: {
        radius: 5,
        segments: 128, // Smoother geometry
        bumpScale: 0.08, // More defined topology
    },

    // UI Animation Timing (seconds)
    timing: {
        introDuration: 2.5,
        zoomDuration: 1.8,
        hoverDuration: 0.4,
    }
};

export default config;
