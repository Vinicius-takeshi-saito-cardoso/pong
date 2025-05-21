// ===== CONFIGURAÇÕES GERAIS =====
const config = {
  CORES: {
    FUNDO: [0, 0, 0],
    TEXTO: [255, 255, 255],
    DESTAQUE: [100, 255, 100],
    BOLA: [255, 255, 255],
    RAQUETE: [255, 255, 255],
    BORDA: [255, 255, 255],
    PARTICULA: [255, 200, 100]
  },
  TAMANHOS: {
    RAQUETE_LARGURA: 15,
    RAQUETE_ALTURA: 100,
    BOLA_RAIO: 12,
    FONTE_BASE: 32
  },
  VELOCIDADE: {
    COMPUTADOR: { FACIL: 4, MEDIO: 6, DIFICIL: 8 },
    BOLA: { X: 8, Y: 6 },
    JOGADOR: 8
  },
  PLACAR_MAXIMO: 5,
  ESPESSURA_BORDA: 4
};

// ===== VARIÁVEIS DO JOGO =====
let estadoJogo = 'menu';
let dificuldade = 'medio';
let bola, jogador, computador;
let placarJogador = 0, placarComputador = 0;
let particulas = [];
let logoCorinthians;

// ===== PRÉ-CARREGAMENTO DA IMAGEM =====
function preload() {
  logoCorinthians = loadImage("logo.png"); // coloque a imagem na mesma pasta do sketch.js
}

// ===== FUNÇÕES PRINCIPAIS p5.js =====
function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  noStroke();
  inicializarJogo();
}

function draw() {
  background(...config.CORES.FUNDO);

  // Fundo com logo do Corinthians
  tint(255, 40); // transparência
  imageMode(CENTER);
  image(logoCorinthians, width / 2, height / 2, width * 0.8, width * 0.8);
  noTint();

  switch (estadoJogo) {
    case 'menu': mostrarMenu(); break;
    case 'jogando': atualizarJogo(); break;
    case 'pausa': mostrarPausa(); break;
    case 'gameover': mostrarGameOver(); break;
  }

  desenharParticulas();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ===== LÓGICA DO JOGO =====
function inicializarJogo() {
  // Cria a bola
  bola = {
    x: width / 2,
    y: height / 2,
    raio: config.TAMANHOS.BOLA_RAIO,
    velX: config.VELOCIDADE.BOLA.X * (random([-1, 1])),
    velY: config.VELOCIDADE.BOLA.Y * (random([-1, 1])),
    reset() {
      this.x = width / 2;
      this.y = height / 2;
      this.velX = config.VELOCIDADE.BOLA.X * (random([-1, 1]));
      this.velY = config.VELOCIDADE.BOLA.Y * (random([-1, 1]));
    },
    update() {
      this.x += this.velX;
      this.y += this.velY;
      
      // Colisão com bordas superior/inferior
      if (this.y - this.raio <= config.ESPESSURA_BORDA || 
          this.y + this.raio >= height - config.ESPESSURA_BORDA) {
        this.velY *= -1;
        adicionarParticulas(this.x, this.y, config.CORES.PARTICULA);
      }
    },
    show() {
      fill(...config.CORES.BOLA);
      ellipse(this.x, this.y, this.raio * 2);
    }
  };

  // Cria raquetes
  jogador = {
    x: 30,
    y: height / 2 - config.TAMANHOS.RAQUETE_ALTURA / 2,
    largura: config.TAMANHOS.RAQUETE_LARGURA,
    altura: config.TAMANHOS.RAQUETE_ALTURA,
    vel: config.VELOCIDADE.JOGADOR,
    update() {
      // Controle por teclado (W/S ou setas)
      if (keyIsDown(87) || keyIsDown(UP_ARROW)) { // W ou ↑
        this.y = max(config.ESPESSURA_BORDA, this.y - this.vel);
      }
      if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) { // S ou ↓
        this.y = min(height - this.altura - config.ESPESSURA_BORDA, this.y + this.vel);
      }
    },
    show() {
      fill(...config.CORES.RAQUETE);
      rect(this.x, this.y + this.altura/2, this.largura, this.altura, 5);
    }
  };

  computador = {
    x: width - 30 - config.TAMANHOS.RAQUETE_LARGURA,
    y: height / 2 - config.TAMANHOS.RAQUETE_ALTURA / 2,
    largura: config.TAMANHOS.RAQUETE_LARGURA,
    altura: config.TAMANHOS.RAQUETE_ALTURA,
    update() {
      // IA baseada na dificuldade
      let velocidade = config.VELOCIDADE.COMPUTADOR[dificuldade.toUpperCase()];
      let destinoY = bola.y - this.altura / 2;
      
      // Adiciona um pequeno atraso para dificuldade
      if (abs(this.y - destinoY) > 20) {
        this.y += (destinoY > this.y) ? velocidade : -velocidade;
      }
      
      this.y = constrain(this.y, config.ESPESSURA_BORDA, height - this.altura - config.ESPESSURA_BORDA);
    },
    show() {
      fill(...config.CORES.RAQUETE);
      rect(this.x, this.y + this.altura/2, this.largura, this.altura, 5);
    }
  };
}

function atualizarJogo() {
  // Campo de jogo
  stroke(...config.CORES.BORDA);
  strokeWeight(config.ESPESSURA_BORDA);
  noFill();
  rect(width/2, height/2, width - config.ESPESSURA_BORDA, height - config.ESPESSURA_BORDA);
  
  // Linha central pontilhada
  drawingContext.setLineDash([20, 15]);
  line(width/2, config.ESPESSURA_BORDA, width/2, height - config.ESPESSURA_BORDA);
  drawingContext.setLineDash([]);
  
  // Placar
  noStroke();
  fill(...config.CORES.TEXTO);
  textSize(config.TAMANHOS.FONTE_BASE * 1.2);
  text(placarJogador, width/4, 50);
  text(placarComputador, width * 3/4, 50);
  
  // Atualiza elementos
  bola.update();
  bola.show();
  
  jogador.update();
  jogador.show();
  
  computador.update();
  computador.show();
  
  verificarColisoes();
  verificarGols();
}

function verificarColisoes() {
  // Colisão com raquete do jogador
  if (bola.x - bola.raio <= jogador.x + jogador.largura &&
      bola.x + bola.raio >= jogador.x &&
      bola.y + bola.raio >= jogador.y &&
      bola.y - bola.raio <= jogador.y + jogador.altura) {
    bola.velX = abs(bola.velX) * 1.05;
    let impacto = (bola.y - (jogador.y + jogador.altura/2)) / (jogador.altura/2);
    bola.velY = impacto * 8;
    adicionarParticulas(bola.x, bola.y, config.CORES.PARTICULA);
  }
  
  // Colisão com raquete do computador
  if (bola.x + bola.raio >= computador.x &&
      bola.x - bola.raio <= computador.x + computador.largura &&
      bola.y + bola.raio >= computador.y &&
      bola.y - bola.raio <= computador.y + computador.altura) {
    bola.velX = -abs(bola.velX);
    let impacto = (bola.y - (computador.y + computador.altura/2)) / (computador.altura/2);
    bola.velY = impacto * 8;
    adicionarParticulas(bola.x, bola.y, config.CORES.PARTICULA);
  }
}

function verificarGols() {
  // Gol do computador
  if (bola.x + bola.raio < 0) {
    placarComputador++;
    if (placarComputador >= config.PLACAR_MAXIMO) {
      estadoJogo = 'gameover';
    } else {
      bola.reset();
    }
  }
  
  // Gol do jogador
  if (bola.x - bola.raio > width) {
    placarJogador++;
    if (placarJogador >= config.PLACAR_MAXIMO) {
      estadoJogo = 'gameover';
    } else {
      bola.reset();
    }
  }
}

// ===== INTERFACE DO USUÁRIO =====
function mostrarMenu() {
  // Título
  fill(config.CORES.TEXTO);
  textSize(config.TAMANHOS.FONTE_BASE * 1.5);
  text("PONG", width/2, height * 0.2);

  // Botões de dificuldade
  textSize(config.TAMANHOS.FONTE_BASE);
  text("Selecione a dificuldade:", width/2, height * 0.4);
  
  const dificuldades = ["Fácil", "Médio", "Difícil"];
  const opcoesDificuldade = ['facil', 'medio', 'dificil'];
  
  for (let i = 0; i < 3; i++) {
    const y = height * (0.5 + i * 0.1);
    const selecionado = dificuldade === opcoesDificuldade[i];
    
    fill(selecionado ? config.CORES.DESTAQUE : 150);
    rect(width/2, y, 200, 50, 10);
    
    fill(0);
    text(dificuldades[i], width/2, y);
  }

  // Instruções
  fill(200);
  textSize(config.TAMANHOS.FONTE_BASE * 0.7);
  text("Pressione ENTER para começar", width/2, height * 0.9);
}

function mostrarGameOver() {
  fill(...config.CORES.TEXTO);
  textSize(config.TAMANHOS.FONTE_BASE * 1.5);
  text(placarJogador > placarComputador ? "VITÓRIA!" : "GAME OVER", width/2, height * 0.3);
  
  textSize(config.TAMANHOS.FONTE_BASE * 1.2);
  text(`${placarJogador} x ${placarComputador}`, width/2, height * 0.45);
  
  // Botão de jogar novamente
  fill(100);
  rect(width/2, height * 0.65, 200, 50, 10);
  fill(255);
  text("Jogar Novamente", width/2, height * 0.65);
  
  // Instrução
  fill(200);
  textSize(config.TAMANHOS.FONTE_BASE * 0.7);
  text("Pressione ENTER para voltar ao menu", width/2, height * 0.8);
}

function mostrarPausa() {
  fill(0, 0, 0, 150);
  rect(width/2, height/2, width, height);
  
  fill(255);
  textSize(config.TAMANHOS.FONTE_BASE * 1.5);
  text("PAUSA", width/2, height * 0.4);
  
  textSize(config.TAMANHOS.FONTE_BASE);
  text("Pressione ENTER para continuar", width/2, height * 0.6);
}

// ===== EFEITOS VISUAIS =====
function adicionarParticulas(x, y, cor = config.CORES.PARTICULA) {
  for (let i = 0; i < 15; i++) {
    particulas.push({
      x, y,
      tamanho: random(2, 6),
      velX: random(-3, 3),
      velY: random(-3, 3),
      vida: 255,
      cor
    });
  }
}

function desenharParticulas() {
  for (let i = particulas.length - 1; i >= 0; i--) {
    const p = particulas[i];
    p.x += p.velX;
    p.y += p.velY;
    p.vida -= 8;
    
    fill(...p.cor, p.vida);
    noStroke();
    ellipse(p.x, p.y, p.tamanho);
    
    if (p.vida <= 0) particulas.splice(i, 1);
  }
}

// ===== CONTROLES =====
function keyPressed() {
  if (keyCode === ENTER) {
    if (estadoJogo === 'menu') {
      estadoJogo = 'jogando';
      placarJogador = 0;
      placarComputador = 0;
      inicializarJogo();
    } else if (estadoJogo === 'gameover') {
      estadoJogo = 'menu';
    } else if (estadoJogo === 'jogando') {
      estadoJogo = 'pausa';
    } else if (estadoJogo === 'pausa') {
      estadoJogo = 'jogando';
    }
  }
  
  if (keyCode === 27) { // ESC
    if (estadoJogo === 'jogando' || estadoJogo === 'pausa') {
      estadoJogo = 'menu';
    }
  }
}

function mouseClicked() {
  if (estadoJogo === 'menu') {
    const btnY = [height * 0.5, height * 0.6, height * 0.7];
    const opcoesDificuldade = ['facil', 'medio', 'dificil'];
    
    for (let i = 0; i < 3; i++) {
      if (mouseX > width/2 - 100 && mouseX < width/2 + 100 &&
          mouseY > btnY[i] - 25 && mouseY < btnY[i] + 25) {
        dificuldade = opcoesDificuldade[i];
        return;
      }
    }
  }
}