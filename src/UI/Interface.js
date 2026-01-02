import { state } from '../State.js';
import { CONFIG } from '../Config.js';
import { continentsData } from '../Data/continents.js';
import * as THREE from 'three';

export class UIManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.camera = sceneManager.camera;
        this.scene = sceneManager.scene;
        this.controls = sceneManager.controls;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.initDOM();
        this.initListeners();
    }

    initDOM() {
        this.loader = document.getElementById('loader');
        this.infoCard = document.getElementById('infoCard');
        this.cardTitle = document.getElementById('cardTitle');
        this.cardText = document.getElementById('cardText');
        this.closeCard = document.getElementById('closeCard');
        this.resetBtn = document.getElementById('resetBtn');
        this.quizBtn = document.getElementById('quizBtn');
        this.quizHud = document.getElementById('quizHud');
        this.quizQuestion = document.getElementById('quizQuestion');
        this.quizScoreEl = document.getElementById('quizScore');
        this.webglCanvas = document.getElementById('webgl');
    }

    initListeners() {
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('click', this.onClick.bind(this));
        this.closeCard.addEventListener('click', () => {
            this.hideInfoCard();
            this.resetView();
        });
        this.resetBtn.addEventListener('click', () => {
            if (state.zoomed) {
                this.hideInfoCard();
                this.resetView();
            }
        });
        this.quizBtn.addEventListener('click', this.toggleQuizMode.bind(this));
    }

    // --- Interaction ---

    onMouseMove(event) {
        if (state.animating) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.sceneManager.getInteractiveObjects(), true);

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while(obj.parent && !obj.userData.isContinent) {
                obj = obj.parent;
            }

            if (state.hovered !== obj) {
                if (state.hovered) this.animateHover(state.hovered, false);
                state.hovered = obj;
                this.animateHover(state.hovered, true);
                document.body.style.cursor = 'pointer';
            }
        } else {
            if (state.hovered) {
                this.animateHover(state.hovered, false);
                state.hovered = null;
                document.body.style.cursor = 'default';
            }
        }
    }

    animateHover(obj, isHovering) {
        const scaleVal = obj.userData.originalScale * (isHovering ? 1.2 : 1.0);
        const targetEmissive = isHovering ? 0.8 : 0.2;
        const duration = 0.4;

        gsap.to(obj.scale, {
            x: scaleVal,
            y: scaleVal,
            z: scaleVal,
            duration: duration,
            ease: "back.out(1.7)"
        });

        obj.children.forEach(mesh => {
             gsap.to(mesh.material, {
                emissiveIntensity: targetEmissive,
                duration: duration
             });
        });
    }

    onClick(event) {
        if (state.animating) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.sceneManager.getInteractiveObjects(), true);

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while(obj.parent && !obj.userData.isContinent) obj = obj.parent;

            if (state.quizMode) {
                this.handleQuizAnswer(obj);
            } else {
                this.focusContinent(obj);
            }
        }
    }

    // --- Exploration Mode ---

    focusContinent(obj) {
        state.animating = true;
        state.zoomed = true;
        this.controls.autoRotate = false;
        this.controls.enabled = false;

        this.createParticleBurst(obj.position, obj.userData.baseColor);

        // Target position: maintain same direction vector but at distance
        const targetPos = new THREE.Vector3().copy(obj.position).normalize().multiplyScalar(CONFIG.radius + 4);

        gsap.to(this.camera.position, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: 2,
            ease: "power3.inOut",
            onUpdate: () => this.camera.lookAt(0,0,0)
        });

        this.showInfoCard(obj.userData);
    }

    resetView() {
        state.animating = true;
        this.hideInfoCard();

        gsap.to(this.camera.position, {
            x: 0,
            y: 0,
            z: CONFIG.camZ,
            duration: 2,
            ease: "power3.inOut",
            onComplete: () => {
                state.animating = false;
                state.zoomed = false;
                this.controls.autoRotate = true;
                this.controls.enabled = true;
            }
        });
    }

    createParticleBurst(position, color) {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = [];

        for(let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y, position.z);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.1,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        const speeds = [];
        for(let i=0; i<particleCount; i++) {
            speeds.push({
                x: (Math.random() - 0.5) * 0.2,
                y: (Math.random() - 0.5) * 0.2,
                z: (Math.random() - 0.5) * 0.2
            });
        }

        const positionsAttribute = geometry.attributes.position;
        const obj = { t: 0 };

        gsap.to(obj, {
            t: 1,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: () => {
                for(let i=0; i<particleCount; i++) {
                    const ix = i * 3;
                    positionsAttribute.array[ix] += speeds[i].x;
                    positionsAttribute.array[ix+1] += speeds[i].y;
                    positionsAttribute.array[ix+2] += speeds[i].z;
                }
                positionsAttribute.needsUpdate = true;
                material.opacity = 1 - obj.t;
            },
            onComplete: () => {
                this.scene.remove(particles);
                geometry.dispose();
                material.dispose();
            }
        });
    }

    showInfoCard(data) {
        this.cardTitle.innerText = data.name;
        this.cardText.innerText = data.trivia;
        this.infoCard.classList.add('visible');
        setTimeout(() => { state.animating = false; }, 2000);
    }

    hideInfoCard() {
        this.infoCard.classList.remove('visible');
    }

    // --- Quiz Mode ---

    toggleQuizMode() {
        state.quizMode = !state.quizMode;
        if (state.quizMode) {
            this.quizBtn.innerText = "Exit Exploration";
            this.quizBtn.style.background = "var(--glass-highlight)";
            this.resetView();
            this.startQuiz();
        } else {
            this.quizBtn.innerText = "Exploration Mode";
            this.quizBtn.style.background = "";
            this.endQuiz();
        }
    }

    startQuiz() {
        state.score = 0;
        this.quizScoreEl.innerText = `Score: 0`;
        this.quizHud.classList.add('visible');
        this.quizQueue = [...continentsData];
        this.nextQuestion();
    }

    endQuiz() {
        this.quizHud.classList.remove('visible');
        alert(`Exploration Complete! Final Score: ${state.score}`);
    }

    nextQuestion() {
        if (this.quizQueue.length === 0) {
            this.endQuiz();
            this.toggleQuizMode();
            return;
        }
        const idx = Math.floor(Math.random() * this.quizQueue.length);
        state.currentQuestion = this.quizQueue[idx];
        this.quizQueue.splice(idx, 1);

        this.quizQuestion.innerText = `Find ${state.currentQuestion.name}`;
        gsap.fromTo(this.quizQuestion, {y: 20, opacity: 0}, {y: 0, opacity: 1, duration: 0.5});

        state.processingAnswer = false; // Allow interaction
    }

    handleQuizAnswer(obj) {
        // Fix for Score Farming: Check flag
        if (state.processingAnswer) return;

        if (obj.userData.name === state.currentQuestion.name) {
            // Correct
            state.processingAnswer = true; // Lock
            state.score += 100;
            this.quizScoreEl.innerText = `Score: ${state.score}`;

            const flash = obj.children[0].material.emissive.getHex();
            obj.children.forEach(m => m.material.emissive.setHex(0x00ff00));

            setTimeout(() => {
                 obj.children.forEach(m => m.material.emissive.setHex(flash));
                 this.nextQuestion();
            }, 500);

        } else {
            // Wrong
            // Fix for Camera Shake: Use CSS Shake instead of camera position
            this.triggerShakeEffect();
        }
    }

    triggerShakeEffect() {
        // CSS based shake on canvas
        // We can add a temporary class to canvas
        this.webglCanvas.style.animation = "shake 0.5s cubic-bezier(.36,.07,.19,.97) both";
        this.webglCanvas.style.transform = "translate3d(0, 0, 0)";

        // Add style rule dynamically if not in CSS, but easier to use inline styles or existing stylesheet
        // Let's assume we can inject style or use JS animation
        // Since we are in JS refactor, let's use GSAP on the DOM element for shake
        gsap.to(this.webglCanvas, {
            x: 5,
            duration: 0.05,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                gsap.set(this.webglCanvas, { x: 0 });
            }
        });
    }

    // --- Lifecycle ---
    startIntro() {
        setTimeout(() => {
            this.loader.style.opacity = '0';
            setTimeout(() => this.loader.style.display = 'none', 1000);

            gsap.fromTo(this.camera.position,
                { z: 40 },
                { z: CONFIG.camZ, duration: 3, ease: "power4.out" }
            );
        }, 500);
    }
}
