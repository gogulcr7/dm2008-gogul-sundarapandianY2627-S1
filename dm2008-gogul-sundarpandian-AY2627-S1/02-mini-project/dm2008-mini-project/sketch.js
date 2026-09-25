// GAME STATE & CONSTANTS

let player, photo, brickPile, sound;
let pAngle = 15;
let startGame = false;
let gameOver = false;
let timeCount = 0;
let score = 0;

let walls = [];
let clouds = [];
let bullets = [];
let explosions = [];
let powerUps = [];


// MAIN FUNCTIONS


async function setup() {
  createCanvas(600, 600);
  player = new Player(width / 4 - 50, height / 2);
  photo = await loadImage("brokenWall.jpg");
  brickPile = await loadImage("brickPile.png");
  sound = await loadSound("OPS.mp3");
}

function draw() {
  background("#b8e0ff");
  
  if (startGame || gameOver) {
    updateAndRenderGame();
  } else {
    renderStartScreen();
  }
}

function mousePressed() {
  if (startGame) {
    player.changeVel(-8);
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
}


// MAIN GAME LOOP & RENDER HELPERS

function updateAndRenderGame() {
  // Spawn walls and clouds periodically
  if (timeCount % 200 === 0) {
    walls.push(new Wall(width + 100, random(150, height - 150), 150, photo, brickPile));
    clouds.push(new Cloud(width + 100, random(150)));
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
    let hitsBottomWall = playerY + 35 >= wallY + g/2;
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

  // Render the ground
  push();
  stroke(0);
  fill("#488c3b");
  rect(0, height - 20, width, 20);
  pop();

  // Floor collision check
  if (player.getPos()[1]  + 50 >= height - 20) {
    gameOver = true;
  }

  // Player animation and movement
  player.show();
  if (!gameOver) {
    player.move();
  }

  // Frame progression & HUD / Game Over overlay
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
  } else {
    push();
    stroke(0);
    fill(0);
    textAlign(CENTER);
    textSize(50);
    text(" GAME OVER!!", width / 2, height / 4);
    textSize(20);
    textAlign(LEFT);
    text("score: " + score, width / 2, height / 2);
    text("click to restart", width / 2, height / 2 + 40);
    pop();
    startGame = false;
    sound.stop();
  }
}

function renderStartScreen() {
  push();
  stroke("#f39d39");
  strokeWeight(3);
  fill("#ece055");
  textAlign(CENTER);
  textSize(30);
  text("FLAPPY BIRD (ROCKETMAN)", width / 2, height / 4);
  textSize(20);
  textAlign(LEFT);
  text("click to start game", width / 2, height / 2);

  push();
  translate(width / 4, height / 2);
  jetpackMan(0, 0, player.flameSize, player.loaded);
  pop();

  pop();
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


