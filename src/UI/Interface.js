import * as THREE from 'three';
import config from '../Config.js';
import { state } from '../State.js';
import gsap from 'gsap';
import { throttle } from '../Utils/Helpers.js';

export class UIManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Track mouse down for drag detection
        this.mouseDownPos = new THREE.Vector2();
        this.isDrag = false;

        // DOM Elements
        this.elements = {
            loader: document.getElementById('loader'),
            card: document.getElementById('infoCard'),
            cardTitle: document.getElementById('cardTitle'),
            cardContent: document.getElementById('cardText'),
            closeCard: document.getElementById('closeCard'),
            resetBtn: document.getElementById('resetBtn'),
            quizUI: document.getElementById('quizHud'),
            quizQuestion: document.getElementById('quizQuestion'),
            quizScore: document.getElementById('quizScore'),
            startQuizBtn: document.getElementById('quizBtn')
        };

        // Create Custom Cursor
        this.cursor = document.createElement('div');
        this.cursor.className = 'custom-cursor';
        document.body.appendChild(this.cursor);
        this.cursorTarget = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.cursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        // Bind methods
        this._onMouseMove = this.onMouseMove.bind(this);
        this._onMouseDown = this.onMouseDown.bind(this);
        this._onMouseUp = this.onMouseUp.bind(this);
        this._onClick = this.onClick.bind(this);
        this._onKeyDown = this.onKeyDown.bind(this);
        this._onResize = this.onResize.bind(this);
        this._onCloseCardClick = this.onCloseCardClick.bind(this);
        this._onResetBtnClick = this.onResetBtnClick.bind(this);
        this._onStartQuizBtnClick = this.onStartQuizBtnClick.bind(this);
        this._animateCursor = this.animateCursor.bind(this);

        this.throttledRaycast = throttle(this.performRaycast.bind(this), 50);

        this.initListeners();
        this.animateCursor();
    }

    initListeners() {
        if (this.elements.closeCard) this.elements.closeCard.addEventListener('click', this._onCloseCardClick);
        if (this.elements.resetBtn) this.elements.resetBtn.addEventListener('click', this._onResetBtnClick);
        if (this.elements.startQuizBtn) this.elements.startQuizBtn.addEventListener('click', this._onStartQuizBtnClick);

        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mouseup', this._onMouseUp);
        window.addEventListener('click', this._onClick);
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('resize', this._onResize);
    }

    animateCursor() {
        // Smooth cursor follow
        const dt = 0.2;
        this.cursorPos.x += (this.cursorTarget.x - this.cursorPos.x) * dt;
        this.cursorPos.y += (this.cursorTarget.y - this.cursorPos.y) * dt;

        this.cursor.style.transform = `translate(${this.cursorPos.x}px, ${this.cursorPos.y}px)`;

        requestAnimationFrame(this._animateCursor);
    }

    onResize() {
        // Handle UI resize
    }

    onCloseCardClick() {
        this.hideCard();
        this.sceneManager.resetView();
    }

    onResetBtnClick() {
        if (!state.animating) {
            this.hideCard();
            this.sceneManager.resetView();
        }
    }

    onStartQuizBtnClick() {
        console.log("Expedition started");
        // Future implementation
    }

    onMouseDown(event) {
        this.mouseDownPos.set(event.clientX, event.clientY);
        this.isDrag = false;
        this.cursor.classList.add('active');
    }

    onMouseUp(event) {
        this.cursor.classList.remove('active');
        const dist = Math.sqrt(
            Math.pow(event.clientX - this.mouseDownPos.x, 2) +
            Math.pow(event.clientY - this.mouseDownPos.y, 2)
        );
        if (dist > 5) this.isDrag = true;
    }

    onKeyDown(e) {
        if (e.key === 'Escape') {
            if (!state.animating) {
                this.hideCard();
                this.sceneManager.resetView();
            }
        }
    }

    onMouseMove(event) {
        // Update cursor target
        this.cursorTarget.x = event.clientX;
        this.cursorTarget.y = event.clientY;

        // Three.js coord normalization
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (state.animating || state.zoomed) return;
        this.throttledRaycast();
    }

    performRaycast() {
        if (!this.sceneManager || !this.sceneManager.camera || !this.sceneManager.globe) return;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        const intersects = this.raycaster.intersectObjects(this.sceneManager.globe.continents, true);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            const group = object.parent;

            if (state.hovered !== group) {
                if (state.hovered) this.setHoverState(state.hovered, false);
                this.setHoverState(group, true);
                state.hovered = group;
                this.cursor.classList.add('hover');
            }
        } else {
            if (state.hovered) {
                this.setHoverState(state.hovered, false);
                state.hovered = null;
                this.cursor.classList.remove('hover');
            }
        }
    }

    setHoverState(group, isHovered) {
        const color = isHovered ? config.colors.continentHover : (group.userData.color || config.colors.continent);
        const originalPos = group.userData.originalPosition;

        if (originalPos) {
            gsap.killTweensOf(group.position);
            const targetPos = isHovered
                ? originalPos.clone().add(originalPos.clone().normalize().multiplyScalar(0.3))
                : originalPos;

            gsap.to(group.position, {
                x: targetPos.x,
                y: targetPos.y,
                z: targetPos.z,
                duration: config.timing.hoverDuration,
                ease: "power2.out"
            });
        }

        group.children.forEach(mesh => {
             gsap.killTweensOf(mesh.material.color);
             gsap.to(mesh.material.color, {
                 r: new THREE.Color(color).r,
                 g: new THREE.Color(color).g,
                 b: new THREE.Color(color).b,
                 duration: config.timing.hoverDuration
             });
        });
    }

    onClick(event) {
        if (event.target !== this.sceneManager.canvas) return;
        if (state.animating || this.isDrag) return;

        if (!this.sceneManager || !this.sceneManager.camera || !this.sceneManager.globe) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

        const intersects = this.raycaster.intersectObjects(this.sceneManager.globe.continents, true);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            const group = object.parent;

            if (group.userData) {
                this.showCard(group.userData);
                const targetPos = new THREE.Vector3();
                group.getWorldPosition(targetPos);
                this.sceneManager.focusOn(targetPos);
            }
        }
    }

    showCard(data) {
        if (this.elements.cardTitle) this.elements.cardTitle.innerText = data.name;
        const content = data.info || data.trivia || "No information available.";
        if (this.elements.cardContent) this.elements.cardContent.innerHTML = `<p>${content}</p>`;

        if (this.elements.card) {
            this.elements.card.style.display = 'block';
            this.elements.card.classList.add('visible');

            gsap.killTweensOf(this.elements.card);
            gsap.set(this.elements.card, {
                opacity: 0,
                x: 80,
                rotationY: -5,
                transformPerspective: 1000,
                transformOrigin: "right center"
            });
            gsap.to(this.elements.card, {
                opacity: 1,
                x: 0,
                rotationY: 0,
                duration: 1.0,
                ease: "power3.out"
            });
        }
    }

    hideCard() {
        if (this.elements.card) {
            this.elements.card.classList.remove('visible');
            gsap.killTweensOf(this.elements.card);
            gsap.to(this.elements.card, {
                opacity: 0,
                x: 40,
                rotationY: -2,
                duration: 0.6,
                ease: "power2.in",
                onComplete: () => {
                    this.elements.card.style.display = 'none';
                }
            });
        }
    }

    startIntro() {
        if (this.elements.loader) {
            console.log("Starting intro animation...");
            gsap.killTweensOf(this.elements.loader);
            gsap.to(this.elements.loader, {
                opacity: 0,
                duration: 2.0,
                ease: "power2.inOut",
                onComplete: () => {
                    console.log("Intro animation complete.");
                    this.elements.loader.style.display = 'none';
                }
            });

            // Fallback: Force remove loader if animation hangs or GSAP fails
            setTimeout(() => {
                if (this.elements.loader.style.display !== 'none') {
                    console.warn("Force removing loader via fallback.");
                    this.elements.loader.style.opacity = '0';
                    this.elements.loader.style.display = 'none';
                }
            }, 2500);
        } else {
            console.warn("Loader element not found.");
        }
    }

    dispose() {
        if (this.throttledRaycast && this.throttledRaycast.cancel) this.throttledRaycast.cancel();

        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mousedown', this._onMouseDown);
        window.removeEventListener('mouseup', this._onMouseUp);
        window.removeEventListener('click', this._onClick);
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('resize', this._onResize);

        if (this.elements.closeCard) this.elements.closeCard.removeEventListener('click', this._onCloseCardClick);
        if (this.elements.resetBtn) this.elements.resetBtn.removeEventListener('click', this._onResetBtnClick);
        if (this.elements.startQuizBtn) this.elements.startQuizBtn.removeEventListener('click', this._onStartQuizBtnClick);

        if (this.cursor && this.cursor.parentNode) document.body.removeChild(this.cursor);

        if (this.elements.card) gsap.killTweensOf(this.elements.card);
        if (this.elements.loader) gsap.killTweensOf(this.elements.loader);

        if (this.sceneManager && this.sceneManager.globe && this.sceneManager.globe.continents) {
            this.sceneManager.globe.continents.forEach(group => {
                gsap.killTweensOf(group.position);
                group.children.forEach(mesh => {
                    if (mesh.material && mesh.material.color) gsap.killTweensOf(mesh.material.color);
                });
            });
        }
    }
}
