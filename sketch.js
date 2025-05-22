let estadoJogo = 'menu'; // 'menu', 'modo', 'jogando', 'pausa', 'gameover'
let dificuldade = 'medio';
let modoJogo = '1jogador'; // ou '2jogadores'
let bola, jogador1, jogador2;
let placar1 = 0, placar2 = 0;
let particulas = [];
let logo;
let larguraBotao = 200;
let alturaBotao = 50;

// CONFIGURAÇÕES
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

function preload() {
  logo = loadImage("logo.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  noStroke();
  inicializarJogo();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(config.CORES.FUNDO);
  imageMode(CENTER);
  tint(255, 50);
  image(logo, width / 2, height / 2, width * 0.5, height * 0.8);
  noTint();

  switch (estadoJogo) {
    case 'menu': mostrarMenu(); break;
    case 'modo': mostrarSelecaoModo(); break;
    case 'jogando': atualizarJogo(); break;
    case 'pausa': mostrarPausa(); break;
    case 'gameover': mostrarGameOver(); break;
  }

  desenharParticulas();
}

// ===== JOGO =====
function inicializarJogo() {
  bola = {
    x: width / 2,
    y: height / 2,
    raio: config.TAMANHOS.BOLA_RAIO,
    velX: config.VELOCIDADE.BOLA.X * random([-1, 1]),
    velY: config.VELOCIDADE.BOLA.Y * random([-1, 1]),
    reset() {
      this.x = width / 2;
      this.y = height / 2;
      this.velX = config.VELOCIDADE.BOLA.X * random([-1, 1]);
      this.velY = config.VELOCIDADE.BOLA.Y * random([-1, 1]);
    },
    update() {
      this.x += this.velX;
      this.y += this.velY;

      if (this.y - this.raio <= config.ESPESSURA_BORDA ||
          this.y + this.raio >= height - config.ESPESSURA_BORDA) {
        this.velY *= -1;
        adicionarParticulas(this.x, this.y);
      }
    },
    show() {
      fill(...config.CORES.BOLA);
      ellipse(this.x, this.y, this.raio * 2);
    }
  };

  jogador1 = criarRaquete(30, 'w', 's');
  jogador2 = criarRaquete(width - 30 - config.TAMANHOS.RAQUETE_LARGURA, 'UP_ARROW', 'DOWN_ARROW');
}

function criarRaquete(x, teclaCima, teclaBaixo) {
  return {
    x,
    y: height / 2 - config.TAMANHOS.RAQUETE_ALTURA / 2,
    largura: config.TAMANHOS.RAQUETE_LARGURA,
    altura: config.TAMANHOS.RAQUETE_ALTURA,
    vel: config.VELOCIDADE.JOGADOR,
    teclaCima,
    teclaBaixo,
    update(isIA = false) {
      if (isIA) {
        let destinoY = bola.y - this.altura / 2;
        let velocidade = config.VELOCIDADE.COMPUTADOR[dificuldade.toUpperCase()];
        if (abs(this.y - destinoY) > 20) {
          this.y += (destinoY > this.y) ? velocidade : -velocidade;
        }
      } else {
        if (keyIsDown(keyCodePorNome(this.teclaCima))) {
          this.y = max(config.ESPESSURA_BORDA, this.y - this.vel);
        }
        if (keyIsDown(keyCodePorNome(this.teclaBaixo))) {
          this.y = min(height - this.altura - config.ESPESSURA_BORDA, this.y + this.vel);
        }
      }
      this.y = constrain(this.y, config.ESPESSURA_BORDA, height - this.altura - config.ESPESSURA_BORDA);
    },
    show() {
      fill(...config.CORES.RAQUETE);
      rect(this.x, this.y + this.altura / 2, this.largura, this.altura, 5);
    }
  };
}

function keyCodePorNome(nome) {
  if (nome === 'w') return 87;
  if (nome === 's') return 83;
  if (nome === 'UP_ARROW') return UP_ARROW;
  if (nome === 'DOWN_ARROW') return DOWN_ARROW;
}

function atualizarJogo() {
  stroke(...config.CORES.BORDA);
  strokeWeight(config.ESPESSURA_BORDA);
  noFill();
  rect(width / 2, height / 2, width - config.ESPESSURA_BORDA, height - config.ESPESSURA_BORDA);
  drawingContext.setLineDash([20, 15]);
  line(width / 2, config.ESPESSURA_BORDA, width / 2, height - config.ESPESSURA_BORDA);
  drawingContext.setLineDash([]);

  noStroke();
  fill(...config.CORES.TEXTO);
  textSize(config.TAMANHOS.FONTE_BASE * 1.2);
  text(placar1, width / 4, 50);
  text(placar2, width * 3 / 4, 50);

  bola.update();
  bola.show();

  jogador1.update();
  jogador1.show();

  if (modoJogo === '1jogador') {
    jogador2.update(true);
  } else {
    jogador2.update();
  }
  jogador2.show();

  verificarColisoes();
  verificarGols();
}

function verificarColisoes() {
  if (colideComRaquete(jogador1)) {
    bola.velX = abs(bola.velX);
    let impacto = (bola.y - (jogador1.y + jogador1.altura / 2)) / (jogador1.altura / 2);
    bola.velY = impacto * 8;
    adicionarParticulas(bola.x, bola.y);
  }
  if (colideComRaquete(jogador2)) {
    bola.velX = -abs(bola.velX);
    let impacto = (bola.y - (jogador2.y + jogador2.altura / 2)) / (jogador2.altura / 2);
    bola.velY = impacto * 8;
    adicionarParticulas(bola.x, bola.y);
  }
}

function colideComRaquete(raquete) {
  return bola.x - bola.raio <= raquete.x + raquete.largura &&
         bola.x + bola.raio >= raquete.x &&
         bola.y + bola.raio >= raquete.y &&
         bola.y - bola.raio <= raquete.y + raquete.altura;
}

function verificarGols() {
  if (bola.x + bola.raio < 0) {
    placar2++;
    if (placar2 >= config.PLACAR_MAXIMO) {
      estadoJogo = 'gameover';
    } else {
      bola.reset();
    }
  }

  if (bola.x - bola.raio > width) {
    placar1++;
    if (placar1 >= config.PLACAR_MAXIMO) {
      estadoJogo = 'gameover';
    } else {
      bola.reset();
    }
  }
}

// ===== INTERFACE =====
function mostrarMenu() {
  fill(...config.CORES.TEXTO);
  textSize(config.TAMANHOS.FONTE_BASE * 1.5);
  text("PONG", width / 2, height * 0.2);

  fill(150);
  rect(width / 2, height * 0.5, larguraBotao, alturaBotao, 10);
  fill(0);
  textSize(config.TAMANHOS.FONTE_BASE);
  text("JOGAR", width / 2, height * 0.5);

  fill(200);
  textSize(config.TAMANHOS.FONTE_BASE * 0.7);
  text("Clique para começar", width / 2, height * 0.85);
}

function mostrarSelecaoModo() {
  fill(...config.CORES.TEXTO);
  textSize(config.TAMANHOS.FONTE_BASE * 1.2);
  text("Selecione o modo de jogo:", width / 2, height * 0.3);

  const modos = ["1 Jogador", "2 Jogadores"];
  for (let i = 0; i < modos.length; i++) {
    let y = height * (0.45 + i * 0.15);
    fill(150);
    rect(width / 2, y, larguraBotao, alturaBotao, 10);
    fill(0);
    textSize(config.TAMANHOS.FONTE_BASE);
    text(modos[i], width / 2, y);
  }

  fill(200);
  textSize(config.TAMANHOS.FONTE_BASE * 0.7);
  text("Clique para escolher", width / 2, height * 0.85);
}

function mostrarGameOver() {
  fill(...config.CORES.TEXTO);
  textSize(config.TAMANHOS.FONTE_BASE * 1.5);
  text(placar1 > placar2 ? "VITÓRIA DO JOGADOR 1" : "VITÓRIA DO JOGADOR 2", width / 2, height * 0.3);

  textSize(config.TAMANHOS.FONTE_BASE * 1.2);
  text(`${placar1} x ${placar2}`, width / 2, height * 0.45);

  fill(100);
  rect(width / 2, height * 0.65, larguraBotao, alturaBotao, 10);
  fill(255);
  text("Jogar Novamente", width / 2, height * 0.65);

  fill(200);
  textSize(config.TAMANHOS.FONTE_BASE * 0.7);
  text("Pressione ENTER para voltar ao menu", width / 2, height * 0.8);
}

function mostrarPausa() {
  fill(0, 0, 0, 150);
  rect(width / 2, height / 2, width, height);

  fill(255);
  textSize(config.TAMANHOS.FONTE_BASE * 1.5);
  text("PAUSA", width / 2, height * 0.4);

  textSize(config.TAMANHOS.FONTE_BASE);
  text("Pressione ENTER para continuar", width / 2, height * 0.6);
}

// ===== EFEITOS VISUAIS =====
function adicionarParticulas(x, y) {
  for (let i = 0; i < 15; i++) {
    particulas.push({
      x, y,
      tamanho: random(2, 6),
      velX: random(-3, 3),
      velY: random(-3, 3),
      vida: 255
    });
  }
}

function desenharParticulas() {
  for (let i = particulas.length - 1; i >= 0; i--) {
    const p = particulas[i];
    p.x += p.velX;
    p.y += p.velY;
    p.vida -= 8;

    fill(...config.CORES.PARTICULA, p.vida);
    noStroke();
    ellipse(p.x, p.y, p.tamanho);

    if (p.vida <= 0) particulas.splice(i, 1);
  }
}

// ===== CONTROLES =====
function keyPressed() {
  if (keyCode === ENTER) {
    if (estadoJogo === 'gameover') {
      estadoJogo = 'menu';
    } else if (estadoJogo === 'jogando') {
      estadoJogo = 'pausa';
    } else if (estadoJogo === 'pausa') {
      estadoJogo = 'jogando';
    }
  }
  if (keyCode === ESCAPE) {
    estadoJogo = 'menu';
  }
}

function mouseClicked() {
  if (estadoJogo === 'menu') {
    if (mouseX > width / 2 - larguraBotao / 2 && mouseX < width / 2 + larguraBotao / 2 &&
        mouseY > height * 0.5 - alturaBotao / 2 && mouseY < height * 0.5 + alturaBotao / 2) {
      estadoJogo = 'modo';
    }
  } else if (estadoJogo === 'modo') {
    if (mouseX > width / 2 - larguraBotao / 2 && mouseX < width / 2 + larguraBotao / 2) {
      if (mouseY > height * 0.45 - alturaBotao / 2 && mouseY < height * 0.45 + alturaBotao / 2) {
        modoJogo = '1jogador';
        iniciarJogoCompleto();
      } else if (mouseY > height * 0.6 - alturaBotao / 2 && mouseY < height * 0.6 + alturaBotao / 2) {
        modoJogo = '2jogadores';
        iniciarJogoCompleto();
      }
    }
  }
}

function iniciarJogoCompleto() {
  placar1 = 0;
  placar2 = 0;
  inicializarJogo();
  estadoJogo = 'jogando';
}
