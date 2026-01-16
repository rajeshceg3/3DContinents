import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { Globe } from './Globe.js';
import { Starfield } from './Starfield.js';
import config from '../Config.js';
import { state } from '../State.js';
import gsap from 'gsap';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(config.colors.background);
        this.scene.fog = new THREE.FogExp2(config.colors.background, 0.02);

        this.initRenderer();
        this.initCamera();
        this.initLights();
        this.initPostProcessing(); // Add post-processing

        this.globe = new Globe(this.scene);
        this.starfield = new Starfield(this.scene);

        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = false; // Controlled programmatically
        this.controls.enablePan = false;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.5;

        this._onWindowResize = this.onWindowResize.bind(this);
        window.addEventListener('resize', this._onWindowResize);
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            config.scene.cameraFOV,
            window.innerWidth / window.innerHeight,
            config.scene.cameraNear,
            config.scene.cameraFar
        );
        this.camera.position.set(
            config.scene.cameraPos.x,
            config.scene.cameraPos.y,
            config.scene.cameraPos.z
        );
        this.camera.lookAt(0, 0, 0);
    }

    initLights() {
        // Ambient Light
        const ambientLight = new THREE.AmbientLight(0xffffff, config.scene.ambientIntensity);
        this.scene.add(ambientLight);

        // Main Sun Light (Key Light)
        this.sunLight = new THREE.DirectionalLight(config.colors.sun, config.scene.sunIntensity);
        this.sunLight.position.set(
            config.scene.sunPosition.x,
            config.scene.sunPosition.y,
            config.scene.sunPosition.z
        );
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.scene.add(this.sunLight);

        // Fill Light (Cooler, softer)
        const fillLight = new THREE.DirectionalLight(0xccccff, 0.5);
        fillLight.position.set(-20, 0, 20);
        this.scene.add(fillLight);

        // Rim Light (Backlight for atmosphere)
        const rimLight = new THREE.SpotLight(config.colors.rim, 2);
        rimLight.position.set(0, 10, -20);
        rimLight.lookAt(0, 0, 0);
        this.scene.add(rimLight);
    }

    initPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Unreal Bloom
        // Adjusted parameters to prevent whiteout on bright background
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5, // strength (reduced from 1.5)
            0.4, // radius
            1.0 // threshold (increased from 0.85 to only bloom very bright sources)
        );
        this.composer.addPass(bloomPass);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    // Camera Animation
    focusOn(targetPosition) {
        state.zoomed = true;
        state.animating = true;
        this.controls.autoRotate = false;
        this.controls.enabled = false;

        // Calculate new camera position
        // Vector from center to target
        const direction = targetPosition.clone().normalize();
        const distance = 10; // Zoom distance
        const newPos = direction.multiplyScalar(distance);

        gsap.to(this.camera.position, {
            x: newPos.x,
            y: newPos.y,
            z: newPos.z,
            duration: config.timing.zoomDuration,
            ease: "power2.inOut",
            onComplete: () => {
                state.animating = false;

                // Set the controls target to the continent so we orbit around IT
                this.controls.target.copy(targetPosition);

                this.controls.enabled = true;
                // Sync controls with new camera position
                this.controls.update();
            }
        });
    }

    resetView() {
        if (state.animating) return;
        state.zoomed = false;
        state.animating = true;
        this.controls.enabled = false;

        gsap.to(this.camera.position, {
            x: config.scene.cameraPos.x,
            y: config.scene.cameraPos.y,
            z: config.scene.cameraPos.z,
            duration: config.timing.zoomDuration,
            ease: "power2.inOut",
            onComplete: () => {
                this.controls.autoRotate = true;
                state.animating = false;

                // Reset target to center of the globe
                this.controls.target.set(0, 0, 0);

                this.controls.enabled = true;
                // Sync controls with new camera position
                this.controls.update();
            }
        });
    }

    render() {
        // Animate globe and starfield
        if (this.globe) this.globe.animate();
        if (this.starfield) this.starfield.animate();

        if (this.controls) this.controls.update();

        // Use composer for post-processing
        if (this.composer) this.composer.render();
    }

    // Cleanup to prevent memory leaks
    dispose() {
        window.removeEventListener('resize', this._onWindowResize);

        if (this.controls) this.controls.dispose();

        // Use dedicated dispose methods
        if (this.globe) {
            this.globe.dispose();
            this.globe = null;
        }

        if (this.starfield) {
            this.starfield.dispose();
            this.starfield = null;
        }

        // Recursively dispose all objects in the scene
        // Even though globe and starfield are disposed, this catches anything else
        if (this.scene) {
            this.scene.traverse((object) => {
                 if (object.geometry) object.geometry.dispose();
                 if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                 }
            });
            this.scene.clear();
        }

        // Kill any active GSAP tweens
        if (this.camera) gsap.killTweensOf(this.camera.position);

        if (this.renderer) {
            this.renderer.dispose();
        }

        if (this.composer) {
            this.composer.passes.forEach(pass => {
                if (pass.dispose) pass.dispose();
            });
            this.composer.dispose();
        }

        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.composer = null;
    }
}
