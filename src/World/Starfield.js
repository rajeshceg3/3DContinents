import * as THREE from 'three';

const starfieldVertex = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        vec4 pos = vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * pos;
    }
`;

const starfieldFragment = `
    uniform float time;
    varying vec2 vUv;

    // Simple noise function
    float noise(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
        vec2 uv = vUv;

        // Deep space gradient
        vec3 color = mix(vec3(0.02, 0.02, 0.05), vec3(0.05, 0.05, 0.15), uv.y);

        // Stars
        float star = noise(uv * 100.0 + time * 0.05);
        if (star > 0.995) {
            color += vec3(1.0) * (sin(time * 2.0 + uv.x * 100.0) * 0.5 + 0.5);
        }

        // Subtle nebula clouds (approximated with noise layers)
        float cloud = noise(uv * 3.0 + time * 0.02);
        color += vec3(0.1, 0.0, 0.2) * cloud * 0.3;

        gl_FragColor = vec4(color, 1.0);
    }
`;

export function createStarfield() {
    const starGeo = new THREE.SphereGeometry(100, 64, 64);
    const starMat = new THREE.ShaderMaterial({
        vertexShader: starfieldVertex,
        fragmentShader: starfieldFragment,
        uniforms: {
            time: { value: 0 }
        },
        side: THREE.BackSide
    });
    return new THREE.Mesh(starGeo, starMat);
}
