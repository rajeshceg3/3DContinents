import { SceneManager } from './World/SceneManager.js';
import { UIManager } from './UI/Interface.js';
import WebGL from 'three/addons/capabilities/WebGL.js';

window.onload = () => {
    // 1. WebGL Capability Check
    if (!WebGL.isWebGLAvailable()) {
        const warning = WebGL.getWebGLErrorMessage();
        document.getElementById('loader').innerHTML = ''; // Clear loader
        document.getElementById('loader').appendChild(warning);
        return;
    }

    // 2. Initialize Application
    const canvas = document.querySelector('#webgl');

    // Error Boundary for Initialization
    try {
        const sceneManager = new SceneManager(canvas);
        const uiManager = new UIManager(sceneManager);

        // Start Loop
        function animate() {
            requestAnimationFrame(animate);
            sceneManager.render();
        }
        animate();

        // Start Intro
        uiManager.startIntro();

    } catch (error) {
        console.error("Critical System Failure:", error);
        // Fallback UI
        const loader = document.getElementById('loader');
        if (loader) {
            loader.innerHTML = `
                <div style="text-align:center; padding: 2rem;">
                    <h2>System Malfunction</h2>
                    <p>Unable to initialize the Aether Archive.</p>
                    <p style="font-size: 0.8rem; color: #999;">${error.message}</p>
                </div>
            `;
            loader.style.opacity = '1';
            loader.style.display = 'flex';
        }
    }
};
