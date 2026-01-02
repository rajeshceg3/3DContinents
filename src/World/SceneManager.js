import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from '../Config.js';
import { createStarfield } from './Starfield.js';
import { Globe } from './Globe.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.init();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = CONFIG.camZ + 10; // Start far

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = false;
        this.controls.enableZoom = false;
        this.controls.minDistance = 6;
        this.controls.maxDistance = 25;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        mainLight.position.set(10, 10, 10);
        this.scene.add(mainLight);

        const rimLight = new THREE.DirectionalLight(0x4455ff, 1.0);
        rimLight.position.set(-10, 5, -10);
        this.scene.add(rimLight);

        // World Objects
        this.starfield = createStarfield();
        this.scene.add(this.starfield);

        this.globe = new Globe(this.scene);

        // Listeners
        window.addEventListener('resize', this.onResize.bind(this));
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        const time = performance.now() * 0.001;
        if(this.starfield.material.uniforms) this.starfield.material.uniforms.time.value = time;

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    getInteractiveObjects() {
        return this.globe.getInteractiveObjects();
    }
}
