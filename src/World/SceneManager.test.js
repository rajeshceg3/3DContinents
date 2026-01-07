import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SceneManager } from './SceneManager.js';
import * as THREE from 'three';

// Mock OrbitControls
vi.mock('three/addons/controls/OrbitControls.js', () => ({
    OrbitControls: class {
        constructor() {
            this.enableDamping = false;
        }
        update() {}
        dispose() {}
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
                    return new THREE.Vector2(100, 100);
                });
                this.getRenderTarget = vi.fn(() => null);
                this.setRenderTarget = vi.fn();
                this.getClearColor = vi.fn(() => new THREE.Color(0x000000));
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
                this.shadowMap = { enabled: false };
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
    }
}));

vi.mock('./Starfield.js', () => ({
    Starfield: class {
        constructor() {}
        animate() {}
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
        // Check if WebGLRenderer was instantiated (by checking if we got an instance)
        expect(sceneManager.renderer.setSize).toBeDefined();
    });

    it('should render frame', () => {
        sceneManager.render();
        expect(sceneManager.renderer.render).toHaveBeenCalled();
    });

    it('should handle resize', () => {
        window.innerWidth = 500;
        window.innerHeight = 500;
        window.dispatchEvent(new Event('resize'));
        expect(sceneManager.renderer.setSize).toHaveBeenCalledWith(500, 500);
    });
});
