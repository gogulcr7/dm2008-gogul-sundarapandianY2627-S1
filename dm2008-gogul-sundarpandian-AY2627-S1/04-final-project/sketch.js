let cam;
let pos = [0,0,0];

let brightness = 150;
function setup() {
  createCanvas(400, 400, WEBGL);
  cam = createCamera();
  setCamera(cam);
  debugMode();
}

function draw() {
  background(20);
  orbitControl();

  // 1. Get camera position (eye) and look-at target
  let eyeX = cam.eyeX;
  let eyeY = cam.eyeY;
  let eyeZ = cam.eyeZ;
  
  let targetX = cam.centerX;
  let targetY = cam.centerY;
  let targetZ = cam.centerZ;

  // 2. Calculate the vector from target to camera
  let dx = eyeX - targetX;
  let dy = eyeY - targetY;
  let dz = eyeZ - targetZ;
  
  // make a unit vector in the direction of the camera vector:
  let ma = dist(0,0,0, dx,dy,dz);
  let pv = [dx/ma, dy/ma, dz/ma];
  
  // 3. Convert to spherical angles (Yaw / Azimuth and Pitch / Polar)
  let azimuth = atan2(dx, dz); // Rotation around the Y-axis
  let polar = atan2(dy, sqrt(dx * dx + dz * dz)); // Tilt up/down

  // Display angles in console or on-screen
  // (use degrees() if your angleMode is DEGREES)

  cam.centerX = pos[0];
  cam.centerY = pos[1];
  cam.centerZ = pos[2];
  
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
  
  for(let i = 0; i <= 40; i++){
    let t = i/40;

    let currentRadius = lerp(startR, finalR, t);

    let shine = pow(1 - t, 3)*35;
    fill(255, 150, 50, shine);
    sphere(currentRadius);
  }
  pop();


  if ( keyIsDown(UP_ARROW)){
    pos[0] -= pv[0];
    pos[1] -= pv[1];
    pos[2] -= pv[2];
    cam.eyeX -= pv[0];
    cam.eyeY -= pv[1];
    cam.eyeZ -= pv[2];
  }
  if(keyIsDown(DOWN_ARROW)){
    pos[0] += pv[0];
    pos[1] += pv[1];
    pos[2] += pv[2];
    cam.eyeX += pv[0];
    cam.eyeY += pv[1];
    cam.eyeZ += pv[2];
  }

  // AI generated formula to obtain the perpendicular vector
  // --- LEFT & RIGHT (Cross Product: pv X [0, -1, 0]) ---
  // This creates a vector pointing perfectly to the camera's right side
  let rx = -pv[2]; 
  let ry = 0;      
  let rz = pv[0];  
  let speed = 1;
  // Normalize the left vector to ensure consistent speed at any angle
  let magR = dist(0, 0, rx, rz);
  if (magR > 0) {
    rx /= magR;
    rz /= magR;
  }

  if (keyIsDown(RIGHT_ARROW)){ // Move right(opposite of left vector)
    pos[0] -= rx * speed;
    pos[2] -= rz * speed;
    cam.eyeX -= rx * speed;
    cam.eyeZ -= rz * speed;
  }
  if (keyIsDown(LEFT_ARROW)) { // Move left (along left vector)
    pos[0] += rx * speed;
    pos[2] += rz * speed;
    cam.eyeX += rx * speed;
    cam.eyeZ += rz * speed;
  }

  if(brightness >= 20){
  brightness -= 0.2;   
  }
}