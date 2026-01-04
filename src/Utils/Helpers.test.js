import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createContinentMesh } from './Helpers.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

// Mock SVGLoader since it relies on DOMParser which jsdom handles, but we need to ensure it works.
// We might not need to mock it if jsdom is present.
// However, creating a real SVGLoader requires a DOM environment.

describe('createContinentMesh', () => {
    it('should create a group with meshes from SVG path', () => {
        const svgPath = "M 10 10 L 90 90 L 10 90 Z"; // Simple triangle
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const loader = new SVGLoader(); // Should work with jsdom environment provided by vitest if configured

        const group = createContinentMesh(svgPath, material, { depth: 1 }, loader);

        expect(group).toBeInstanceOf(THREE.Group);
        expect(group.children.length).toBeGreaterThan(0);
        expect(group.children[0]).toBeInstanceOf(THREE.Mesh);
        expect(group.children[0].geometry).toBeInstanceOf(THREE.ExtrudeGeometry);
    });
});
