import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { CONFIG } from '../Config.js';
import { continentsData } from '../Data/continents.js';
import { createContinentMesh } from '../Utils/Helpers.js';

// Planet Atmosphere Shader - Enhanced for volumetric softness
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
        // More sophisticated fresnel
        float viewAngle = dot(vNormal, vec3(0, 0, 1.0));
        float intensity = pow(0.55 - viewAngle, 4.0);

        // Gradient color: Lavender to White
        vec3 glowColor = mix(vec3(0.9, 0.9, 1.0), vec3(0.95, 0.8, 0.95), intensity);

        gl_FragColor = vec4(glowColor, 1.0) * intensity * 1.8;
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
        // 1. Planet Core - "Porcelain & Pearl"
        // Using MeshPhysicalMaterial for that premium subsurface look
        const planetGeo = new THREE.SphereGeometry(CONFIG.radius, 128, 128);
        const planetMat = new THREE.MeshPhysicalMaterial({
            color: CONFIG.colors.core,
            roughness: 0.25,
            metalness: 0.05,
            transmission: 0,
            reflectivity: 0.8,
            sheen: 1.0,
            sheenColor: CONFIG.colors.sheen,
            clearcoat: 0.8,
            clearcoatRoughness: 0.15,
        });
        this.planet = new THREE.Mesh(planetGeo, planetMat);
        this.scene.add(this.planet);

        // 2. Atmosphere - Ethereal Glow
        const atmoGeo = new THREE.SphereGeometry(CONFIG.radius + 1.5, 64, 64);
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

            // "Frosted Glass" Material
            const material = new THREE.MeshPhysicalMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.1, // Subtle inner glow
                roughness: 0.2,
                metalness: 0.1,
                transmission: 0.15, // Glassy
                thickness: 2.0,
                clearcoat: 1.0,
                side: THREE.DoubleSide
            });

            // Geometry generation
            const continentMeshGroup = createContinentMesh(svgPath, material, {
                depth: 1.2,
                bevelEnabled: true,
                bevelThickness: 0.2,
                bevelSize: 0.2,
                bevelSegments: 8, // High fidelity edges
                curveSegments: 24 // Smoother curves
            }, this.svgLoader);

            // Scaling & Orientation
            // Invert Y scale to correct for SVG coordinate system (Y down) vs Three.js (Y up)
            continentMeshGroup.scale.set(scale, -scale, scale);

            const surfaceRadius = CONFIG.radius - 0.1; // Slightly embedded for integration
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);

            continentMeshGroup.position.setFromSphericalCoords(surfaceRadius, phi, theta);

            const target = new THREE.Vector3().copy(continentMeshGroup.position).multiplyScalar(2);
            continentMeshGroup.lookAt(target);

            // Metadata
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
        if (this.planet) {
            this.scene.remove(this.planet);
            if (this.planet.geometry) this.planet.geometry.dispose();
            if (this.planet.material) this.planet.material.dispose();
        }
        if (this.atmosphere) {
            this.scene.remove(this.atmosphere);
            if (this.atmosphere.geometry) this.atmosphere.geometry.dispose();
            if (this.atmosphere.material) this.atmosphere.material.dispose();
        }
        if (this.continentsGroup) {
            if (this.planet) this.planet.remove(this.continentsGroup);
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
