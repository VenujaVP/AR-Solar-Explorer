document.addEventListener("DOMContentLoaded", () => {
    // === STATE VARIABLES ===
    let isPlaying = true;
    let pathsVisible = false;
    let bgVisible = false;
    let focusedObject = null; // Tracks which planet is being explored
    let isSpinning = true;

    // === ELEMENTS ===
    const targetEntity = document.querySelector("#target-entity");
    const uiContainer = document.querySelector("#ar-ui-container");
    const root = document.querySelector("#solar-system-root");
    const animTargets = document.querySelectorAll(".anim-target");
    const orbitPaths = document.querySelectorAll(".orbit-path");
    
    // 3D Objects & Wrappers
    const spaceBg = document.querySelector("#space-bg");
    const sunWrapper = document.querySelector("#sun-wrapper");
    const sunModel = document.querySelector("#sun-model");
    const earthPivot = document.querySelector("#earth-pivot");
    const earthContainer = document.querySelector("#earth-container");
    const earthSpin = document.querySelector("#earth-spin");
    const earthModel = document.querySelector("#earth-model");
    const moonPivot = document.querySelector("#moon-pivot");
    const moonSpin = document.querySelector("#moon-spin");
    const moonModel = document.querySelector("#moon-model");
    const moonPath = document.querySelector("#moon-path");

    // UI Elements
    const topControls = document.querySelector("#top-controls");
    const planetSelector = document.querySelector("#planet-selector");
    const focusPanel = document.querySelector("#focus-panel");
    const focusTitle = document.querySelector("#focus-title");
    const focusDesc = document.querySelector("#focus-desc");

    // === MARKER DETECTION ===
    targetEntity.addEventListener("targetFound", () => uiContainer.classList.remove("hidden"));
    targetEntity.addEventListener("targetLost", () => uiContainer.classList.add("hidden"));

    // === TOP CONTROLS ===
    document.querySelector("#btn-play-pause").addEventListener("click", (e) => {
        isPlaying = !isPlaying;
        e.target.innerText = isPlaying ? "⏸ Pause Orbits" : "▶ Play Orbits";
        animTargets.forEach(el => el.emit(isPlaying ? 'resumeOrbit' : 'pauseOrbit'));
        
        if(!focusedObject) {
            earthSpin.emit(isPlaying ? 'resumeSpin' : 'pauseSpin');
            moonSpin.emit(isPlaying ? 'resumeSpin' : 'pauseSpin');
        }
    });

    document.querySelector("#btn-toggle-orbits").addEventListener("click", (e) => {
        pathsVisible = !pathsVisible;
        e.target.innerText = pathsVisible ? "⭕ Hide Paths" : "⭕ Show Paths";
        if (!focusedObject) {
            orbitPaths.forEach(el => el.setAttribute("visible", pathsVisible));
        }
    });

    document.querySelector("#btn-toggle-bg").addEventListener("click", (e) => {
        bgVisible = !bgVisible;
        e.target.innerText = bgVisible ? "🌌 Background: ON" : "🌌 Background: OFF";
        spaceBg.setAttribute("visible", bgVisible);
    });

    // === PLANET DATA DATABASE ===
    const planetData = {
        sun: {
            title: "☀️ The Sun",
            desc: "The star at the center of the Solar System.<br><br><b>Explore:</b> Swipe to rotate, Pinch to zoom.",
            target: sunWrapper,
            model: sunModel,
            baseScale: 1,
            focusScale: 1.5,
            defaultPos: "0 0 0"
        },
        earth: {
            title: "🌍 Earth",
            desc: "Third planet from the Sun. The only known world to harbor life.<br><br><b>Explore:</b> Swipe to rotate, Pinch to zoom.",
            target: earthContainer,
            model: earthModel,
            baseScale: 0.4,
            focusScale: 1.2,
            defaultPos: "2 0 0"
        },
        moon: {
            title: "🌙 The Moon",
            desc: "Earth's only natural satellite.<br><br><b>Explore:</b> Swipe to rotate, Pinch to zoom.",
            target: moonModel, // We move the model directly for the Moon
            model: moonModel,
            baseScale: 0.15,
            focusScale: 0.8,
            defaultPos: "0.6 0 0"
        }
    };

    // === EXPLORE MODE TRIGGER ===
    function enterFocusMode(planetKey) {
        focusedObject = planetKey;
        const data = planetData[planetKey];

        // 1. Manage UI
        topControls.classList.add("hidden");
        planetSelector.classList.add("hidden");
        focusPanel.classList.remove("hidden");
        focusTitle.innerHTML = data.title;
        focusDesc.innerHTML = data.desc;

        // 2. Hide everything in the system
        sunWrapper.setAttribute("visible", false);
        earthContainer.setAttribute("visible", false);
        moonModel.setAttribute("visible", false);
        spaceBg.setAttribute("visible", false);
        orbitPaths.forEach(el => el.setAttribute("visible", false));

        // 3. Pause all orbits
        animTargets.forEach(el => el.emit('pauseOrbit'));

        // 4. Reset pivots to stabilize math
        earthPivot.setAttribute("rotation", "0 0 0"); 
        moonPivot.setAttribute("rotation", "0 0 0"); 

        // 5. Unhide ONLY the selected target, push to top of screen, and scale up
        data.target.setAttribute("visible", true);
        data.target.setAttribute("position", "0 1.5 -2.5"); 
        
        currentFocusScale = data.focusScale;
        data.model.setAttribute("scale", `${currentFocusScale} ${currentFocusScale} ${currentFocusScale}`);
        
        // 6. Manage Spin State
        isSpinning = true;
        document.querySelector("#btn-focus-spin").innerText = "⏸ Pause Spin";
        if (planetKey === 'earth') earthSpin.emit('resumeSpin');
        if (planetKey === 'moon') moonSpin.emit('resumeSpin');
        if (planetKey === 'sun') sunWrapper.emit('resumeOrbit');
    }

    // Connect the 3 buttons
    document.querySelector("#btn-focus-sun").addEventListener("click", () => enterFocusMode('sun'));
    document.querySelector("#btn-focus-earth").addEventListener("click", () => enterFocusMode('earth'));
    document.querySelector("#btn-focus-moon").addEventListener("click", () => enterFocusMode('moon'));

    // === EXIT EXPLORE MODE ===
    document.querySelector("#btn-exit-focus").addEventListener("click", () => {
        const data = planetData[focusedObject];
        focusedObject = null;

        // Restore UI
        topControls.classList.remove("hidden");
        planetSelector.classList.remove("hidden");
        focusPanel.classList.add("hidden");

        // Restore visibility to everything
        sunWrapper.setAttribute("visible", true);
        earthContainer.setAttribute("visible", true);
        moonModel.setAttribute("visible", true);
        if (bgVisible) spaceBg.setAttribute("visible", true);
        if (pathsVisible) orbitPaths.forEach(el => el.setAttribute("visible", true));

        // Put the explored object back where it belongs
        data.target.setAttribute("position", data.defaultPos);
        data.model.setAttribute("scale", `${data.baseScale} ${data.baseScale} ${data.baseScale}`);
        data.model.setAttribute("rotation", "0 0 0"); // Reset manual swipes

        // Resume orbits if system is playing
        if (isPlaying) {
            animTargets.forEach(el => el.emit('resumeOrbit'));
            earthSpin.emit('resumeSpin');
            moonSpin.emit('resumeSpin');
        } else {
            earthSpin.emit('pauseSpin');
            moonSpin.emit('pauseSpin');
        }
    });

    // === TOGGLE SPIN BUTTON ===
    document.querySelector("#btn-focus-spin").addEventListener("click", (e) => {
        isSpinning = !isSpinning;
        e.target.innerText = isSpinning ? "⏸ Pause Spin" : "▶ Resume Spin";
        
        if (focusedObject === 'earth') earthSpin.emit(isSpinning ? 'resumeSpin' : 'pauseSpin');
        if (focusedObject === 'moon') moonSpin.emit(isSpinning ? 'resumeSpin' : 'pauseSpin');
        if (focusedObject === 'sun') sunWrapper.emit(isSpinning ? 'resumeOrbit' : 'pauseOrbit');
    });

    // === TOUCH GESTURES (SWIPE & PINCH) ===
    let initialDistance = 0;
    let currentScale = 0.2;
    let currentFocusScale = 1.0;
    let previousTouchX = 0;
    let currentRotZ = 0;
    let currentFocusRotY = 0;

    document.addEventListener('touchstart', (e) => {
        if(e.target.closest('.ar-btn') || e.target.closest('#focus-panel') || e.target.closest('#top-controls')) return; 
        if (e.touches.length === 2) {
            initialDistance = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
        } else if (e.touches.length === 1) {
            previousTouchX = e.touches[0].pageX;
        }
    });

    document.addEventListener('touchmove', (e) => {
        if(e.target.closest('.ar-btn') || e.target.closest('#focus-panel') || e.target.closest('#top-controls')) return;

        // PINCH TO ZOOM
        if (e.touches.length === 2) {
            let newDistance = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
            let scaleDelta = (newDistance - initialDistance) * 0.003;
            initialDistance = newDistance; 
            
            if (focusedObject) {
                // Zoom the currently focused planet
                const model = planetData[focusedObject].model;
                currentFocusScale = Math.max(0.2, Math.min(4.0, currentFocusScale + scaleDelta));
                model.setAttribute('scale', `${currentFocusScale} ${currentFocusScale} ${currentFocusScale}`);
            } else {
                // Zoom the whole solar system
                currentScale = Math.max(0.05, Math.min(1.0, currentScale + scaleDelta));
                root.setAttribute('scale', `${currentScale} ${currentScale} ${currentScale}`);
            }
        } 
        // SWIPE TO ROTATE
        else if (e.touches.length === 1) {
            let deltaX = e.touches[0].pageX - previousTouchX;
            previousTouchX = e.touches[0].pageX;
            
            if (focusedObject) {
                // Rotate the focused planet on its Y axis
                const model = planetData[focusedObject].model;
                currentFocusRotY += deltaX * 0.8; 
                model.setAttribute('rotation', `0 ${currentFocusRotY} 0`);
            } else {
                // Rotate the entire system
                currentRotZ += deltaX * 0.8; 
                root.setAttribute('rotation', `90 0 ${currentRotZ}`);
            }
        }
    });
});