let port; // do not remove or rename port
let serialData;
let cam;
let pos = [0, 0, 0];
let brightness = 150;
let ts = 0;

// Camera orbit angles
let azimuth = 0;
let polar = 0;
let camDist = 300; // Fixed distance between camera and player

function setup() {
  // Change this if you want a fixed size canvas
  createCanvas(windowWidth, windowHeight, WEBGL);
  port = createSerial(); // creates the Serial Port
  cam = createCamera();
  setCamera(cam);
  debugMode();
}

function draw() {
  background(240);

  // Receive data from Arduino
  if (port.opened()) {
    // sending brightness value every second (fixed ts++ issue)
    if (ts % 60 == 0) {
      port.write(int(brightness) + '\n');
    }

    serialData = port.readUntil("\n");
    // Only log and use data that has information, not empty signals
    if (serialData[0]) {
      // Remember to convert the serial data from string to number using float()
      // Disable or remove console.log once verified working
      console.log(serialData);
    }
  }

  // --- CAMERA ROTATION & POSITIONING ---
  // Rotate freely with mouse movement without needing to hold LMB
  if (mouseMoved() && (mouseX !== pmouseX || mouseY !== pmouseY)) {
    azimuth -= (mouseX - pmouseX) * 0.005;
    polar += (mouseY - pmouseY) * 0.005;
    // Constrain polar angle so the camera doesn't flip upside down
    polar = constrain(polar, -1.4, 1.4);
  }

  // 1. Set the camera look-at target to the player's position
  cam.centerX = pos[0];
  cam.centerY = pos[1];
  cam.centerZ = pos[2];

  // 2. Position camera eye at a fixed distance relative to the player using spherical coordinates
  cam.eyeX = pos[0] + camDist * cos(polar) * sin(azimuth);
  cam.eyeY = pos[1] + camDist * sin(polar);
  cam.eyeZ = pos[2] + camDist * cos(polar) * cos(azimuth);
  // -------------------------------------

  // Draw player sphere
  push();
  translate(...pos);
  rotateY(azimuth);
  rotateX(-polar);
  noStroke();
  fill("#fcff42");
  sphere(20);

  // making the light source like view:
  let startR = 20;
  let finalR = brightness;

  for (let i = 0; i <= 40; i++) {
    let t = i / 40;
    let currentRadius = lerp(startR, finalR, t);
    let shine = pow(1 - t, 3) * 35;
    fill(255, 150, 50, shine);
    sphere(currentRadius);
  }
  pop();

  // Calculate forward unit vector based on camera direction projected on XZ plane
  let dx = cam.eyeX - cam.centerX;
  let dz = cam.eyeZ - cam.centerZ;
  let ma = dist(0, 0, dx, dz);
  let pv = [dx / ma, 0, dz / ma];

  if (keyIsDown(UP_ARROW)) {
    pos[0] -= pv[0];
    pos[2] -= pv[2];
  }
  if (keyIsDown(DOWN_ARROW)) {
    pos[0] += pv[0];
    pos[2] += pv[2];
  }

  // --- LEFT & RIGHT (Cross Product for strafing) ---
  let rx = -pv[2];
  let rz = pv[0];
  let speed = 1;
  let magR = dist(0, 0, rx, rz);
  if (magR > 0) {
    rx /= magR;
    rz /= magR;
  }

  if (keyIsDown(RIGHT_ARROW)) {
    pos[0] -= rx * speed;
    pos[2] -= rz * speed;
  }
  if (keyIsDown(LEFT_ARROW)) {
    pos[0] += rx * speed;
    pos[2] += rz * speed;
  }

  if (brightness >= 20) {
    brightness -= 0.2;
  }
  
  ts++; // Properly incrementing frame counter so serial transmission works correctly
}

function keyPressed() {
  if (key == 'b') {
    if (brightness <= 255) {
      brightness += (255 - brightness);
    }
  }
}

// DO NOT REMOVE THIS FUNCTION
function connectBtnClicked() {
  // When button is clicked, check if serial port is already opened
  if (!port.opened()) {
    // If not already, open the port with baud rate 9600
    port.open(9600);
  } else {
    // Otherwise, close the port
    port.close();
  }
}