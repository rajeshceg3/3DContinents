import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from '../Config.js';
import { createStarfield } from './Starfield.js';
import { Globe } from './Globe.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.clock = new THREE.Clock();
        this.init();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        // Fog matches the background gradient mid-tone for seamless blend
        this.scene.fog = new THREE.FogExp2(0xFDFBF7, 0.015);

        // Camera
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = CONFIG.camZ + 15; // Start further out

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
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.04; // Silkier finish
        this.controls.enablePan = false;
        this.controls.enableZoom = false; // Zoom handled by UI events
        this.controls.minDistance = 6;
        this.controls.maxDistance = 30;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.6; // Gentler rotation

        // Lighting (Cinematic Setup)

        // 1. Soft Ambient (Base illumination)
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        this.scene.add(ambientLight);

        // 2. Key Light (Sun) - Warm
        const keyLight = new THREE.DirectionalLight(0xFFF0DD, 1.5);
        keyLight.position.set(8, 12, 10);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        this.scene.add(keyLight);

        // 3. Fill Light (Sky) - Cool Lavender
        const fillLight = new THREE.DirectionalLight(0xE6E6FA, 0.9);
        fillLight.position.set(-8, 4, 8);
        this.scene.add(fillLight);

        // 4. Rim Light (Edge definition) - Bright White
        const rimLight = new THREE.SpotLight(0xFFFFFF, 2.0);
        rimLight.position.set(0, 10, -15);
        rimLight.lookAt(0, 0, 0);
        this.scene.add(rimLight);

        // World Objects
        this.starfield = createStarfield(this.scene);
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
        const time = this.clock.getElapsedTime();

        this.controls.update();

        // Update Starfield (background & particles)
        if (this.starfield && this.starfield.update) {
            this.starfield.update(time);
        }

        this.renderer.render(this.scene, this.camera);
    }

    getInteractiveObjects() {
        return this.globe.getInteractiveObjects();
    }

    dispose() {
        window.removeEventListener('resize', this._onResize);
        if (this.controls) this.controls.dispose();
        if (this.globe) this.globe.dispose();
        if (this.starfield) this.starfield.dispose();

        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (object.material.isMaterial) {
                        object.material.dispose();
                    } else if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    }
                }
            });
            this.scene.clear();
            this.scene = null;
        }

        if (this.renderer) this.renderer.dispose();
    }
}
