import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { CONFIG } from '../Config.js';
import { continentsData } from '../Data/continents.js';
import { createContinentMesh } from '../Utils/Helpers.js';

// Planet Atmosphere Shader
const atmosphereVertex = `
    varying vec3 vNormal;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const atmosphereFragment = `
    varying vec3 vNormal;
    void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
        gl_FragColor = vec4(0.6, 0.8, 1.0, 1.0) * intensity;
    }
`;

export class Globe {
    constructor(scene) {
        this.scene = scene;
        this.interactiveObjects = [];
        this.svgLoader = new SVGLoader();

        this.init();
    }

    init() {
        // 1. Planet Core
        const planetGeo = new THREE.SphereGeometry(CONFIG.radius, 128, 128);
        const planetMat = new THREE.MeshPhysicalMaterial({
            color: 0x1a1a2e,
            roughness: 0.6,
            metalness: 0.2,
            clearcoat: 0.1,
            clearcoatRoughness: 0.4,
            sheen: 0.5,
            sheenColor: 0x4444ff,
        });
        this.planet = new THREE.Mesh(planetGeo, planetMat);
        this.scene.add(this.planet);

        // 2. Atmosphere
        const atmoGeo = new THREE.SphereGeometry(CONFIG.radius + 1.5, 64, 64);
        const atmoMat = new THREE.ShaderMaterial({
            vertexShader: atmosphereVertex,
            fragmentShader: atmosphereFragment,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.5
        });
        this.atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
        this.scene.add(this.atmosphere);

        // 3. Continents
        this.continentsGroup = new THREE.Group();
        this.planet.add(this.continentsGroup);

        this.generateContinents();
    }

    generateContinents() {
        continentsData.forEach(data => {
            const { svgPath, name, color, lat, lon, scale, trivia } = data;

            const material = new THREE.MeshPhysicalMaterial({
                color: color,
                transparent: true,
                opacity: 0.8,
                roughness: 0.2,
                metalness: 0.1,
                transmission: 0.2,
                thickness: 0.5,
                emissive: color,
                emissiveIntensity: 0.2,
                side: THREE.DoubleSide
            });

            // Use helper to fix Island Collapse bug
            const continentMeshGroup = createContinentMesh(svgPath, material, {
                depth: 2,
                bevelEnabled: true,
                bevelThickness: 0.5,
                bevelSize: 0.5,
                bevelSegments: 3
            }, this.svgLoader);

            // Scaling
            continentMeshGroup.scale.set(scale, scale, scale);

            // Positioning
            // Fix Z-Fighting: Push out slightly more than radius
            // Previous code used exactly radius. We add a small offset.
            const surfaceRadius = CONFIG.radius + 0.05;
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);

            continentMeshGroup.position.setFromSphericalCoords(surfaceRadius, phi, theta);

            // Orientation
            // Look at center to orient Z-axis towards center
            continentMeshGroup.lookAt(0, 0, 0);
            // Rotate 180 deg around X or Y to flip it to face outward correctly?
            // Actually, ExtrudeGeometry creates shape on XY plane.
            // lookAt makes +Z point to target.
            // If we look at (0,0,0), +Z points IN. The XY plane is tangent.
            // The "top" of extrusion is +Z. So the top faces IN.
            // We want top to face OUT. So we look away from center.
            const target = new THREE.Vector3().copy(continentMeshGroup.position).multiplyScalar(2);
            continentMeshGroup.lookAt(target);

            // Store metadata
            continentMeshGroup.userData = {
                name,
                trivia,
                isContinent: true,
                baseColor: color,
                originalScale: scale
            };

            this.continentsGroup.add(continentMeshGroup);
            this.interactiveObjects.push(continentMeshGroup);
        });
    }

    getInteractiveObjects() {
        return this.interactiveObjects;
    }
}
