// interactions.js

document.addEventListener("DOMContentLoaded", () => {
    // === STATE VARIABLES ===
    let isPlaying = true;
    let pathsVisible = false;
    let bgVisible = false;
    let inFocusMode = false;
    let earthSpinning = true;

    // === ELEMENTS ===
    const targetEntity = document.querySelector("#target-entity");
    const uiContainer = document.querySelector("#ar-ui-container");
    const root = document.querySelector("#solar-system-root");
    const animTargets = document.querySelectorAll(".anim-target");
    const orbitPaths = document.querySelectorAll(".orbit-path");
    
    const sunWrapper = document.querySelector("#sun-wrapper");
    const earthPivot = document.querySelector("#earth-pivot");
    const earthContainer = document.querySelector("#earth-container");
    const earthSpin = document.querySelector("#earth-spin");
    const earthModel = document.querySelector("#earth-model");
    const moonPivot = document.querySelector("#moon-pivot");
    const spaceBg = document.querySelector("#space-bg");

    const focusPanel = document.querySelector("#focus-panel");
    const topControls = document.querySelector("#top-controls");

    // === 1. MARKER DETECTION (Show/Hide UI) ===
    targetEntity.addEventListener("targetFound", () => {
        uiContainer.classList.remove("hidden");
    });
    targetEntity.addEventListener("targetLost", () => {
        uiContainer.classList.add("hidden");
    });

    // === 2. TOP CONTROLS ===
    document.querySelector("#btn-play-pause").addEventListener("click", (e) => {
        isPlaying = !isPlaying;
        e.target.innerText = isPlaying ? "⏸ Pause Orbits" : "▶ Play Orbits";
        animTargets.forEach(el => el.emit(isPlaying ? 'resumeOrbit' : 'pauseOrbit'));
        
        if(!inFocusMode) {
            earthSpinning = isPlaying;
            earthSpin.emit(isPlaying ? 'resumeSpin' : 'pauseSpin');
        }
    });

    document.querySelector("#btn-toggle-orbits").addEventListener("click", (e) => {
        pathsVisible = !pathsVisible;
        e.target.innerText = pathsVisible ? "⭕ Hide Paths" : "⭕ Show Paths";
        if (!inFocusMode) {
            orbitPaths.forEach(el => el.setAttribute("visible", pathsVisible));
        }
    });

    document.querySelector("#btn-toggle-bg").addEventListener("click", (e) => {
        bgVisible = !bgVisible;
        e.target.innerText = bgVisible ? "🌌 Background: ON" : "🌌 Background: OFF";
        spaceBg.setAttribute("visible", bgVisible);
    });

    // === 3. TOUCH GESTURES (Pinch Zoom & Swipe Rotate) ===
    let initialDistance = 0;
    let currentScale = 0.2;
    let currentFocusScale = 1.0;
    let previousTouchX = 0;
    let currentRotZ = 0;
    let currentFocusRotY = 0;

    document.addEventListener('touchstart', (e) => {
        // Prevent default touch actions on the UI so pinch doesn't zoom the web browser
        if(e.target.closest('#focus-panel') || e.target.closest('#top-controls')) return; 

        if (e.touches.length === 2) {
            initialDistance = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
        } else if (e.touches.length === 1) {
            previousTouchX = e.touches[0].pageX;
        }
    });

    document.addEventListener('touchmove', (e) => {
        if(e.target.closest('#focus-panel') || e.target.closest('#top-controls')) return;

        // Two fingers: SCALE
        if (e.touches.length === 2) {
            let newDistance = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
            let scaleDelta = (newDistance - initialDistance) * 0.003;
            initialDistance = newDistance; 
            
            if (inFocusMode) {
                currentFocusScale = Math.max(0.3, Math.min(3.0, currentFocusScale + scaleDelta));
                earthModel.setAttribute('scale', `${currentFocusScale} ${currentFocusScale} ${currentFocusScale}`);
            } else {
                currentScale = Math.max(0.05, Math.min(1.0, currentScale + scaleDelta));
                root.setAttribute('scale', `${currentScale} ${currentScale} ${currentScale}`);
            }
        } 
        // One finger: ROTATE
        else if (e.touches.length === 1) {
            let deltaX = e.touches[0].pageX - previousTouchX;
            previousTouchX = e.touches[0].pageX;
            
            if (inFocusMode) {
                currentFocusRotY += deltaX * 0.8; 
                earthModel.setAttribute('rotation', `0 ${currentFocusRotY} 0`);
            } else {
                currentRotZ += deltaX * 0.8; 
                root.setAttribute('rotation', `90 0 ${currentRotZ}`);
            }
        }
    });

    // === 4. EARTH FOCUS MODE ===
    earthModel.addEventListener("click", () => {
        if (inFocusMode) return;
        inFocusMode = true;

        topControls.classList.add("hidden");
        focusPanel.classList.remove("hidden");

        // Hide everything else so only Earth is visible
        sunWrapper.setAttribute("visible", false);
        moonPivot.setAttribute("visible", false);
        spaceBg.setAttribute("visible", false);
        orbitPaths.forEach(el => el.setAttribute("visible", false));

        // Stop orbits to freeze the system
        animTargets.forEach(el => el.emit('pauseOrbit'));
        
        // Reset pivot and move Earth up into the camera view (top half)
        earthPivot.setAttribute("rotation", "0 0 0"); 
        // Z-axis pushes it UP off the physical marker toward the camera
        earthContainer.setAttribute("position", "0 0 2"); 
        
        // Scale it up for inspection
        currentFocusScale = 1.2;
        earthModel.setAttribute("scale", `${currentFocusScale} ${currentFocusScale} ${currentFocusScale}`);
        
        // Ensure Earth spin logic continues independently
        earthSpinning = true;
        document.querySelector("#btn-focus-spin").innerText = "⏸ Pause Earth Spin";
        earthSpin.emit('resumeSpin');
    });

    // Toggle Earth Spin inside Focus Mode
    document.querySelector("#btn-focus-spin").addEventListener("click", (e) => {
        earthSpinning = !earthSpinning;
        e.target.innerText = earthSpinning ? "⏸ Pause Earth Spin" : "▶ Resume Earth Spin";
        earthSpin.emit(earthSpinning ? 'resumeSpin' : 'pauseSpin');
    });

    // === 5. EXIT FOCUS MODE ===
    document.querySelector("#btn-exit-focus").addEventListener("click", () => {
        inFocusMode = false;

        topControls.classList.remove("hidden");
        focusPanel.classList.add("hidden");

        // Restore visibility
        sunWrapper.setAttribute("visible", true);
        moonPivot.setAttribute("visible", true);
        if (bgVisible) spaceBg.setAttribute("visible", true);
        if (pathsVisible) orbitPaths.forEach(el => el.setAttribute("visible", true));

        // Move Earth back to its exact orbit position
        earthContainer.setAttribute("position", "2 0 0");
        earthModel.setAttribute("scale", "0.4 0.4 0.4");
        earthModel.setAttribute("rotation", "0 0 0"); 

        // Sync spin back to master play state
        earthSpinning = isPlaying;
        earthSpin.emit(isPlaying ? 'resumeSpin' : 'pauseSpin');

        if (isPlaying) {
            animTargets.forEach(el => el.emit('resumeOrbit'));
        }
    });
});