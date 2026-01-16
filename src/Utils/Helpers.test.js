import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createContinentMesh, throttle } from './Helpers.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

describe('createContinentMesh', () => {
    it('should create a single merged mesh from SVG path', () => {
        const svgPath = "M 10 10 L 90 90 L 10 90 Z"; // Simple triangle
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const loader = new SVGLoader();

        const mesh = createContinentMesh(svgPath, material, { depth: 1 }, loader);

        expect(mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh.geometry).toBeInstanceOf(THREE.BufferGeometry);
        // Ensure it's not a Group anymore
        expect(mesh.isGroup).toBeUndefined();
    });

    it('should return null for empty path', () => {
        const svgPath = "";
        const material = new THREE.MeshBasicMaterial();
        const loader = new SVGLoader();

        // Wrap in a try-catch because loader.parse might throw on empty string depending on impl
        // But the helper wraps it in <svg>...
        const mesh = createContinentMesh(svgPath, material, { depth: 1 }, loader);
        // If no paths found, returns null
        expect(mesh).toBeNull();
    });

    it('should offset geometry to sit on surface (Z <= 0)', () => {
        const svgPath = "M 0 0 L 10 0 L 10 10 L 0 10 Z"; // Square
        const material = new THREE.MeshBasicMaterial();
        const loader = new SVGLoader();
        const depth = 2;

        // Disable bevel to ensure depth match
        const mesh = createContinentMesh(svgPath, material, { depth, bevelEnabled: false }, loader);

        mesh.geometry.computeBoundingBox();
        const maxZ = mesh.geometry.boundingBox.max.z;

        // Should be close to 0 (top surface at 0, bottom at -depth)
        // Currently (before fix) it is centered at 0, so maxZ is depth/2 = 1
        expect(Math.abs(maxZ)).toBeLessThan(0.001);

        const minZ = mesh.geometry.boundingBox.min.z;
        // Should extend to -depth
        expect(Math.abs(minZ - (-depth))).toBeLessThan(0.001);
    });
});

describe('throttle', () => {
    it('should throttle function calls', async () => {
        let count = 0;
        const inc = () => count++;
        const throttledInc = throttle(inc, 100);

        throttledInc();
        throttledInc();
        throttledInc();

        expect(count).toBe(1);

        await new Promise(resolve => setTimeout(resolve, 150));
        throttledInc();
        expect(count).toBe(2);
    });
});
