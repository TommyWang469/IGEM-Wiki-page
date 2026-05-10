import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

(function () {

// ── Scene Setup ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('hero-canvas');
if (!canvas) return;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ── DNA Helix ────────────────────────────────────────────────────────────────
const dnaGroup = new THREE.Group();

const numPairs = 30;
const radius = 1.8;
const rise = 0.38;
const twist = (2 * Math.PI) / 10;

// Build strand tube geometry
function buildStrand(offset, color) {
  const points = [];
  for (let i = 0; i <= numPairs * 20; i++) {
    const t = i / (numPairs * 20);
    const angle = t * numPairs * twist + offset;
    const y = t * numPairs * rise - (numPairs * rise) / 2;
    points.push(new THREE.Vector3(
      radius * Math.cos(angle), y, radius * Math.sin(angle)
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, 400, 0.045, 8, false);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
  return new THREE.Mesh(geo, mat);
}

dnaGroup.add(buildStrand(0, 0x00e5ff));
dnaGroup.add(buildStrand(Math.PI, 0x7c4dff));

// Base pairs (rungs)
const rungMat = new THREE.LineBasicMaterial({ color: 0x1de9b6, transparent: true, opacity: 0.5 });
for (let i = 0; i < numPairs; i++) {
  const angle = i * twist;
  const y = i * rise - (numPairs * rise) / 2;
  const p1 = new THREE.Vector3(radius * Math.cos(angle), y, radius * Math.sin(angle));
  const p2 = new THREE.Vector3(radius * Math.cos(angle + Math.PI), y, radius * Math.sin(angle + Math.PI));
  const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
  dnaGroup.add(new THREE.Line(geo, rungMat));

  // Node spheres at pair joints
  [p1, p2].forEach((p, idx) => {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 12),
      new THREE.MeshBasicMaterial({ color: idx === 0 ? 0x00e5ff : 0x7c4dff })
    );
    sphere.position.copy(p);
    dnaGroup.add(sphere);
  });
}

dnaGroup.position.set(3, 0, 0);
scene.add(dnaGroup);

// ── Floating Particles ───────────────────────────────────────────────────────
const particleCount = 1200;
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  positions[i * 3]     = (Math.random() - 0.5) * 40;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
}
const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particleMat = new THREE.PointsMaterial({
  color: 0x00e5ff, size: 0.06, transparent: true, opacity: 0.6, sizeAttenuation: true
});
scene.add(new THREE.Points(particleGeo, particleMat));

// ── Mouse tracking ───────────────────────────────────────────────────────────
let mouse = { x: 0, y: 0 };
let targetRot = { x: 0, y: 0 };

document.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
});

// ── Scroll: push DNA back ─────────────────────────────────────────────────────
ScrollTrigger.create({
  trigger: 'body',
  start: 'top top',
  end: '40% top',
  onUpdate: (self) => {
    gsap.to(dnaGroup.position, { z: -self.progress * 8, duration: 0.3, ease: 'power2.out' });
    dnaGroup.traverse((child) => {
      if (child.material) child.material.opacity = 1 - self.progress * 0.45;
    });
  }
});

// ── Intro animation ───────────────────────────────────────────────────────────
gsap.from(dnaGroup.rotation, { y: -Math.PI * 2, duration: 3, ease: 'power3.out' });
gsap.from(dnaGroup.scale, { x: 0, y: 0, z: 0, duration: 2, ease: 'elastic.out(1, 0.5)' });

// ── Animate ───────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Smooth mouse follow
  targetRot.y += (mouse.x * 0.4 - targetRot.y) * 0.05;
  targetRot.x += (mouse.y * 0.2 - targetRot.x) * 0.05;

  dnaGroup.rotation.y = targetRot.y + t * 0.3;
  dnaGroup.rotation.x = targetRot.x;

  // Drift particles slowly
  particleGeo.attributes.position.array.forEach((_, i) => {
    if (i % 3 === 1) particleGeo.attributes.position.array[i] += 0.001;
    if (particleGeo.attributes.position.array[i] > 20) particleGeo.attributes.position.array[i] = -20;
  });
  particleGeo.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}
animate();

// ── Resize ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Section reveal animations ─────────────────────────────────────────────────
gsap.utils.toArray('.section-card').forEach((card, i) => {
  gsap.from(card, {
    scrollTrigger: { trigger: card, start: 'top 85%' },
    y: 60, opacity: 0, duration: 0.8,
    delay: (i % 3) * 0.12,
    ease: 'power3.out'
  });
});

gsap.utils.toArray('.story-node, .route-card').forEach((item, i) => {
  gsap.from(item, {
    scrollTrigger: { trigger: item, start: 'top 88%' },
    y: 36,
    opacity: 0,
    duration: 0.7,
    delay: (i % 4) * 0.08,
    ease: 'power3.out'
  });
});

gsap.from('.showcase-media', {
  scrollTrigger: { trigger: '.visual-showcase', start: 'top 78%' },
  y: 40,
  opacity: 0,
  duration: 0.9,
  ease: 'power3.out'
});

gsap.utils.toArray('.section-heading').forEach((heading) => {
  gsap.from(heading, {
    scrollTrigger: { trigger: heading, start: 'top 84%' },
    y: 32,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out'
  });
});

gsap.from('.hero-metric', {
  y: 18,
  opacity: 0,
  duration: 0.7,
  delay: 0.7,
  stagger: 0.08,
  ease: 'power3.out'
});

gsap.from('.section-label', {
  scrollTrigger: { trigger: '.sections-grid', start: 'top 80%' },
  y: 20,
  opacity: 0,
  duration: 0.7,
  ease: 'power3.out'
});

})();
