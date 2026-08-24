document.addEventListener("DOMContentLoaded", () => {
    // === STATE VARIABLES ===
    let isPlaying = true;
    let pathsVisible = false;
    let bgVisible = false;
    let inFocusMode = false;
    let systemScale = 0.2;
    let systemRotationZ = 0;
    let focusEarthScale = 0.4;

    // === ELEMENTS ===
    const root = document.querySelector("#solar-system-root");
    const animTargets = document.querySelectorAll(".anim-target");
    const orbitPaths = document.querySelectorAll(".orbit-path");
    
    const sunWrapper = document.querySelector("#sun-wrapper");
    const earthPivot = document.querySelector("#earth-pivot");
    const earthContainer = document.querySelector("#earth-container");
    const earthModel = document.querySelector("#earth-model");
    const moonPivot = document.querySelector("#moon-pivot");
    const spaceBg = document.querySelector("#space-bg");

    const focusPanel = document.querySelector("#focus-panel");
    const topControls = document.querySelector("#top-controls");
    const systemControls = document.querySelector("#system-controls");

    // === PLAY / PAUSE ORBITS ===
    document.querySelector("#btn-play-pause").addEventListener("click", (e) => {
        isPlaying = !isPlaying;
        e.target.innerText = isPlaying ? "⏸ Pause Orbits" : "▶ Play Orbits";
        animTargets.forEach(el => {
            el.emit(isPlaying ? 'resumeOrbit' : 'pauseOrbit');
        });
    });

    // === TOGGLE ORBIT PATHS ===
    document.querySelector("#btn-toggle-orbits").addEventListener("click", (e) => {
        pathsVisible = !pathsVisible;
        e.target.innerText = pathsVisible ? "⭕ Hide Paths" : "⭕ Show Paths";
        // Only show if we aren't in focus mode
        if (!inFocusMode) {
            orbitPaths.forEach(el => el.setAttribute("visible", pathsVisible));
        }
    });

    // === TOGGLE BACKGROUND ===
    document.querySelector("#btn-toggle-bg").addEventListener("click", (e) => {
        bgVisible = !bgVisible;
        e.target.innerText = bgVisible ? "🌌 Background: ON" : "🌌 Background: OFF";
        spaceBg.setAttribute("visible", bgVisible);
    });

    // === SYSTEM CONTROLS (Scale & Rotate) ===
    document.querySelector("#btn-scale-up").addEventListener("click", () => {
        if (systemScale < 0.6) systemScale += 0.05;
        root.setAttribute("scale", `${systemScale} ${systemScale} ${systemScale}`);
    });
    
    document.querySelector("#btn-scale-down").addEventListener("click", () => {
        if (systemScale > 0.05) systemScale -= 0.05;
        root.setAttribute("scale", `${systemScale} ${systemScale} ${systemScale}`);
    });

    document.querySelector("#btn-rotate-left").addEventListener("click", () => {
        systemRotationZ -= 15;
        root.setAttribute("rotation", `90 0 ${systemRotationZ}`);
    });

    document.querySelector("#btn-rotate-right").addEventListener("click", () => {
        systemRotationZ += 15;
        root.setAttribute("rotation", `90 0 ${systemRotationZ}`);
    });

    // === EARTH FOCUS MODE (The Complex Interaction) ===
    earthModel.addEventListener("click", () => {
        if (inFocusMode) return; // Prevent double clicks
        inFocusMode = true;

        // 1. Hide UI and show Focus Panel
        topControls.classList.add("hidden");
        systemControls.classList.add("hidden");
        focusPanel.classList.remove("hidden");

        // 2. Hide everything else
        sunWrapper.setAttribute("visible", false);
        moonPivot.setAttribute("visible", false);
        orbitPaths.forEach(el => el.setAttribute("visible", false));

        // 3. Pause orbits and move Earth to center of the marker
        animTargets.forEach(el => el.emit('pauseOrbit'));
        earthPivot.setAttribute("rotation", "0 0 0"); // Reset orbit angle
        earthContainer.setAttribute("position", "0 0 0"); // Move to center
        
        // 4. Make Earth huge for inspection
        focusEarthScale = 1.2;
        earthModel.setAttribute("scale", `${focusEarthScale} ${focusEarthScale} ${focusEarthScale}`);
        
        // Ensure Earth keeps spinning on its axis
        document.querySelector("#earth-spin").emit('resumeOrbit');
    });

    // === EXIT FOCUS MODE ===
    document.querySelector("#btn-exit-focus").addEventListener("click", () => {
        inFocusMode = false;

        // 1. Restore UI
        topControls.classList.remove("hidden");
        systemControls.classList.remove("hidden");
        focusPanel.classList.add("hidden");

        // 2. Restore visibility
        sunWrapper.setAttribute("visible", true);
        moonPivot.setAttribute("visible", true);
        if (pathsVisible) orbitPaths.forEach(el => el.setAttribute("visible", true));

        // 3. Move Earth back to its orbit position
        earthContainer.setAttribute("position", "2 0 0");
        earthModel.setAttribute("scale", "0.4 0.4 0.4"); // Restore original scale

        // 4. Resume all orbits if the global play state is true
        if (isPlaying) {
            animTargets.forEach(el => el.emit('resumeOrbit'));
        }
    });

    // === FOCUS MODE ZOOM CONTROLS ===
    document.querySelector("#btn-focus-zoom-in").addEventListener("click", () => {
        if (focusEarthScale < 3.0) focusEarthScale += 0.2;
        earthModel.setAttribute("scale", `${focusEarthScale} ${focusEarthScale} ${focusEarthScale}`);
    });

    document.querySelector("#btn-focus-zoom-out").addEventListener("click", () => {
        if (focusEarthScale > 0.5) focusEarthScale -= 0.2;
        earthModel.setAttribute("scale", `${focusEarthScale} ${focusEarthScale} ${focusEarthScale}`);
    });
});