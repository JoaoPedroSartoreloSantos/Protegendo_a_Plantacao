let plantas = [];
let vidaPlantas = [];
let bichos = [];
let maxBichos = 24; 
let dia = true;
let diaAtual = 1;
let jogoAtivo = true;
let minigameAtivo = false;
let plantaInfectada = -1;
let minigameTimer = 0;
let player;
let inimigosMinigame = [];
let lanternCooldown = 0;
let tempoNoiteFrames = 0;
let vidaRecuperadaHoje = [];
const TEMPO_NOITE = 15 * 60; // 20 segundos em frames (60fps)
const LANTERN_COOLDOWN_FRAMES = 15; 

//feixe de luz
let feixes = [];

let tempoJogoSegundos = 0;
let jogoFinalizado = false;
let melhorTempo = null;

function setup() {
  createCanvas(800, 600);
  textAlign(CENTER, CENTER);
  
  for (let i = 0; i < 5; i++) {
    plantas.push({ x: 100 + i * 130, y: 520, plantada: false, infectada: false });
    vidaPlantas.push(200);
    vidaRecuperadaHoje.push(false);
  }
  
  botaoAvancar = createButton("Avançar");
  botaoAvancar.position(20, 20);
  botaoAvancar.mousePressed(avancarTempo);
  botaoAvancar.hide();
  
  botaoReiniciar = createButton("Reiniciar");
  botaoReiniciar.position(100, 20);
  botaoReiniciar.mousePressed(reiniciarJogo);
  botaoReiniciar.hide();

  const tempoSalvo = localStorage.getItem('melhorTempoPlantas');
  if (tempoSalvo) melhorTempo = parseFloat(tempoSalvo);

  jogoAtivo = true;
}

function draw() {
  if(jogoFinalizado){
    mostrarTelaFinal();
    return;
  }

  background(dia ? 'skyblue' : 'midnightblue');
  drawCeu();
  
  if (minigameAtivo) {
    desenharMinigame();
    return;
  }
  
  drawPlantas();
  
  if (!jogoAtivo) {
    fill(255);
    textSize(32);
    text("Fim de jogo!", width / 2, height / 2);
    botaoReiniciar.show();
    return;
  }
  
  //contagem de dias
  fill(255);
  textSize(24);
  text("Dia " + diaAtual, width/2, 20);

  if (dia) {
    //botão de avançar
    if (diaAtual < 2) {
      let todasPlantadas = plantas.every(p => p.plantada);
      if (todasPlantadas) botaoAvancar.show();
      else botaoAvancar.hide();
    } else {
      let temViva = vidaPlantas.some(v => v > 0);
      let temInfectada = plantas.some(p => p.infectada);
      if (temViva && !temInfectada) botaoAvancar.show();
      else botaoAvancar.hide();
    }
    tempoNoiteFrames = 0; // reset contador noite
  } else {
    updateBichos();
    tempoNoiteFrames++;
    
    drawBarraProgressoNoite();
    
    if (tempoNoiteFrames >= TEMPO_NOITE) {
      botaoAvancar.show();
    } else {
      botaoAvancar.hide();
    }
    
    if (lanternCooldown > 0,25) lanternCooldown--;
  }

  desenharFeixes();

  //atualiza contador de tempo do jogo só se estiver ativo e não no minigame
  if(jogoAtivo && !minigameAtivo && !dia){
    //contando tempo em segundos com frameRate 60
    tempoJogoSegundos += deltaTime / 1000;
  }
}

function mostrarTelaFinal(){
  background(100);
  fill(255);
  textSize(28);
  text("Você manteve suas plantas vivas!", width/2, height/2 - 40);
  text("Agora pode vendê-las na cidade.", width/2, height/2);
  textSize(20);
  text(`Tempo: ${tempoJogoSegundos.toFixed(2)}s`, width/2, height/2 + 40);
  if(melhorTempo){
    text(`Melhor tempo: ${melhorTempo.toFixed(2)}s`, width/2, height/2 + 70);
  } else {
    text(`Melhor tempo: -`, width/2, height/2 + 70);
  }
  botaoReiniciar.show();
  botaoAvancar.hide();
}

function drawBarraProgressoNoite() {
  const barraX = 200, barraY = 40, barraWidth = 400, barraHeight = 20;
  let progresso = constrain(tempoNoiteFrames / TEMPO_NOITE, 0, 1);
  fill(0);
  stroke(0);
  strokeWeight(2);
  rect(barraX, barraY, barraWidth, barraHeight);
  noStroke();
  fill(0, 255, 255);
  rect(barraX, barraY, barraWidth * progresso, barraHeight);
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Tempo restante da noite", barraX + barraWidth/2, barraY + barraHeight / 2);
}

function drawCeu() {
  if (!dia) {
    fill(255, 255, 200);
    ellipse(700, 100, 60);
  } else {
    fill('yellow');
    ellipse(700, 100, 80);
  }
  // Retângulo marrom com borda preta
  fill('saddlebrown');
  stroke(0);
  strokeWeight(2);
  rect(0, 570, width, 30);
  noStroke();
}

function drawPlantas() {
  textAlign(CENTER, CENTER);
  for (let i = 0; i < plantas.length; i++) {
    let p = plantas[i];
    stroke(0);
    strokeWeight(2);
    if (!p.plantada) {
      fill('saddlebrown');
      rect(p.x, p.y, 50, 50, 10);
      noStroke();
      fill(0);
      textSize(14);
      text('Clique\npara\nplantar', p.x + 25, p.y + 25);
      continue;
    }
    if (vidaPlantas[i] <= 0) {
      noStroke();
      continue;
    }
    
    fill(p.infectada ? 'purple' : 'green');
    rect(p.x, p.y, 50, 50, 10);
    
    // Emoji fixo e centralizado
    noStroke();
    textSize(32);
    fill(255);
    text('🌱', p.x + 25, p.y + 25);
    
    // Vida da planta - tamanho fixo
    textSize(16);
    fill(255);
    text(int(vidaPlantas[i]), p.x + 25, p.y - 15);
  }
  noStroke();
}

function spawnBichos() {
  bichos = [];
  let tipos = [
    { emoji: '🐺', vida: 35, dano: 25, velocidadeBase: 1.2 },
    { emoji: '🦊', vida: 30, dano: 15, velocidadeBase: 1.1 },
    { emoji: '🐦', vida: 15, dano: 30, velocidadeBase: 1.0 }
  ];
  let count = 0;
  while (count < maxBichos) {
    let alvoIndex = floor(random(plantas.length));
    if (!plantas[alvoIndex].plantada || vidaPlantas[alvoIndex] <= 0) {
      continue;
    }
    let tipo = random(tipos);
    bichos.push({
      x: plantas[alvoIndex].x + 25,
      y: -random(50, 150),
      alvo: alvoIndex,
      vida: tipo.vida,
      dano: tipo.dano,
      velocidade: tipo.velocidadeBase * pow(1.01, diaAtual - 1) * 0.8,
      emoji: tipo.emoji,
      vidaMax: tipo.vida
    });
    count++;
  }
}

function updateBichos() {
  for (let i = bichos.length - 1; i >= 0; i--) {
    let b = bichos[i];
    let p = plantas[b.alvo];
    
    if (!p.plantada || vidaPlantas[b.alvo] <= 0) {
      bichos.splice(i, 1);
      continue;
    }
    
    fill(255);
    textSize(24);
    text(b.emoji, b.x, b.y);
    
    fill(255, 0, 0);
    rect(b.x - 15, b.y - 25, 30, 5);
    fill(0, 255, 0);
    let barraVida = map(b.vida, 0, b.vidaMax, 0, 30);
    rect(b.x - 15, b.y - 25, barraVida, 5);
    
    b.y += b.velocidade;
    
    if (dist(b.x, b.y, p.x + 25, p.y + 25) < 30) {
      vidaPlantas[b.alvo] -= b.dano;
      if (vidaPlantas[b.alvo] < 0) vidaPlantas[b.alvo] = 0;
      bichos.splice(i, 1);
    }
  }
  
  if (vidaPlantas.every(v => v <= 0)) {
    jogoAtivo = false;
  }
}

function mousePressed() {
  if (minigameAtivo) return;
  
  if (dia) {
    for (let i = 0; i < plantas.length; i++) {
      let p = plantas[i];
      if (dist(mouseX, mouseY, p.x + 25, p.y + 25) < 30) {
        if (!p.plantada) {
          p.plantada = true;
          vidaPlantas[i] = 200;
          vidaRecuperadaHoje[i] = false;
        } else if (p.infectada) {
          iniciarMinigame(i);
        } else {
          if (!vidaRecuperadaHoje[i] && vidaPlantas[i] < 200) {
            vidaPlantas[i] = min(200, vidaPlantas[i] + 10);
            vidaRecuperadaHoje[i] = true;
          }
        }
      }
    }
  } else {
    if (lanternCooldown <= 0) {
      lanternCooldown = LANTERN_COOLDOWN_FRAMES;
      usarLanterna(mouseX, mouseY);
      criarFeixe(mouseX, mouseY);
    }
  }
}

function usarLanterna(x, y) {
  for (let b of bichos) {
    if (dist(x, y, b.x, b.y) < 50) {
      b.vida -= 10;
      if (b.vida <= 0) {
        bichos.splice(bichos.indexOf(b), 1);
      }
    }
  }
}

function criarFeixe(x, y) {
  feixes.push({ x, y, duracao: 5 });
}

function desenharFeixes() {
  noStroke();
  for (let i = feixes.length - 1; i >= 0; i--) {
    let f = feixes[i];
    for (let j = 0; j < 10; j++) {
      let alpha = map(j, 0, 10, 200, 0);
      fill(255, 255, 150, alpha);
      ellipse(f.x, f.y, 20 - j * 2);
    }
    f.duracao--;
    if (f.duracao <= 0) {
      feixes.splice(i, 1);
    }
  }
}

function avancarTempo() {
  if (minigameAtivo) return;
  if (jogoFinalizado) return;
  
  if (dia) {
    dia = false;
    bichos = [];
    spawnBichos();
    tempoNoiteFrames = 0;
    botaoAvancar.hide();
    vidaRecuperadaHoje = vidaPlantas.map(() => false);
  } else {
    dia = true;
    diaAtual++;
    
    if (diaAtual >= 3) {
      let indicesVivos = [];
      for (let i = 0; i < plantas.length; i++) {
        if (plantas[i].plantada && vidaPlantas[i] > 0 && !plantas[i].infectada) {
          indicesVivos.push(i);
        }
      }
      if (indicesVivos.length > 0) {
        let infectada = random(indicesVivos);
        plantas[infectada].infectada = true;
      }
    }
    bichos = [];
    botaoAvancar.hide();

    if(diaAtual > 8){
      // Finaliza o jogo e mostra tela
      jogoFinalizado = true;
      botaoAvancar.hide();
      botaoReiniciar.show();
      // salva melhor tempo
      if(!melhorTempo || tempoJogoSegundos < melhorTempo){
        melhorTempo = tempoJogoSegundos;
        localStorage.setItem('melhorTempoPlantas', melhorTempo);
      }
    }
  }
}

function iniciarMinigame(indice) {
  minigameAtivo = true;
  plantaInfectada = indice;
  player = { x: width / 2, y: height - 50, r: 20 };
  minigameTimer = 600;
  inimigosMinigame = [];
  for (let i = 0; i < 10; i++) {
    inimigosMinigame.push({
      x: random(width),
      y: random(-300, -50),
      velocidade: random(2, 5)
    });
  }
}

function desenharMinigame() {
  background(20);
  fill(255);
  textSize(20);
  text("Desvie da infecção!", width / 2, 30);
  textSize(40);
  text('👨‍🌾', player.x, player.y);
  
  for (let inimigo of inimigosMinigame) {
    textSize(32);
    text('👾', inimigo.x, inimigo.y);
    inimigo.y += inimigo.velocidade;
    
    if (dist(player.x, player.y, inimigo.x, inimigo.y) < player.r) {
      minigameAtivo = false;
      return;
    }
  }
  
  if (keyIsDown(LEFT_ARROW)) player.x -= 5;
  if (keyIsDown(RIGHT_ARROW)) player.x += 5;
  player.x = constrain(player.x, player.r, width - player.r);
  
  minigameTimer--;
  if (minigameTimer <= 0) {
    plantas[plantaInfectada].infectada = false;
    plantaInfectada = -1;
    minigameAtivo = false;
  }
}

function reiniciarJogo() {
  plantas = [];
  vidaPlantas = [];
  bichos = [];
  dia = true;
  diaAtual = 1;
  jogoAtivo = true;
  minigameAtivo = false;
  plantaInfectada = -1;
  minigameTimer = 0;
  lanternCooldown = 0;
  tempoNoiteFrames = 0;
  feixes = [];
  vidaRecuperadaHoje = [];
  tempoJogoSegundos = 0;
  jogoFinalizado = false;
  
  for (let i = 0; i < 5; i++) {
    plantas.push({ x: 100 + i * 130, y: 520, plantada: false, infectada: false });
    vidaPlantas.push(200);
    vidaRecuperadaHoje.push(false);
  }
  
  botaoAvancar.hide();
  botaoReiniciar.hide();
}
