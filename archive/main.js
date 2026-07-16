// ============================================
//  JACK ALPERSTEIN PORTFOLIO · main.js
// ============================================

// --- Fade-in on scroll ---
const fadeEls = document.querySelectorAll(
  '.about-grid, .stat-card, .project-card, .timeline-item, .contact-grid, .section-header, .hero-impact'
);

if (fadeEls.length) {
  fadeEls.forEach(el => el.classList.add('fade-in'));

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, 80 * (entry.target.dataset.delay || 0));
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  fadeEls.forEach((el, i) => {
    el.dataset.delay = i;
    fadeObserver.observe(el);
  });
}

// --- Nav shadow on scroll ---
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.style.boxShadow = '0 2px 12px rgba(15,61,102,0.1)';
    } else {
      nav.style.boxShadow = '0 1px 3px rgba(15,61,102,0.08)';
    }
  });
}

// --- Staggered timeline items ---
document.querySelectorAll('.timeline-item').forEach((item, i) => {
  item.style.transitionDelay = `${i * 80}ms`;
});

// --- Particle / Constellation Background ---
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const hero = document.getElementById('hero');
  if (!hero) return;

  function resize() {
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COUNT = 50;
  const MAX_DIST = 120;

  const particles = Array.from({ length: COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    r: Math.random() * 2.0 + 1.0
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = 0.35 * (1 - dist / MAX_DIST);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.lineWidth = 1.4;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });

    requestAnimationFrame(draw);
  }
  draw();
})();

// --- Project Modal ---
(function initModals() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  const projectData = {
    heat: {
      title: 'Heat Exposure & Emergency Room Visits in Southern California',
      tags: ['THESIS', 'EPIDEMIOLOGY', 'R', 'CASE-CROSSOVER'],
      desc: 'MPH thesis research evaluating the association between ambient heat exposure and heat-related emergency room visits across Southern California from 2010 to 2019, using a case-crossover epidemiological design.',
      details: [
        'Analyzed 60+ million patient records from the California Office of Statewide Health Planning and Development (OSHPD)',
        'Introduced primary language spoken as a novel social determinant of health in the context of heat vulnerability',
        'Applied a time-stratified case-crossover design with conditional logistic regression in R',
        'Examined effect modification by language group, age, and geographic region',
        'Identified statistically significant increased ER risk on extreme heat days, with differential risk by language group'
      ],
      metrics: ['60M+ records', '2010\u20132019', 'R / tidyverse', 'Case-crossover design', 'Conditional logistic regression']
    },
    carter: {
      title: 'Carter Center Trachoma Lab Database Modernization',
      tags: ['DATABASE', 'SQL', 'R', 'SHINYAPPS', 'GLOBAL HEALTH'],
      desc: 'Led the modernization of laboratory management databases for the Carter Center\'s Trachoma Control Program, improving specimen tracking, diagnostic capacity, and data quality in Ethiopian hospitals.',
      details: [
        'Designed relational database schema for lab specimen management using SQL',
        'Built R/ShinyApps dashboard for real-time tracking of trachoma lab specimens and results',
        'Streamlined data entry workflows, reducing data errors and specimen loss',
        'Supported integration with Carter Center global reporting systems (PowerBI)',
        'Trained local Ethiopian hospital staff on the new system'
      ],
      metrics: ['SQL / R', 'ShinyApps', 'PowerBI', 'Ethiopian hospitals', 'Carter Center']
    },
    pm25: {
      title: 'PM2.5 Low-Cost Sensor Analysis for Environmental Justice',
      tags: ['AIR QUALITY', 'ENV JUSTICE', 'R', 'GIS'],
      desc: 'Analyzed low-cost particulate matter (PM2.5) sensor networks in environmental justice communities across Georgia, producing policy-relevant visualizations and compliance reports for the Georgia Environmental Protection Division.',
      details: [
        'Processed and QA/QC\'d time-series data from PurpleAir low-cost PM2.5 sensors',
        'Compared low-cost sensor data to EPA Federal Reference Monitor (FRM) readings',
        'Produced spatial visualizations using GIS tools to identify pollution hotspots in EJ communities',
        'Authored compliance reports supporting EPA Ethylene Oxide and PM2.5 monitoring requirements',
        'Automated equipment inventory management database for EPA policy adherence using R'
      ],
      metrics: ['Georgia EPD', 'R / GIS', 'PurpleAir sensors', 'EPA compliance', 'Env. Justice']
    }
  };

  const modalTitle = document.getElementById('modal-title');
  const modalTags = document.getElementById('modal-tags');
  const modalDesc = document.getElementById('modal-desc');
  const modalDetails = document.getElementById('modal-details');
  const modalMetrics = document.getElementById('modal-metrics');
  const closeBtn = document.getElementById('modal-close');

  function openModal(key) {
    const data = projectData[key];
    if (!data) return;

    modalTags.innerHTML = data.tags
      .map(t => `<span class="proj-tag">${t}</span>`)
      .join('');

    modalTitle.textContent = data.title;
    modalDesc.textContent = data.desc;

    modalDetails.innerHTML = `<ul>${data.details
      .map(d => `<li>${d}</li>`)
      .join('')}</ul>`;

    modalMetrics.innerHTML = data.metrics
      .map(m => `<span class="modal-metric-chip">${m}</span>`)
      .join('');

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.project-card[data-modal]').forEach(card => {
    card.addEventListener('click', () => {
      openModal(card.dataset.modal);
    });
    card.style.cursor = 'pointer';
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
})();
