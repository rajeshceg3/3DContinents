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
        this.lastRaycastTime = 0;
        this.particleTexture = this.createParticleTexture();

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
        this._onMouseMove = this.onMouseMove.bind(this);
        this._onMouseDown = this.onMouseDown.bind(this);
        this._onClick = this.onClick.bind(this);
        this._onCloseCardClick = () => {
            if (state.animating) return;
            this.hideInfoCard();
            this.resetView();
        };
        this._onResetBtnClick = () => {
            if (state.zoomed && !state.animating) {
                this.hideInfoCard();
                this.resetView();
            }
        };
        this._onQuizBtnClick = this.toggleQuizMode.bind(this);

        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('click', this._onClick);
        this.closeCard.addEventListener('click', this._onCloseCardClick);
        this.resetBtn.addEventListener('click', this._onResetBtnClick);
        this.quizBtn.addEventListener('click', this._onQuizBtnClick);
    }

    // --- Interaction ---

    onMouseDown(event) {
        this.mouseDownPos = { x: event.clientX, y: event.clientY };
    }

    onMouseMove(event) {
        if (state.animating) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const now = Date.now();
        if (now - this.lastRaycastTime < 40) return; // Throttle raycasting (~25fps)
        this.lastRaycastTime = now;

        // Interactive Raycasting
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
        // "Breathing" hover effect
        const scaleVal = obj.userData.originalScale * (isHovering ? 1.08 : 1.0);

        gsap.to(obj.scale, {
            x: scaleVal,
            y: scaleVal, // Remember Y is inverted for continents
            z: scaleVal,
            duration: 0.8,
            ease: "elastic.out(1, 0.6)"
        });

        // Color shift
        const targetEmissive = isHovering ? 0.3 : 0.1;

        obj.children.forEach(mesh => {
             gsap.to(mesh.material, {
                emissiveIntensity: targetEmissive,
                transmission: isHovering ? 0.2 : 0.15, // Clearer when hovered
                duration: 0.5
             });
        });
    }

    onClick(event) {
        if (state.animating) return;

        if (this.mouseDownPos) {
            const dx = event.clientX - this.mouseDownPos.x;
            const dy = event.clientY - this.mouseDownPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 5) return;
        }

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

        // Cinematic Camera Move
        const targetPos = new THREE.Vector3().copy(obj.position).normalize().multiplyScalar(CONFIG.radius + 5.5);

        gsap.to(this.camera.position, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: 2.2, // Slower, more majestic
            ease: "power3.inOut",
            onUpdate: () => this.camera.lookAt(0,0,0),
            onComplete: () => {
                state.animating = false;
            }
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
            duration: 2.5,
            ease: "power4.inOut",
            onComplete: () => {
                state.animating = false;
                state.zoomed = false;
                this.controls.autoRotate = true;
                this.controls.enabled = true;
            }
        });
    }

    // Organic Confetti Burst
    createParticleBurst(position, color) {
        const particleCount = 80;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const randoms = [];

        for(let i = 0; i < particleCount; i++) {
            positions.push(position.x, position.y, position.z);
            randoms.push(Math.random(), Math.random(), Math.random());
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('random', new THREE.Float32BufferAttribute(randoms, 3));

        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.35,
            map: this.particleTexture,
            transparent: true,
            opacity: 1.0,
            depthWrite: false,
            blending: THREE.NormalBlending
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        const speeds = [];
        for(let i=0; i<particleCount; i++) {
            speeds.push({
                x: (Math.random() - 0.5) * 0.4,
                y: (Math.random() - 0.5) * 0.4,
                z: (Math.random() - 0.5) * 0.4 + 0.6 // Outward bias
            });
        }

        const positionsAttr = geometry.attributes.position;
        const obj = { t: 0 };

        gsap.to(obj, {
            t: 1,
            duration: 2.5,
            ease: "power2.out",
            onUpdate: () => {
                for(let i=0; i<particleCount; i++) {
                    const ix = i * 3;
                    // Move
                    positionsAttr.array[ix] += speeds[i].x;
                    positionsAttr.array[ix+1] += speeds[i].y;
                    positionsAttr.array[ix+2] += speeds[i].z;

                    // Slow down (air resistance)
                    speeds[i].x *= 0.96;
                    speeds[i].y *= 0.96;
                    speeds[i].z *= 0.96;
                }
                positionsAttr.needsUpdate = true;
                material.opacity = 1 - Math.pow(obj.t, 3); // Fade out late
            },
            onComplete: () => {
                this.scene.remove(particles);
                geometry.dispose();
                material.dispose();
            }
        });
    }

    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(16, 16, 8, 14, 0, 0, 2 * Math.PI); // Oval/Petal shape
        ctx.fill();
        return new THREE.CanvasTexture(canvas);
    }

    showInfoCard(data) {
        this.cardTitle.innerText = data.name;
        this.cardText.innerText = data.trivia;
        this.infoCard.classList.add('visible');
    }

    hideInfoCard() {
        this.infoCard.classList.remove('visible');
    }

    // --- Quiz Mode ---

    toggleQuizMode() {
        state.quizMode = !state.quizMode;
        if (state.quizMode) {
            this.quizBtn.innerText = "Exit Expedition";
            this.quizBtn.style.background = "#fff";
            this.quizBtn.style.color = "var(--text-primary)";
            this.resetView();
            this.startQuiz();
        } else {
            this.quizBtn.innerText = "Begin Expedition";
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
    }

    nextQuestion() {
        if (this.quizQueue.length === 0) {
            this.toggleQuizMode();
            return;
        }
        const idx = Math.floor(Math.random() * this.quizQueue.length);
        state.currentQuestion = this.quizQueue[idx];
        this.quizQueue.splice(idx, 1);

        this.quizQuestion.innerText = `Find ${state.currentQuestion.name}`;
        gsap.fromTo(this.quizQuestion, {y: 30, opacity: 0}, {y: 0, opacity: 1, duration: 0.8, ease: "back.out(1.7)"});

        state.processingAnswer = false;
    }

    handleQuizAnswer(obj) {
        if (state.processingAnswer) return;

        if (obj.userData.name === state.currentQuestion.name) {
            state.processingAnswer = true;
            state.score += 100;
            this.quizScoreEl.innerText = `Score: ${state.score}`;

            this.createParticleBurst(obj.position, 0xB5EAD7); // Success color (Mint)

            // Pulse Green
            obj.children.forEach(m => {
                gsap.to(m.material.emissive, {r:0.7, g:0.9, b:0.8, duration: 0.3, yoyo: true, repeat: 1});
            });

            setTimeout(() => {
                 this.nextQuestion();
            }, 1000);

        } else {
            this.triggerShakeEffect();
            // Pulse Red
            obj.children.forEach(m => {
                gsap.to(m.material.emissive, {r:1, g:0.8, b:0.8, duration: 0.3, yoyo: true, repeat: 1});
            });
        }
    }

    triggerShakeEffect() {
        gsap.to(this.webglCanvas, {
            x: 8,
            duration: 0.05,
            yoyo: true,
            repeat: 5,
            ease: "sine.inOut",
            onComplete: () => {
                gsap.set(this.webglCanvas, { x: 0 });
            }
        });
    }

    // --- Lifecycle ---
    startIntro() {
        setTimeout(() => {
            this.loader.style.opacity = '0';
            setTimeout(() => this.loader.style.display = 'none', 1500);

            // Intro Camera - Slow reveal
            gsap.fromTo(this.camera.position,
                { z: 45, y: 15 },
                { z: CONFIG.camZ, y: 0, duration: 4.5, ease: "power2.inOut" }
            );
        }, 1800);
    }

    dispose() {
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mousedown', this._onMouseDown);
        window.removeEventListener('click', this._onClick);
        if (this.closeCard) this.closeCard.removeEventListener('click', this._onCloseCardClick);
        if (this.resetBtn) this.resetBtn.removeEventListener('click', this._onResetBtnClick);
        if (this.quizBtn) this.quizBtn.removeEventListener('click', this._onQuizBtnClick);
        if (this.particleTexture) this.particleTexture.dispose();
    }
}
