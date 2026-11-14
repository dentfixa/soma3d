import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { koMuscle, koNerve, nervousKind, regionOf, ORGANS, REGIONS, SUBGROUPS } from './ko_terms.js?v=14';
import { koGeneral, GROUPS_KO } from './ko_general.js?v=14';

// ---------------------------------------------------------------- layers
// depth: 0 skin, 1 muscle, 2 skeleton, 3 deep organs (used by the peel slider)
const SETS = [
  { key: 'bp', title: '기본 모델 (BodyParts3D)', path: 'models/bp3d/', layers: [
    { k: 'teg', ko: '피부·모발', color: '#d9a287', depth: 0, on: true },
    { k: 'mus', ko: '근육', color: '#b8404a', depth: 1, on: true },
    { k: 'esq', ko: '골격', color: '#e8dcc4', depth: 2, on: true },
    { k: 'ner', ko: '신경·감각기', color: '#e3c16f', depth: 3, on: true },
    { k: 'car', ko: '심장·혈관', color: '#c8283a', depth: 3, on: true },
    { k: 'res', ko: '호흡기', color: '#e58f9c', depth: 3, on: true },
    { k: 'dig', ko: '소화기', color: '#c98a4b', depth: 3, on: true },
    { k: 'uri', ko: '비뇨기', color: '#d6b24a', depth: 3, on: true },
    { k: 'rep', ko: '생식기', color: '#6f8fc7', depth: 3, on: true },
    { k: 'end', ko: '내분비', color: '#8e6bbf', depth: 3, on: true },
    { k: 'lin', ko: '비장·가슴샘', color: '#6aa36f', depth: 3, on: true },
  ] },
  { key: 'za', title: '상세 모델 (Z-Anatomy)', path: 'models/zanat/', layers: [
    { k: 'lymphatic', ko: '림프계', color: '#1fff06', depth: 3, on: true },
    // the base model has no tongue, pharynx or thyroid, so these few come from the detailed model's organ file
    { k: 'mouth', file: 'visceral', keep: /tongue|palate|uvula|pharynx|thyroid|sublingual/i, ko: '혀·인두·갑상샘', color: '#d9736a', depth: 3, on: true },
    { k: 'muscular', ko: '근육·근막', color: '#cc2818', depth: 1, on: false },
    { k: 'skeletal', ko: '골격', color: '#cc8b4f', depth: 2, on: false },
    { k: 'joints', ko: '관절·인대', color: '#cbfef8', depth: 2, on: false },
    { k: 'cardiovascular', ko: '혈관', color: '#c82828', depth: 3, on: false },
    { k: 'nervous', ko: '신경', color: '#f2e24a', depth: 3, on: true },
    { k: 'visceral', ko: '내장', color: '#cc5814', depth: 3, on: false },
  ] },
];
const LAYERS = [];
for (const set of SETS) for (const L of set.layers) {
  Object.assign(L, { set, id: set.key + ':' + L.k, opacity: 1, state: 'idle', structs: [], group: null });
  LAYERS.push(L);
}
const byId = Object.fromEntries(LAYERS.map(L => [L.id, L]));
const NERV = ['za:nervous', 'bp:ner'];

// Quick views: which layers stay on (everything else is switched off).
const PRESETS = [
  { ko: '전체', ids: LAYERS.filter(L => L.on).map(L => L.id) },
  { ko: '피부', ids: ['bp:teg'] },
  { ko: '근육', ids: ['bp:mus'] },
  { ko: '골격', ids: ['bp:esq'] },
  { ko: '림프', ids: ['za:lymphatic', 'bp:lin'], ghost: 'bp:esq' },
  { ko: '신경', ids: ['bp:ner', 'za:nervous'], ghost: 'bp:esq' },
  { ko: '혈관', ids: ['bp:car', 'za:cardiovascular'], ghost: 'bp:esq' },
  { ko: '장기', ids: ['bp:res', 'bp:dig', 'bp:uri', 'bp:rep', 'bp:end', 'bp:lin', 'bp:car', 'za:mouth'], ghost: 'bp:esq' },
];

// ---------------------------------------------------------------- scene
const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);          // the page's gradient shows through
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 50);
scene.add(camera);
scene.add(new THREE.HemisphereLight(0xf2f6ff, 0x2a3140, 1.25));
// studio-style lights that travel with the camera: warm key, cool fill, rim from behind
const key = new THREE.DirectionalLight(0xfff1e0, 2.1); key.position.set(0.5, 0.7, 1);
const fill = new THREE.DirectionalLight(0xbcd4ff, 0.7); fill.position.set(-0.9, 0.1, 0.6);
const rim = new THREE.DirectionalLight(0x9fd4ff, 1.1); rim.position.set(0, 0.6, -1);
camera.add(key, fill, rim);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.12;
controls.zoomToCursor = true;      // the wheel zooms toward what the pointer is on
controls.rotateSpeed = 0.9;
controls.addEventListener('change', () => { dirty = true; });

let dirty = true;
const BODY = new THREE.Box3(new THREE.Vector3(-0.5, 0, -0.2), new THREE.Vector3(0.5, 1.7, 0.2));

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  applyViewOffset();
  camera.updateProjectionMatrix();
  dirty = true;
}
window.addEventListener('resize', resize);

// The sidebar covers the left of the canvas, so the view is shifted to centre the body in the free area.
function sideWidth() {
  return window.innerWidth > 900 && !document.getElementById('left').classList.contains('collapsed') ? 346 : 0;
}
function applyViewOffset() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.setViewOffset(w, h, -sideWidth() / 2, 0, w, h);
  document.body.style.setProperty('--side', sideWidth() + 'px');
}
let tween = null;   // smooth camera move
function frameBox(box, dirKeep = false, instant = false) {
  const c = box.getCenter(new THREE.Vector3());
  const r = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 0.03);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const free = Math.max(0.3, (window.innerWidth - sideWidth()) / window.innerHeight);
  const fit = r / Math.sin(Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * free)) / 2);
  const dir = dirKeep ? camera.position.clone().sub(controls.target).normalize() : new THREE.Vector3(0, 0.05, 1).normalize();
  const pos = c.clone().addScaledVector(dir, fit * 1.08);
  if (instant) {
    tween = null;
    controls.target.copy(c); camera.position.copy(pos); controls.update(); dirty = true;
  } else {
    tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: c, start: performance.now() };
  }
}

let hoverAt = null, lastHover = 0;
(function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  if (tween) {
    const k = Math.min(1, (now - tween.start) / 520), e = k * k * (3 - 2 * k);
    camera.position.lerpVectors(tween.p0, tween.p1, e);
    controls.target.lerpVectors(tween.t0, tween.t1, e);
    if (k === 1) tween = null;
    dirty = true;
  }
  controls.update();
  if (hoverAt && !tween && now - lastHover > 70) { lastHover = now; updateHover(); }
  if (dirty) { dirty = false; renderer.render(scene, camera); }
})();

// ---------------------------------------------------------------- loading
const statusEl = document.getElementById('status');
const loaderEl = document.getElementById('loader');
let booting = true;
function setStatus(t) {
  statusEl.textContent = t; statusEl.style.display = t && !booting ? '' : 'none';
  if (booting && t) document.getElementById('loaderText').textContent = t;
}
function bootProgress() {
  const want = LAYERS.filter(L => L.on), done = want.filter(L => L.state === 'ready' || L.state === 'error');
  document.getElementById('loaderBar').style.width = Math.round(100 * (done.length + 0.3) / (want.length + 0.3)) + '%';
}

const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setDRACOLoader(draco);
let bpMeta = null;
const allStructs = [];

function titleCase(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function makeStruct(L, name, extra = {}) {
  const s = { layer: L, name, meshes: [], hidden: false, faded: false, group: '', desc: '', side: '', ...extra };
  L.structs.push(s); allStructs.push(s);
  return s;
}
function ownMaterial(mesh, s, color) {
  const src = mesh.material;
  const m = new THREE.MeshStandardMaterial({
    color: color ?? (src && src.color ? src.color.clone() : new THREE.Color(0xcccccc)),
    roughness: 0.62, metalness: 0, side: THREE.DoubleSide,
  });
  mesh.material = m;
  mesh.userData.struct = s;
  s.meshes.push(mesh);
}

function buildBp(L, gltf) {
  for (const root of gltf.scene.children) {
    const part = bpMeta.parts[root.name];
    const concept = part ? bpMeta.concepts[part.c] : null;
    const s = makeStruct(L, titleCase(part ? part.n : root.name), concept ? {
      group: concept.g, desc: concept.d, concept: concept.n,
      side: part.sd === 'I' ? '왼쪽' : part.sd === 'D' ? '오른쪽' : '',
    } : {});
    if (concept && L.k === 'mus') {
      // muscles: anatomical term + Korean terms, and the body region they belong to
      s.name = concept.n;
      const k = koMuscle(concept.n);
      if (k) { s.ko = k.ko; s.old = k.old; }
      s.region = (REGIONS.find(r => concept.g.startsWith(r[0])) || ['', '기타'])[1];
      s.sub = SUBGROUPS[concept.g] || concept.g;
      s.group = s.region + ' · ' + s.sub;
    } else if (concept) {
      const k = koGeneral(concept.n);
      if (k) [s.ko, s.old] = k;
      s.grp = GROUPS_KO[concept.g] || concept.g;
    }
    root.traverse(o => {
      if (!o.isMesh) return;
      o.geometry.computeVertexNormals();
      ownMaterial(o, s, new THREE.Color(part ? part.col : L.color));
    });
  }
}
function buildZa(L, gltf) {
  const map = new Map();
  gltf.scene.traverse(o => {
    if (!o.isMesh) return;
    let n = o;
    while (n && !(n.userData && n.userData.za_name)) n = n.parent;
    const raw = n ? n.userData.za_name : (o.name || '?');
    if (L.keep && !L.keep.test(raw)) { o.visible = false; return; }
    let s = map.get(raw);
    if (!s) {
      const side = /\.l$/.test(raw) ? '왼쪽' : /\.r$/.test(raw) ? '오른쪽' : '';
      s = makeStruct(L, raw.replace(/\.[lr]$/, ''), { side });
      map.set(raw, s);
    }
    if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
    // peripheral nerves are thin, so they get a bright yellow to stand out against muscle and bone
    const nerve = L.k === 'nervous' && nervousKind(raw) === 'nerve';
    ownMaterial(o, s, nerve ? new THREE.Color(0xffd23c) : undefined);
  });
}

async function loadLayer(L) {
  if (L.state !== 'idle') return;
  L.state = 'loading';
  refreshLayerRow(L);
  setStatus(`${L.ko} 불러오는 중…`);
  try {
    const gltf = await loader.loadAsync(L.set.path + (L.file || L.k) + '.glb');
    (L.set.key === 'bp' ? buildBp : buildZa)(L, gltf);
    if (L.id === 'bp:mus') buildRegionUI(L);
    L.group = gltf.scene;
    if (L.set.key === 'za') {
      // Z-Anatomy derives from the same body but is 3% larger and offset; this fit
      // (measured on femur, sternum, frontal bone, calcaneus, atlas) lines it up with BodyParts3D.
      L.group.scale.setScalar(0.97);
      L.group.position.set(0, -0.015, 0.098);
      L.group.updateMatrixWorld(true);
    }
    scene.add(L.group);
    // every structure gets a body region: muscles from their group, the rest from where they sit
    const ctr = new THREE.Vector3();
    for (const s of L.structs) {
      if (L.k === 'nervous') { const k = koNerve(s.name); if (k) { s.ko = k.ko; s.old = k.old; } }
      if (L.k === 'mouth' && ORGANS[s.name]) [s.ko, s.old] = ORGANS[s.name];
      if (L.k === 'nervous' || L.k === 'ner') s.kind = nervousKind(s.name.replace(/^(left|right) /i, ''));
      if (L.k === 'nervous' && s.kind !== 'nerve') s.extra = true;   // the base model already shows brain and eyes; these detailed copies appear only when picked from the list
      if (s.region || L.k === 'teg') continue;
      s.region = regionOf(structBox(s).getCenter(ctr), s.name);
      if (!s.group) s.group = s.region;
    }
    L.state = 'ready';
  } catch (e) {
    console.error(e);
    L.state = 'error';
  }
  applyLayer(L);
  refreshLayerRow(L);
  if (uiReady) renderTree();
  if (!LAYERS.some(x => x.state === 'loading')) {
    const bad = LAYERS.filter(x => x.state === 'error').map(x => x.ko);
    setStatus(bad.length ? `불러오기 실패: ${bad.join(', ')}` : '');
  }
}

// ---------------------------------------------------------------- visibility
let isolated = null;   // a Set of structs shown on their own, or null
let activeRegion = null;   // '팔', '다리' … or null for the whole body
let hovered = null;
let xray = null;          // structure selected from the list (shown through covering layers)
let spot = null;          // Set of structures kept solid while the rest is ghosted (list navigation)
const kindOn = { nerve: true, brain: true, sense: true };   // parts of the nervous layers
let mode = 'select';       // 'select' or 'erase' (each click hides what it hits)
const undoStack = [];
let uiReady = false;       // set once every panel has been built
let selected = null;

function applyStruct(s) {
  const L = s.layer;
  const vis = L.on && !s.hidden && !s.extra && !s.regionOff && (!activeRegion || s.region === activeRegion) && (!s.kind || kindOn[s.kind]) && (!isolated || isolated.has(s));
  const op = L.opacity * (s.faded ? 0.15 : 1) * (spot && !spot.has(s) ? 0.035 : 1);
  for (const m of s.meshes) {
    const mat = m.material;
    const tr = op < 0.995;
    m.visible = vis && op > 0.01;
    if (mat.transparent !== tr) { mat.transparent = tr; mat.needsUpdate = true; }
    mat.opacity = op;
    mat.depthWrite = !tr;
    // a structure picked from the list is drawn over whatever covers it, so it can be seen without hiding anything
    const through = s === selected && s === xray;
    if (mat.depthTest === through) { mat.depthTest = !through; mat.needsUpdate = true; }
    m.renderOrder = through ? 5 : tr ? 1 : 0;
    mat.emissive.setHex(s === selected ? 0x1f6fe0 : s === hovered ? 0x123a66 : 0x000000);
  }
  dirty = true;
}
function applyLayer(L) { for (const s of L.structs) applyStruct(s); }
function applyAll() { for (const L of LAYERS) applyLayer(L); updateHiddenNote(); }

function setLayerOn(L, on) {
  L.on = on;
  if (on && L.state === 'idle') loadLayer(L);
  applyLayer(L);
  refreshLayerRow(L);
}
function setLayerOpacity(L, v) { L.opacity = v; applyLayer(L); refreshLayerRow(L); }

// ---------------------------------------------------------------- layer UI
const layersEl = document.getElementById('layers');
for (const set of SETS) {
  const h = document.createElement('h2');
  h.textContent = set.title;
  layersEl.appendChild(h);
  for (const L of set.layers) {
    const el = document.createElement('div');
    el.className = 'layer';
    el.innerHTML = `<div class="row"><label><input type="checkbox"><span class="sw" style="background:${L.color}"></span>` +
      `<span class="name">${L.ko}</span><span class="count"></span></label>` +
      `<button class="small" title="이 계통만 보기">단독</button></div>` +
      `<input type="range" min="0" max="1" step="0.01" title="투명도">`;
    L.el = el;
    L.chk = el.querySelector('input[type=checkbox]');
    L.rng = el.querySelector('input[type=range]');
    L.cnt = el.querySelector('.count');
    L.chk.addEventListener('change', () => {
      // switching a nervous layer on while every part of it is filtered out would show nothing
      if (L.chk.checked && NERV.includes(L.id) && !Object.values(kindOn).some(Boolean)) for (const k in kindOn) kindOn[k] = true;
      setLayerOn(L, L.chk.checked);
    });
    L.rng.addEventListener('input', () => { L.opacity = +L.rng.value; applyLayer(L); });
    el.querySelector('button').addEventListener('click', () => solo([L.id]));
    layersEl.appendChild(el);
    refreshLayerRow(L);
  }
}
function refreshLayerRow(L) {
  L.chk.checked = L.on;
  L.rng.value = L.opacity;
  L.el.classList.toggle('off', !L.on);
  if (L.id === 'bp:mus') document.getElementById('musOpacity').value = L.opacity;
  if (uiReady) refreshRegionChips();
  L.cnt.textContent = L.state === 'loading' ? '불러오는 중' : L.state === 'error' ? '실패' : L.state === 'ready' ? L.structs.length + '개' : '';
}

function solo(ids, ghost, keepRegions = false) {
  isolated = null;
  if (!keepRegions) { setRegions(() => true); activeRegion = null; refreshRegionChips(); }
  for (const L of LAYERS) {
    const on = ids.includes(L.id) || L.id === ghost;
    L.opacity = L.id === ghost && !ids.includes(L.id) ? 0.25 : 1;
    setLayerOn(L, on);
  }
  updateHiddenNote();
}
const presetsEl = document.getElementById('presets');
for (const p of PRESETS) {
  const b = document.createElement('button');
  b.textContent = p.ko;
  b.addEventListener('click', () => solo(p.ids, p.ghost));
  presetsEl.appendChild(b);
}

// ---------------------------------------------------------------- body regions
// Picking a region shows only what lies in it (muscles, bones, nerves …) and zooms there.
const REGION_NAMES = REGIONS.map(r => r[1]);
const SYSTEM_CHIPS = [
  { label: '근육', ids: ['bp:mus'] }, { label: '뼈', ids: ['bp:esq'] },
  { label: '신경', ids: NERV, kind: 'nerve' }, { label: '뇌·척수', ids: NERV, kind: 'brain' }, { label: '안구·귀', ids: NERV, kind: 'sense' },
  { label: '혀·인두', ids: ['za:mouth'] },
  { label: '혈관', ids: ['za:cardiovascular', 'bp:car'] }, { label: '림프', ids: ['za:lymphatic', 'bp:lin'] },
];
const chipOn = c => c.ids.some(id => byId[id].on) && (!c.kind || kindOn[c.kind]);
const regionChipsEl = document.getElementById('regionChips');
const systemChipsEl = document.getElementById('systemChips');
function refreshRegionChips() {
  if (!uiReady) return;
  for (const b of regionChipsEl.children) b.classList.toggle('on', (b.dataset.region || null) === activeRegion);
  for (const b of systemChipsEl.children) b.classList.toggle('on', chipOn(b.chip));
}
function frameRegion() {
  const b = new THREE.Box3();
  for (const id of ['bp:mus', 'bp:esq']) for (const s of byId[id].structs) if (s.region === activeRegion) b.union(structBox(s));
  if (!b.isEmpty()) frameBox(b, true);
}
function setActiveRegion(region) {
  isolated = null;
  activeRegion = region;
  setRegions(() => true);
  if (region) {
    // a region view always includes muscles, bones and nerves; muscles go half transparent so nerves show
    for (const id of ['bp:mus', 'bp:esq', 'za:nervous', 'bp:ner', 'za:mouth']) if (!byId[id].on) setLayerOn(byId[id], true);
    setLayerOpacity(byId['bp:esq'], 1);
    setLayerOpacity(byId['bp:mus'], 0.5);
    applyAll();
    frameRegion();
  } else {
    setLayerOpacity(byId['bp:mus'], 1);
    applyAll();
    frameBox(BODY);
  }
  refreshRegionChips();
}
for (const name of ['전신', ...REGION_NAMES]) {
  const b = document.createElement('button');
  b.textContent = name;
  if (name !== '전신') b.dataset.region = name;
  b.addEventListener('click', () => setActiveRegion(b.dataset.region || null));
  regionChipsEl.appendChild(b);
}
for (const chip of SYSTEM_CHIPS) {
  const b = document.createElement('button');
  b.textContent = chip.label;
  b.className = 'small';
  b.chip = chip;
  b.addEventListener('click', () => {
    const on = !chipOn(chip);
    if (chip.kind) {
      // 신경 / 뇌·척수 / 안구·귀 share the nervous layers, so they are filtered inside them
      kindOn[chip.kind] = on;
      for (const id of chip.ids) { if (on && !byId[id].on) setLayerOn(byId[id], true); else applyLayer(byId[id]); }
    } else {
      for (const id of chip.ids) setLayerOn(byId[id], on);
    }
    refreshRegionChips();
  });
  systemChipsEl.appendChild(b);
}
document.getElementById('musOpacity').addEventListener('input', e => {
  const L = byId['bp:mus'];
  L.opacity = +e.target.value; L.rng.value = L.opacity; applyLayer(L);
});

// ---------------------------------------------------------------- muscle regions
// Tree: region (팔, 다리 …) → subgroup (위팔, 아래팔 앞칸 …) → muscles. Checkboxes show/hide, 단독 isolates.
const regionNodes = [];   // { chk, test(struct) }
function setRegions(fn) {
  const mus = byId['bp:mus'];
  for (const s of mus.structs) s.regionOff = !fn(s);
  applyLayer(mus);
  syncRegionChecks();
}
function syncRegionChecks() {
  const mus = byId['bp:mus'];
  for (const n of regionNodes) {
    const list = mus.structs.filter(n.test);
    const on = list.filter(s => !s.regionOff).length;
    n.chk.checked = on > 0;
    n.chk.indeterminate = on > 0 && on < list.length;
  }
}
function regionRow(label, count, test, cls) {
  const row = document.createElement('div');
  row.className = 'rrow ' + cls;
  row.innerHTML = `<span class="tw">▸</span><input type="checkbox" checked><span class="name"></span>` +
    `<span class="count">${count}</span><button class="small">단독</button>`;
  row.querySelector('.name').textContent = label;
  const chk = row.querySelector('input');
  regionNodes.push({ chk, test });
  chk.addEventListener('change', () => {
    const mus = byId['bp:mus'];
    for (const s of mus.structs) if (test(s)) s.regionOff = !chk.checked;
    applyLayer(mus); syncRegionChecks();
  });
  row.querySelector('button').addEventListener('click', () => {
    setActiveRegion(byId['bp:mus'].structs.find(test).region);
    setRegions(test);
    const b = new THREE.Box3();
    for (const s of byId['bp:mus'].structs) if (test(s)) b.union(structBox(s));
    if (!b.isEmpty()) frameBox(b, true);
  });
  return row;
}
function foldable(row, body) {
  body.style.display = 'none';
  const toggle = () => {
    const open = body.style.display === 'none';
    body.style.display = open ? '' : 'none';
    row.querySelector('.tw').textContent = open ? '▾' : '▸';
  };
  row.querySelector('.tw').addEventListener('click', toggle);
  row.querySelector('.name').addEventListener('click', toggle);
}
function buildRegionUI(L) {
  const host = $('regions');
  host.textContent = '';
  regionNodes.length = 0;
  for (const region of [...REGIONS.map(r => r[1]), '기타']) {
    const inRegion = L.structs.filter(s => s.region === region);
    if (!inRegion.length) continue;
    const terms = new Set(inRegion.map(s => s.name));
    const rrow = regionRow(region, terms.size + '개', s => s.region === region, 'r1');
    const rbody = document.createElement('div');
    host.append(rrow, rbody);
    foldable(rrow, rbody);
    for (const sub of [...new Set(inRegion.map(s => s.sub))]) {
      const inSub = inRegion.filter(s => s.sub === sub);
      const srow = regionRow(sub, '', s => s.region === region && s.sub === sub, 'r2');
      const sbody = document.createElement('div');
      rbody.append(srow, sbody);
      foldable(srow, sbody);
      for (const term of [...new Set(inSub.map(s => s.name))]) {
        const first = inSub.find(s => s.name === term);
        const item = document.createElement('div');
        item.className = 'rrow r3';
        item.innerHTML = '<span class="name"></span><small></small>';
        item.querySelector('.name').textContent = first.ko || term;
        item.querySelector('small').textContent = first.ko ? term : '';
        item.addEventListener('click', () => {
          first.hidden = false; first.regionOff = false;
          if (!L.on) setLayerOn(L, true);
          applyStruct(first); syncRegionChecks();
          select(first); focusSelected();
        });
        sbody.appendChild(item);
      }
    }
  }
}

// Peel slider: fades whole depth bands in order, skin first.
const peelEl = document.getElementById('peel');
function applyPeel() {
  const v = +peelEl.value;
  for (const L of LAYERS) {
    if (L.depth >= 3) continue;
    setLayerOpacity(L, THREE.MathUtils.clamp(1 - (v - L.depth), 0, 1));
  }
}
peelEl.addEventListener('input', applyPeel);

// ---------------------------------------------------------------- cutting plane
const cutPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
const cut = { on: false, axis: 'x', flip: false, pos: 0.5 };
function applyCut() {
  const i = 'xyz'.indexOf(cut.axis);
  const lo = BODY.min.getComponent(i), hi = BODY.max.getComponent(i);
  const p = lo + (hi - lo) * cut.pos;
  const sign = cut.flip ? 1 : -1;            // keep the side where sign * (coord - p) >= 0
  cutPlane.normal.set(0, 0, 0).setComponent(i, sign);
  cutPlane.constant = -sign * p;
  renderer.clippingPlanes = cut.on ? [cutPlane] : [];
  dirty = true;
  refreshHalves();
}
document.getElementById('cutOn').addEventListener('change', e => { cut.on = e.target.checked; applyCut(); });
document.getElementById('cutFlip').addEventListener('change', e => { cut.flip = e.target.checked; applyCut(); });
document.getElementById('cutPos').addEventListener('input', e => {
  cut.pos = +e.target.value;
  if (!cut.on) { cut.on = true; document.getElementById('cutOn').checked = true; }
  applyCut();
});
for (const b of document.querySelectorAll('#cutAxis button')) {
  b.addEventListener('click', () => {
    cut.axis = b.dataset.axis;
    for (const o of document.querySelectorAll('#cutAxis button')) o.classList.toggle('on', o === b);
    applyCut();
  });
}

// ---------------------------------------------------------------- selection
const infoEl = document.getElementById('info');
const $ = id => document.getElementById(id);

function select(s, keepSpot = false) {
  const prev = selected;
  selected = s;
  xray = keepSpot ? s : null;
  if (spot && !keepSpot) { spot = null; applyAll(); }
  if (uiReady) markTreeActive();
  if (prev) applyStruct(prev);
  if (!s) { infoEl.style.display = 'none'; return; }
  applyStruct(s);
  $('infoName').textContent = s.ko || s.name;
  const terms = $('infoTerms');
  terms.textContent = '';
  const line = (label, value) => {
    const d = document.createElement('div');
    const b = document.createElement('span'); b.className = 'lbl'; b.textContent = label;
    d.append(b, value); terms.appendChild(d);
  };
  if (s.ko) { line('해부학 용어', s.name); line('새 용어', s.ko); line('옛 용어', s.old); }
  $('infoMeta').textContent = [s.layer.ko, s.group, s.side].filter(Boolean).join(' · ');
  $('infoDesc').textContent = s.desc || '';
  $('infoDesc').style.display = s.desc ? '' : 'none';
  refreshActions();
  infoEl.style.display = 'block';
}
function refreshActions() {
  if (!selected) return;
  $('actHide').textContent = selected.hidden ? '다시 보이기' : '숨기기';
  $('actFade').classList.toggle('on', selected.faded);
  const only = isolated && isolated.size === 1 && isolated.has(selected);
  $('actIsolate').classList.toggle('on', only);
  $('actIsolate').textContent = only ? '전체 다시 보기' : '이것만 보기';
}
function updateHiddenNote() {
  const h = allStructs.filter(s => s.hidden).length, f = allStructs.filter(s => s.faded).length;
  $('hiddenNote').textContent = (h || f || isolated) ?
    [h && `숨김 ${h}개`, f && `페이드 ${f}개`, isolated && (isolated.size === 1 ? '한 구조만 보는 중' : `${isolated.size}개 구조만 보는 중`)].filter(Boolean).join(' · ') : '';
}
function structBox(s) {
  const b = new THREE.Box3();
  for (const m of s.meshes) b.expandByObject(m);
  return b;
}
function toggleHide() {
  if (!selected) return;
  if (!selected.hidden) { hideStruct(selected); return; }
  selected.hidden = false; applyStruct(selected); refreshActions(); updateHiddenNote();
}
function toggleFade() { if (!selected) return; selected.faded = !selected.faded; applyStruct(selected); refreshActions(); updateHiddenNote(); }
function toggleIsolate() {
  if (!selected) return;
  isolated = isolated && isolated.size === 1 && isolated.has(selected) ? null : new Set([selected]);
  if (isolated) { selected.hidden = false; if (!selected.layer.on) setLayerOn(selected.layer, true); }
  applyAll(); refreshActions();
}
function focusSelected() { if (selected) frameBox(structBox(selected), true); }
$('actHide').addEventListener('click', toggleHide);
$('actFade').addEventListener('click', toggleFade);
$('actIsolate').addEventListener('click', toggleIsolate);
$('actFocus').addEventListener('click', focusSelected);
$('infoClose').addEventListener('click', () => select(null));
$('restoreAll').addEventListener('click', () => {
  isolated = null; spot = null;
  for (const L of LAYERS) if (L.depth < 3 && L.opacity < 1 && L.id !== 'bp:teg') setLayerOpacity(L, 1);
  undoStack.length = 0;
  for (const k in kindOn) kindOn[k] = true;
  for (const s of allStructs) { s.hidden = false; s.faded = false; s.regionOff = false; }
  syncRegionChecks();
  applyAll(); refreshActions(); refreshRegionChips();
});
$('resetView').addEventListener('click', () => frameBox(BODY));

// picking: a click (not a drag) selects the nearest visible, reasonably opaque structure
const raycaster = new THREE.Raycaster();
function pick(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1), camera);
  const targets = [];
  for (const s of allStructs) for (const m of s.meshes) if (m.visible && m.material.opacity >= 0.35) targets.push(m);
  // every structure under the pointer, nearest first
  const out = [];
  for (const h of raycaster.intersectObjects(targets, false)) {
    if (cut.on && cutPlane.distanceToPoint(h.point) < 0) continue;
    const s = h.object.userData.struct;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}
let down = null, lastClick = null;
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, b: e.button }; tween = null; setHover(null); hoverAt = null; });
canvas.addEventListener('pointerup', e => {
  const d = down; down = null;
  if (!d || d.b !== 0 || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) return;
  const hits = pick(e.clientX, e.clientY);
  if (mode === 'erase') { if (hits[0]) hideStruct(hits[0]); return; }
  // clicking the same spot again steps to the structure underneath (nerve under muscle, bone under nerve …)
  let i = 0;
  if (lastClick && Math.hypot(e.clientX - lastClick.x, e.clientY - lastClick.y) < 5 && selected) {
    const at = hits.indexOf(selected);
    if (at >= 0) i = (at + 1) % hits.length;
  }
  lastClick = { x: e.clientX, y: e.clientY };
  select(hits[i] || null);
  if (hits.length > 1 && hits[i]) toast(`겹친 구조 ${i + 1}/${hits.length} · 같은 곳을 다시 누르면 아래 구조`, null, 1800);
});

// ---------------------------------------------------------------- hide, undo, toast
const toastEl = document.getElementById('toast');
let toastTimer = 0;
function toast(text, undo, ms = 4500) {
  toastEl.textContent = text;
  if (undo) {
    const b = document.createElement('button');
    b.className = 'small'; b.textContent = '되돌리기';
    b.addEventListener('click', () => { undoLast(); });
    toastEl.appendChild(b);
  }
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
}
function hideStruct(s) {
  s.hidden = true;
  if (selected === s) select(null);
  if (hovered === s) setHover(null);
  applyStruct(s);
  undoStack.push(() => { s.hidden = false; applyStruct(s); updateHiddenNote(); });
  updateHiddenNote();
  toast(`숨김: ${s.ko || s.name}`, true);
}
function undoLast() {
  const fn = undoStack.pop();
  if (!fn) { toast('되돌릴 작업이 없습니다', null, 1500); return; }
  fn();
  toastEl.classList.remove('show');
}
function setMode(m) {
  mode = m;
  document.getElementById('modeSelect').classList.toggle('on', m === 'select');
  document.getElementById('modeErase').classList.toggle('on', m === 'erase');
  canvas.classList.toggle('erase', m === 'erase');
  if (m === 'erase') { select(null); toast('지우개: 누르는 구조가 바로 숨겨집니다 (Ctrl+Z 되돌리기)', null, 3000); }
}
document.getElementById('modeSelect').addEventListener('click', () => setMode('select'));
document.getElementById('modeErase').addEventListener('click', () => setMode('erase'));
document.getElementById('undoBtn').addEventListener('click', undoLast);
document.getElementById('bgToggle').addEventListener('click', () => {
  const light = document.body.classList.toggle('lightbg');
  try { localStorage.setItem('soma-bg', light ? 'light' : 'dark'); } catch {}
});
try { if (localStorage.getItem('soma-bg') === 'dark') document.body.classList.remove('lightbg'); } catch {}

// half-body view: one click cuts at the midline (x = 0) and keeps the chosen side
function refreshHalves() {
  const i = 'xyz'.indexOf(cut.axis);
  const mid = (0 - BODY.min.getComponent(i)) / (BODY.max.getComponent(i) - BODY.min.getComponent(i));
  const atMid = cut.on && cut.axis === 'x' && Math.abs(cut.pos - mid) < 0.002;
  const cur = !cut.on ? 'all' : atMid ? (cut.flip ? 'left' : 'right') : '';
  for (const b of document.querySelectorAll('#halves button')) b.classList.toggle('on', b.dataset.half === cur);
}
for (const b of document.querySelectorAll('#halves button')) {
  b.addEventListener('click', () => {
    const h = b.dataset.half;
    cut.on = h !== 'all';
    if (cut.on) {
      cut.axis = 'x';
      cut.pos = (0 - BODY.min.x) / (BODY.max.x - BODY.min.x);
      cut.flip = h === 'left';           // the body's left is +x
      for (const o of document.querySelectorAll('#cutAxis button')) o.classList.toggle('on', o.dataset.axis === 'x');
      document.getElementById('cutPos').value = cut.pos;
      document.getElementById('cutFlip').checked = cut.flip;
    }
    document.getElementById('cutOn').checked = cut.on;
    applyCut();
  });
}

// front / back / side views keep the current target and distance
const VIEW_DIRS = { front: [0, 0.05, 1], back: [0, 0.05, -1], left: [1, 0.05, 0], right: [-1, 0.05, 0] };
for (const b of document.querySelectorAll('#views button')) {
  b.addEventListener('click', () => {
    const t = controls.target.clone(), d = camera.position.distanceTo(t);
    const dir = new THREE.Vector3(...VIEW_DIRS[b.dataset.view]).normalize();
    tween = { p0: camera.position.clone(), t0: t, p1: t.clone().addScaledVector(dir, d), t1: t, start: performance.now() };
  });
}

// hover: name tag that follows the pointer, and a faint glow on the structure under it
const tipEl = document.getElementById('tip');
function setHover(s) {
  if (s === hovered) return;
  const prev = hovered;
  hovered = s;
  if (prev) applyStruct(prev);
  if (s) applyStruct(s);
  canvas.style.cursor = s ? 'pointer' : '';
  if (!s) { tipEl.style.display = 'none'; return; }
  tipEl.textContent = s.ko || s.name;
  if (s.ko || s.side) {
    const sm = document.createElement('small');
    sm.textContent = [s.ko && s.name, s.side].filter(Boolean).join(' · ');
    tipEl.appendChild(sm);
  }
  tipEl.style.display = 'block';
}
function updateHover() {
  const p = hoverAt; hoverAt = null;
  if (!p || down) return;
  setHover(pick(p.x, p.y)[0] || null);
  if (hovered) {
    tipEl.style.left = Math.min(p.x + 16, window.innerWidth - tipEl.offsetWidth - 8) + 'px';
    tipEl.style.top = Math.min(p.y + 18, window.innerHeight - tipEl.offsetHeight - 8) + 'px';
  }
}
canvas.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && !e.buttons) hoverAt = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerleave', () => { hoverAt = null; setHover(null); });
canvas.addEventListener('dblclick', focusSelected);
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undoLast(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (k === 'h' || k === 'delete' || k === 'backspace') toggleHide();
  else if (k === 'f') toggleFade(); else if (k === 'i') toggleIsolate();
  else if (k === 'e') setMode(mode === 'erase' ? 'select' : 'erase');
  else if (k === 'escape') { if (mode === 'erase') setMode('select'); else select(null); }
});

// ---------------------------------------------------------------- search
const searchEl = $('search'), resultsEl = $('results');
searchEl.addEventListener('input', () => {
  const q = searchEl.value.trim().toLowerCase();
  resultsEl.textContent = '';
  if (q.length < 2) return;
  const found = allStructs.filter(s => [s.name, s.ko, s.old].some(t => t && t.toLowerCase().includes(q))).slice(0, 40);
  if (!found.length) { resultsEl.innerHTML = '<small>결과 없음 (불러온 레이어에서만 찾습니다)</small>'; return; }
  for (const s of found) {
    const d = document.createElement('div');
    d.textContent = (s.ko || s.name) + ' ';
    const sm = document.createElement('small');
    sm.textContent = [s.ko && s.name, s.side, s.layer.ko].filter(Boolean).join(' · ');
    d.appendChild(sm);
    d.addEventListener('click', () => {
      s.hidden = false; s.regionOff = false;
      if (!s.layer.on) setLayerOn(s.layer, true);
      select(s); focusSelected(); updateHiddenNote();
    });
    resultsEl.appendChild(d);
  }
});

// ---------------------------------------------------------------- misc UI
$('showCredits').addEventListener('click', () => { $('credits').style.display = 'flex'; });
$('creditsClose').addEventListener('click', () => { $('credits').style.display = 'none'; });
const toggleSide = () => { $('left').classList.toggle('collapsed'); document.body.classList.toggle('noside', $('left').classList.contains('collapsed')); resize(); };
$('toggleLeft').addEventListener('click', toggleSide);
$('collapseLeft').addEventListener('click', toggleSide);
if (window.innerWidth <= 900) { $('left').classList.add('collapsed'); document.body.classList.add('noside'); }
for (const b of document.querySelectorAll('#tabs button')) {
  b.addEventListener('click', () => {
    for (const o of document.querySelectorAll('#tabs button')) o.classList.toggle('on', o === b);
    for (const t of document.querySelectorAll('.tab')) t.classList.toggle('on', t.id === b.dataset.tab);
    if (spot) { spot = null; applyAll(); }
  });
}
// ---------------------------------------------------------------- atlas list (계통 → 그룹 → 구조)
// Click a system, then a group, then a structure: the camera flies to it and it is selected.
const ATLAS = [
  { ko: '피부·털', src: [{ id: 'bp:teg' }] },
  { ko: '근육', src: [{ id: 'bp:mus' }] },
  { ko: '뼈', src: [{ id: 'bp:esq' }] },
  { ko: '관절·인대', src: [{ id: 'za:joints' }] },
  { ko: '말초신경', src: [{ id: 'za:nervous', kind: 'nerve' }, { id: 'bp:ner', kind: 'nerve' }] },
  { ko: '뇌·척수', src: [{ id: 'bp:ner', kind: 'brain' }, { id: 'za:nervous', kind: 'brain', tag: '상세' }] },
  { ko: '감각기 (눈·귀)', src: [{ id: 'bp:ner', kind: 'sense' }, { id: 'za:nervous', kind: 'sense', tag: '상세' }] },
  { ko: '심장·혈관', src: [{ id: 'bp:car' }, { id: 'za:cardiovascular', tag: '상세' }] },
  { ko: '호흡기', src: [{ id: 'bp:res' }] },
  { ko: '소화기', src: [{ id: 'bp:dig' }, { id: 'za:mouth' }] },
  { ko: '비뇨기', src: [{ id: 'bp:uri' }] },
  { ko: '생식기', src: [{ id: 'bp:rep' }] },
  { ko: '내분비', src: [{ id: 'bp:end' }] },
  { ko: '림프·면역', src: [{ id: 'bp:lin' }, { id: 'za:lymphatic' }] },
  { ko: '근막 (상세)', src: [{ id: 'za:muscular' }] },
];
const treeOpen = new Set();     // keys of expanded rows
const treeEl = document.getElementById('tree');
const groupOf = (s, src) => s.layer.id === 'bp:mus' ? s.group : (src.tag ? src.tag + ' · ' : '') + (s.grp || s.region || '기타');
function atlasStructs(node) {
  const out = [];
  for (const src of node.src) for (const s of byId[src.id].structs) if (!src.kind || s.kind === src.kind) out.push([s, groupOf(s, src)]);
  return out;
}
function boxOf(list) {
  const b = new THREE.Box3();
  for (const x of list) b.union(structBox(x));
  return b;
}
function goTo(list) {
  // make sure the structure can be seen, ghost the rest, then fly to it
  const s = list[0];
  for (const x of list) { x.hidden = false; x.regionOff = false; x.extra = false; }
  if (s.kind) kindOn[s.kind] = true;
  if (activeRegion && s.region !== activeRegion) { activeRegion = null; setLayerOpacity(byId['bp:mus'], 1); }
  if (isolated && !list.every(x => isolated.has(x))) isolated = null;
  if (!s.layer.on) setLayerOn(s.layer, true);
  if (s.layer.opacity < 0.5) setLayerOpacity(s.layer, 1);
  spot = document.getElementById('spotOn').checked ? new Set(list) : null;
  applyAll(); syncRegionChecks(); refreshRegionChips();
  select(s, true);
  frameBox(boxOf([s]), true);   // paired structures: go to one side so the view really zooms in
}
function markTreeActive() {
  for (const el of treeEl.querySelectorAll('.t3.on')) el.classList.remove('on');
  if (!selected) return;
  for (const el of treeEl.querySelectorAll('.t3')) if (el.list && el.list.includes(selected)) el.classList.add('on');
}
function treeRow(cls, label, count, key, build) {
  const row = document.createElement('div');
  row.className = 'trow ' + cls;
  row.innerHTML = '<span class="tw">▸</span><span class="name"></span><span class="count"></span>';
  row.querySelector('.name').textContent = label;
  row.querySelector('.count').textContent = count;
  const body = document.createElement('div');
  const open = on => {
    if (on && !body.built) { body.built = true; build(body); }
    body.style.display = on ? '' : 'none';
    row.querySelector('.tw').textContent = on ? '▾' : '▸';
    row.classList.toggle('open', on);
    if (on) treeOpen.add(key); else treeOpen.delete(key);
  };
  row.addEventListener('click', e => { if (e.target.tagName !== 'BUTTON') open(body.style.display === 'none'); });
  open(treeOpen.has(key));
  return [row, body];
}
function renderTree() {
  treeEl.textContent = '';
  for (const node of ATLAS) {
    const all = atlasStructs(node);
    const pending = node.src.filter(src => byId[src.id].state === 'idle');
    const loading = node.src.some(src => byId[src.id].state === 'loading');
    const names = new Set(all.map(([s]) => s.ko || s.name));
    const count = loading ? '불러오는 중' : names.size ? names.size + '개' : '';
    const [row, body] = treeRow('t1', node.ko, count, node.ko, body => {
      const groups = new Map();
      for (const [s, g] of all) { if (!groups.has(g)) groups.set(g, []); groups.get(g).push(s); }
      const order = Object.values(GROUPS_KO);
      const rank = g => { const i = order.indexOf(g); if (i >= 0) return i; const r = REGION_NAMES.findIndex(n => g.replace(/^상세 · /, '').startsWith(n)); return r >= 0 ? 100 + r : 999; };
      for (const [g, list] of [...groups].sort((x, y) => rank(x[0]) - rank(y[0]))) {
        const items = new Map();   // left and right of one structure share a row
        for (const s of list) { const k = s.ko || s.name; if (!items.has(k)) items.set(k, []); items.get(k).push(s); }
        const [grow, gbody] = treeRow('t2', g, items.size, node.ko + '/' + g, gbody => {
          for (const [label, sides] of [...items].sort((a, b) => a[0].localeCompare(b[0], 'ko'))) {
            const it = document.createElement('div');
            it.className = 'trow t3';
            it.list = sides;
            it.innerHTML = '<span class="name"></span><small></small>';
            it.querySelector('.name').textContent = label;
            it.querySelector('small').textContent = [sides[0].ko ? (sides[0].concept || sides[0].name) : '', sides.length > 1 ? '좌·우' : sides[0].side].filter(Boolean).join(' · ');
            it.addEventListener('click', () => goTo(sides));
            gbody.appendChild(it);
          }
          markTreeActive();
        });
        const only = document.createElement('button');
        only.className = 'small'; only.textContent = '이것만'; only.title = '이 그룹만 남기고 그쪽으로 이동';
        only.addEventListener('click', () => {
          for (const s of list) { s.hidden = false; s.regionOff = false; s.extra = false; if (s.kind) kindOn[s.kind] = true; }
          activeRegion = null; spot = null;
          isolated = new Set(list);
          if (!list[0].layer.on) setLayerOn(list[0].layer, true);
          if (list[0].layer.opacity < 0.5) setLayerOpacity(list[0].layer, 1);
          applyAll(); syncRegionChecks(); refreshRegionChips(); select(null);
          frameBox(boxOf(list), true);
        });
        grow.appendChild(only);
        body.append(grow, gbody);
      }
      if (pending.length) {
        const more = document.createElement('button');
        more.className = 'small more';
        more.textContent = all.length ? '＋ 상세 구조 더 불러오기' : '＋ 불러오기';
        more.addEventListener('click', () => { more.textContent = '불러오는 중…'; for (const src of pending) setLayerOn(byId[src.id], true); });
        body.appendChild(more);
      }
    });
    treeEl.append(row, body);
  }
  markTreeActive();
}
document.getElementById('spotOn').addEventListener('change', e => {
  spot = e.target.checked && selected ? new Set([selected]) : null;
  applyAll();
});
document.getElementById('treeCollapse').addEventListener('click', () => { treeOpen.clear(); renderTree(); });

uiReady = true;
renderTree();
refreshRegionChips();

// ---------------------------------------------------------------- start
resize();
frameBox(BODY, false, true);
applyCut();
(async function start() {
  try {
    bpMeta = await (await fetch('data/bp3d.json')).json();
  } catch (e) {
    console.error(e);
    setStatus('data/bp3d.json을 불러오지 못했습니다. 웹 서버로 열어 주세요.');
    return;
  }
  bootProgress();
  for (const L of LAYERS) if (L.on) { await loadLayer(L); bootProgress(); }
  const skin = byId['bp:teg'];
  if (skin.group) { BODY.setFromObject(skin.group); frameBox(BODY, false, true); applyCut(); }
  applyPeel();
  booting = false;
  loaderEl.classList.add('done');
  setStatus(LAYERS.some(x => x.state === 'error') ? statusEl.textContent : '');
})();

window.__viewer = { LAYERS, allStructs, scene, camera, BODY, THREE, select, structBox };
