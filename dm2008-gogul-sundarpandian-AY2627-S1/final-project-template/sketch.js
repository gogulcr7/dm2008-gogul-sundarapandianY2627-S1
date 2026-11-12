let port; // do not remove or rename port
let serialData;
let cam;
let pos = [0,0,0];
let brightness = 200;
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
  orbitControl();

  push();
  translate(...pos);
  // rotateY(azimuth);
  // rotateX(-polar);
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
