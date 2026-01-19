import { SceneManager } from './World/SceneManager.js';
import { UIManager } from './UI/Interface.js';
import { resetState } from './State.js';
import WebGL from 'three/addons/capabilities/WebGL.js';

const init = () => {
    console.log("Initializing Aether...");
    // Error Boundary for Initialization
    try {
        // Reset global state
        resetState();

        // 1. WebGL Capability Check
        if (!WebGL.isWebGLAvailable()) {
            console.error("WebGL not available");
            const warning = WebGL.getWebGLErrorMessage();
            const loader = document.getElementById('loader');
            if (loader) {
                loader.innerHTML = ''; // Clear loader
                loader.appendChild(warning);
            }
            return;
        }

        // 2. Initialize Application
        const canvas = document.querySelector('#webgl');
        if (!canvas) throw new Error("Canvas element #webgl not found");

        const sceneManager = new SceneManager(canvas);
        const uiManager = new UIManager(sceneManager);

        // Start Loop
        let animationId;
        function animate() {
            animationId = requestAnimationFrame(animate);
            try {
                sceneManager.render();
            } catch (err) {
                console.error("Runtime Error:", err);
                cancelAnimationFrame(animationId);
                // Optionally stop animation or show error UI if critical
            }
        }
        animate();
        console.log("Animation loop started.");

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

// Execute initialization
// Module scripts are deferred by default, meaning they run after the document is parsed.
// We can check readyState to be safe, but usually running immediately is fine for modules.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
