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

const numPairs = 32;
const radius = 1.85;
const rise = 0.39;
const twist = (2 * Math.PI) / 10;
const sequence = ['A', 'T', 'G', 'C', 'G', 'A', 'C', 'T', 'A', 'G', 'C', 'T'];
const complement = { A: 'T', T: 'A', G: 'C', C: 'G' };

const baseColors = {
  A: 0xffb454,
  T: 0xff6f61,
  G: 0x1de9b6,
  C: 0x7c4dff
};

const dnaMaterials = [];
const hydrogenBonds = [];

function makeMaterial(options) {
  const mat = new THREE.MeshBasicMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    ...options
  });
  mat.userData.baseOpacity = mat.opacity;
  dnaMaterials.push(mat);
  return mat;
}

function makeLineMaterial(options) {
  const mat = new THREE.LineBasicMaterial({
    transparent: true,
    ...options
  });
  mat.userData.baseOpacity = mat.opacity;
  return mat;
}

const backboneMatA = makeMaterial({ color: 0x00e5ff, opacity: 0.96 });
const backboneMatB = makeMaterial({ color: 0x9b72ff, opacity: 0.94 });
const backboneGlowMatA = makeMaterial({ color: 0x00e5ff, opacity: 0.18 });
const backboneGlowMatB = makeMaterial({ color: 0x7c4dff, opacity: 0.18 });
const phosphateMat = makeMaterial({ color: 0xe8f4f8, opacity: 0.98 });
const sugarMatA = makeMaterial({ color: 0x67f6ff, opacity: 0.98 });
const sugarMatB = makeMaterial({ color: 0xab8dff, opacity: 0.96 });
const bondMat = makeMaterial({ color: 0xe8f4f8, opacity: 0.48 });
const grooveMajorMat = makeMaterial({ color: 0xffb454, opacity: 0.3 });
const grooveMinorMat = makeMaterial({ color: 0x1de9b6, opacity: 0.24 });

const phosphateGeo = new THREE.SphereGeometry(0.13, 16, 16);
const sugarGeo = new THREE.OctahedronGeometry(0.145, 1);
const basePlateGeo = new THREE.BoxGeometry(1, 0.1, 0.34);
const bondGeo = new THREE.CylinderGeometry(0.024, 0.024, 1, 8);
const connectorGeo = new THREE.CylinderGeometry(0.02, 0.02, 1, 8);

// Build strand tube geometry
function buildStrand(offset, color, glow = false) {
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
  const geo = new THREE.TubeGeometry(curve, 400, glow ? 0.09 : 0.052, glow ? 12 : 8, false);
  const mat = color === 0x00e5ff
    ? (glow ? backboneGlowMatA : backboneMatA)
    : (glow ? backboneGlowMatB : backboneMatB);
  return new THREE.Mesh(geo, mat);
}

dnaGroup.add(buildStrand(0, 0x00e5ff, true));
dnaGroup.add(buildStrand(Math.PI, 0x7c4dff, true));
dnaGroup.add(buildStrand(0, 0x00e5ff));
dnaGroup.add(buildStrand(Math.PI, 0x7c4dff));

function pointOnStrand(angle, y) {
  return new THREE.Vector3(
    radius * Math.cos(angle),
    y,
    radius * Math.sin(angle)
  );
}

function makeCylinderBetween(start, end, radiusScale, material, geometry = connectorGeo) {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(mid);
  mesh.scale.set(radiusScale, direction.length(), radiusScale);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function makeBasePlate(start, end, base, strandIndex) {
  const material = makeMaterial({ color: baseColors[base], opacity: 0.88 });
  const mesh = new THREE.Mesh(basePlateGeo, material);
  const direction = new THREE.Vector3().subVectors(end, start);
  mesh.position.addVectors(start, end).multiplyScalar(0.5);
  mesh.scale.set(direction.length(), 1, strandIndex === 0 ? 1.1 : 0.95);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction.normalize());
  return mesh;
}

function makeBaseLabel(base, position, angle) {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '700 52px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 10;
  ctx.fillStyle = `#${baseColors[base].toString(16).padStart(6, '0')}`;
  ctx.fillText(base, 48, 50);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.72,
    depthWrite: false
  });
  material.userData.baseOpacity = material.opacity;
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.position.x += Math.cos(angle) * 0.03;
  sprite.position.z += Math.sin(angle) * 0.03;
  sprite.scale.set(0.36, 0.36, 0.36);
  return sprite;
}

function addNucleotideNode(position, strandIndex, index) {
  const phosphate = new THREE.Mesh(phosphateGeo, phosphateMat);
  phosphate.position.copy(position);
  phosphate.scale.setScalar(index % 2 === 0 ? 1 : 0.78);
  dnaGroup.add(phosphate);

  const angleShift = strandIndex === 0 ? twist * 0.28 : -twist * 0.28;
  const sugarPosition = new THREE.Vector3(
    (radius - 0.18) * Math.cos(Math.atan2(position.z, position.x) + angleShift),
    position.y + (strandIndex === 0 ? rise * 0.18 : -rise * 0.18),
    (radius - 0.18) * Math.sin(Math.atan2(position.z, position.x) + angleShift)
  );
  const sugar = new THREE.Mesh(sugarGeo, strandIndex === 0 ? sugarMatA : sugarMatB);
  sugar.position.copy(sugarPosition);
  sugar.rotation.set(index * 0.4, index * 0.2, index * 0.3);
  dnaGroup.add(sugar);

  const connector = makeCylinderBetween(position, sugarPosition, 1, bondMat);
  dnaGroup.add(connector);
}

function addHydrogenBonds(center, direction, tangent, count) {
  const offsets = count === 2 ? [-0.07, 0.07] : [-0.12, 0, 0.12];
  offsets.forEach((offset) => {
    const start = center.clone().addScaledVector(direction, -0.2).addScaledVector(tangent, offset);
    const end = center.clone().addScaledVector(direction, 0.2).addScaledVector(tangent, offset);
    const material = makeMaterial({ color: 0xe8f4f8, opacity: 0.42 });
    const bond = makeCylinderBetween(start, end, 1, material, bondGeo);
    hydrogenBonds.push(bond);
    dnaGroup.add(bond);
  });
}

// Base pairs, sugar/phosphate nodes, and hydrogen-bond details
for (let i = 0; i < numPairs; i++) {
  const angle = i * twist;
  const y = i * rise - (numPairs * rise) / 2;
  const p1 = pointOnStrand(angle, y);
  const p2 = pointOnStrand(angle + Math.PI, y);
  const center = new THREE.Vector3(0, y, 0);
  const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
  const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).normalize();
  const baseA = sequence[i % sequence.length];
  const baseB = complement[baseA];
  const innerA = center.clone().addScaledVector(direction, -0.24);
  const innerB = center.clone().addScaledVector(direction, 0.24);
  const sugarA = p1.clone().lerp(center, 0.22);
  const sugarB = p2.clone().lerp(center, 0.22);

  addNucleotideNode(p1, 0, i);
  addNucleotideNode(p2, 1, i);

  dnaGroup.add(makeBasePlate(sugarA, innerA, baseA, 0));
  dnaGroup.add(makeBasePlate(innerB, sugarB, baseB, 1));
  dnaGroup.add(makeCylinderBetween(sugarA, p1, 1, bondMat));
  dnaGroup.add(makeCylinderBetween(sugarB, p2, 1, bondMat));
  addHydrogenBonds(center, direction, tangent, baseA === 'G' || baseA === 'C' ? 3 : 2);

  if (i % 2 === 0) {
    dnaGroup.add(makeBaseLabel(baseA, sugarA.clone().lerp(innerA, 0.52), angle));
    dnaGroup.add(makeBaseLabel(baseB, sugarB.clone().lerp(innerB, 0.52), angle + Math.PI));
  }
}

// Faint guide curves hint at the major/minor grooves between the backbones.
function buildGrooveGuide(offset, material, guideRadius) {
  const points = [];
  for (let i = 0; i <= numPairs * 18; i++) {
    const t = i / (numPairs * 18);
    const angle = t * numPairs * twist + offset;
    const y = t * numPairs * rise - (numPairs * rise) / 2;
    points.push(new THREE.Vector3(
      guideRadius * Math.cos(angle),
      y,
      guideRadius * Math.sin(angle)
    ));
  }
  return new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 240, 0.018, 6, false),
    material
  );
}

dnaGroup.add(buildGrooveGuide(twist * 1.45, grooveMajorMat, radius + 0.34));
dnaGroup.add(buildGrooveGuide(Math.PI + twist * 0.45, grooveMinorMat, radius + 0.22));

dnaGroup.position.set(3, 0, 0);
dnaGroup.rotation.z = -0.08;
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
      if (child.material) {
        const baseOpacity = child.material.userData.baseOpacity || 1;
        child.material.opacity = baseOpacity * (1 - self.progress * 0.45);
      }
    });
  }
});

// ── Intro animation ───────────────────────────────────────────────────────────
gsap.from(dnaGroup.rotation, { y: -Math.PI * 2, duration: 3, ease: 'power3.out' });
gsap.from(dnaGroup.scale, { x: 0.35, y: 0.35, z: 0.35, duration: 2, ease: 'elastic.out(1, 0.5)' });

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

  hydrogenBonds.forEach((bond, i) => {
    const baseOpacity = bond.material.userData.baseOpacity || 0.4;
    bond.material.opacity = baseOpacity * (0.72 + Math.sin(t * 2.2 + i * 0.35) * 0.18);
  });

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
