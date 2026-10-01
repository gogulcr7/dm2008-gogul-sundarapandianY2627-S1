// GAME STATE & CONSTANTS

let player, photo, brickPile, sound, bg;
let pAngle = 15;
let startGame = false;
let gameOver = false;
let timeCount = 0;
let score = 0;
let startAngle = 0;

let walls = [];
let clouds = [];
let bullets = [];
let explosions = [];
let powerUps = [];
let buildings = [];
let bushes = [];

// MAIN FUNCTIONS


async function setup() {
  createCanvas(600, 800);
  //initial data required:
  player = new Player(width / 4 - 50, height / 2);
  for(let i = 0; i <= width; i += 50){
    buildings.push(new BgBuilding(i, 300));
  }
  for(let i = 0; i <= width; i+= 100){
    bushes.push(new Bush(i, height - 25));
  }
  // load assets:
  photo = await loadImage("pictures/brokenWall.jpg");
  brickPile = await loadImage("pictures/brickPile.png");
  sound = await loadSound("audio-files/OPS.mp3");
  expSound = await loadSound("audio-files/explosion.mp3");
}

function draw() {
  background("#b8e0ff");
  if(!startGame) {
    updateSurroundings();
  }
  if (startGame || gameOver) {
    updateAndRenderGame();
  } else {
    renderStartScreen();
  }
}

function mousePressed() {
  if (startGame) {
    player.changeVel(-7);
    player.changeFlameSize([40, 45]);
  } else if (gameOver) {
    restart();
  } else {
    startGame = true;
    sound.play();
  }
}

function keyPressed() {
  if (key === "d" && player.getLoaded()) {
    bullets.push(new Bullet(...player.getPos()));
    player.changeLoaded();
  }
}

function restart() {
  player = new Player(width / 4 - 50, height / 2);
  pAngle = 15;
  startGame = false;
  gameOver = false;
  walls = [];
  clouds = [];
  bullets = [];
  explosions = [];
  powerUps = [];
  timeCount = 0;
  score = 0;
  startAngle = 0;
  buildings = [];
  bushes = [];
  for(let i = 0; i <= width; i += 50){
    buildings.push(new BgBuilding(i, 300));
  }
  for(let i = 0; i <= width; i+= 100){
    bushes.push(new Bush(i, height - 25));
  }
}


// MAIN GAME LOOP & RENDER HELPERS
function updateSurroundings(){
  if(timeCount % 50 == 0){
    buildings.push(new BgBuilding(width + 50, 300));
  }

  if(timeCount % 100 == 0){
    bushes.push(new Bush(width + 100, height -25));
  }

  //update and render background:
  for (let i = buildings.length - 1; i >= 0; i--){
    buildings[i].show();
    if (!gameOver){
      buildings[i].move();
    } 

    let bgBx = buildings[i].getPos().x;
    if(bgBx <= -50){
      buildings.splice(i, 1);
    }
  }

  // Render the bushes
  for(let i = bushes.length - 1; i > 0; i--){
    bushes[i].show();
    if(!gameOver){
      bushes[i].move();
    }

    if(bushes[i].getPos().x <= -100){
      bushes.splice(i, 1);
    }
  }

  // Render the ground
  push();
  stroke(0);
  fill("#22ac00");
  rect(0, height - 20, width, 20);
  pop()

  timeCount ++;
}

function updateAndRenderGame() {
  // Spawn walls and clouds periodically
  if (timeCount % 150 == 0) {
    walls.push(new Wall(width + 100, random(150, height - 150), 150, photo, brickPile));
    clouds.push(new Cloud(width + 100, random(150)));
  }

  //spawn background buildings
  if(timeCount % 50 == 0){
    buildings.push(new BgBuilding(width + 50, 300));
  }

  // Spawn bushes
  if(timeCount % 100 == 0){
    bushes.push(new Bush(width + 100, height -25));
  }

  //update and render background:
  for (let i = buildings.length - 1; i >= 0; i--){
    buildings[i].show();
    if (!gameOver){
      buildings[i].move();
    } 

    let bgBx = buildings[i].getPos().x;
    if(bgBx <= -50){
      buildings.splice(i, 1);
    }
  }

  // Update and render clouds
  for (let i = clouds.length - 1; i >= 0; i--) {
    clouds[i].show();
    if (!gameOver) {
      clouds[i].move();
    }
    if (clouds[i].getPos().x < -100) {
      clouds.splice(i, 1);
    }
  }

  // Update and render walls
  for (let i = walls.length - 1; i >= 0; i--) {
    walls[i].show();

    if (!gameOver) {
      walls[i].move();
    }

    if (walls[i].getPos().x < -100) {
      walls.splice(i, 1);
    }

    // Scoring system
    if (player.getPos()[0] === walls[i].getPos().x && !gameOver) {
      score += 1;
    }

    // Wall collision checks
    let playerX = player.getPos()[0];
    let playerY = player.getPos()[1];
    let wallX = walls[i].getPos().x;
    let wallY = walls[i].getPos().y;
    let wallS = walls[i].getWallState();
    let g = walls[i].getGapSize();

    let hitsTopWall = playerY - 17 <= wallY - g/2;
    let hitsBottomWall = playerY + 40 >= wallY + g/2;
    let overlapsX = playerX + 20 >= wallX && playerX <= wallX + 50;

    if ((hitsTopWall || hitsBottomWall) && overlapsX && !wallS) {
      gameOver = true;
    }
  }

  // Update and render bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].show();
    if (!gameOver) {
      bullets[i].move();
    }

    if (bullets[i].getPos().x >= width + 100) {
      bullets.splice(i, 1);
    } else {
      // Bullet vs Wall collision check
      for (let j = walls.length - 1; j >= 0; j--) {
        let bx = bullets[i].getPos().x;
        let by = bullets[i].getPos().y;
        let wx = walls[j].getPos().x;
        let wy = walls[j].getPos().y;
        let wby = walls[j].getWPos();
        let g = walls[j].getGapSize();
        
        let bulletOverlapsX = bx + 45 >= wx && bx + 45 <= wx + 50;
        let bulletHitsWall = by + 15 <= wy - g/2 || by + 25 >= wy + g/2;
        let bulletBreaksWall = by + 15 >= wby && by + 25 <= wby + 50;

        if (bulletOverlapsX && bulletHitsWall) {
          explosions.push(new Explosion(bx + 45, by + 20));
          expSound.play();
          bullets.splice(i, 1);
          if(bulletBreaksWall){
            walls[j].breakWall();
          }else{
            walls[j].hit();
          }
          break;
        }
      }
    }
  }

  // Update and render explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].show();
    explosions[i].move();
    if (explosions[i].getSize() >= 50) {
      explosions.splice(i, 1);
    }
  }

  // Render the bushes
  for(let i = bushes.length - 1; i > 0; i--){
    bushes[i].show();
    if(!gameOver){
      bushes[i].move();
    }

    if(bushes[i].getPos().x <= -100){
      bushes.splice(i, 1);
    }
  }

  // Render the ground
  push();
  stroke(0);
  fill("#22ac00");
  rect(0, height - 20, width, 20);
  pop()

  // Floor collision check
  if (player.getPos()[1]  + 50 >= height - 20) {
    gameOver = true;
  }

  // Player animation and movement
  player.show();
  if (!gameOver) {
    player.move();
  }

  // bg variables and score visual
  if (!gameOver) {
    pAngle = 15 + player.getVel();
    timeCount++;

    push();
    noStroke();
    fill(0);
    textAlign(RIGHT);
    textSize(10);
    text("score: " + score, width - 30, 30);
    pop();
  } 
  // game over screen
  else {
    fill("#e4dd98");
    rect(100, 100, width - 200, 400);

    fill("#f5d64c");
    rect(120, 150, width - 240, 70);

    push();
    stroke(0);
    fill(0);
    textAlign(CENTER);
    textSize(50);
    text(" GAME OVER!!", width / 2, height / 4);
    textSize(80);
    text(score, width/2, 2*height/5);
    textSize(20);
    text("score", width / 2, height / 2);
    text("click to restart", width / 2, height / 2 + 40);
    pop();
    startGame = false;
    sound.stop();
  }
}

function renderStartScreen() {

  let y = 10 * sin(radians(startAngle));

  push();
  stroke(0);
  fill("#22ac00");
  rect(0, height - 20, width, 20);
  pop();

  push();
  stroke("#f39d39");
  strokeWeight(3);
  fill("#ece055");
  textAlign(CENTER);
  textSize(30);
  text("FLAPPY BIRD (ROCKETMAN)", width / 2 + 20, height / 2 + y);
  push();
  translate(width / 4 - 100, height / 2 - 20 + y);
  jetpackMan(0, 0, player.flameSize, player.loaded);
  pop();

  stroke(0);
  fill("#c9a67e");
  rect(width / 2 - 10, 3 * height / 4 - 20, 180, 30);
  textSize(20);
  textAlign(LEFT);
  text("click to start game", width / 2, 3 * height / 4);

  pop();

  startAngle += 5;
}


// PLAYER DESIGN

function jetpackMan(x, y, fireHeight = [35, 40], ammo = true) {
  // Flame
  let h = random(...fireHeight);
  stroke("#e6931e");
  strokeWeight(2);
  fill("#fcff57");
  triangle(x - 8, y + 24, x - 2, y + 24, x - 5, y + h);

  // Jetpack
  stroke(0);
  strokeWeight(1);
  fill("#a1a1a1");
  rect(x - 10, y, 10, 25, 3);
  fill("#545454");
  rect(x - 8, y - 3, 6, 4, 2);

  // Torso
  fill("#3c6336");
  rect(x, y, 20, 25, 3);

  // Head
  ellipse(x + 10, y - 8, 18);

  // Arms and legs
  rect(x - 5, y + 5, 7, 15, 3);
  rect(x + 20, y + 5, 7, 15, 3);
  rect(x, y + 23, 7, 15, 3);
  rect(x + 12, y + 23, 7, 15, 3);

  // Hazmat suit
  fill("#283e2c");
  rect(x + 5, y + 3, 13, 13, 3);
  fill("#c91818");
  rect(x + 10, y + 10, 5, 3, 3);

  // Eyes
  fill(0);
  ellipse(x + 14, y - 11, 2);

  // Shoes
  fill("#3d3d3d");
  rect(x - 1, y + 35, 10, 6, 2);
  rect(x + 11, y + 35, 10, 6, 2);

  // Rocket ammo
  if (ammo) {
    fill("#c20000");
    triangle(x + 33, y + 15, x + 33, y + 25, x + 45, y + 20);
  }

  // Rocket launcher
  fill(0);
  rect(x + 15, y + 12, 10, 5);
  fill("#526d40");
  rect(x, y + 15, 35, 10);
  fill("#595959");
  rect(x + 33, y + 13, 5, 14);
  rect(x + 20, y + 23, 5, 10);
  rect(x, y + 13, 5, 14);
}


// GAME CLASSES

class Bush {
  constructor(x, y){
    this.pos = createVector(x, y);
    this.v = -2;
    this.plant = floor(random(4));
    this.ts = 0;
  }

  getPos(){
    return this.pos;
  }

  move(){
    this.pos.x += this.v;
    this.ts++;
  }

  show(){
    push();
    translate(this.pos.x, this.pos.y);
    noStroke();
    fill("#025607");
    switch(this.plant){
      case 0:
        ellipse(0, 0, 50)
        ellipse(-25, 0, 50);
        ellipse(25, 0, 50);
        ellipse(-15, -20, 50);
        ellipse(15, -20, 50);
        
        fill("#4441f8");
        ellipse(-15, -25, 5);
        ellipse(10, 5, 5);
        ellipse(5, -2, 5);
        ellipse(-30, -8, 5);
        ellipse(20, -15, 5);
        break;
      case 1:
        ellipse(0, 0, 50);
        ellipse(-25, 0, 50);
        ellipse(25, 0, 50);
        ellipse(-50, 0, 50);
        ellipse(50, 0, 50);
        ellipse(-10, -25, 50);
        ellipse(10, -25, 50);
        break;
      case 2:
        ellipse(0, 0, 100);
        ellipse(50, 0, 100);
        ellipse(-50, 0, 100);
        break;
      case 3:
        ellipse(0, 0, 50);
        ellipse(-25, 0, 50);
        ellipse(25, 0, 50);
       break
    }
    pop();
  }
}

class BgBuilding {
  constructor(x, y){
    this.pos = createVector(x, y);
    this.building = floor(random(5));
  }

  getPos(){
    return (this.pos);
  }

  move(){
    this.pos.x -= 1;
  }

  show(){
    push();
    translate(this.pos.x, this.pos.y);
    noStroke();
    fill("#848887");
    switch(this.building){
      case 0:
        rect(-25, 80, 50, height - this.pos.y - 80);
        rect(-5, 40, 10, 40);
        rect(-15, 60, 30, 30);
        fill("#beedff");
        push();
        translate(-25, 80);
        for(let i = 0; i <= 20; i += 20){
          for(let j = 0; j <= 100 ; j += 40){
            rect(10 + i, 10 + j, 10, 20);
          }
        }
        pop();
        break;
      case 1:
        rect(-25, -80, 50, height - this.pos.y + 80);
        rect(-20, -130, 5, 50);
        rect(-20, -130, 30, 20);
        fill("#beedff");
        push();
        translate(-25, -80);
        for(let i = 0; i <= 20; i += 20){
          for(let j = 0; j <= 100 ; j += 40){
            rect(10 + i, 10 + j, 10, 20);
          }
        }
        pop();
        break;
      case 2:
        rect(-25, 0, 50, height - this.pos.y);
        rect(-25, -10, 40, 10);
        rect(-25, -20, 30, 10);
        rect(-25, -30, 20, 10);
        rect(-25, -40, 10, 10);
        fill("#beedff");
        push();
        translate(-25, 0);
        for(let i = 0; i <= 20; i += 20){
          for(let j = 0; j <= 100 ; j += 40){
            rect(10 + i, 10 + j, 10, 20);
          }
        }
        pop();
        break;
      case 3:
        rect(-25, -140, 50, height - this.pos.y + 200);
        rect(-15, -160, 5, 20);
        rect(-20, -160, 20, 10);
        rect(-40, -157.5, 20, 5);
        rect(-40, -159, 3, 8);
        fill("#beedff");
        push();
        translate(-25, -140);
        for(let i = 0; i <= 20; i += 20){
          for(let j = 0; j <= 100 ; j += 40){
            rect(10 + i, 10 + j, 10, 20);
          }
        }
        pop();
        break;
      default:
        rect(-25, 140, 50, height - this.pos.y - 140);
        rect(-5, 100, 5, 40);
        rect(-20, 130, 35, 5);
        rect(-15, 120, 25, 5);
        rect(-10, 110, 15, 5);
        fill("#beedff");
        push();
        translate(-25, 140);
        for(let i = 0; i <= 20; i += 20){
          for(let j = 0; j <= 100 ; j += 40){
            rect(10 + i, 10 + j, 10, 20);
          }
        }
        pop();
    }
    pop();
  }
}

class Player {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.v = 0;
    this.a = 0.5;
    this.flameSize = [30, 35];
    this.loaded = true;
    this.ts = 1;
    this.initialX = x;
  }

  changeVel(v) {
    this.v = v;
  }

  getVel() {
    return this.v;
  }

  getPos() {
    return [this.pos.x, this.pos.y];
  }

  changeFlameSize(array = []) {
    this.flameSize = array;
  }

  getLoaded() {
    return this.loaded;
  }

  changeLoaded() {
    this.loaded = !this.loaded;
    this.pos.x -= 50;
  }

  move() {
    this.v += this.a;
    this.pos.y += this.v;

    if (this.v > 0 && this.flameSize[0] > 35) {
      this.flameSize[0] -= 0.5;
      this.flameSize[1] -= 0.5;
    }

    if (!this.loaded && this.ts % 200 === 0) {
      this.loaded = !this.loaded;
      this.ts = 1;
    }

    if (!this.loaded) {
      this.ts++;
      if (this.pos.x < this.initialX) {
        this.pos.x += 1;
      }
    }
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(radians(pAngle));
    jetpackMan(0, 0, this.flameSize, this.loaded);
    pop();
  }
}

class Wall {
  constructor(x, y, gapSize, photo1, photo2) {
    this.pos = createVector(x, y);
    this.g = gapSize;
    this.ts = 0;
    this.vibrate = false;
    this.wallBroken = false;
    this.pic1 = photo1;
    this.pic2 = photo2;
    this.weakPoint = random() < 0.2;
    let up = random() < 0.5;
    if(up){
      this.wY = random(20, y - gapSize/2 - 70);
    }else{
      this.wY = random(y + gapSize/2 + 20, height - 70);
    }
  }

  getPos() {
    return this.pos;
  }

  getWPos() {
    return this.wY;
  }

  breakWall() {
    this.wallBroken = !this.wallBroken;
  }

  getWallState() {
    return this.wallBroken;
  }

  getGapSize(){
    return this.g;
  }
  
  move() {
    this.pos.x -= 2;
    if (this.vibrate) {
      if (this.ts % 10 === 0) {
        this.pos.x += 5;
      } else if (this.ts % 5 === 0) {
        this.pos.x -= 5;
      }
      this.ts++;
    }

    if (this.ts >= 100) {
      this.vibrate = false;
      this.ts = 0;
    }
  }

  hit() {
    this.vibrate = true;
  }

  show() {
    if(!this.wallBroken){
      let x = this.pos.x;
      let y = this.pos.y;
      let g = this.g;
      
      // Base background
      push();
      stroke(0);
      strokeWeight(1);
      fill("#292929");
      rect(x, 0, 50, height);
  
      fill("#eb6060");
      rect(x, 0, 50, y - g / 2);
      rect(x, y + g / 2, 50, height - y - g / 2);
      pop();
  
      // Brick pattern
      push();
      stroke("#4f4f4f");
      strokeWeight(1);
      let row = 0;
      let rowStart = 0;
      
      for (let i = 0; i < height; i += 10) {
        if (i < y - g / 2 || i > y + g / 2) {
          line(x, i, x + 50, i);
        }
  
        rowStart = row % 2 === 0 ? 0 : 5;
  
        for (let j = rowStart; j < 50; j += 10) {
          if (i + 10 < y - g / 2 || i > y + g / 2) {
            line(x + j, i, x + j, i + 10);
          } else if (i + 10 > y - g / 2 && i < y - g / 2) {
            line(x + j, i, x + j, y - g / 2);
          } else if (i < y + g / 2 && i + 10 > y + g / 2) {
            line(x + j, y + g / 2, x + j, i + 10);
          }
        }
        row++;
      }
      if(this.weakPoint){
      image(this.pic1, this.pos.x, this.wY, 50, 50);
      }
      pop();
    }else{
      image(this.pic2, this.pos.x, height - 60, 100, 50);
    }
  }
}

class Bullet {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.v = 5;
  }

  getPos() {
    return this.pos;
  }

  move() {
    this.pos.x += this.v;
  }

  show() {
    let x = this.pos.x;
    let y = this.pos.y;
    push();
    fill("#c20000");
    triangle(x + 33, y + 15, x + 33, y + 25, x + 45, y + 20);
    pop();
  }
}

class Explosion {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.sz = 10;
  }

  getSize() {
    return this.sz;
  }

  move() {
    this.sz += 1;
    this.pos.x -= 2;
  }

  show() {
    push();
    noStroke();
    fill("#efb925");
    ellipse(this.pos.x, this.pos.y, this.sz);
    pop();
  }
}

class Cloud {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.v = -1;
    this.array = [];
    for (let p = 0; p < 20; p++) {
      this.array.push([random(-20, 20), random(-10, 10)]);
    }
  }

  getPos() {
    return this.pos;
  }

  move() {
    this.pos.x += this.v;
  }

  show() {
    push();
    noStroke();
    fill("#ffffff");
    for (let p = 0; p < this.array.length; p++) {
      ellipse(this.pos.x + this.array[p][0], this.pos.y + this.array[p][1], 20);
    }
    pop();
  }
}

