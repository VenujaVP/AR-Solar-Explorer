// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 80);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = true;

// Sun (preserve natural glow)
const sunTexture = new THREE.TextureLoader().load("textures/sun.jpg");
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(8, 64, 64),
  new THREE.MeshBasicMaterial({ map: sunTexture }) 
);
scene.add(sun);

// Light to illuminate planets
const sunLight = new THREE.PointLight(0xffffff, 2, 500);
sunLight.castShadow = true;
sun.add(sunLight);



// Ambient Light
scene.add(new THREE.AmbientLight(0x222222));

// Stars
const starsGeo = new THREE.BufferGeometry();
const starVertices = [];
for (let i = 0; i < 5000; i++) {
  starVertices.push(
    (Math.random() - 0.5) * 2000,
    (Math.random() - 0.5) * 2000,
    (Math.random() - 0.5) * 2000
  );
}
starsGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVertices, 3));
scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff })));

// Planet Creator
function planet(name, size, distance, speed, texturePath, cloudPath, moonTexture, ringTexture) {
  const texture = new THREE.TextureLoader().load(texturePath);
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(size, 64, 64),
    new THREE.MeshStandardMaterial({ map: texture })
  );
  mesh.castShadow = true;
  mesh.userData = { name };

  const pivot = new THREE.Object3D();
  mesh.position.x = distance;
  pivot.add(mesh);
  scene.add(pivot);

  // Clouds
  if (cloudPath) {
    const cloudTex = new THREE.TextureLoader().load(cloudPath);
    const cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(size + 0.05, 64, 64),
      new THREE.MeshStandardMaterial({ map: cloudTex, transparent: true, opacity: 0.6 })
    );
    mesh.add(cloudMesh);
  }

  // Moon
  if (moonTexture) {
    const moonTex = new THREE.TextureLoader().load(moonTexture);
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 32, 32),
      new THREE.MeshStandardMaterial({ map: moonTex })
    );
    const moonPivot = new THREE.Object3D();
    moonMesh.position.x = size + 2;
    moonPivot.add(moonMesh);
    mesh.add(moonPivot);
  }

  // Saturn Ring
  if (ringTexture) {
    const ringTex = new THREE.TextureLoader().load(ringTexture);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(size + 1, size + 3, 64),
      new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true })
    );
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);
  }

  return { mesh, pivot, speed };
}

// Planets (closer distances & slower speeds)
const planets = [
  planet("Mercury", 1.5, 12, 0.01, "textures/mercury.jpg"),
  planet("Venus", 2, 18, 0.007, "textures/venus.jpg"),
  planet("Earth", 2.5, 24, 0.005, "textures/earth.jpg", "textures/earth_clouds.jpg", "textures/moon.jpg"),
  planet("Mars", 2, 30, 0.004, "textures/mars.jpg"),
  planet("Jupiter", 4, 38, 0.003, "textures/jupiter.jpg"),
  planet("Saturn", 3.5, 46, 0.002, "textures/saturn.jpg", null, null, "textures/saturn_ring.png"),
  planet("Uranus", 3, 52, 0.0015, "textures/uranus.jpg"),
  planet("Neptune", 3, 60, 0.001, "textures/neptune.jpg")
];

// Speed Control
const speedControl = document.getElementById("speed");

// Animate
function animate() {
  requestAnimationFrame(animate);
  planets.forEach(p => {
    p.pivot.rotation.y += p.speed * (speedControl ? speedControl.value : 1);
    p.mesh.rotation.y += 0.005;
  });
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Responsive
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
