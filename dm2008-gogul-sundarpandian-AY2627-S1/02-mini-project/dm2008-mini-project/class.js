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
      stroke(0);
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