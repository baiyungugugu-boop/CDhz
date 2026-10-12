import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/addons/OrbitControls.js';
import { RoomEnvironment } from './vendor/addons/RoomEnvironment.js';

const $ = id => document.getElementById(id);
const stage = $('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0.6, innerWidth < 640 ? 9 : 6.5);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 3; controls.maxDistance = 14;

const key = new THREE.DirectionalLight(0xffffff, 2); key.position.set(3, 4, 5); scene.add(key);
const rim = new THREE.DirectionalLight(0x99ccff, 1.5); rim.position.set(-4, 1, -3); scene.add(rim);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

// 背景彩色光斑（让折射更明显）
const bg = new THREE.Group(); scene.add(bg);
[[0xff6fb5, -2.5, 1.2], [0x6fc3ff, 2.6, -0.8], [0xb6ff7a, 0.4, -2]].forEach(([c, x, y]) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 16), new THREE.MeshBasicMaterial({ color: c }));
  m.position.set(x, y, -4); bg.add(m);
});

// ---------- 程序生成默认封面 ----------
function defaultArt(seed = 1) {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 1024, 1024);
  gr.addColorStop(0, '#1b1f4a'); gr.addColorStop(.5, '#d94f8a'); gr.addColorStop(1, '#ffc46b');
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
  let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 28; i++) {
    g.beginPath(); g.arc(r() * 1024, r() * 1024, 20 + r() * 160, 0, 7);
    g.fillStyle = `hsla(${r() * 360},90%,70%,${.15 + r() * .3})`; g.fill();
  }
  g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3;
  for (let i = 0; i < 10; i++) { g.beginPath(); g.arc(512, 560, 60 + i * 34, 0, 7); g.stroke(); }
  g.fillStyle = '#fff'; g.font = 'bold 120px "PingFang SC","Noto Sans SC",sans-serif';
  g.textAlign = 'center'; g.fillText('白云 CD', 512, 200);
  g.font = '40px sans-serif'; g.fillText('TRANSPARENT  ·  2026', 512, 940);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- 尺寸（单位≈cm/1.2）----------
const W = 1.42 * 2, H = 1.25 * 2, T = 0.1;   // 盒子宽高、单片厚度
const glass = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, transmission: 1, roughness: 0, metalness: 0, ior: 1.5,
  thickness: 0.05, clearcoat: 0.3, clearcoatRoughness: 0, specularIntensity: 0.35,
  transparent: true, opacity: 1, side: THREE.FrontSide, envMapIntensity: 0.6,
});
function box(w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d);
  return new THREE.Mesh(geo, glass);
}
const caseGroup = new THREE.Group(); scene.add(caseGroup);

// 底座（托盘）
const base = new THREE.Group(); caseGroup.add(base);
base.add(box(W, H, T)).position.z = -0.2;
const backPlate = base.children[0];
[[W, T, 0.4, 0, H / 2 - T / 2], [W, T, 0.4, 0, -H / 2 + T / 2]].forEach(([w, h, d, x, y]) => {
  const m = box(w, h, d); m.position.set(x, y, -0.05); base.add(m);
});
const spineEdge = box(T, H, 0.4); spineEdge.position.set(W / 2 - T / 2, 0, -0.05); base.add(spineEdge);
// 黑色内托（经典），半透明
const tray = new THREE.Mesh(new THREE.BoxGeometry(W - 0.25, H - 0.2, 0.05),
  new THREE.MeshPhysicalMaterial({ color: 0x111318, roughness: .3, transmission: .4, thickness: .1, transparent: true }));
tray.position.z = -0.12; base.add(tray);
// 中心卡齿
const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12), glass);
hub.rotation.x = Math.PI / 2; hub.position.z = -0.06; base.add(hub);

// 光盘
const discTex = { tex: defaultArt(7) };
function discMaterials() {
  const label = new THREE.MeshPhysicalMaterial({ map: discTex.tex, roughness: .5, transparent: true, alphaMap: ringAlpha() });
  const rainbow = new THREE.MeshPhysicalMaterial({
    color: 0xd8d8e0, metalness: 1, roughness: 0.12, iridescence: 1, iridescenceIOR: 1.8,
    iridescenceThicknessRange: [200, 900], clearcoat: 1,
  });
  return { label, rainbow };
}
function ringAlpha() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.arc(128, 128, 20, 0, 7, true); g.fill('evenodd');
  return new THREE.CanvasTexture(c);
}
const disc = new THREE.Group(); disc.position.z = -0.05; base.add(disc);
const dm = discMaterials();
const R = 1.1;
const discBody = new THREE.Mesh(new THREE.RingGeometry(0.14, R, 96, 1), dm.rainbow);
disc.add(discBody);
// 底面也做彩虹，模拟光盘读取面
const discBack = new THREE.Mesh(new THREE.RingGeometry(0.14, R, 96, 1), dm.rainbow);
discBack.rotation.y = Math.PI; discBack.position.z = -0.005; disc.add(discBack);
// 标签面（印刷图，留出外圈彩虹）
const labelGeo = new THREE.RingGeometry(0.34, R * 0.92, 96, 1);
// 平面 UV 映射
{ const p = labelGeo.attributes.position, uv = labelGeo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (2 * R * .92) + .5, p.getY(i) / (2 * R * .92) + .5); }
const labelMat = new THREE.MeshPhysicalMaterial({ map: discTex.tex, roughness: .45, clearcoat: .6 });
const label = new THREE.Mesh(labelGeo, labelMat); label.position.z = 0.004; disc.add(label);

// 盒盖（铰链在左边）
const hinge = new THREE.Group(); hinge.position.set(-W / 2, 0, 0.2); caseGroup.add(hinge);
const lid = new THREE.Group(); hinge.add(lid);
const lidPlate = box(W, H, T); lidPlate.position.set(W / 2, 0, 0); lid.add(lidPlate);
const lidTab = box(W - 0.3, T * .6, 0.12); lidTab.position.set(W / 2, H / 2 - 0.06, -0.08); lid.add(lidTab);
const lidTab2 = lidTab.clone(); lidTab2.position.y = -H / 2 + 0.06; lid.add(lidTab2);
// 封面册（插在盖子内侧）
const coverMat = new THREE.MeshPhysicalMaterial({ map: defaultArt(3), roughness: .6 });
const cover = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.2, H - 0.12), coverMat);
cover.position.set(W / 2 - 0.02, 0, -T / 2 - 0.012); cover.rotation.y = 0; lid.add(cover);
const coverBack = new THREE.Mesh(cover.geometry, coverMat); coverBack.position.copy(cover.position); coverBack.position.z -= 0.002; coverBack.rotation.y = Math.PI; lid.add(coverBack);
// 铰链圆柱
const hingeRod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, H, 16), glass);
hingeRod.position.set(-W / 2, 0, 0.15); caseGroup.add(hingeRod);

caseGroup.rotation.set(0.15, -0.5, 0);

// ---------- 交互 ----------
let open = false, lidAngle = 0, spinOn = true, speed = 0.3, discSpeed = 0;
$('lid').onclick = () => { open = !open; $('lid').textContent = open ? '关上盒盖' : '打开盒盖'; };
$('spin').onchange = e => spinOn = e.target.checked;
$('speed').oninput = e => speed = e.target.value / 100;
$('color').oninput = e => { glass.color.set(e.target.value); };
$('trans').oninput = e => {
  const v = e.target.value / 100; $('tv').textContent = e.target.value + '%';
  glass.transmission = v; glass.roughness = (1 - v) * 0.2;
  glass.specularIntensity = 0.35 + (1 - v) * 0.6;
};
$('toggle').onclick = () => $('panel').classList.toggle('hide');
if (innerWidth < 640) $('panel').classList.add('hide');

function loadImage(file, cb) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  new THREE.TextureLoader().load(url, t => { t.colorSpace = THREE.SRGBColorSpace; cb(squareTex(t)); });
}
// 裁剪成正方形居中
function squareTex(t) {
  const img = t.image, s = Math.min(img.width, img.height);
  t.repeat.set(s / img.width, s / img.height);
  t.offset.set((1 - t.repeat.x) / 2, (1 - t.repeat.y) / 2);
  t.needsUpdate = true; return t;
}
const setDisc = t => { labelMat.map = t; labelMat.needsUpdate = true; };
const setCover = t => { coverMat.map = t; coverMat.needsUpdate = true; if ($('sameImg').checked) setDisc(t); };
$('coverFile').onchange = e => loadImage(e.target.files[0], setCover);
$('discFile').onchange = e => { $('sameImg').checked = false; loadImage(e.target.files[0], setDisc); };
$('sameImg').onchange = e => { if (e.target.checked) setDisc(coverMat.map); };
$('reset').onclick = () => { setCover(defaultArt(3)); setDisc(defaultArt(7)); };
$('shot').onclick = () => {
  renderer.render(scene, camera);
  const a = document.createElement('a'); a.download = 'cd-case.png';
  a.href = renderer.domElement.toDataURL('image/png'); a.click();
};

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const params = new URLSearchParams(location.search);
if (params.has('open')) { open = true; $('lid').textContent = '关上盒盖'; }

const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  if (spinOn) caseGroup.rotation.y += dt * speed * 1.2;
  caseGroup.position.y = Math.sin(t * 1.2) * 0.05;
  const target = open ? -Math.PI * 0.62 : 0;
  lidAngle += (target - lidAngle) * Math.min(1, dt * 4);
  hinge.rotation.y = lidAngle;
  // 光盘：打开时升起并加速旋转
  const openK = lidAngle / (-Math.PI * 0.62);
  discSpeed += ((open ? 6 : 0) - discSpeed) * Math.min(1, dt * 1.5);
  disc.rotation.z -= discSpeed * dt;
  disc.position.z = -0.05 + openK * 0.35;
  bg.rotation.z = t * 0.1;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();
window.__cd = { THREE, scene, setOpen: v => open = v };
