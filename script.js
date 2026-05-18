let world3D; 
let playerX = 0;
let playerY = -50; 
let playerZ = -150; 

// Ângulos de visão estáveis
let yaw = 1.57;   
let pitch = 0; 

// Variáveis de física para o pulo
let velocityY = 0;
let gravity = 0.55;
let jumpForce = -11.5;
let isGrounded = true;

// Lista de Blocos do Parkour
let platforms = [
  { x: 0,   y: -25,  z: 50,   w: 80, h: 50,  d: 80,  c: [255, 100, 100] }, // Vermelho
  { x: 0,   y: -45,  z: 220,  w: 70, h: 90,  d: 70,  c: [255, 165, 0]   }, // Laranja
  { x: -90, y: -65,  z: 380,  w: 60, h: 130, d: 60,  c: [255, 215, 0]   }, // Amarelo
  { x: 50,  y: -85,  z: 540,  w: 50, h: 170, d: 50,  c: [50, 205, 50]   }, // Verde
  { x: 0,   y: -115, z: 700,  w: 90, h: 230, d: 90,  c: [30, 144, 255]  }  // Azul
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  world3D = createGraphics(windowWidth, windowHeight, WEBGL);
  
  let gl = world3D._renderer.GL;
  gl.enable(gl.DEPTH_TEST);
  
  let canvas = select('canvas');
  canvas.mousePressed(() => {
    if (!document.pointerLockElement) {
      requestLock();
    }
  });
}

function draw() {
  background(0);
  
  // 1. ROTAÇÃO DO MOUSE
  let sensitivity = 0.003; 
  yaw += movedX * sensitivity;
  pitch -= movedY * sensitivity; 
  pitch = constrain(pitch, -HALF_PI + 0.05, HALF_PI - 0.05); 
  
  // 2. MOVIMENTO E COLISÃO MULTI-PLATAFORMA
  handleMovement();
  applyGravityAndCollisions();
  
  // 3. DESENHA O MUNDO 3D
  world3D.background(135, 206, 235); // Céu claro
  world3D.perspective();
  
  let dx = cos(pitch) * cos(yaw);
  let dy = sin(pitch);
  let dz = cos(pitch) * sin(yaw);
  world3D.camera(playerX, playerY, playerZ, playerX + dx, playerY + dy, playerZ + dz, 0, 1, 0);
  
  // Desenha o chão cinza original
  world3D.stroke(50); 
  world3D.strokeWeight(2);
  let gridSize = 2000;
  let step = 100;
  for (let i = -gridSize; i <= gridSize; i += step) {
    world3D.line(i, 0, -gridSize, i, 0, gridSize);
    world3D.line(-gridSize, 0, i, gridSize, 0, i);
  }
  
  // Desenha todas as plataformas do parkour
  for (let p of platforms) {
    world3D.push();
    world3D.translate(p.x, p.y, p.z);
    world3D.stroke(0);          
    world3D.strokeWeight(1);
    world3D.fill(p.c[0], p.c[1], p.c[2]); 
    world3D.box(p.w, p.h, p.d);
    world3D.pop();
  }
  
  // 4. RENDERIZA TELA PRINCIPAL E MIRA 2D
  image(world3D, 0, 0);
  
  push();
  stroke(255, 0, 0); 
  strokeWeight(2);
  let centerX = width / 2;
  let centerY = height / 2;
  let size = 10;
  line(centerX - size, centerY, centerX + size, centerY);
  line(centerX, centerY - size, centerX, centerY + size);
  pop();
}

function handleMovement() {
  let speed = 6.5; // Velocidade padrão (W, A, S, D)
  
  // Se segurar Shift (Código 16), aumenta a velocidade de corrida
  if (keyIsDown(16)) { 
    speed = 11.0;    
  }
  
  let forwardX = cos(yaw);
  let forwardZ = sin(yaw);
  let rightX = -sin(yaw);
  let rightZ = cos(yaw);
  
  let oldX = playerX;
  let oldZ = playerZ;
  
  if (keyIsDown(87)) { playerX += forwardX * speed; playerZ += forwardZ * speed; } // W
  if (keyIsDown(83)) { playerX -= forwardX * speed; playerZ -= forwardZ * speed; } // S
  if (keyIsDown(65)) { playerX -= rightX * speed;   playerZ -= rightZ * speed;   } // A
  if (keyIsDown(68)) { playerX += rightX * speed;   playerZ += rightZ * speed;   } // D
  
  // Colisão lateral com todas as plataformas
  let buffer = 15; 
  for (let p of platforms) {
    let insideX = playerX >= p.x - p.w/2 - buffer && playerX <= p.x + p.w/2 + buffer;
    let insideZ = playerZ >= p.z - p.d/2 - buffer && playerZ <= p.z + p.d/2 + buffer;
    let isBelowTop = playerY > (-50 - p.h + 5); 
    
    if (insideX && insideZ && isBelowTop) {
      playerX = oldX;
      playerZ = oldZ;
      break;
    }
  }
  
  if (keyIsDown(32) && isGrounded) { 
    velocityY = jumpForce;
    isGrounded = false;
  }
}

function applyGravityAndCollisions() {
  velocityY += gravity;
  playerY += velocityY;
  
  let onAnyPlatform = false;
  
  for (let p of platforms) {
    let topOfBlockY = -50 - p.h; 
    let insideX = playerX >= p.x - p.w/2 && playerX <= p.x + p.w/2;
    let insideZ = playerZ >= p.z - p.d/2 && playerZ <= p.z + p.d/2;
    
    if (insideX && insideZ) {
      if (playerY >= topOfBlockY && velocityY >= 0 && playerY < topOfBlockY + 25) {
        playerY = topOfBlockY;
        velocityY = 0;
        isGrounded = true;
        onAnyPlatform = true;
        return;
      }
    }
  }
  
  if (playerY >= -50) {
    playerY = -50;
    velocityY = 0;
    isGrounded = true;
  } else if (isGrounded && !onAnyPlatform) {
    isGrounded = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  world3D.resizeCanvas(windowWidth, windowHeight);
}

function requestLock() {
  let element = document.body;
  if (element.requestPointerLock) {
    element.requestPointerLock();
  }
}
