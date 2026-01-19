import * as THREE from 'three';
import config from '../Config.js';

const starfieldVertex = `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
        vUv = uv;
        vPosition = position;
        vec4 pos = vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * pos;
    }
`;

const starfieldFragment = `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;

    void main() {
        // Sophisticated Gradient: Ethereal
        float y = normalize(vPosition).y * 0.5 + 0.5;

        // Triple stop gradient
        vec3 color = mix(uColorC, uColorB, smoothstep(0.0, 0.45, y));
        color = mix(color, uColorA, smoothstep(0.45, 1.0, y));

        // Subtle moving grain for atmosphere
        float noise = fract(sin(dot(vUv * 5.0 + uTime * 0.05, vec2(12.9898, 78.233))) * 43758.5453);
        color -= noise * 0.015;

        gl_FragColor = vec4(color, 1.0);
    }
`;

export class Starfield {
    constructor(scene) {
        this.scene = scene;
        this.init();
    }

    init() {
        const starGeo = new THREE.SphereGeometry(120, 64, 64);

        // Convert config colors to Vectors for shader
        const c1 = new THREE.Color(config.colors.background); // Main BG
        const c2 = new THREE.Color(config.colors.atmosphere); // Mid
        // Create a softer version of atmosphere for top
        const c3 = new THREE.Color(config.colors.atmosphere).lerp(new THREE.Color(0xFFFFFF), 0.5);

        this.starMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColorA: { value: c3 },
                uColorB: { value: c1 },
                uColorC: { value: new THREE.Color(0xF0F0F0) } // Bottom lighter
            },
            vertexShader: starfieldVertex,
            fragmentShader: starfieldFragment,
            side: THREE.BackSide
        });

        this.bgMesh = new THREE.Mesh(starGeo, this.starMat);
        this.scene.add(this.bgMesh);

        // Add Floating Particles ("Pixie Dust")
        const particleCount = 400; // Increased count
        this.particleGeo = new THREE.BufferGeometry();
        const positions = [];
        const sizes = [];

        for(let i=0; i<particleCount; i++) {
            positions.push(
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 60, // Less vertical spread
                (Math.random() - 0.5) * 80
            );
            sizes.push(Math.random());
        }

        this.particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.particleGeo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        // Custom shader for particles to have soft edges
        this.particleMat = new THREE.PointsMaterial({
            color: config.colors.particle,
            size: 0.2,
            transparent: true,
            opacity: 0.7,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(this.particleGeo, this.particleMat);
        this.scene.add(this.particles);
    }

    animate() {
        const time = performance.now() * 0.001;
        if (this.starMat) this.starMat.uniforms.uTime.value = time;

        // Gentle particle float
        if (this.particles) {
            this.particles.rotation.y = time * 0.02;

            const positions = this.particles.geometry.attributes.position.array;
            for(let i=1; i<positions.length; i+=3) {
                // Bobbing Y motion
                positions[i] += Math.sin(time + positions[i]) * 0.02;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
    }

    dispose() {
         if (this.bgMesh) {
             this.scene.remove(this.bgMesh);
             this.bgMesh.geometry.dispose();
             this.bgMesh.material.dispose();
         }

         if (this.particles) {
             this.scene.remove(this.particles);
             this.particleGeo.dispose();
             this.particleMat.dispose();
         }
    }
}
