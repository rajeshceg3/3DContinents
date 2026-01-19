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
        this.scene.fog = new THREE.FogExp2(config.colors.background, 0.015);

        this.initRenderer();
        this.initCamera();
        this.initLights();
        this.initPostProcessing();

        this.globe = new Globe(this.scene);
        this.starfield = new Starfield(this.scene);

        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = false;
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
            powerPreference: "high-performance",
            alpha: true // Allow transparency for background effects
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
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
        // Soft Ambient Light
        const ambientLight = new THREE.AmbientLight(0xffffff, config.scene.ambientIntensity);
        this.scene.add(ambientLight);

        // Main Sun Light (Key Light) - Warm
        this.sunLight = new THREE.DirectionalLight(config.colors.sun, config.scene.sunIntensity);
        this.sunLight.position.set(
            config.scene.sunPosition.x,
            config.scene.sunPosition.y,
            config.scene.sunPosition.z
        );
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.bias = -0.0001;
        this.scene.add(this.sunLight);

        // Fill Light (Cooler) - From opposite side
        const fillLight = new THREE.DirectionalLight(0xD8E2DC, 0.8);
        fillLight.position.set(-30, 10, -10);
        this.scene.add(fillLight);

        // Rim Light (Backlight for contour)
        const rimLight = new THREE.SpotLight(config.colors.rim, 2.5);
        rimLight.position.set(0, 20, -30);
        rimLight.lookAt(0, 0, 0);
        this.scene.add(rimLight);
    }

    initPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Refined Bloom for "Glow" effect without burnout
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.4,  // strength
            0.6,  // radius
            0.9   // threshold
        );
        this.composer.addPass(bloomPass);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    focusOn(targetPosition) {
        state.zoomed = true;
        state.animating = true;
        this.controls.autoRotate = false;
        this.controls.enabled = false;

        const direction = targetPosition.clone().normalize();
        const distance = 9;
        const newPos = direction.multiplyScalar(distance);

        const currentTarget = this.controls.target.clone();
        const tweenTarget = currentTarget.clone();

        gsap.to(this.camera.position, {
            x: newPos.x,
            y: newPos.y,
            z: newPos.z,
            duration: config.timing.zoomDuration,
            ease: "power2.inOut",
            onUpdate: () => {
                this.camera.lookAt(tweenTarget);
            },
            onComplete: () => {
                state.animating = false;
                this.controls.target.copy(targetPosition);
                this.controls.enabled = true;
                this.controls.update();
            }
        });

        gsap.to(tweenTarget, {
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z,
            duration: config.timing.zoomDuration,
            ease: "power2.inOut"
        });
    }

    resetView() {
        if (state.animating) return;
        state.zoomed = false;
        state.animating = true;
        this.controls.enabled = false;

        const currentTarget = this.controls.target.clone();
        const targetReset = new THREE.Vector3(0, 0, 0);
        const tweenTarget = currentTarget.clone();

        gsap.to(this.camera.position, {
            x: config.scene.cameraPos.x,
            y: config.scene.cameraPos.y,
            z: config.scene.cameraPos.z,
            duration: config.timing.zoomDuration,
            ease: "power2.inOut",
            onUpdate: () => {
                 this.camera.lookAt(tweenTarget);
            },
            onComplete: () => {
                this.controls.autoRotate = true;
                state.animating = false;
                this.controls.target.set(0, 0, 0);
                this.controls.enabled = true;
                this.controls.update();
            }
        });

        gsap.to(tweenTarget, {
            x: targetReset.x,
            y: targetReset.y,
            z: targetReset.z,
            duration: config.timing.zoomDuration,
            ease: "power2.inOut"
        });
    }

    render() {
        if (this.globe) this.globe.animate();
        if (this.starfield) this.starfield.animate();
        if (this.controls) this.controls.update();
        if (this.composer) this.composer.render();
    }

    dispose() {
        window.removeEventListener('resize', this._onWindowResize);
        if (this.controls) this.controls.dispose();

        if (this.composer) {
            this.composer.passes.forEach(pass => {
                if (pass.dispose) pass.dispose();
            });
            this.composer.dispose();
        }

        if (this.globe) {
            this.globe.dispose();
            this.globe = null;
        }

        if (this.starfield) {
            this.starfield.dispose();
            this.starfield = null;
        }

        if (this.scene) {
            this.scene.traverse((object) => {
                 if (object.geometry) object.geometry.dispose();
                 if (object.material) {
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    materials.forEach(material => {
                        for (const key in material) {
                            if (material[key] && material[key].isTexture) material[key].dispose();
                        }
                        material.dispose();
                    });
                 }
            });
            this.scene.clear();
        }

        if (this.camera) gsap.killTweensOf(this.camera.position);

        if (this.renderer) this.renderer.dispose();

        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.controls = null;
        this.composer = null;
    }
}
