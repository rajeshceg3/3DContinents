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

export function createStarfield(scene) {
    const starGeo = new THREE.SphereGeometry(100, 64, 64);
    const starMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 }
        },
        vertexShader: starfieldVertex,
        fragmentShader: starfieldFragment,
        side: THREE.BackSide
    });

    const bgMesh = new THREE.Mesh(starGeo, starMat);
    scene.add(bgMesh);

    // Add Floating Particles ("Dust Motes") for depth
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = [];

    for(let i=0; i<particleCount; i++) {
        positions.push(
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 60
        );
    }

    particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.15,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Return an object with an update method
    return {
        mesh: bgMesh,
        particles: particles,
        update: (time) => {
            starMat.uniforms.uTime.value = time;
            particles.rotation.y = time * 0.05;
        },
        dispose: () => {
             scene.remove(bgMesh);
             bgMesh.geometry.dispose();
             bgMesh.material.dispose();

             scene.remove(particles);
             particleGeo.dispose();
             particleMat.dispose();
        }
    };
}
