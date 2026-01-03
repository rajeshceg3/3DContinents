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

    void main() {
        // Pastel Sky Gradient
        // Top: Soft Lavender/Pink
        // Bottom: Warm Cream/Peach

        vec3 topColor = vec3(0.9, 0.82, 0.98); // Lavender
        vec3 bottomColor = vec3(0.99, 0.98, 0.97); // Cream

        // Map y position (-100 to 100) to 0-1
        float y = normalize(vPosition).y * 0.5 + 0.5;

        vec3 color = mix(bottomColor, topColor, y);

        // Add subtle grain/noise for texture
        float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
        color -= noise * 0.03;

        gl_FragColor = vec4(color, 1.0);
    }
`;

export function createStarfield() {
    const starGeo = new THREE.SphereGeometry(100, 64, 64);
    const starMat = new THREE.ShaderMaterial({
        vertexShader: starfieldVertex,
        fragmentShader: starfieldFragment,
        side: THREE.BackSide
    });
    return new THREE.Mesh(starGeo, starMat);
}
