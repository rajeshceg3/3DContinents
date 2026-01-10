import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Creates a single merged mesh from an SVG path string, correctly handling
 * multiple sub-paths (islands) by centering the *combined* geometry
 * and merging them into one efficient mesh.
 *
 * @param {string} svgPath - The SVG path data.
 * @param {THREE.Material} material - The material to apply.
 * @param {object} options - Extrusion options (depth, etc).
 * @param {SVGLoader} loader - Instance of SVGLoader.
 * @returns {THREE.Mesh} - A single mesh containing the combined geometry, or null if empty.
 */
export function createContinentMesh(svgPath, material, options, loader) {
    // Wrap in SVG tag to ensure parser handles it as XML
    const parsedData = loader.parse(`<svg><path d="${svgPath}"/></svg>`);
    const geometries = [];

    // 1. Create all geometries first
    parsedData.paths.forEach((path) => {
        const shapes = SVGLoader.createShapes(path);
        shapes.forEach((shape) => {
            const geometry = new THREE.ExtrudeGeometry(shape, options);
            geometries.push(geometry);
        });
    });

    if (geometries.length === 0) return null;

    // 2. Merge all geometries into one
    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);

    // Dispose original geometries as they are now merged
    geometries.forEach(g => g.dispose());

    // 3. Center the merged geometry
    mergedGeometry.center();

    // 4. Create the single mesh
    const mesh = new THREE.Mesh(mergedGeometry, material);
    return mesh;
}

/**
 * Throttles a function to only execute once every `limit` milliseconds.
 *
 * @param {Function} callback - The function to throttle.
 * @param {number} limit - The time limit in milliseconds.
 * @returns {Function} - The throttled function with a .cancel() method.
 */
export function throttle(callback, limit) {
    let waiting = false;
    let lastArgs = null;
    let lastContext = null;
    let timeoutId = null;

    const timeoutFunc = function () {
        timeoutId = null;
        if (lastArgs == null) {
            waiting = false;
        } else {
            callback.apply(lastContext, lastArgs);
            lastContext = null;
            lastArgs = null;
            timeoutId = setTimeout(timeoutFunc, limit);
        }
    };

    const throttled = function () {
        if (!waiting) {
            callback.apply(this, arguments);
            waiting = true;
            timeoutId = setTimeout(timeoutFunc, limit);
        } else {
            lastContext = this;
            lastArgs = arguments;
        }
    };

    throttled.cancel = function() {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        lastArgs = null;
        lastContext = null;
        waiting = false;
    };

    return throttled;
}
