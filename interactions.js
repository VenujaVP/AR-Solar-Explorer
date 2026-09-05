document.addEventListener("DOMContentLoaded", () => {
    // === STATE VARIABLES ===
    let isPlaying = true;
    let pathsVisible = false;
    let bgVisible = false;
    let inFocusMode = false;
    let focusIsSpinning = true;
    let activeFocusModel = null;

    let currentSystemScale = 0.2;
    let currentFocusScale = 1.0;
    let currentSystemRotZ = 0;
    let currentFocusRotX = 0;
    let currentFocusRotY = 0;

    const SYSTEM_SCALE_MIN = 0.05;
    const SYSTEM_SCALE_MAX = 1.5;
    const FOCUS_SCALE_MIN = 0.2;
    const FOCUS_SCALE_MAX = 4.0;

    // === ELEMENTS ===
    const targetEntity = document.querySelector("#target-entity");
    const uiContainer = document.querySelector("#ar-ui-container");
    const gestureLayer = document.querySelector("#gesture-layer");
    const gestureHint = document.querySelector("#gesture-hint");

    const solarSystemRoot = document.querySelector("#solar-system-root");
    const animTargets = document.querySelectorAll(".anim-target");
    const orbitPaths = document.querySelectorAll(".orbit-path");
    const earthSpin = document.querySelector("#earth-spin");
    const moonSpin = document.querySelector("#moon-spin");
    const spaceBg = document.querySelector("#space-bg");

    const focusRoot = document.querySelector("#focus-root");
    const focusSpinWrapper = document.querySelector("#focus-spin-wrapper");
    const focusModelSun = document.querySelector("#focus-model-sun");
    const focusModelEarth = document.querySelector("#focus-model-earth");
    const focusModelMoon = document.querySelector("#focus-model-moon");

    const topControls = document.querySelector("#top-controls");
    const planetSelector = document.querySelector("#planet-selector");
    const focusTopUi = document.querySelector("#focus-top-ui");
    const focusPanel = document.querySelector("#focus-panel");
    const focusTitle = document.querySelector("#focus-title");
    const focusDesc = document.querySelector("#focus-desc");

    const uiBlockSelector = ".glass-btn, .dock-btn, .action-btn, .xform-btn, #focus-panel, #top-controls, #transform-dock, #planet-selector, #focus-top-ui";

    function isUiTarget(target) {
        return !!(target && target.closest && target.closest(uiBlockSelector));
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function applyZoom(delta) {
        if (inFocusMode && activeFocusModel) {
            currentFocusScale = clamp(currentFocusScale + delta, FOCUS_SCALE_MIN, FOCUS_SCALE_MAX);
            activeFocusModel.setAttribute("scale", `${currentFocusScale} ${currentFocusScale} ${currentFocusScale}`);
            return;
        }
        currentSystemScale = clamp(currentSystemScale + delta, SYSTEM_SCALE_MIN, SYSTEM_SCALE_MAX);
        solarSystemRoot.setAttribute("scale", `${currentSystemScale} ${currentSystemScale} ${currentSystemScale}`);
    }

    function applyRotate(deltaX, deltaY = 0) {
        if (inFocusMode && activeFocusModel) {
            currentFocusRotY += deltaX;
            currentFocusRotX = clamp(currentFocusRotX + deltaY, -80, 80);
            activeFocusModel.setAttribute("rotation", `${currentFocusRotX} ${currentFocusRotY} 0`);
            return;
        }
        currentSystemRotZ += deltaX;
        solarSystemRoot.setAttribute("rotation", `90 0 ${currentSystemRotZ}`);
    }

    function hideHint() {
        if (gestureHint) gestureHint.classList.add("hint-faded");
    }

    function refreshHint() {
        if (!gestureHint) return;
        const finePointer = window.matchMedia("(pointer: fine)").matches;
        gestureHint.textContent = finePointer
            ? "Drag to rotate · Scroll to zoom"
            : "Swipe to rotate · Pinch to zoom";
        gestureHint.classList.remove("hint-faded");
    }

    // === MARKER DETECTION ===
    targetEntity.addEventListener("targetFound", () => {
        uiContainer.classList.remove("hidden");
        refreshHint();
        window.setTimeout(hideHint, 5000);
    });
    targetEntity.addEventListener("targetLost", () => uiContainer.classList.add("hidden"));

    // === TOP CONTROLS (Normal Mode) ===
    document.querySelector("#btn-play-pause").addEventListener("click", (e) => {
        isPlaying = !isPlaying;
        e.target.innerText = isPlaying ? "⏸ Pause Orbits" : "▶ Play Orbits";
        animTargets.forEach((el) => el.emit(isPlaying ? "resumeOrbit" : "pauseOrbit"));
        earthSpin.emit(isPlaying ? "resumeSpin" : "pauseSpin");
        moonSpin.emit(isPlaying ? "resumeSpin" : "pauseSpin");
    });

    document.querySelector("#btn-toggle-orbits").addEventListener("click", (e) => {
        pathsVisible = !pathsVisible;
        e.target.innerText = pathsVisible ? "⭕ Hide Paths" : "⭕ Show Paths";
        orbitPaths.forEach((el) => el.setAttribute("visible", pathsVisible));
    });

    document.querySelector("#btn-toggle-bg").addEventListener("click", (e) => {
        bgVisible = !bgVisible;
        e.target.innerText = bgVisible ? "🌌 Background: ON" : "🌌 Background: OFF";
        spaceBg.setAttribute("visible", bgVisible && !inFocusMode);
    });

    // === RICH PLANET DATA ===
    const planetData = {
        sun: {
            title: "☀️ The Sun",
            desc: `<b>Type:</b> Yellow Dwarf Star (G2V)<br><b>Age:</b> 4.6 Billion Years<br><br>The Sun holds 99.8% of the solar system's mass.`,
            focusNode: focusModelSun,
            focusScale: 0.6,
            focusPos: "0 0 0",
            spinSpeed: 10000
        },
        earth: {
            title: "🌍 Earth",
            desc: `<b>Type:</b> Terrestrial Planet<br><b>Distance from Sun:</b> ~150 Million km<br><br>Our home planet is the only place we know of inhabited by living things.`,
            focusNode: focusModelEarth,
            focusScale: 0.6,
            focusPos: "0 -0.1 0",
            spinSpeed: 5000
        },
        moon: {
            title: "🌙 The Moon",
            desc: `<b>Type:</b> Natural Satellite<br><b>Distance from Earth:</b> 384,400 km<br><br>Earth's only natural satellite.`,
            focusNode: focusModelMoon,
            focusScale: 0.5,
            focusPos: "0 -0.1 0",
            spinSpeed: 8000
        }
    };

    function enterFocusMode(planetKey) {
        inFocusMode = true;
        const data = planetData[planetKey];

        topControls.classList.add("hidden");
        planetSelector.classList.add("hidden");
        focusTopUi.classList.remove("hidden");
        focusPanel.classList.remove("hidden");
        focusTitle.innerHTML = data.title;
        focusDesc.innerHTML = data.desc;

        solarSystemRoot.setAttribute("visible", false);
        spaceBg.setAttribute("visible", false);

        focusModelSun.setAttribute("visible", false);
        focusModelEarth.setAttribute("visible", false);
        focusModelMoon.setAttribute("visible", false);

        activeFocusModel = data.focusNode;
        activeFocusModel.setAttribute("visible", true);

        currentFocusScale = data.focusScale;
        currentFocusRotX = 0;
        currentFocusRotY = 0;
        activeFocusModel.setAttribute("scale", `${currentFocusScale} ${currentFocusScale} ${currentFocusScale}`);
        activeFocusModel.setAttribute("position", data.focusPos);
        activeFocusModel.setAttribute("rotation", "0 0 0");

        focusSpinWrapper.setAttribute("animation", `property: rotation; to: 0 360 0; loop: true; dur: ${data.spinSpeed}; easing: linear; pauseEvents: pauseFocusSpin; resumeEvents: resumeFocusSpin`);

        focusRoot.setAttribute("visible", true);
        focusIsSpinning = true;
        document.querySelector("#btn-focus-spin").innerText = "⏸ Pause Spin";
        focusSpinWrapper.emit("resumeFocusSpin");
        refreshHint();
        window.setTimeout(hideHint, 4000);
    }

    document.querySelector("#btn-focus-sun").addEventListener("click", () => enterFocusMode("sun"));
    document.querySelector("#btn-focus-earth").addEventListener("click", () => enterFocusMode("earth"));
    document.querySelector("#btn-focus-moon").addEventListener("click", () => enterFocusMode("moon"));

    document.querySelector("#btn-exit-focus").addEventListener("click", () => {
        inFocusMode = false;
        activeFocusModel = null;

        topControls.classList.remove("hidden");
        planetSelector.classList.remove("hidden");
        focusTopUi.classList.add("hidden");
        focusPanel.classList.add("hidden");

        focusRoot.setAttribute("visible", false);
        solarSystemRoot.setAttribute("visible", true);
        if (bgVisible) spaceBg.setAttribute("visible", true);
        refreshHint();
        window.setTimeout(hideHint, 4000);
    });

    document.querySelector("#btn-focus-spin").addEventListener("click", (e) => {
        focusIsSpinning = !focusIsSpinning;
        e.target.innerText = focusIsSpinning ? "⏸ Pause Spin" : "▶ Resume Spin";
        focusSpinWrapper.emit(focusIsSpinning ? "resumeFocusSpin" : "pauseFocusSpin");
    });

    // === ON-SCREEN ZOOM / ROTATE (desktop + mobile) ===
    function bindHoldButton(button, onTick) {
        if (!button) return;
        let timer = null;

        const start = (event) => {
            if (event.pointerType === "mouse" && event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            onTick();
            timer = window.setInterval(onTick, 45);
        };

        const stop = () => {
            if (timer) window.clearInterval(timer);
            timer = null;
        };

        button.addEventListener("pointerdown", start);
        ["pointerup", "pointerleave", "pointercancel"].forEach((type) => {
            button.addEventListener(type, stop);
        });
    }

    bindHoldButton(document.querySelector("#btn-zoom-in"), () => applyZoom(0.035));
    bindHoldButton(document.querySelector("#btn-zoom-out"), () => applyZoom(-0.035));
    bindHoldButton(document.querySelector("#btn-rotate-left"), () => applyRotate(-4, 0));
    bindHoldButton(document.querySelector("#btn-rotate-right"), () => applyRotate(4, 0));

    // === DESKTOP: DRAG TO ROTATE, WHEEL TO ZOOM ===
    let isPointerDown = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    function onPointerDown(event) {
        if (isUiTarget(event.target)) return;
        if (event.pointerType === "touch") return;
        if (event.button !== 0) return;
        isPointerDown = true;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        if (gestureLayer) gestureLayer.classList.add("is-dragging");
        hideHint();
    }

    function onPointerMove(event) {
        if (!isPointerDown) return;
        const deltaX = event.clientX - lastPointerX;
        const deltaY = event.clientY - lastPointerY;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        applyRotate(deltaX * 0.45, deltaY * 0.35);
    }

    function onPointerUp() {
        isPointerDown = false;
        if (gestureLayer) gestureLayer.classList.remove("is-dragging");
    }

    function onWheel(event) {
        if (isUiTarget(event.target)) return;
        event.preventDefault();
        const delta = -event.deltaY * 0.0012;
        applyZoom(delta);
        hideHint();
    }

    const pointerTarget = gestureLayer || document;
    pointerTarget.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    pointerTarget.addEventListener("wheel", onWheel, { passive: false });

    // === TOUCH: PINCH ZOOM + SWIPE ROTATE ===
    let initialDistance = 0;
    let previousTouchX = 0;
    let previousTouchY = 0;

    document.addEventListener("touchstart", (e) => {
        if (isUiTarget(e.target)) return;
        if (e.touches.length === 2) {
            initialDistance = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
        } else if (e.touches.length === 1) {
            previousTouchX = e.touches[0].pageX;
            previousTouchY = e.touches[0].pageY;
        }
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
        if (isUiTarget(e.target)) return;

        if (e.touches.length === 2) {
            const newDistance = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            const scaleDelta = (newDistance - initialDistance) * 0.003;
            initialDistance = newDistance;
            applyZoom(scaleDelta);
            hideHint();
            return;
        }

        if (e.touches.length === 1) {
            const deltaX = e.touches[0].pageX - previousTouchX;
            const deltaY = e.touches[0].pageY - previousTouchY;
            previousTouchX = e.touches[0].pageX;
            previousTouchY = e.touches[0].pageY;
            applyRotate(deltaX * 0.8, deltaY * 0.55);
            hideHint();
        }
    }, { passive: true });
});
