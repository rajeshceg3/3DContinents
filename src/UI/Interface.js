import { state } from '../State.js';
import { CONFIG } from '../Config.js';
import { continentsData } from '../Data/continents.js';
import * as THREE from 'three';
import gsap from 'gsap';

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
        const scaleVal = obj.userData.originalScale * (isHovering ? 1.1 : 1.0);
        // Make it pop more with color
        const targetEmissiveIntensity = isHovering ? 0.5 : 0;
        const duration = 0.5;

        gsap.to(obj.scale, {
            x: scaleVal,
            y: scaleVal,
            z: scaleVal,
            duration: duration,
            ease: "elastic.out(1, 0.5)"
        });

        obj.children.forEach(mesh => {
             // Animate material properties
             gsap.to(mesh.material, {
                emissiveIntensity: targetEmissiveIntensity,
                duration: duration
             });
        });
    }

    onClick() {
        if (state.animating) return;

        // Check if click was on UI elements (ignore)
        if (event.target.closest('.btn') || event.target.closest('.info-card') || event.target.closest('.close-btn')) return;

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
        const targetPos = new THREE.Vector3().copy(obj.position).normalize().multiplyScalar(CONFIG.radius + 6);

        // Smooth camera transition
        gsap.to(this.camera.position, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: 1.8,
            ease: "power2.inOut",
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
        const particleCount = 60;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const sizes = [];

        for(let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y, position.z);
            sizes.push(Math.random() * 0.5);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        // Create a soft circle texture for particles
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(0,0,32,32);
        const texture = new THREE.CanvasTexture(canvas);

        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.5,
            map: texture,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        const speeds = [];
        for(let i=0; i<particleCount; i++) {
            speeds.push({
                x: (Math.random() - 0.5) * 0.3,
                y: (Math.random() - 0.5) * 0.3,
                z: (Math.random() - 0.5) * 0.3 + 0.5 // Bias outwards
            });
        }

        const positionsAttribute = geometry.attributes.position;
        const obj = { t: 0 };

        gsap.to(obj, {
            t: 1,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => {
                for(let i=0; i<particleCount; i++) {
                    const ix = i * 3;
                    positionsAttribute.array[ix] += speeds[i].x;
                    positionsAttribute.array[ix+1] += speeds[i].y;
                    positionsAttribute.array[ix+2] += speeds[i].z;
                }
                positionsAttribute.needsUpdate = true;
                material.opacity = 0.8 * (1 - obj.t);
            },
            onComplete: () => {
                this.scene.remove(particles);
                geometry.dispose();
                material.dispose();
                texture.dispose();
            }
        });
    }

    showInfoCard(data) {
        this.cardTitle.innerText = data.name;
        this.cardText.innerText = data.trivia;
        this.infoCard.classList.add('visible');
        setTimeout(() => { state.animating = false; }, 1500);
    }

    hideInfoCard() {
        this.infoCard.classList.remove('visible');
    }

    // --- Quiz Mode ---

    toggleQuizMode() {
        state.quizMode = !state.quizMode;
        if (state.quizMode) {
            this.quizBtn.innerText = "Exit Exploration";
            this.quizBtn.style.background = "#fff";
            this.quizBtn.style.color = "var(--text-primary)";
            this.resetView();
            this.startQuiz();
        } else {
            this.quizBtn.innerText = "Exploration Mode";
            this.quizBtn.style.background = "";
            this.quizBtn.style.color = "";
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
        // Removed alert for a cleaner experience, maybe show a modal later or just reset
        console.log(`Exploration Complete! Final Score: ${state.score}`);
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
        if (state.processingAnswer) return;

        if (obj.userData.name === state.currentQuestion.name) {
            // Correct
            state.processingAnswer = true; // Lock
            state.score += 100;
            this.quizScoreEl.innerText = `Score: ${state.score}`;

            // Success animation
            this.createParticleBurst(obj.position, 0x00FF00); // Green burst

            const originalEmissive = obj.children[0].material.emissive.getHex();

            // Flash Green
            obj.children.forEach(m => {
                gsap.to(m.material.emissive, {r:0, g:1, b:0, duration: 0.2, yoyo: true, repeat: 1});
            });

            setTimeout(() => {
                 this.nextQuestion();
            }, 800);

        } else {
            // Wrong
            this.triggerShakeEffect();
            // Flash Red
            obj.children.forEach(m => {
                gsap.to(m.material.emissive, {r:1, g:0, b:0, duration: 0.2, yoyo: true, repeat: 1});
            });
        }
    }

    triggerShakeEffect() {
        gsap.to(this.webglCanvas, {
            x: 10,
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
        // Wait for fonts to load ideally, but timeout works for now
        setTimeout(() => {
            this.loader.style.opacity = '0';
            setTimeout(() => this.loader.style.display = 'none', 1000);

            // Intro Camera move
            gsap.fromTo(this.camera.position,
                { z: 40, y: 10 },
                { z: CONFIG.camZ, y: 0, duration: 3.5, ease: "power3.inOut" }
            );
        }, 1500); // Slightly longer load to admire the loader
    }
}
