import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

/**
 * Creates an extruded mesh from an SVG path string, correctly handling
 * multiple sub-paths (islands) by centering the *combined* geometry
 * rather than each piece individually.
 *
 * @param {string} svgPath - The SVG path data.
 * @param {THREE.Material} material - The material to apply.
 * @param {object} options - Extrusion options (depth, etc).
 * @param {SVGLoader} loader - Instance of SVGLoader.
 * @returns {THREE.Group} - A group containing the meshes.
 */
export function createContinentMesh(svgPath, material, options, loader) {
    const parsedData = loader.parse(`<svg><path d="${svgPath}"/></svg>`);
    const group = new THREE.Group();
    const geometries = [];

    // 1. Create all geometries first
    parsedData.paths.forEach((path) => {
        // SVGLoader.createShapes is a static method
        const shapes = SVGLoader.createShapes(path);
        shapes.forEach((shape) => {
            const geometry = new THREE.ExtrudeGeometry(shape, options);
            geometries.push(geometry);
        });
    });

    if (geometries.length === 0) return group;

    // 2. Compute the bounding box of ALL geometries combined
    const combinedBox = new THREE.Box3();
    geometries.forEach(geo => {
        geo.computeBoundingBox();
        combinedBox.union(geo.boundingBox);
    });

    // 3. Calculate the center of the combined box
    const center = new THREE.Vector3();
    combinedBox.getCenter(center);

    // 4. Create meshes and offset them so the group center is at (0,0,0)
    geometries.forEach(geo => {
        // Translate geometry to center it relative to the group origin
        geo.translate(-center.x, -center.y, -center.z);

        const mesh = new THREE.Mesh(geo, material);
        group.add(mesh);
    });

    return group;
}
