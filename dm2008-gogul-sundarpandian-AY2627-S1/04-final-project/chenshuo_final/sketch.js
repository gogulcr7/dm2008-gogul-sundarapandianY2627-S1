let groundModels = [];
let groundTex, bee, beeTex, skyTex, lanternModel, lanternTex;
let patches = [];
let lanterns = [];
let beeX = 0, beeY = 0, beeZ = 0;
let glow = 100;
let score = 0;
let brightnessFactor = glow / 350;

const SPACING = 180;
const GRID = 5;
const FOLIAGE_AMOUNT = 0.3;
const HALO_Y = -45;
const LANTERN_SCALE = 120;       // lantern size
const LANTERN_COUNT = 6; 
const PICKUP_RADIUS = 70; 
const PATCH_FILES = ['patch-grass', 'patch-grass-foliage'];

let sensitivity = 0.005;
let yaw = 0;   // Rotation around Y axis (left/right)
let pitch = 0; // Rotation around X axis (up/down)
let d = 500;   // Distance from the player (controlled by scroll wheel)
let cam, uiLayer;
let speed = 10;
let fTiltAngle = 0;
let sTiltAngle = 0;

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
  perspective(PI / 3, width / height, 10, 60000);

  cam = createCamera();
  setCamera(cam);

  uiLayer = createGraphics(800, 600);

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

  // Update camera angles if mouse is pressed and dragged inside canvas
  if (mouseIsPressed && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    let deltaX = mouseX - pmouseX;
    let deltaY = mouseY - pmouseY;
    
    yaw -= deltaX * sensitivity;
    pitch += deltaY * sensitivity;
    
    // Clamp pitch to avoid flipping upside down
    pitch = constrain(pitch, -HALF_PI + 0.01, HALF_PI - 0.01);
  }

  // --- Clean Movement Controls (WASD) ---
  if (keyIsDown(87) || keyIsDown('w') || keyIsDown('W')) { // Forward
    beeX -= sin(yaw) * speed;
    beeZ -= cos(yaw) * speed;
    fTiltAngle = min(fTiltAngle + 0.005 + 0.02*sin(fTiltAngle*6), PI/6);
  }else if (keyIsDown(83) || keyIsDown('s') || keyIsDown('S')) { // Backward
    beeX += sin(yaw) * speed;
    beeZ += cos(yaw) * speed;
    fTiltAngle = max(fTiltAngle - 0.005 + 0.02*sin(fTiltAngle*6), -PI/6);
  }else if(fTiltAngle !=0){
    if(fTiltAngle > 0){
      fTiltAngle = max(fTiltAngle - 0.005 - 0.02*sin(fTiltAngle*6), 0);
    }else {
      fTiltAngle = min(fTiltAngle + 0.005 - 0.02*sin(fTiltAngle*6), 0);
    }
  }
  if (keyIsDown(65) || keyIsDown('a') || keyIsDown('A')) { // Strafe Left
    beeX -= cos(yaw) * speed;
    beeZ += sin(yaw) * speed;
    sTiltAngle = min(sTiltAngle + 0.005 + 0.02*sin(sTiltAngle*6), PI/6);
  }else if (keyIsDown(68) || keyIsDown('d') || keyIsDown('D')) { // Strafe Right
    beeX += cos(yaw) * speed;
    beeZ -= sin(yaw) * speed;
    sTiltAngle = max(sTiltAngle - 0.005 + 0.02*sin(sTiltAngle*6), -PI/6);
  }else if(sTiltAngle !=0){
    if(sTiltAngle > 0){
      sTiltAngle = max(sTiltAngle - 0.005 + 0.02*sin(sTiltAngle*6), 0);
    }else{
      sTiltAngle = min(sTiltAngle + 0.005 + 0.02*sin(sTiltAngle*6), 0);
    }
  }

  // Constrain boundaries and calculate bobbing height
  beeX = constrain(beeX, -950, 950);
  beeZ = constrain(beeZ, -950, 950);
  beeY = -80 + sin(frameCount * 0.05) * 10;

  // --- Camera Position Fix ---
  // Update the camera anchor position to always track the bee's exact coordinates
  pos = [beeX, beeY, beeZ];

  let camX = pos[0] + d * cos(pitch) * sin(yaw);
  let camY = pos[1] - d * sin(pitch);
  let camZ = pos[2] + d * cos(pitch) * cos(yaw);
  
  cam.setPosition(camX, camY, camZ);
  cam.lookAt(beeX, beeY, beeZ);

  // --- collecting ---
  for (let i = lanterns.length - 1; i >= 0; i--) {
    if (lanterns[i].distTo(beeX, beeZ) < PICKUP_RADIUS) {
      lanterns.splice(i, 1);
      lanterns.push(new Lantern());          // a new one appears somewhere else
      glow = min(glow + 40, 255);
      score++;
      select('#score-display').html('Score: ' + score);
    }
  }
  //glow = max(glow - 0.15, 150);              // the light slowly fades
  glow = max(glow - 0.2, 0);

    // --- sky ---
  push();
  translate(camX, camY, camZ); // Keep skybox centered around the camera
  noStroke();
  tint(90, 90, 120);
  texture(skyTex);
  sphere(8000, 48, 32);
  noTint();
  pop();

  // --- lights ---
  ambientLight(12, 15, 28);
  lightFalloff(1, 10, 20 / (glow * glow));
  pointLight(255, 190, 100, beeX, beeY + HALO_Y, beeZ);
  pointLight(255,255,255, 200,-200,0);
  let nearest = lanterns.slice().sort((a, b) => a.distTo(beeX, beeZ) - b.distTo(beeX, beeZ)).slice(0, 3);
  for (let l of nearest) {                 // only the 3 closest lanterns get a real light
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
    specularMaterial(255);
    shininess(20);
    model(groundModels[p.kind]);
    pop();
  }

  // --- solid things that stay bright ---
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

  // --- see-through glows, always last ---
  for (let l of lanterns) l.displayGlow();
  drawHalo(beeX, beeY + HALO_Y, beeZ, glow, 1);
}

function mouseWheel(event) {
  // Adjust distance with scroll wheel and constrain it to reasonable zoom limits
  d += event.delta;
  d = constrain(d, 50, 1500);
  
  // Prevent page scrolling when using the mouse wheel over the canvas
  return false;
}

