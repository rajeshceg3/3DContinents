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
        // Soft rim glow
        float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
        gl_FragColor = vec4(0.9, 0.82, 0.98, 1.0) * intensity * 1.5; // Lavender glow
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
        // 1. Planet Core (Glass/Porcelain look)
        const planetGeo = new THREE.SphereGeometry(CONFIG.radius, 128, 128);
        const planetMat = new THREE.MeshPhysicalMaterial({
            color: CONFIG.colors.core,
            roughness: 0.1,
            metalness: 0.0,
            transmission: 0, // Solid porcelain look
            reflectivity: 1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
        });
        this.planet = new THREE.Mesh(planetGeo, planetMat);
        this.scene.add(this.planet);

        // 2. Atmosphere
        const atmoGeo = new THREE.SphereGeometry(CONFIG.radius + 1.2, 64, 64);
        const atmoMat = new THREE.ShaderMaterial({
            vertexShader: atmosphereVertex,
            fragmentShader: atmosphereFragment,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false
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

            // Translucent Crystal/Candy Material
            const material = new THREE.MeshPhysicalMaterial({
                color: color,
                roughness: 0.2,
                metalness: 0.1,
                transmission: 0.1, // Slight translucency
                thickness: 1.0,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1,
                side: THREE.DoubleSide
            });

            // Use helper to fix Island Collapse bug
            const continentMeshGroup = createContinentMesh(svgPath, material, {
                depth: 1.5,
                bevelEnabled: true,
                bevelThickness: 0.3,
                bevelSize: 0.3,
                bevelSegments: 5 // Smoother edges
            }, this.svgLoader);

            // Scaling
            // Invert Y scale to correct for SVG coordinate system (Y down) vs Three.js (Y up)
            continentMeshGroup.scale.set(scale, -scale, scale);

            // Positioning
            const surfaceRadius = CONFIG.radius + 0.02; // Close to surface
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);

            continentMeshGroup.position.setFromSphericalCoords(surfaceRadius, phi, theta);

            // Orientation
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

    dispose() {
        // Dispose Planet
        if (this.planet) {
            this.scene.remove(this.planet);
            if (this.planet.geometry) this.planet.geometry.dispose();
            if (this.planet.material) this.planet.material.dispose();
        }

        // Dispose Atmosphere
        if (this.atmosphere) {
            this.scene.remove(this.atmosphere);
            if (this.atmosphere.geometry) this.atmosphere.geometry.dispose();
            if (this.atmosphere.material) this.atmosphere.material.dispose();
        }

        // Dispose Continents
        if (this.continentsGroup) {
            // Remove from planet (already removed if planet is removed, but good practice)
            if (this.planet) this.planet.remove(this.continentsGroup);

            // Dispose interactive objects (continents)
            this.interactiveObjects.forEach(group => {
                if (group.children) {
                    group.children.forEach(mesh => {
                        if (mesh.geometry) mesh.geometry.dispose();
                        if (mesh.material) mesh.material.dispose();
                    });
                }
            });
            this.interactiveObjects = [];
        }
    }
}
