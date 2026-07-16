// ============================================
//  JACK ALPERSTEIN · Full-screen Journey Globe
// ============================================

(function () {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas) return;

  // --- THREE.JS SETUP ---
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);

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
  window.addEventListener('load', resize);
  // Self-heal: if layout wasn't ready at init, the canvas is 0x0 — fix it
  const sizeCheck = setInterval(() => {
    if (canvas.width === 0 || canvas.height === 0) {
      resize();
    } else {
      clearInterval(sizeCheck);
    }
  }, 100);

  // --- STARFIELD ---
  const starCount = 2200;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 80 + Math.random() * 120;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = r * Math.cos(phi);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.28, sizeAttenuation: true, opacity: 0.9, transparent: true });
  scene.add(new THREE.Points(starGeo, starMat));

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
    'assets/earth-texture.jpg',
    function (tex) {
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
    },
    undefined,
    function () {
      earth.material = new THREE.MeshPhongMaterial({ color: 0x1a5f9e });
    }
  );

  const earthMat = new THREE.MeshPhongMaterial({
    map: earthTex,
    specular: new THREE.Color(0x222222),
    shininess: 12
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
  const SOCAL = { lat: 33.6, lon: -117.7, dist: 11 };

  const locations = {
    intro:      { lat: 20, lon: -40,   dist: 22, label: '' },
    sandiego:   { lat: SOCAL.lat, lon: SOCAL.lon, dist: SOCAL.dist, label: 'Southern California' },
    kenya:      { lat: -0.42, lon: 36.95, dist: 10, label: 'Nyeri, Kenya' },
    berkeley:   { lat: 37.87, lon: -122.26, dist: 11, label: 'UC Berkeley' },
    cameroon:   { lat: 4.0, lon: 14.0,  dist: 10, label: 'East Region, Cameroon' },
    chad:       { lat: 9.0, lon: 18.5,  dist: 10, label: 'Moyen-Chari, Chad' },
    atlanta:    { lat: 33.75, lon: -84.39, dist: 11, label: 'Atlanta, Georgia' },
    losangeles: { lat: SOCAL.lat, lon: SOCAL.lon, dist: SOCAL.dist, label: 'Los Angeles, California' },
    kinshasa:   { lat: -4.32, lon: 15.31, dist: 10, label: 'Kinshasa, DRC' },
    losangeles2:{ lat: SOCAL.lat, lon: SOCAL.lon, dist: 13, label: 'Los Angeles, California' }
  };

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

  // --- MARKERS ---
  const markerGroup = new THREE.Group();
  scene.add(markerGroup);

  const markerMeshes = {};
  const markerLocations = ['socal', 'kenya', 'berkeley', 'cameroon', 'chad', 'atlanta', 'kinshasa'];

  const markerCoords = {
    socal:    SOCAL,
    kenya:    locations.kenya,
    berkeley: locations.berkeley,
    cameroon: locations.cameroon,
    chad:     locations.chad,
    atlanta:  locations.atlanta,
    kinshasa: locations.kinshasa
  };

  markerLocations.forEach(key => {
    const loc = markerCoords[key];
    const pos = latLonToVec3(loc.lat, loc.lon, RADIUS * 1.005);

    const ringGeo = new THREE.RingGeometry(0.06, 0.1, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xe8a820, side: THREE.DoubleSide, transparent: true, opacity: 0
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos);
    ring.lookAt(0, 0, 0);

    const dotGeo = new THREE.CircleGeometry(0.05, 16);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xe8a820, side: THREE.DoubleSide, transparent: true, opacity: 0
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.copy(pos);
    dot.lookAt(0, 0, 0);

    markerGroup.add(ring);
    markerGroup.add(dot);
    markerMeshes[key] = { ring, dot };
  });

  function chapterToMarker(chapterKey) {
    if (chapterKey === 'sandiego' || chapterKey === 'losangeles' || chapterKey === 'losangeles2') return 'socal';
    return chapterKey;
  }

  // --- JOURNEY PATH (arcs revealed progressively) ---
  const pathOrder = ['socal', 'kenya', 'socal', 'berkeley', 'cameroon', 'chad', 'atlanta', 'socal', 'kinshasa', 'socal'];
  const pathPoints = pathOrder.map(key => {
    const loc = markerCoords[key] || SOCAL;
    return latLonToVec3(loc.lat, loc.lon, RADIUS * 1.003);
  });

  const arcRevealAtChapter = [
    'kenya',       // socal → kenya
    'berkeley',    // kenya → socal
    'berkeley',    // socal → berkeley
    'cameroon',    // berkeley → cameroon
    'chad',        // cameroon → chad
    'atlanta',     // chad → atlanta
    'losangeles',  // atlanta → socal
    'kinshasa',    // socal → kinshasa
    'losangeles2', // kinshasa → socal
  ];

  const markerRevealAtChapter = {
    socal:    'sandiego',
    kenya:    'kenya',
    berkeley: 'berkeley',
    cameroon: 'cameroon',
    chad:     'chad',
    atlanta:  'atlanta',
    kinshasa: 'kinshasa',
  };

  const arcMeshes = [];

  for (let i = 0; i < pathOrder.length - 1; i++) {
    const startPt = pathPoints[i];
    const endPt = pathPoints[i + 1];

    const angularDist = startPt.angleTo(endPt);
    const heightMul = RADIUS * (1.08 + angularDist * 0.25);

    const cp1 = new THREE.Vector3().lerpVectors(startPt, endPt, 0.33);
    cp1.normalize().multiplyScalar(heightMul);
    const cp2 = new THREE.Vector3().lerpVectors(startPt, endPt, 0.66);
    cp2.normalize().multiplyScalar(heightMul);

    const curve = new THREE.CubicBezierCurve3(startPt, cp1, cp2, endPt);
    const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.02, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0xe8a820, transparent: true, opacity: 0.5
    });
    const mesh = new THREE.Mesh(tubeGeo, tubeMat);
    // Not added to scene until revealed
    arcMeshes.push(mesh);
  }

  const chapterRevealMap = {};
  arcRevealAtChapter.forEach((chapterKey, arcIdx) => {
    if (!chapterRevealMap[chapterKey]) chapterRevealMap[chapterKey] = { arcs: [], markers: [] };
    chapterRevealMap[chapterKey].arcs.push(arcIdx);
  });
  Object.entries(markerRevealAtChapter).forEach(([markerKey, chapterKey]) => {
    if (!chapterRevealMap[chapterKey]) chapterRevealMap[chapterKey] = { arcs: [], markers: [] };
    chapterRevealMap[chapterKey].markers.push(markerKey);
  });

  // --- CAMERA STATE (spherical interpolation) ---
  let currentSpherical = {
    lat: locations.intro.lat,
    lon: locations.intro.lon,
    dist: locations.intro.dist
  };
  let targetSpherical = { ...currentSpherical };

  camera.position.copy(latLonToCamera(currentSpherical.lat, currentSpherical.lon, currentSpherical.dist));
  camera.lookAt(0, 0, 0);

  const labelEl = document.getElementById('globe-label');
  const scrollHint = document.getElementById('scroll-hint');

  function shortestLonDelta(from, to) {
    let delta = to - from;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    return delta;
  }

  // --- SCROLL-DRIVEN CHAPTER ACTIVATION ---
  const chapterEls = Array.from(document.querySelectorAll('.chapter'));

  let activeChapter = 'intro';
  const revealedChapters = new Set();

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

    // Hide scroll hint once journey begins
    if (scrollHint) {
      scrollHint.classList.toggle('hidden', locKey !== 'intro');
    }

    // Reveal arcs and markers for this chapter (once)
    if (!revealedChapters.has(locKey)) {
      revealedChapters.add(locKey);
      const reveals = chapterRevealMap[locKey];
      if (reveals) {
        reveals.arcs.forEach(idx => markerGroup.add(arcMeshes[idx]));
        reveals.markers.forEach(markerKey => {
          markerMeshes[markerKey].ring.material.opacity = 0.7;
          markerMeshes[markerKey].dot.material.opacity = 0.9;
        });
      }
    }

    // Highlight active marker among revealed ones
    const activeMarker = chapterToMarker(locKey);
    markerLocations.forEach(key => {
      const m = markerMeshes[key];
      if (m.dot.material.opacity === 0) return;
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
  const SMOOTH_TIME = 1.8;
  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);

    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    const factor = 1 - Math.exp(-3 / SMOOTH_TIME * dt);

    currentSpherical.lat += (targetSpherical.lat - currentSpherical.lat) * factor;
    currentSpherical.lon += shortestLonDelta(currentSpherical.lon, targetSpherical.lon) * factor;
    currentSpherical.dist += (targetSpherical.dist - currentSpherical.dist) * factor;

    while (currentSpherical.lon > 180) currentSpherical.lon -= 360;
    while (currentSpherical.lon < -180) currentSpherical.lon += 360;

    // Idle drift when zoomed out on intro
    if (activeChapter === 'intro') {
      targetSpherical.lon += 0.04;
    }

    const camPos = latLonToCamera(currentSpherical.lat, currentSpherical.lon, currentSpherical.dist);
    camera.position.copy(camPos);

    // Shift the globe right of center on desktop so floating cards
    // on the left don't cover the focused location.
    // Look at a point slightly to the LEFT of the globe center (in
    // camera space), which pushes the globe visually to the RIGHT.
    if (window.innerWidth > 900) {
      const forward = new THREE.Vector3(0, 0, 0).sub(camPos).normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
      const shift = currentSpherical.dist * 0.22;
      const target = right.multiplyScalar(-shift);
      camera.lookAt(target);
    } else {
      camera.lookAt(0, 0, 0);
    }

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

  document.querySelectorAll('.chapter-card, .intro-content').forEach(el => {
    el.classList.add('fade-in');
    cardObserver.observe(el);
  });
})();
