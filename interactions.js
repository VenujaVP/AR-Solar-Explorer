document.addEventListener("DOMContentLoaded", () => {
    // === STATE VARIABLES ===
    let isPlaying = true;
    let pathsVisible = false;
    let bgVisible = false;
    let inFocusMode = false;
    let focusIsSpinning = true;
    let activeFocusModel = null; 

    // === ELEMENTS ===
    const targetEntity = document.querySelector("#target-entity");
    const uiContainer = document.querySelector("#ar-ui-container");
    
    // System Elements
    const solarSystemRoot = document.querySelector("#solar-system-root");
    const animTargets = document.querySelectorAll(".anim-target");
    const orbitPaths = document.querySelectorAll(".orbit-path");
    const earthSpin = document.querySelector("#earth-spin");
    const moonSpin = document.querySelector("#moon-spin");
    const spaceBg = document.querySelector("#space-bg");

    // Independent Focus Elements
    const focusRoot = document.querySelector("#focus-root");
    const focusSpinWrapper = document.querySelector("#focus-spin-wrapper");
    const focusModelSun = document.querySelector("#focus-model-sun");
    const focusModelEarth = document.querySelector("#focus-model-earth");
    const focusModelMoon = document.querySelector("#focus-model-moon");

    // UI Elements
    const topControls = document.querySelector("#top-controls");
    const planetSelector = document.querySelector("#planet-selector");
    const focusTopUi = document.querySelector("#focus-top-ui"); 
    const focusPanel = document.querySelector("#focus-panel");
    const focusTitle = document.querySelector("#focus-title");
    const focusDesc = document.querySelector("#focus-desc");

    // === MARKER DETECTION ===
    targetEntity.addEventListener("targetFound", () => uiContainer.classList.remove("hidden"));
    targetEntity.addEventListener("targetLost", () => uiContainer.classList.add("hidden"));

    // === TOP CONTROLS (Normal Mode) ===
    document.querySelector("#btn-play-pause").addEventListener("click", (e) => {
        isPlaying = !isPlaying;
        e.target.innerText = isPlaying ? "⏸ Pause Orbits" : "▶ Play Orbits";
        animTargets.forEach(el => el.emit(isPlaying ? 'resumeOrbit' : 'pauseOrbit'));
        earthSpin.emit(isPlaying ? 'resumeSpin' : 'pauseSpin');
        moonSpin.emit(isPlaying ? 'resumeSpin' : 'pauseSpin');
    });

    document.querySelector("#btn-toggle-orbits").addEventListener("click", (e) => {
        pathsVisible = !pathsVisible;
        e.target.innerText = pathsVisible ? "⭕ Hide Paths" : "⭕ Show Paths";
        orbitPaths.forEach(el => el.setAttribute("visible", pathsVisible));
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
            focusPos: "0 0 0", // Perfectly centered
            spinSpeed: 10000
        },
        earth: {
            title: "🌍 Earth",
            desc: `<b>Type:</b> Terrestrial Planet<br><b>Distance from Sun:</b> ~150 Million km<br><br>Our home planet is the only place we know of inhabited by living things.`,
            focusNode: focusModelEarth,
            focusScale: 0.6, // Shrunk down to fit properly
            focusPos: "0 -0.1 0", // Pulled slightly lower in the frame
            spinSpeed: 5000
        },
        moon: {
            title: "🌙 The Moon",
            desc: `<b>Type:</b> Natural Satellite<br><b>Distance from Earth:</b> 384,400 km<br><br>Earth's only natural satellite.`,
            focusNode: focusModelMoon,
            focusScale: 0.5, // Shrunk down to fit properly
            focusPos: "0 -0.1 0", // Pulled slightly lower in the frame
            spinSpeed: 8000
        }
    };

    // === EXPLORE MODE TRIGGER ===
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

        // Setup the specific model size and placement
        activeFocusModel = data.focusNode;
        activeFocusModel.setAttribute("visible", true); 
        
        currentFocusScale = data.focusScale;
        activeFocusModel.setAttribute("scale", `${currentFocusScale} ${currentFocusScale} ${currentFocusScale}`);
        activeFocusModel.setAttribute("position", data.focusPos); // Apply specific vertical centering
        activeFocusModel.setAttribute("rotation", "0 0 0"); 
        
        focusSpinWrapper.setAttribute("animation", `property: rotation; to: 0 360 0; loop: true; dur: ${data.spinSpeed}; easing: linear; pauseEvents: pauseFocusSpin; resumeEvents: resumeFocusSpin`);

        focusRoot.setAttribute("visible", true);
        focusIsSpinning = true;
        document.querySelector("#btn-focus-spin").innerText = "⏸ Pause Spin";
        focusSpinWrapper.emit('resumeFocusSpin');
    }

    document.querySelector("#btn-focus-sun").addEventListener("click", () => enterFocusMode('sun'));
    document.querySelector("#btn-focus-earth").addEventListener("click", () => enterFocusMode('earth'));
    document.querySelector("#btn-focus-moon").addEventListener("click", () => enterFocusMode('moon'));

    // === EXIT EXPLORE MODE ===
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
    });

    // === TOGGLE FOCUS SPIN BUTTON ===
    document.querySelector("#btn-focus-spin").addEventListener("click", (e) => {
        focusIsSpinning = !focusIsSpinning;
        e.target.innerText = focusIsSpinning ? "⏸ Pause Spin" : "▶ Resume Spin";
        focusSpinWrapper.emit(focusIsSpinning ? 'resumeFocusSpin' : 'pauseFocusSpin');
    });

    // === TOUCH GESTURES (SWIPE & PINCH) ===
    let initialDistance = 0;
    let currentSystemScale = 0.2;
    let currentFocusScale = 1.0;
    let previousTouchX = 0;
    let currentSystemRotZ = 0;
    let currentFocusRotY = 0;

    document.addEventListener('touchstart', (e) => {
        if(e.target.closest('.glass-btn') || e.target.closest('.dock-btn') || e.target.closest('.action-btn') || e.target.closest('#focus-panel') || e.target.closest('#top-controls')) return; 
        if (e.touches.length === 2) {
            initialDistance = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
        } else if (e.touches.length === 1) {
            previousTouchX = e.touches[0].pageX;
        }
    });

    document.addEventListener('touchmove', (e) => {
        if(e.target.closest('.glass-btn') || e.target.closest('.dock-btn') || e.target.closest('.action-btn') || e.target.closest('#focus-panel') || e.target.closest('#top-controls')) return;

        if (e.touches.length === 2) {
            let newDistance = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
            let scaleDelta = (newDistance - initialDistance) * 0.003;
            initialDistance = newDistance; 
            
            if (inFocusMode && activeFocusModel) {
                currentFocusScale = Math.max(0.2, Math.min(4.0, currentFocusScale + scaleDelta));
                activeFocusModel.setAttribute('scale', `${currentFocusScale} ${currentFocusScale} ${currentFocusScale}`);
            } else {
                currentSystemScale = Math.max(0.05, Math.min(1.0, currentSystemScale + scaleDelta));
                solarSystemRoot.setAttribute('scale', `${currentSystemScale} ${currentSystemScale} ${currentSystemScale}`);
            }
        } 
        else if (e.touches.length === 1) {
            let deltaX = e.touches[0].pageX - previousTouchX;
            previousTouchX = e.touches[0].pageX;
            
            if (inFocusMode && activeFocusModel) {
                currentFocusRotY += deltaX * 0.8; 
                activeFocusModel.setAttribute('rotation', `0 ${currentFocusRotY} 0`);
            } else {
                currentSystemRotZ += deltaX * 0.8; 
                solarSystemRoot.setAttribute('rotation', `90 0 ${currentSystemRotZ}`);
            }
        }
    });
});