// ============================================
//  JOURNEY PAGE · Scrollytelling Globe
// ============================================

(function () {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas) return;

  // --- THREE.JS SETUP ---
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const container = document.getElementById('globe-container');

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // --- LIGHTING ---
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(5, 3, 5);
  scene.add(sun);

  // --- EARTH ---
  const RADIUS = 5;
  const earthGeo = new THREE.SphereGeometry(RADIUS, 64, 64);

  // Load satellite texture
  const loader = new THREE.TextureLoader();
  const earthTex = loader.load(
    'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg',
    function () { /* loaded */ },
    undefined,
    function () {
      // Fallback: solid blue sphere if texture fails
      earth.material = new THREE.MeshPhongMaterial({ color: 0x1a5f9e });
    }
  );

  const bumpTex = loader.load(
    'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png'
  );

  const earthMat = new THREE.MeshPhongMaterial({
    map: earthTex,
    bumpMap: bumpTex,
    bumpScale: 0.3,
    specular: new THREE.Color(0x333333),
    shininess: 15
  });

  const earth = new THREE.Mesh(earthGeo, earthMat);
  scene.add(earth);

  // --- ATMOSPHERE GLOW ---
  const atmosGeo = new THREE.SphereGeometry(RADIUS * 1.015, 64, 64);
  const atmosMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
        gl_FragColor = vec4(0.4, 0.7, 1.0, intensity * 0.4);
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
  });
  scene.add(new THREE.Mesh(atmosGeo, atmosMat));

  // --- LOCATION DATA ---
  const locations = {
    intro:      { lat: 20, lon: -40,   dist: 22, label: '' },
    sandiego:   { lat: 33.1, lon: -117.2, dist: 11, label: 'North San Diego County' },
    berkeley:   { lat: 37.87, lon: -122.26, dist: 11, label: 'UC Berkeley' },
    cameroon:   { lat: 4.0, lon: 14.0,  dist: 10, label: 'East Region, Cameroon' },
    chad:       { lat: 9.0, lon: 18.5,  dist: 10, label: 'Moyen-Chari, Chad' },
    atlanta:    { lat: 33.75, lon: -84.39, dist: 11, label: 'Atlanta, Georgia' },
    losangeles: { lat: 34.05, lon: -118.24, dist: 11, label: 'Los Angeles, California' },
    outro:      { lat: 20, lon: -40,   dist: 22, label: '' }
  };

  // --- MARKERS ---
  const markerGroup = new THREE.Group();
  scene.add(markerGroup);

  const markerMeshes = {};
  const markerLocations = ['sandiego', 'berkeley', 'cameroon', 'chad', 'atlanta', 'losangeles'];

  markerLocations.forEach(key => {
    const loc = locations[key];
    const pos = latLonToVec3(loc.lat, loc.lon, RADIUS * 1.005);

    // Outer ring
    const ringGeo = new THREE.RingGeometry(0.06, 0.1, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xe8a820,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos);
    ring.lookAt(0, 0, 0);

    // Center dot
    const dotGeo = new THREE.CircleGeometry(0.05, 16);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xe8a820,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(pos);
    dot.lookAt(0, 0, 0);

    markerGroup.add(ring);
    markerGroup.add(dot);
    markerMeshes[key] = { ring, dot };
  });

  // --- JOURNEY PATH (arc lines between locations) ---
  const pathPoints = markerLocations.map(key => {
    const loc = locations[key];
    return latLonToVec3(loc.lat, loc.lon, RADIUS * 1.003);
  });

  for (let i = 0; i < pathPoints.length - 1; i++) {
    const start = pathPoints[i];
    const end = pathPoints[i + 1];
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(RADIUS * 1.15);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(48);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xe8a820,
      transparent: true,
      opacity: 0.25
    });
    markerGroup.add(new THREE.Line(lineGeo, lineMat));
  }

  // --- HELPERS ---
  function latLonToVec3(lat, lon, r) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  function latLonToCamera(lat, lon, dist) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -dist * Math.sin(phi) * Math.cos(theta),
       dist * Math.cos(phi),
       dist * Math.sin(phi) * Math.sin(theta)
    );
  }

  // --- CAMERA STATE (spherical interpolation) ---
  // Track camera as lat/lon/dist and interpolate in spherical space
  // so the camera follows the globe surface instead of cutting through it
  let currentSpherical = {
    lat: locations.intro.lat,
    lon: locations.intro.lon,
    dist: locations.intro.dist
  };
  let targetSpherical = { ...currentSpherical };

  const initPos = latLonToCamera(currentSpherical.lat, currentSpherical.lon, currentSpherical.dist);
  camera.position.copy(initPos);
  camera.lookAt(0, 0, 0);

  const labelEl = document.getElementById('globe-label');

  // Shortest-path longitude delta (handles wraparound)
  function shortestLonDelta(from, to) {
    let delta = to - from;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    return delta;
  }

  // --- SCROLL-DRIVEN CHAPTER ACTIVATION ---
  // Each chapter locks in when its top crosses 30% from the top of the viewport,
  // and stays locked until the NEXT chapter's top crosses that same line.
  const chapterEls = Array.from(document.querySelectorAll('.chapter'));

  function setActiveChapter(locKey) {
    if (locKey === activeChapter || !locations[locKey]) return;
    activeChapter = locKey;
    const loc = locations[locKey];
    targetSpherical = { lat: loc.lat, lon: loc.lon, dist: loc.dist };

    // Update label
    if (labelEl) {
      if (loc.label) {
        labelEl.textContent = loc.label;
        labelEl.classList.add('visible');
      } else {
        labelEl.classList.remove('visible');
      }
    }

    // Highlight active marker
    markerLocations.forEach(key => {
      const m = markerMeshes[key];
      const isActive = key === locKey;
      m.ring.material.opacity = isActive ? 1 : 0.4;
      m.dot.material.opacity = isActive ? 1 : 0.5;
      m.ring.scale.setScalar(isActive ? 1.8 : 1);
    });
  }

  let activeChapter = 'intro';
  const TRIGGER_LINE = 0.3; // 30% from top of viewport

  function onScroll() {
    const triggerY = window.innerHeight * TRIGGER_LINE;

    // Walk chapters in reverse; the first one whose top is above the trigger line wins
    for (let i = chapterEls.length - 1; i >= 0; i--) {
      const rect = chapterEls[i].getBoundingClientRect();
      if (rect.top <= triggerY) {
        setActiveChapter(chapterEls[i].dataset.location);
        return;
      }
    }
    // If none matched (scrolled above everything), use the first chapter
    setActiveChapter(chapterEls[0].dataset.location);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // set initial state

  // --- ANIMATION LOOP ---
  const lerpSpeed = 0.025;

  function animate() {
    requestAnimationFrame(animate);

    // Interpolate in spherical coordinates (smooth globe-surface path)
    currentSpherical.lat += (targetSpherical.lat - currentSpherical.lat) * lerpSpeed;
    currentSpherical.lon += shortestLonDelta(currentSpherical.lon, targetSpherical.lon) * lerpSpeed;
    currentSpherical.dist += (targetSpherical.dist - currentSpherical.dist) * lerpSpeed;

    // Normalize longitude
    while (currentSpherical.lon > 180) currentSpherical.lon -= 360;
    while (currentSpherical.lon < -180) currentSpherical.lon += 360;

    // Subtle idle drift when zoomed out (applied via camera lon, not earth rotation)
    if (activeChapter === 'intro' || activeChapter === 'outro') {
      targetSpherical.lon += 0.04;
    }

    // Convert to camera position
    const camPos = latLonToCamera(currentSpherical.lat, currentSpherical.lon, currentSpherical.dist);
    camera.position.copy(camPos);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();

  // --- CHAPTER CARD FADE-IN ---
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.chapter-card, .photo-frame').forEach(el => {
    el.classList.add('fade-in');
    cardObserver.observe(el);
  });
})();
