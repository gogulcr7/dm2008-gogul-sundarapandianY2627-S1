let groundModels = [];
let groundTex, bee, beeTex, skyTex, lanternModel, lanternTex;
let patches = [];
let lanterns = [];
let beeX = 0, beeZ = 0;
let glow = 350;
let score = 0;

const SPACING = 180;
const GRID = 5;
const FOLIAGE_AMOUNT = 0.3;
const HALO_Y = -45;
const LANTERN_SCALE = 120;       // lantern size
const LANTERN_COUNT = 6; 
const PICKUP_RADIUS = 70; 
const PATCH_FILES = ['patch-grass', 'patch-grass-foliage'];

class Lantern {
  constructor() {
    do {
      this.x = random(-900, 900);
      this.z = random(-900, 900);
    } while (dist(this.x, this.z, beeX, beeZ) < 250);  
    this.seed = random(1000);
  }
  y() { return -50 + sin(frameCount * 0.04 + this.seed) * 12; }   // floats up and down
  centerY() { return this.y() - LANTERN_SCALE * 0.4; }  
  flicker() { return 0.65 + 0.35 * noise(frameCount * 0.03 + this.seed); }
  distTo(x, z) { return dist(this.x, this.z, x, z); }
  display() {
    push();
    translate(this.x, this.y(), this.z);
    scale(LANTERN_SCALE);
    rotateX(PI);
    texture(lanternTex);
    model(lanternModel);
    pop();
  }
  displayGlow() { drawHalo(this.x, this.centerY(), this.z, 25, this.flicker()); }
}

function drawHalo(x, y, z, size, f) {
  push();
  translate(x, y, z);
  noStroke();
  for (let i = 1; i <= 6; i++) {
    fill(255, 180, 60, 18 * f);
    sphere(size + i * size * 0.4, 16, 12);
  }
  pop();
}

async function setup() {
  createCanvas(800, 600, WEBGL);
  perspective(PI / 3, width / height, 10, 20000);

  for (let name of PATCH_FILES) {
    groundModels.push(await loadModel('ground/' + name + '.obj'));
  }
  groundTex = await loadImage('ground/colormap.png');
  bee = await loadModel('bee/animal-bee.obj');
  beeTex = await loadImage('bee/colormap.png');
  skyTex = await loadImage('sky/skybox-night.png');
  lanternModel = await loadModel('props/lantern-glass.obj');
  lanternTex = await loadImage('props/colormap.png');

  for (let gx = -GRID; gx <= GRID; gx++) {
    for (let gz = -GRID; gz <= GRID; gz++) {
      patches.push({
        x: gx * SPACING + random(-30, 30),
        z: gz * SPACING + random(-30, 30),
        rot: random(TWO_PI),
        s: random(180, 230),
        kind: random() < FOLIAGE_AMOUNT ? 1 : 0
      });
    }
  }
  for (let i = 0; i < LANTERN_COUNT; i++) lanterns.push(new Lantern());
}

function draw() {
  background(5);

  // --- temporary movement---
  if (keyIsDown(LEFT_ARROW)) beeX -= 4;
  if (keyIsDown(RIGHT_ARROW)) beeX += 4;
  if (keyIsDown(UP_ARROW)) beeZ -= 4;
  if (keyIsDown(DOWN_ARROW)) beeZ += 4;
  beeX = constrain(beeX, -950, 950);
  beeZ = constrain(beeZ, -950, 950);
  camera(beeX, -900, beeZ + 1000, beeX, 0, beeZ, 0, 1, 0);   // camera follows the bee

  let beeY = -80 + sin(frameCount * 0.05) * 10;

  // --- collecting ---
  for (let i = lanterns.length - 1; i >= 0; i--) {
    if (lanterns[i].distTo(beeX, beeZ) < PICKUP_RADIUS) {
      lanterns.splice(i, 1);
      lanterns.push(new Lantern());          // a new one appears somewhere else
      glow = min(glow + 80, 700);
      score++;
    }
  }
  glow = max(glow - 0.15, 150);              // the light slowly fades

  // --- sky ---
  push();
  noStroke();
  tint(90, 90, 120);
  texture(skyTex);
  sphere(8000, 48, 32);
  noTint();
  pop();

  // --- lights ---
  ambientLight(12, 15, 28);
  lightFalloff(1, 0.004, 20 / (glow * glow));
  pointLight(255, 190, 100, beeX, beeY + HALO_Y, beeZ);
  let nearest = lanterns.slice().sort((a, b) => a.distTo(beeX, beeZ) - b.distTo(beeX, beeZ)).slice(0, 3);
  for (let l of nearest) {                   // only the 3 closest lanterns get a real light
    let f = l.flicker();
    pointLight(255 * f, 170 * f, 80 * f, l.x, l.centerY(), l.z);
  }

  // --- ground ---
  noStroke();
  for (let p of patches) {
    push();
    translate(p.x, 0, p.z);
    rotateY(p.rot);
    scale(p.s);
    rotateX(PI);
    texture(groundTex);
    model(groundModels[p.kind]);
    pop();
  }

  // --- solid things that stay bright ---
  noLights();
  push();
  translate(beeX, beeY, beeZ);
  scale(100);
  rotateX(PI);
  texture(beeTex);
  model(bee);
  pop();
  for (let l of lanterns) l.display();

  // --- see-through glows, always last ---
  drawHalo(beeX, beeY + HALO_Y, beeZ, 40, 1);
  for (let l of lanterns) l.displayGlow();
}