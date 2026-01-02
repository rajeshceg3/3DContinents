import { SceneManager } from './World/SceneManager.js';
import { UIManager } from './UI/Interface.js';

window.onload = () => {
    const canvas = document.querySelector('#webgl');
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
};
