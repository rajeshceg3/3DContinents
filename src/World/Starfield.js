import * as THREE from 'three';

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

    void main() {
        // Sophisticated Gradient: "Dawn Sky"
        // Top: Misty Lavender
        // Bottom: Soft Apricot Cream

        vec3 topColor = vec3(0.92, 0.88, 0.98); // Lavender
        vec3 midColor = vec3(0.98, 0.95, 0.95); // Whiteish
        vec3 bottomColor = vec3(0.99, 0.94, 0.90); // Apricot

        float y = normalize(vPosition).y * 0.5 + 0.5;

        // Triple stop gradient
        vec3 color = mix(bottomColor, midColor, smoothstep(0.0, 0.5, y));
        color = mix(color, topColor, smoothstep(0.5, 1.0, y));

        // Subtle dynamic grain
        float noise = fract(sin(dot(vUv + uTime * 0.05, vec2(12.9898, 78.233))) * 43758.5453);
        color -= noise * 0.02;

        gl_FragColor = vec4(color, 1.0);
    }
`;

export class Starfield {
    constructor(scene) {
        this.scene = scene;
        this.init();
    }

    init() {
        const starGeo = new THREE.SphereGeometry(100, 64, 64);
        this.starMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 }
            },
            vertexShader: starfieldVertex,
            fragmentShader: starfieldFragment,
            side: THREE.BackSide
        });

        this.bgMesh = new THREE.Mesh(starGeo, this.starMat);
        this.scene.add(this.bgMesh);

        // Add Floating Particles ("Dust Motes") for depth
        const particleCount = 200;
        this.particleGeo = new THREE.BufferGeometry();
        const positions = [];

        for(let i=0; i<particleCount; i++) {
            positions.push(
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60
            );
        }

        this.particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        this.particleMat = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.15,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(this.particleGeo, this.particleMat);
        this.scene.add(this.particles);
    }

    animate() {
        const time = performance.now() * 0.001;
        if (this.starMat) this.starMat.uniforms.uTime.value = time;
        if (this.particles) this.particles.rotation.y = time * 0.05;
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
