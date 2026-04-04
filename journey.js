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
  const earthGeo = new THREE.SphereGeometry(RADIUS, 128, 128);

  const loader = new THREE.TextureLoader();
  const earthTex = loader.load(
    'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg',
    function () {},
    undefined,
    function () {
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
  // San Diego and Los Angeles share a single "Southern California" marker
  const SOCAL = { lat: 33.6, lon: -117.7, dist: 11 };

  const locations = {
    intro:      { lat: 20, lon: -40,   dist: 22, label: '' },
    sandiego:   { lat: SOCAL.lat, lon: SOCAL.lon, dist: SOCAL.dist, label: 'Southern California' },
    berkeley:   { lat: 37.87, lon: -122.26, dist: 11, label: 'UC Berkeley' },
    cameroon:   { lat: 4.0, lon: 14.0,  dist: 10, label: 'East Region, Cameroon' },
    chad:       { lat: 9.0, lon: 18.5,  dist: 10, label: 'Moyen-Chari, Chad' },
    atlanta:    { lat: 33.75, lon: -84.39, dist: 11, label: 'Atlanta, Georgia' },
    losangeles: { lat: SOCAL.lat, lon: SOCAL.lon, dist: SOCAL.dist, label: 'Southern California' },
    outro:      { lat: 20, lon: -40,   dist: 22, label: '' }
  };

  // --- MARKERS ---
  // Only 4 unique dots: Southern California, Berkeley, Cameroon, Chad, Atlanta
  const markerGroup = new THREE.Group();
  scene.add(markerGroup);

  const markerMeshes = {};
  const markerLocations = ['socal', 'berkeley', 'cameroon', 'chad', 'atlanta'];

  const markerCoords = {
    socal:    SOCAL,
    berkeley: locations.berkeley,
    cameroon: locations.cameroon,
    chad:     locations.chad,
    atlanta:  locations.atlanta
  };

  markerLocations.forEach(key => {
    const loc = markerCoords[key];
    const pos = latLonToVec3(loc.lat, loc.lon, RADIUS * 1.005);

    const ringGeo = new THREE.RingGeometry(0.06, 0.1, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xe8a820, side: THREE.DoubleSide, transparent: true, opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos);
    ring.lookAt(0, 0, 0);

    const dotGeo = new THREE.CircleGeometry(0.05, 16);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xe8a820, side: THREE.DoubleSide, transparent: true, opacity: 0.9
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(pos);
    dot.lookAt(0, 0, 0);

    markerGroup.add(ring);
    markerGroup.add(dot);
    markerMeshes[key] = { ring, dot };
  });

  // Map chapter keys to their marker key
  function chapterToMarker(chapterKey) {
    if (chapterKey === 'sandiego' || chapterKey === 'losangeles') return 'socal';
    return chapterKey;
  }

  // --- JOURNEY PATH (arc lines between markers) ---
  const pathOrder = ['socal', 'berkeley', 'cameroon', 'chad', 'atlanta', 'socal'];
  const pathPoints = pathOrder.map(key => {
    const loc = markerCoords[key] || SOCAL;
    return latLonToVec3(loc.lat, loc.lon, RADIUS * 1.003);
  });

  for (let i = 0; i < pathPoints.length - 1; i++) {
    const start = pathPoints[i];
    const end = pathPoints[i + 1];
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mid.normalize().multiplyScalar(RADIUS * 1.15);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.02, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0xe8a820, transparent: true, opacity: 0.45
    });
    markerGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
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

  function shortestLonDelta(from, to) {
    let delta = to - from;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    return delta;
  }

  // --- SCROLL-DRIVEN CHAPTER ACTIVATION ---
  const chapterEls = Array.from(document.querySelectorAll('.chapter'));

  let activeChapter = 'intro';

  function setActiveChapter(locKey) {
    if (locKey === activeChapter || !locations[locKey]) return;
    activeChapter = locKey;
    const loc = locations[locKey];
    targetSpherical = { lat: loc.lat, lon: loc.lon, dist: loc.dist };

    if (labelEl) {
      if (loc.label) {
        labelEl.textContent = loc.label;
        labelEl.classList.add('visible');
      } else {
        labelEl.classList.remove('visible');
      }
    }

    const activeMarker = chapterToMarker(locKey);
    markerLocations.forEach(key => {
      const m = markerMeshes[key];
      const isActive = key === activeMarker;
      m.ring.material.opacity = isActive ? 1 : 0.4;
      m.dot.material.opacity = isActive ? 1 : 0.5;
      m.ring.scale.setScalar(isActive ? 1.8 : 1);
    });
  }

  const TRIGGER_LINE = 0.3;

  function onScroll() {
    const triggerY = window.innerHeight * TRIGGER_LINE;
    for (let i = chapterEls.length - 1; i >= 0; i--) {
      const rect = chapterEls[i].getBoundingClientRect();
      if (rect.top <= triggerY) {
        setActiveChapter(chapterEls[i].dataset.location);
        return;
      }
    }
    setActiveChapter(chapterEls[0].dataset.location);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- ANIMATION LOOP ---
  // Use time-based smoothing for frame-rate-independent, stutter-free transitions
  const SMOOTH_TIME = 1.8; // seconds to ~95% of target
  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);

    const dt = Math.min((now - lastTime) / 1000, 0.1); // cap delta to avoid jumps
    lastTime = now;

    // Exponential smoothing factor (frame-rate independent)
    const factor = 1 - Math.exp(-3 / SMOOTH_TIME * dt);

    currentSpherical.lat += (targetSpherical.lat - currentSpherical.lat) * factor;
    currentSpherical.lon += shortestLonDelta(currentSpherical.lon, targetSpherical.lon) * factor;
    currentSpherical.dist += (targetSpherical.dist - currentSpherical.dist) * factor;

    while (currentSpherical.lon > 180) currentSpherical.lon -= 360;
    while (currentSpherical.lon < -180) currentSpherical.lon += 360;

    // Subtle idle drift when zoomed out
    if (activeChapter === 'intro' || activeChapter === 'outro') {
      targetSpherical.lon += 0.04;
    }

    const camPos = latLonToCamera(currentSpherical.lat, currentSpherical.lon, currentSpherical.dist);
    camera.position.copy(camPos);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

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
