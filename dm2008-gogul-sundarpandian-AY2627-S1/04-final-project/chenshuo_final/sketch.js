let port;
let groundModels = [];
let groundTex, bee, beeTex, skyTex, lanternModel, lanternTex, ghostModel, pineModel;
let patches = [];
let lanterns = [];
let ghosts = [];
let trees = [];
let sndAmbient, sndPickup, sndHit, sndGhost;
let audioStarted = false;

let beeX = 0, beeY = -80, beeZ = 0;
let glow = 100; // how far the bee's light reaches
let score = 0;
let gameFrames = 0; // tracks active gameplay time for difficulty/spawning

// World & Entity Constants
const SPACING = 180;
const WORLD_GRID = 20;
const WORLD_LIMIT = WORLD_GRID * SPACING - 150;
const FOLIAGE_AMOUNT = 0.3;
const DRAW_DISTANCE = 2200;

const TREE_COUNT = 100;
const TREE_SCALE = 250;
const TREE_DENSITY = 0.4;
const TREE_DRAW_DISTANCE = 2000;

const HALO_Y = -45;
const LANTERN_SCALE = 120;
const LANTERN_COUNT = 6;
const PICKUP_RADIUS = 70;

const GHOST_SCALE = 310;
const GHOST_COUNT = 4;
const GHOST_HIT_RADIUS = 100;
const GHOST_DAMAGE = 120;
const GHOST_CHASE_SPEED = 4.5;
const GHOST_WANDER_SPEED = 2;
const GHOST_SPAWN_EVERY = 1800; // every 30s at 60fps
const MAX_GHOSTS = 12;

const PATCH_FILES = ['patch-grass', 'patch-grass-foliage'];
const BOB_HEIGHT = 20;

// Audio Volumes
const AMBIENT_VOL = 0.4;
const PICKUP_VOL = 0.7;
const HIT_VOL = 0.8;

// Camera & Movement Controls
let sensitivity = 0.005;
let yaw = 0;   // Rotation around Y axis (left/right)
let pitch = 0.35; // Slight downward angle to start
let d = 650;   // Distance from the player
let cam;
let speed = 10;
let fTiltAngle = 0;
let sTiltAngle = 0;

// Game State Flags
let gameStarted = false;
let gameOver = false;

class Lantern {
  constructor() {
    let ang = random(TWO_PI);
    let r = random(400, 1500);
    this.x = constrain(beeX + cos(ang) * r, -WORLD_LIMIT, WORLD_LIMIT);
    this.z = constrain(beeZ + sin(ang) * r, -WORLD_LIMIT, WORLD_LIMIT);
    this.seed = random(1000);
  }
  y() {
    return -50 + sin(frameCount * 0.04 + this.seed) * 12;
  }
  centerY() {
    return this.y() - LANTERN_SCALE * 0.4;
  }
  flicker() {
    return 0.65 + 0.35 * noise(frameCount * 0.03 + this.seed);
  }
  distTo(x, z) {
    return dist(this.x, this.z, x, z);
  }
  display() {
    push();
    translate(this.x, this.y(), this.z);
    scale(LANTERN_SCALE);
    rotateX(PI);
    texture(lanternTex);
    model(lanternModel);
    pop();
  }
  displayGlow() {
    drawHalo(this.x, this.centerY(), this.z, 25, this.flicker());
  }
}

class Ghost {
  constructor() {
    this.seed = random(1000);
    this.vx = 0;
    this.vz = 0;
    this.respawn();
  }
  respawn() {
    let ang = random(TWO_PI);
    let r = random(900, 1600);
    this.x = constrain(beeX + cos(ang) * r, -WORLD_LIMIT, WORLD_LIMIT);
    this.z = constrain(beeZ + sin(ang) * r, -WORLD_LIMIT, WORLD_LIMIT);
  }
  y() {
    return -60 + sin(frameCount * 0.05 + this.seed) * 10;
  }
  update(difficulty) {
    let distToBee = dist(this.x, this.z, beeX, beeZ);
    let tx, tz, spd;
    if (distToBee < glow * 1.2) {
      // Chase the bee
      tx = beeX - this.x;
      tz = beeZ - this.z;
      spd = GHOST_CHASE_SPEED;
      sndGhost.play();
    } else {
      // Wander
      let t = frameCount * 0.005 + this.seed;
      tx = noise(t) - 0.5;
      tz = noise(t + 50) - 0.5;
      spd = GHOST_WANDER_SPEED;
    }
    let m = max(dist(0, 0, tx, tz), 0.0001);
    this.vx = lerp(this.vx, (tx / m) * spd * difficulty, 0.05);
    this.vz = lerp(this.vz, (tz / m) * spd * difficulty, 0.05);
    this.x = constrain(this.x + this.vx, -WORLD_LIMIT, WORLD_LIMIT);
    this.z = constrain(this.z + this.vz, -WORLD_LIMIT, WORLD_LIMIT);
  }
  touches() {
    return dist(this.x, this.z, beeX, beeZ) < GHOST_HIT_RADIUS;
  }
  display() {
    let distToBee = dist(this.x, this.z, beeX, beeZ);
    let a = map(distToBee, glow * 0.4, glow * 0.9, 255, 0, true);
    if (a <= 1) return; // Skip rendering if completely invisible
    push();
    translate(this.x, this.y(), this.z);
    rotateY(atan2(this.vx, this.vz) + PI);
    scale(GHOST_SCALE);
    rotateX(PI);
    tint(255, a);
    texture(lanternTex);
    model(ghostModel);
    noTint();
    pop();
  }
}

class Tree {
  constructor() {
    let tries = 0;
    do {
      this.x = random(-WORLD_LIMIT, WORLD_LIMIT);
      this.z = random(-WORLD_LIMIT, WORLD_LIMIT);
      tries++;
    } while (
      (dist(this.x, this.z, 0, 0) < 300 ||
        noise(this.x * 0.002, this.z * 0.002) < TREE_DENSITY) &&
      tries < 60
    );
    this.rot = random(TWO_PI);
    this.s = TREE_SCALE * random(0.8, 1.4);
  }
  display() {
    push();
    translate(this.x, 0, this.z);
    rotateY(this.rot);
    scale(this.s);
    rotateX(PI);
    texture(lanternTex);
    model(pineModel);
    pop();
  }
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

async function loadSfx(path) {
  try {
    let s = await loadSound(path);
    console.log('sound loaded:', path);
    return s;
  } catch (e) {
    console.log('SOUND FAILED:', path);
    return null;
  }
}

function playSfx(s, vol) {
  if (audioStarted && s) {
    s.amp(vol);
    s.play();
  }
}

async function initAudio() {
  if (!audioStarted) {
    await userStartAudio();
    audioStarted = true;
    if (sndAmbient && !sndAmbient.isPlaying()) {
      sndAmbient.amp(AMBIENT_VOL);
      sndAmbient.loop();
    }
  }
}

function playBgMusic(){
  sndAmbient.amp(AMBIENT_VOL);
  if(!sndAmbient.isPlaying()){
    sndAmbient.play();
  }
}

async function setup() {
  createCanvas(800, 600, WEBGL);
  perspective(PI / 3, width / height, 10, 60000);

  port = createSerial(); // Initialize Serial Port safely
  cam = createCamera();
  setCamera(cam);

  // Load 3D Models & Textures
  for (let name of PATCH_FILES) {
    groundModels.push(await loadModel('ground/' + name + '.obj'));
  }
  groundTex = await loadImage('ground/colormap.png');
  bee = await loadModel('bee/animal-bee.obj');
  beeTex = await loadImage('bee/colormap.png');
  skyTex = await loadImage('sky/skybox-night.png');
  lanternModel = await loadModel('props/lantern-glass.obj');
  lanternTex = await loadImage('props/colormap.png');
  ghostModel = await loadModel('props/character-ghost.obj');
  pineModel = await loadModel('props/pine.obj');

  // Load Audio
  sndAmbient = await loadSfx('sounds/andriih-magic-fantasy-fairy-tale-music-601667.mp3');
  sndPickup = await loadSfx('sounds/universfield-magic-spell-02-250240.mp3');
  sndHit = await loadSfx('sounds/freesound_community-hurt_c_08-102842.mp3');
  sndGhost = await loadSfx('sounds/dragon-studio-ghost-horror-sound-382709.mp3');

  // Generate World
  for (let gx = -WORLD_GRID; gx <= WORLD_GRID; gx++) {
    for (let gz = -WORLD_GRID; gz <= WORLD_GRID; gz++) {
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
  for (let i = 0; i < GHOST_COUNT; i++) ghosts.push(new Ghost());
  for (let i = 0; i < TREE_COUNT; i++) trees.push(new Tree());

  // --- Attach UI Button Listeners ---
  if (select('#start-btn')) {
    select('#start-btn').mousePressed(() => {
      initAudio();
      startGame();
    });
  }

  if (select('#restart-btn')) {
    select('#restart-btn').mousePressed(() => {
      initAudio();
      resetGame();
    });
  }

  if (select('#speed-btn')) {
    select('#speed-btn').mousePressed(() => {
      speed = speed === 10 ? 18 : 10;
      console.log('Speed toggled to:', speed);
    });
  }

  if (select('#color-btn')) {
    select('#color-btn').mousePressed(() => {
      console.log('Theme change clicked!');
    });
  }
}

function startGame() {
  gameStarted = true;
  if (select('#start-screen')) select('#start-screen').addClass('hidden');
  playBgMusic();
}

function resetGame() {
  score = 0;
  glow = 100;
  gameFrames = 0;
  beeX = 0;
  beeZ = 0;
  yaw = 0;
  pitch = 0.35;
  fTiltAngle = 0;
  sTiltAngle = 0;

  if (select('#score-display')) select('#score-display').html('Score : ' + score);

  // Re-initialize Lanterns & Ghosts
  lanterns = [];
  for (let i = 0; i < LANTERN_COUNT; i++) lanterns.push(new Lantern());

  ghosts = [];
  for (let i = 0; i < GHOST_COUNT; i++) ghosts.push(new Ghost());

  gameOver = false;
  gameStarted = true;
  if (select('#game-over-screen')) select('#game-over-screen').addClass('hidden');
  playBgMusic();
}

function draw() {
  background(5);

  // Safely check if port is initialized and opened before writing
  if (port && port.opened()) {
    if (gameFrames > 0 && gameFrames % 20 == 0) {
      port.write(int(glow) + '\n');
    }
  }

  // Freeze gameplay updates on Start or Game Over screens
  if (!gameStarted || gameOver) {
    renderScene();
    return;
  }

  gameFrames++;

  // Update camera angles on mouse drag
  if (mouseIsPressed && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    let deltaX = mouseX - pmouseX;
    let deltaY = mouseY - pmouseY;

    yaw -= deltaX * sensitivity;
    pitch += deltaY * sensitivity;
    pitch = constrain(pitch, -HALF_PI + 0.05, HALF_PI - 0.05);
  }

  // --- WASD + Arrow Key Movement & Bee Tilting ---
  let moveForward = keyIsDown(87) || keyIsDown(UP_ARROW) || keyIsDown("w");
  let moveBackward = keyIsDown(83) || keyIsDown(DOWN_ARROW) || keyIsDown("s");
  let moveLeft = keyIsDown(65) || keyIsDown(LEFT_ARROW) || keyIsDown("a");
  let moveRight = keyIsDown(68) || keyIsDown(RIGHT_ARROW) || keyIsDown("d");

  if (moveForward) {
    beeX -= sin(yaw) * speed;
    beeZ -= cos(yaw) * speed;
    fTiltAngle = min(fTiltAngle + 0.02, PI / 12);
  } else if (moveBackward) {
    beeX += sin(yaw) * speed;
    beeZ += cos(yaw) * speed;
    fTiltAngle = max(fTiltAngle - 0.02, -PI / 12);
  } else if (fTiltAngle !== 0) {
    fTiltAngle = fTiltAngle > 0 ? max(fTiltAngle - 0.02, 0) : min(fTiltAngle + 0.02, 0);
  }

  if (moveLeft) {
    beeX -= cos(yaw) * speed;
    beeZ += sin(yaw) * speed;
    sTiltAngle = min(sTiltAngle + 0.02, PI / 12);
  } else if (moveRight) {
    beeX += cos(yaw) * speed;
    beeZ -= sin(yaw) * speed;
    sTiltAngle = max(sTiltAngle - 0.02, -PI / 12);
  } else if (sTiltAngle !== 0) {
    sTiltAngle = sTiltAngle > 0 ? max(sTiltAngle - 0.02, 0) : min(sTiltAngle + 0.02, 0);
  }

  // Constrain to forest boundaries and update bobbing height
  beeX = constrain(beeX, -WORLD_LIMIT, WORLD_LIMIT);
  beeZ = constrain(beeZ, -WORLD_LIMIT, WORLD_LIMIT);
  beeY = -80 + sin(frameCount * 0.05) * BOB_HEIGHT;

  // --- Difficulty & Ghost Spawning ---
  let difficulty = 1 + gameFrames / 3600;
  if (gameFrames % GHOST_SPAWN_EVERY === 0 && ghosts.length < MAX_GHOSTS) {
    ghosts.push(new Ghost());
  }

  // --- Collecting Lanterns ---
  for (let i = lanterns.length - 1; i >= 0; i--) {
    if (lanterns[i].distTo(beeX, beeZ) < PICKUP_RADIUS) {
      lanterns.splice(i, 1);
      lanterns.push(new Lantern());
      glow = min(glow + 40, 255);
      score++;
      playSfx(sndPickup, PICKUP_VOL);
      if (select('#score-display')) select('#score-display').html('Score : ' + score);
    }
  }

  // --- Ghost Collisions & AI ---
  for (let g of ghosts) {
    g.update(difficulty);
    if (g.touches()) {
      glow = max(glow - GHOST_DAMAGE, 0);
      g.respawn();
      playSfx(sndHit, HIT_VOL);
    }
  }

  // Light slowly fades over time
  glow = max(glow - 0.15, 0);

  // --- Check Game Over ---
  if (glow <= 0) {
    gameOver = true;
    if (select('#final-score-text')) select('#final-score-text').html('You scored ' + score + ' points.');
    if (select('#game-over-screen')) select('#game-over-screen').removeClass('hidden');
    sndAmbient.stop();
  }else{
    playBgMusic();
  }

  select('#brightness-display').html('Brightness : ' + int(glow));
  renderScene();
}

function renderScene() {
  // Position 3rd-person orbit camera
  let camX = beeX + d * cos(pitch) * sin(yaw);
  let camY = beeY - d * sin(pitch);
  let camZ = beeZ + d * cos(pitch) * cos(yaw);

  cam.setPosition(camX, camY, camZ);
  cam.lookAt(beeX, beeY, beeZ);

  // --- Skybox ---
  push();
  translate(camX, camY, camZ);
  noStroke();
  tint(90, 90, 120);
  texture(skyTex);
  sphere(8000, 48, 32);
  noTint();
  pop();

  // --- Dynamic Lighting ---
  ambientLight(12, 15, 28);
  lightFalloff(1, 0.004, 20 / (glow * glow + 1));
  pointLight(255, 190, 100, beeX, beeY + HALO_Y, beeZ);

  let nearest = lanterns
    .slice()
    .sort((a, b) => a.distTo(beeX, beeZ) - b.distTo(beeX, beeZ))
    .slice(0, 3);
  for (let l of nearest) {
    let f = l.flicker();
    pointLight(255 * f, 170 * f, 80 * f, l.x, l.centerY(), l.z);
  }

  // --- Ground Patches & Pine Trees ---
  noStroke();
  for (let p of patches) {
    if (dist(p.x, p.z, beeX, beeZ) > DRAW_DISTANCE) continue;
    push();
    translate(p.x, 0, p.z);
    rotateY(p.rot);
    scale(p.s);
    rotateX(PI);
    texture(groundTex);
    specularMaterial(255);
    shininess(20);
    model(groundModels[p.kind]);
    pop();
  }

  for (let t of trees) {
    if (dist(t.x, t.z, beeX, beeZ) < TREE_DRAW_DISTANCE) {
      t.display();
    }
  }

  // --- Solid Objects (Unlit) ---
  noLights();
  push();
  translate(beeX, beeY, beeZ);
  rotateY(yaw);
  scale(100);
  rotateX(PI);
  rotateX(fTiltAngle);
  rotateZ(sTiltAngle);
  texture(beeTex);
  model(bee);
  pop();

  for (let l of lanterns) l.display();

  // --- Transparent Objects & Glows (Always Last) ---
  for (let g of ghosts) g.display();
  drawHalo(beeX, beeY + HALO_Y, beeZ, glow, 1);
  for (let l of lanterns) l.displayGlow();
}

function mouseWheel(event) {
  d += event.delta;
  d = constrain(d, 100, 1500);
  return false;
}

// function keyPressed() {
//   initAudio();
// }

// DO NOT REMOVE THIS FUNCTION
function connectBtnClicked() {
  if (port) {
    if (!port.opened()) {
      port.open(9600);
    } else {
      port.close();
    }
  }
}