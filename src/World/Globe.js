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
        // High-res sphere for smoothness
        const geometry = new THREE.SphereGeometry(config.globe.radius, config.globe.segments, config.globe.segments);

        // Ethereal "Porcelain" or "Frosted Glass" Material
        const material = new THREE.MeshPhysicalMaterial({
            color: config.colors.globe,
            emissive: config.colors.globeEmissive,
            roughness: 0.6, // Matte finish
            metalness: 0.1,
            clearcoat: 0.3, // Subtle shine
            clearcoatRoughness: 0.2,
            transmission: 0,
            opacity: 1,
            sheen: 1.0, // Velvet-like light scattering
            sheenColor: 0xAAAAAA
        });

        this.sphere = new THREE.Mesh(geometry, material);
        this.sphere.receiveShadow = true;
        this.group.add(this.sphere);
    }

    initAtmosphere() {
        // Create a glow sphere around the globe
        const geometry = new THREE.SphereGeometry(config.globe.radius + 1.2, 64, 64);
        const color = new THREE.Color(config.colors.atmosphere);

        // Custom Shader Material for Soft Volume Glow
        const vertexShader = `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec3 vNormal;
            uniform vec3 uColor;
            void main() {
                // Fresnel intensity
                float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
                gl_FragColor = vec4(uColor, 1.0) * intensity * 0.8;
            }
        `;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: color }
            },
            vertexShader,
            fragmentShader,
            blending: THREE.AdditiveBlending, // Additive for glow
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

            // Continent Material - Soft Matte
            const material = new THREE.MeshStandardMaterial({
                color: data.color || config.colors.continent,
                roughness: 0.7,
                metalness: 0.0,
                side: THREE.DoubleSide
            });

            const mesh = createContinentMesh(data.svgPath, material, {
                depth: 0.15, // Thinner, more elegant
                bevelEnabled: true,
                bevelThickness: 0.02,
                bevelSize: 0.02,
                bevelSegments: 3
            }, loader);

            if (mesh) {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                group.add(mesh);
            }

            const pos = this.latLonToVector3(data.lat, data.lon, config.globe.radius);
            group.position.copy(pos);

            // Correct Alignment Logic
            const targetZ = pos.clone().normalize().negate();
            const globalNorth = new THREE.Vector3(0, 1, 0);

            let tangentNorth;
            if (Math.abs(targetZ.y) > 0.99) {
                 tangentNorth = new THREE.Vector3(0, 0, 1).cross(targetZ).normalize().cross(targetZ);
            } else {
                 const normal = pos.clone().normalize();
                 tangentNorth = globalNorth.clone().sub(normal.multiplyScalar(globalNorth.dot(normal))).normalize();
            }

            const targetX = new THREE.Vector3().crossVectors(tangentNorth, targetZ).normalize();
            const targetY = new THREE.Vector3().crossVectors(targetZ, targetX).normalize();

            const rotationMatrix = new THREE.Matrix4().makeBasis(targetX, targetY, targetZ);
            group.quaternion.setFromRotationMatrix(rotationMatrix);

            const s = data.scale || 0.05;
            group.scale.set(s, -s, s);

            group.userData = {
                name: data.name,
                info: data.trivia || data.info,
                color: data.color || config.colors.continent,
                originalPosition: pos.clone()
            };

            this.continents.push(group);
            this.group.add(group);
        });
    }

    latLonToVector3(lat, lon, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);

        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = (radius * Math.sin(phi) * Math.sin(theta));
        const y = (radius * Math.cos(phi));

        return new THREE.Vector3(x, y, z);
    }

    animate() {
        // Slow rotation of the entire globe group
        if (this.group) {
           this.group.rotation.y += 0.0005;
        }
    }

    dispose() {
        if (this.group) {
            this.scene.remove(this.group);
            if (this.sphere) {
                this.sphere.geometry.dispose();
                this.sphere.material.dispose();
            }
            this.continents.forEach(group => {
                group.children.forEach(mesh => {
                    if (mesh.geometry) mesh.geometry.dispose();
                    if (mesh.material) mesh.material.dispose();
                });
            });
        }
        if (this.atmosphere) {
            this.scene.remove(this.atmosphere);
            this.atmosphere.geometry.dispose();
            this.atmosphere.material.dispose();
        }
    }
}
