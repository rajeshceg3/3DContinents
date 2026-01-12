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

        // DOM Elements - IDs aligned with index.html
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

        // Bind methods for event listeners to allow removal
        this._onMouseMove = this.onMouseMove.bind(this);
        this._onMouseDown = this.onMouseDown.bind(this);
        this._onMouseUp = this.onMouseUp.bind(this);
        this._onClick = this.onClick.bind(this);
        this._onKeyDown = this.onKeyDown.bind(this);
        this._onResize = this.onResize.bind(this);

        // Bind UI Element handlers
        this._onCloseCard = () => {
             this.hideCard();
             this.sceneManager.resetView();
        };
        this._onResetView = () => {
             if (!state.animating) {
                 this.hideCard();
                 this.sceneManager.resetView();
             }
        };
        this._onStartQuiz = () => {
             console.log("Expedition started (Logic to be implemented)");
        };

        // Throttled raycasting for hover
        this.throttledRaycast = throttle(this.performRaycast.bind(this), 50);

        this.initListeners();
    }

    initListeners() {
        // Close Card
        if (this.elements.closeCard) {
            this.elements.closeCard.addEventListener('click', this._onCloseCard);
        }

        // Reset View
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', this._onResetView);
        }

        // Start Quiz / Expedition
        if (this.elements.startQuizBtn) {
            this.elements.startQuizBtn.addEventListener('click', this._onStartQuiz);
        }

        // Mouse Interaction
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mouseup', this._onMouseUp);
        window.addEventListener('click', this._onClick);
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('resize', this._onResize);
    }

    onResize() {
        // Handle UI resize logic if needed
    }

    onMouseDown(event) {
        this.mouseDownPos.set(event.clientX, event.clientY);
        this.isDrag = false;
    }

    onMouseUp(event) {
        const dist = Math.sqrt(
            Math.pow(event.clientX - this.mouseDownPos.x, 2) +
            Math.pow(event.clientY - this.mouseDownPos.y, 2)
        );
        // If moved more than 5 pixels, consider it a drag
        if (dist > 5) {
            this.isDrag = true;
        }
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
        // Normalize mouse coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (state.animating || state.zoomed) return;

        // Perform raycasting (throttled)
        this.throttledRaycast();
    }

    performRaycast() {
        // Raycasting for hover effects
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

        // Optimize: use recursive intersection on the continent groups directly
        const intersects = this.raycaster.intersectObjects(this.sceneManager.globe.continents, true);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            // The object is a Mesh. Its parent is the Group (continent).
            const group = object.parent;

            if (state.hovered !== group) {
                // Reset previous hover
                if (state.hovered) this.setHoverState(state.hovered, false);

                // Set new hover
                this.setHoverState(group, true);
                state.hovered = group;

                // Change cursor
                document.body.style.cursor = 'pointer';
            }
        } else {
            if (state.hovered) {
                this.setHoverState(state.hovered, false);
                state.hovered = null;
                document.body.style.cursor = 'default';
            }
        }
    }

    setHoverState(group, isHovered) {
        const color = isHovered
            ? config.colors.continentHover
            : (group.userData.color || config.colors.continent);

        // Animate color
        group.children.forEach(mesh => {
             // Ensure we kill any existing color tween to prevent conflict/leaks
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
        // Prevent 3D interaction if clicking on UI
        if (event.target !== this.sceneManager.canvas) return;

        if (state.animating) return;
        if (this.isDrag) return; // Ignore if it was a drag operation

        // Re-calculate mouse in case of fast click (though mouse down/up logic handles drag)
        // But we want exact click pos
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

        const intersects = this.raycaster.intersectObjects(this.sceneManager.globe.continents, true);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            const group = object.parent;

            if (group.userData) {
                this.showCard(group.userData);

                // Focus camera on this continent
                const targetPos = new THREE.Vector3();
                group.getWorldPosition(targetPos);

                this.sceneManager.focusOn(targetPos);
            }
        }
    }

    showCard(data) {
        if (this.elements.cardTitle) this.elements.cardTitle.innerText = data.name;
        if (this.elements.cardContent) this.elements.cardContent.innerHTML = `<p>${data.info}</p>`;

        if (this.elements.card) {
            this.elements.card.style.display = 'block';
            gsap.killTweensOf(this.elements.card);

            // Set initial state only if we are starting from hidden/transparent
            // This handles the case where it was 'display: none' but we want to animate from opacity 0
            if (window.getComputedStyle(this.elements.card).opacity === '0' || this.elements.card.style.opacity === '0') {
                 this.elements.card.style.opacity = '0';
                 this.elements.card.style.transform = 'translateY(20px)';
            }

            gsap.to(this.elements.card, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: "back.out(1.7)"
            });
        }
    }

    hideCard() {
        if (this.elements.card) {
            gsap.killTweensOf(this.elements.card);
            gsap.to(this.elements.card, {
                opacity: 0,
                y: 20,
                duration: 0.3,
                onComplete: () => {
                    this.elements.card.style.display = 'none';
                }
            });
        }
    }

    startIntro() {
        // Hide loader
        if (this.elements.loader) {
            gsap.killTweensOf(this.elements.loader);
            gsap.to(this.elements.loader, {
                opacity: 0,
                duration: 1.5,
                onComplete: () => {
                    this.elements.loader.style.display = 'none';
                }
            });
        }
    }

    dispose() {
        if (this.throttledRaycast && this.throttledRaycast.cancel) {
            this.throttledRaycast.cancel();
        }

        // Remove UI Element listeners
        if (this.elements.closeCard) this.elements.closeCard.removeEventListener('click', this._onCloseCard);
        if (this.elements.resetBtn) this.elements.resetBtn.removeEventListener('click', this._onResetView);
        if (this.elements.startQuizBtn) this.elements.startQuizBtn.removeEventListener('click', this._onStartQuiz);

        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mousedown', this._onMouseDown);
        window.removeEventListener('mouseup', this._onMouseUp);
        window.removeEventListener('click', this._onClick);
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('resize', this._onResize);

        // Kill GSAP tweens on elements
        if (this.elements.card) gsap.killTweensOf(this.elements.card);
        if (this.elements.loader) gsap.killTweensOf(this.elements.loader);
    }
}
