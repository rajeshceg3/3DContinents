import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import config from '../Config.js';
import { continentsData } from '../Data/continents.js';

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
            const paths = loader.parse(data.svgPath).paths; // Use svgPath from data
            const group = new THREE.Group();

            paths.forEach(path => {
                const shapes = SVGLoader.createShapes(path);

                shapes.forEach(shape => {
                    const geometry = new THREE.ExtrudeGeometry(shape, {
                        depth: 0.2,
                        bevelEnabled: true,
                        bevelThickness: 0.05,
                        bevelSize: 0.05,
                        bevelSegments: 2
                    });

                    // Center geometry
                    geometry.center();

                    // Create separate material for each continent based on data color
                    const material = new THREE.MeshStandardMaterial({
                        color: data.color || config.colors.continent, // Use data color
                        roughness: 0.8,
                        metalness: 0.2,
                        side: THREE.DoubleSide
                    });

                    const mesh = new THREE.Mesh(geometry, material);
                    group.add(mesh);
                });
            });

            // Convert Lat/Lon to Vector3
            const pos = this.latLonToVector3(data.lat, data.lon, config.globe.radius);

            group.position.copy(pos);
            group.lookAt(0, 0, 0);

            // Fix orientation (SVG is y-down, 3D is y-up) and apply scale
            const s = data.scale || 0.05;
            group.scale.set(s, -s, s);

            // Add user data for interaction
            group.userData = {
                name: data.name,
                info: data.trivia || data.info, // trivia from new data
                type: 'continent'
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
        // Subtle rotation or pulse could go here
    }
}
