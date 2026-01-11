import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SceneManager } from './SceneManager.js';
import * as THREE from 'three';
import config from '../Config.js';

// Mock OrbitControls without relying on external THREE import
vi.mock('three/addons/controls/OrbitControls.js', () => ({
    OrbitControls: class {
        constructor() {
            this.enableDamping = false;
            // Mock target as a simple object mimicking Vector3
            this.target = {
                x: 0,
                y: 0,
                z: 0,
                set: function(x, y, z) { this.x = x; this.y = y; this.z = z; },
                copy: function(v) { this.x = v.x; this.y = v.y; this.z = v.z; }
            };
            this.enabled = true;
            // Mock camera attached
            this.object = { position: { x: 0, y: 0, z: 0 } };
            this.autoRotate = true;
            this.autoRotateSpeed = 0.5;
            this.dampingFactor = 0.05;
            this.enableZoom = false;
            this.enablePan = false;
        }
        update() {}
        dispose() {}
    }
}));

// Mock GSAP
vi.mock('gsap', () => ({
    default: {
        to: (target, vars) => {
            // Immediately execute onComplete to simulate animation finish
            if (vars.onComplete) vars.onComplete();
            return { kill: () => {} };
        },
        killTweensOf: () => {}
    }
}));

// Mock THREE.WebGLRenderer
vi.mock('three', async () => {
    const actual = await vi.importActual('three');
    return {
        ...actual,
        WebGLRenderer: class {
            constructor() {
                this.setSize = vi.fn();
                this.setPixelRatio = vi.fn();
                this.getPixelRatio = vi.fn(() => 1);
                this.getSize = vi.fn((target) => {
                    if (target) {
                        target.x = 100;
                        target.y = 100;
                    }
                    return new actual.Vector2(100, 100);
                });
                this.getRenderTarget = vi.fn(() => null);
                this.setRenderTarget = vi.fn();
                this.getClearColor = vi.fn(() => new actual.Color(0x000000));
                this.getClearAlpha = vi.fn(() => 1);
                this.setClearColor = vi.fn();
                this.render = vi.fn();
                this.dispose = vi.fn();
                this.forceContextLoss = vi.fn();
                this.setScissor = vi.fn();
                this.setScissorTest = vi.fn();
                this.setViewport = vi.fn();
                this.clear = vi.fn();
                this.domElement = document.createElement('canvas');
                this.toneMapping = 0;
                this.toneMappingExposure = 1.0;
                this.shadowMap = { enabled: false, type: null };
                this.capabilities = { isWebGL2: true, getMaxAnisotropy: () => 1 };
                this.info = { reset: () => {} };
            }
        },
    };
});

// Mock Globe and Starfield
vi.mock('./Globe.js', () => ({
    Globe: class {
        constructor() {}
        animate() {}
        dispose() {}
    }
}));

vi.mock('./Starfield.js', () => ({
    Starfield: class {
        constructor() {}
        animate() {}
        dispose() {}
    }
}));

describe('SceneManager', () => {
    let sceneManager;

    beforeEach(() => {
        vi.clearAllMocks();
        const canvas = document.createElement('canvas');
        sceneManager = new SceneManager(canvas);
    });

    afterEach(() => {
        if (sceneManager) sceneManager.dispose();
    });

    it('should initialize the scene and renderer', () => {
        expect(sceneManager.scene).toBeInstanceOf(THREE.Scene);
        expect(sceneManager.renderer).toBeDefined();
        expect(sceneManager.renderer.setSize).toBeDefined();
    });

    it('should render frame', () => {
        sceneManager.render();
        expect(sceneManager.renderer).toBeDefined();
    });

    it('should handle resize', () => {
        window.innerWidth = 500;
        window.innerHeight = 500;
        window.dispatchEvent(new Event('resize'));
        expect(sceneManager.renderer.setSize).toHaveBeenCalledWith(500, 500);
    });

    it('should update controls target when focusOn is called', () => {
        const targetPos = new THREE.Vector3(10, 20, 30);

        // Initial state
        expect(sceneManager.controls.target.x).toBe(0);
        expect(sceneManager.controls.target.y).toBe(0);
        expect(sceneManager.controls.target.z).toBe(0);

        // Call focusOn
        sceneManager.focusOn(targetPos);

        // Expect target to be updated to the new position
        expect(sceneManager.controls.target.x).toBe(10);
        expect(sceneManager.controls.target.y).toBe(20);
        expect(sceneManager.controls.target.z).toBe(30);
    });

    it('should reset controls target when resetView is called', () => {
        // Set up a zoomed state first
        sceneManager.controls.target.set(10, 20, 30);

        // Call resetView
        sceneManager.resetView();

        // Expect target to be reset to (0, 0, 0)
        expect(sceneManager.controls.target.x).toBe(0);
        expect(sceneManager.controls.target.y).toBe(0);
        expect(sceneManager.controls.target.z).toBe(0);
    });
});
