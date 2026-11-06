let port; // do not remove or rename port
let serialData;
let cam;
let pos = [0,0,0];
let brightness = 150;
let ts = 0;

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

//======================================SERIAL COMMUNICATION =============================================

  // Receive data from Arduino
  if (port.opened()) {

    // sending brightness value every second
    if(ts % 20 == 0){
      port.write( int(brightness) + '\n');
    }

    serialData = port.readUntil("\n");
    // Only log and use data that has information, not empty signals
    if (serialData[0]) {
      // Remember to convert the serial data from string to number using float()
      // Disable or remove console.log once verified working
      console.log(serialData);
    }
  }

// ========================================================================================================

// =========================================== PLAYER =====================================================
   // orbitControl();

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

  if ( keyIsDown(UP_ARROW)){
    pos[0] -= pv[0];
    pos[1] -= pv[1];
    pos[2] -= pv[2];
    //cam.eyeX -= pv[0];
    //cam.eyeY -= pv[1];
    //cam.eyeZ -= pv[2];
  }
  if(keyIsDown(DOWN_ARROW)){
    pos[0] += pv[0];
    pos[1] += pv[1];
    pos[2] += pv[2];
    //cam.eyeX += pv[0];
    //cam.eyeY += pv[1];
    //cam.eyeZ += pv[2];
  }
  if (keyIsDown(RIGHT_ARROW)){ // Move right(opposite of left vector)
    pos[0] -= rx * speed;
    pos[2] -= rz * speed;
    // cam.eyeX -= rx * speed;
    // cam.eyeZ -= rz * speed;
  }
  if (keyIsDown(LEFT_ARROW)) { // Move left (along left vector)
    pos[0] += rx * speed;
    pos[2] += rz * speed;
    // cam.eyeX += rx * speed;
    // cam.eyeZ += rz * speed;
  }

  // CAMERA LOCK:
  
  
  // Adjust 0.005 to change rotation sensitivity
  if (mouseMoved()) { // or just update continuously when mouse moves
    azimuth -= (mouseX - pmouseX) * 0.005;
    polar += (mouseY - pmouseY) * 0.005;
    // Constrain polar angle so the camera doesn't flip upside down
    polar = constrain(polar, -1.4, 1.4);
  }

  // 2. Define a fixed distance that never changes
  let camDist = 300; 

  // 3. Set the camera look-at target to the player's position
  cam.centerX = pos[0];
  cam.centerY = pos[1];
  cam.centerZ = pos[2];

  // 4. Calculate camera eye position relative to the player at a fixed distance
  cam.eyeX = pos[0] + camDist * cos(polar) * sin(azimuth);
  cam.eyeY = pos[1] + camDist * sin(polar);
  cam.eyeZ = pos[2] + camDist * cos(polar) * cos(azimuth);
  
  if(brightness >= 20){
  brightness -= 0.2;   
  }
  ts ++;
}

function keyPressed(){
  if(key == 'b'){
    if(brightness <= 255){
      brightness += (255 - brightness);
    }
  }
}








// DO NOT REMOVE THIS FUNCTION
function connectBtnClicked() {
  // When button is clicked, check if serial port is already opened
  if (!port.opened()) {
    // If not already, open the port with baud rate 9600
    // Make sure baud rate here matches settings in Arduino
    port.open(9600);
  } else {
    // Otherwise, close the port
    port.close();
  }
}
