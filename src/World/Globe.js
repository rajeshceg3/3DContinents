import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import config from '../Config.js';
import { continentsData } from '../Data/continents.js';
import { createContinentMesh } from '../Utils/Helpers.js';

export class Globe {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.continents = [];

        this.initSphere();
        this.initAtmosphere();
        this.loadContinents();
    }

    initSphere() {
        const geometry = new THREE.SphereGeometry(config.globe.radius, config.globe.segments, config.globe.segments);
        const material = new THREE.MeshPhysicalMaterial({
            color: config.colors.globe,
            emissive: config.colors.globeEmissive,
            roughness: 0.2,
            metalness: 0.1,
            clearcoat: 0.5,
            clearcoatRoughness: 0.1,
            // Simulating water/glassy look
            transmission: 0,
            opacity: 1,
            transparent: false
        });

        this.sphere = new THREE.Mesh(geometry, material);
        this.sphere.receiveShadow = true;
        this.group.add(this.sphere);
    }

    initAtmosphere() {
        // Create a slightly larger sphere for atmosphere glow
        const geometry = new THREE.SphereGeometry(config.globe.radius + 1.5, 64, 64);

        // Custom Shader Material for Atmosphere
        const vertexShader = `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                gl_FragColor = vec4(0.3, 0.0, 0.5, 1.0) * intensity;
            }
        `;

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false
        });

        this.atmosphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.atmosphere);
    }

    loadContinents() {
        const loader = new SVGLoader();

        continentsData.forEach(data => {
            const group = new THREE.Group();

            const material = new THREE.MeshStandardMaterial({
                color: data.color || config.colors.continent,
                roughness: 0.8,
                metalness: 0.2,
                side: THREE.DoubleSide
            });

            // Use the helper to create a single merged mesh
            const mesh = createContinentMesh(data.svgPath, material, {
                depth: 0.2,
                bevelEnabled: true,
                bevelThickness: 0.05,
                bevelSize: 0.05,
                bevelSegments: 2
            }, loader);

            if (mesh) {
                group.add(mesh);
            }

            // Convert Lat/Lon to Vector3
            const pos = this.latLonToVector3(data.lat, data.lon, config.globe.radius);

            // Correctly align the continent using Quaternions
            // "Up" (Z-axis of the mesh) should point OUT from the center of the globe (Normal)
            // "North" (Y-axis of the mesh) should align with the North direction on the sphere surface

            const targetZ = pos.clone().normalize(); // Z points OUT (Normal)
            const globalNorth = new THREE.Vector3(0, 1, 0);

            // If we are at the poles, globalNorth and targetZ are parallel, causing instability
            // Handle poles by defining an arbitrary "up" for tangent calculation
            let tangentNorth;
            if (Math.abs(targetZ.y) > 0.99) {
                 // Close to pole, use Z axis as reference for "north"/alignment
                 tangentNorth = new THREE.Vector3(0, 0, 1).cross(targetZ).normalize().cross(targetZ);
            } else {
                 // Project Global North onto the tangent plane defined by targetZ
                 // Tangent = GlobalNorth - (GlobalNorth . Normal) * Normal
                 const normal = targetZ;
                 tangentNorth = globalNorth.clone().sub(normal.clone().multiplyScalar(globalNorth.dot(normal))).normalize();
            }

            // Create rotation matrix basis
            // X = Y cross Z
            const targetX = new THREE.Vector3().crossVectors(tangentNorth, targetZ).normalize();
            // Recompute Y to ensure orthogonality
            const targetY = new THREE.Vector3().crossVectors(targetZ, targetX).normalize();

            const rotationMatrix = new THREE.Matrix4().makeBasis(targetX, targetY, targetZ);
            group.quaternion.setFromRotationMatrix(rotationMatrix);

            // Offset the group position so the bottom of the continent (Z = -depth/2) sits on the surface
            // Geometry is centered, so it ranges from -0.1 to 0.1 (depth 0.2)
            // We want Z = -0.1 to be at Radius.
            // Current center is at Radius. So Z is at Radius. Range: R-0.1 to R+0.1.
            // We want range: R to R+0.2.
            // So shift OUT by 0.1.
            const offset = 0.1;
            group.position.copy(pos.clone().add(targetZ.clone().multiplyScalar(offset)));

            // Fix orientation and apply scale
            // SVG is Y-down. 3D is Y-up.
            // Also, extrusion is along Z.
            const s = data.scale || 0.05;
            group.scale.set(s, -s, s);

            // Add user data for interaction
            group.userData = {
                name: data.name,
                info: data.trivia || data.info,
                color: data.color || config.colors.continent,
                type: 'continent'
            };

            this.continents.push(group);
            this.group.add(group);
        });
    }

    latLonToVector3(lat, lon, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);

        const x = (radius * Math.sin(phi) * Math.cos(theta));
        const z = (radius * Math.sin(phi) * Math.sin(theta));
        const y = (radius * Math.cos(phi));

        return new THREE.Vector3(x, y, z);
    }

    animate() {
        // Subtle rotation or pulse could go here
    }

    dispose() {
        if (this.group) {
            this.scene.remove(this.group);

            // Recursively dispose all objects in the group
            this.group.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(m => m.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }

        if (this.atmosphere) {
            this.scene.remove(this.atmosphere);
            if (this.atmosphere.geometry) this.atmosphere.geometry.dispose();
            if (this.atmosphere.material) this.atmosphere.material.dispose();
        }
    }
}
