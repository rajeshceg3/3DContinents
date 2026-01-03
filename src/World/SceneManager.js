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
        this.scene.fog = new THREE.FogExp2(CONFIG.colors.bg, 0.02);

        // Camera
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = CONFIG.camZ + 10;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = false;
        this.controls.enableZoom = false;
        this.controls.minDistance = 6;
        this.controls.maxDistance = 25;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.8;

        // Lighting (Soft Studio Setup)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(5, 10, 7);
        this.scene.add(mainLight);

        const fillLight = new THREE.DirectionalLight(0xE6E6FA, 0.8); // Lavender fill
        fillLight.position.set(-5, 0, 5);
        this.scene.add(fillLight);

        const backLight = new THREE.DirectionalLight(0xFFDAB9, 1.0); // Peach rim
        backLight.position.set(0, 5, -10);
        this.scene.add(backLight);

        // World Objects
        this.starfield = createStarfield();
        this.scene.add(this.starfield);

        this.globe = new Globe(this.scene);

        // Listeners
        this._onResize = this.onResize.bind(this);
        window.addEventListener('resize', this._onResize);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    getInteractiveObjects() {
        return this.globe.getInteractiveObjects();
    }

    dispose() {
        // Remove listeners
        window.removeEventListener('resize', this._onResize);

        // Dispose Controls
        if (this.controls) this.controls.dispose();

        // Dispose Globe
        if (this.globe) this.globe.dispose();

        // Dispose Starfield
        if (this.starfield) {
            this.scene.remove(this.starfield);
            if (this.starfield.geometry) this.starfield.geometry.dispose();
            if (this.starfield.material) this.starfield.material.dispose();
        }

        // Dispose Renderer
        if (this.renderer) {
            this.renderer.dispose();
            // If the canvas is created by us, we might want to remove it, but here it is passed in.
        }
    }
}
