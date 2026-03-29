/*
 * LUNAR ROVER GAME
 * Matter.js kullanılarak oluşturulmuş prosedürel fizik tabanlı araç oyunu.
 */

let gameEngine = null;
let gameRender = null;
let gameRunner = null;
let keys = { ArrowRight: false, ArrowLeft: false, ArrowUp: false, ArrowDown: false, Space: false };
let lastJumpTime = 0;
let roverBody = null;
let isGameOver = false;

function initLunarRoverGame() {
    isGameOver = false;
    window.isGameActive = true; // Hikaye script'ini durdurmak için global bayrak

    // UI Değişiklikleri
    document.getElementById('gameOverlay').classList.remove('hidden');
    document.getElementById('gameOverPanel').classList.add('hidden');
    document.getElementById('btnRestartGame').classList.remove('hidden');
    document.getElementById('btnExitGame').classList.add('hidden');
    
    const container = document.getElementById('gameCanvasContainer');
    container.innerHTML = '';
    
    // Matter.js Modülleri
    const Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Composites = Matter.Composites,
        Constraint = Matter.Constraint,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        Composite = Matter.Composite,
        Body = Matter.Body,
        Events = Matter.Events,
        Bodies = Matter.Bodies,
        Vector = Matter.Vector;

    // Motor ve Dünya
    const engine = Engine.create();
    gameEngine = engine;
    
    // Ay yerçekimi (normal Dünya'ya göre daha hafif, süspansiyon tepkili)
    engine.world.gravity.y = 0.5;

    // Render Oluştur
    const render = Render.create({
        element: container,
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            background: 'transparent',
            wireframes: false,
            showAngleIndicator: false
        }
    });
    gameRender = render;

    // Zemin Oluştur (Ay Krateri Yüzeyi)
    const terrainParts = [];
    const segmentWidth = 120;
    const terrainLength = 30000;
    let cx = -300;
    let currentY = 600;

    for (let x = cx; x < terrainLength; x += segmentWidth) {
        // Daha yatay ve pürüzsüz yüzey, aracın takılmasını önler
        let nextY = 600 + Math.sin(x / 1500) * 80 + Math.sin(x / 600) * 40;

        const width = segmentWidth;
        const segmentDist = Math.sqrt(width * width + (nextY - currentY) * (nextY - currentY));
        const segmentAngle = Math.atan2(nextY - currentY, width);

        const part = Bodies.rectangle(x + width/2, (currentY + nextY)/2 + 300, segmentDist + 15, 600, {
            isStatic: true,
            friction: 0.9,
            restitution: 0.1,
            angle: segmentAngle,
            render: {
                fillStyle: '#8c92ac', // Ay tozu rengi
                strokeStyle: '#4b5563',
                lineWidth: 3
            }
        });
        terrainParts.push(part);
        currentY = nextY;
    }
    
    // Güvenli başlangıç platformu
    const startPlatform = Bodies.rectangle(0, 700, 800, 200, { 
        isStatic: true, 
        friction: 1.0,
        render: { fillStyle: '#3a414b' } 
    });
    
    // 300mt Bitiş Bayrağı (Görsel ve SENSÖR)
    // 300 * 40 = 12000 x koordinatı
    const finishPole = Bodies.rectangle(12000, 300, 10, 800, {
        isStatic: true,
        isSensor: true, // Arabaya çarpmaz içinden geçer
        render: { fillStyle: '#bfa15f' } // Altın direk
    });
    const finishFlag = Bodies.rectangle(12050, 0, 100, 60, {
        isStatic: true,
        isSensor: true,
        render: { fillStyle: '#e31837' } // Kırmızı bayrak
    });
    
    Composite.add(engine.world, terrainParts);
    Composite.add(engine.world, startPlatform);
    Composite.add(engine.world, [finishPole, finishFlag]);

    // Uzay Rover'ı (Araç) Oluştur
    const carX = 100, carY = 500;
    const group = Body.nextGroup(true);

    const chassis = Bodies.rectangle(carX, carY, 140, 25, {
        collisionFilter: { group: group },
        density: 0.008, // Daha ağır şasi stabilite sağlar
        render: { fillStyle: '#b0b5c0' }, // Gri
        chamfer: { radius: 8 }
    });

    const cabin = Bodies.rectangle(carX - 10, carY - 25, 70, 35, {
        collisionFilter: { group: group },
        density: 0.002,
        render: { fillStyle: '#d0d5e0' }, // Açık gri kabin
        chamfer: { radius: 5 }
    });
    
    const foil = Bodies.rectangle(carX + 15, carY - 15, 30, 6, {
        collisionFilter: { group: group },
        density: 0.0002,
        render: { fillStyle: '#d4af37' }, // Altın folyo parçası
    });

    const antenna = Bodies.rectangle(carX - 35, carY - 55, 3, 40, {
        collisionFilter: { group: group },
        density: 0.0001,
        render: { fillStyle: '#888' } // Gri anten
    });

    const carBody = Body.create({
        parts: [chassis, cabin, foil, antenna],
        collisionFilter: { group: group },
    });
    roverBody = carBody;

    // Metalik Ağ Tekerlekler (Aygır/Rover tarzı 6x6 araç, yanda 3 teker)
    const wheelAOffset = 65;   // Ön
    const wheelMOffset = 0;    // Orta
    const wheelBOffset = -65;  // Arka
    const wheelYOffset = 25;
    const wheelRadius = 26; // Eski orijinal tekerlek boyutu

    const wheelConfig = {
        collisionFilter: { group: group },
        friction: 0.95,
        restitution: 0.1,
        density: 0.003,
        render: { fillStyle: 'transparent', strokeStyle: '#cbd5e1', lineWidth: 5 }
    };

    const wheelA = Bodies.circle(carX + wheelAOffset, carY + wheelYOffset, wheelRadius, wheelConfig);
    const wheelM = Bodies.circle(carX + wheelMOffset, carY + wheelYOffset, wheelRadius, wheelConfig);
    const wheelB = Bodies.circle(carX + wheelBOffset, carY + wheelYOffset, wheelRadius, wheelConfig);

    // Süspansiyon Gövde Bağlantıları (Yaylar)
    const axelA = Constraint.create({
        bodyA: carBody,
        pointA: { 
            x: (carX + wheelAOffset) - carBody.position.x, 
            y: (carY + wheelYOffset) - carBody.position.y 
        },
        bodyB: wheelA,
        stiffness: 0.3, // Ay yüzeyi için yumuşak süspansiyon
        damping: 0.1,
        length: 26,
        render: { visible: false }
    });
    const axelM = Constraint.create({
        bodyA: carBody,
        pointA: { 
            x: (carX + wheelMOffset) - carBody.position.x, 
            y: (carY + wheelYOffset) - carBody.position.y 
        },
        bodyB: wheelM,
        stiffness: 0.4,
        damping: 0.15,
        length: 26,
        render: { visible: false }
    });
    const axelB = Constraint.create({
        bodyA: carBody,
        pointA: { 
            x: (carX + wheelBOffset) - carBody.position.x, 
            y: (carY + wheelYOffset) - carBody.position.y 
        },
        bodyB: wheelB,
        stiffness: 0.4,
        damping: 0.15,
        length: 26,
        render: { visible: false }
    });

    Composite.add(engine.world, [carBody, wheelA, wheelM, wheelB, axelA, axelM, axelB]);

    // HTML üzerindeki maksimum hedefi 300 olarak güncelle
    const goalEl = document.getElementById('gameGoal');
    if (goalEl) goalEl.innerText = "300";

    // Oynat
    Render.run(render);
    const runner = Runner.create();
    gameRunner = runner;
    Runner.run(runner, engine);

    // Dinleyiciler
    document.addEventListener('keydown', handleGameKeydown);
    document.addEventListener('keyup', handleGameKeyup);

    // Oyun Döngüsü (Update)
    Events.on(engine, 'beforeUpdate', function() {
        if (isGameOver) return;

        // Kontroller
        const angularVelocityLimit = 0.25; // Hız limitini daha da azalttık
        const accelStep = 0.015; // Hızlanma ivmesini iyice yumuşattık

        if (keys.ArrowRight) {
            Body.setAngularVelocity(wheelA, Math.min(wheelA.angularVelocity + accelStep, angularVelocityLimit));
            Body.setAngularVelocity(wheelM, Math.min(wheelM.angularVelocity + accelStep, angularVelocityLimit));
            Body.setAngularVelocity(wheelB, Math.min(wheelB.angularVelocity + accelStep, angularVelocityLimit));
        }
        if (keys.ArrowLeft) {
            Body.setAngularVelocity(wheelA, Math.max(wheelA.angularVelocity - accelStep, -angularVelocityLimit));
            Body.setAngularVelocity(wheelM, Math.max(wheelM.angularVelocity - accelStep, -angularVelocityLimit));
            Body.setAngularVelocity(wheelB, Math.max(wheelB.angularVelocity - accelStep, -angularVelocityLimit));
        }
        if ((keys.ArrowUp || keys.Space) && engine.timing.timestamp - lastJumpTime > 1500) {
            Body.applyForce(carBody, carBody.position, { x: 0.0, y: -0.15 });
            lastJumpTime = engine.timing.timestamp;
            console.log("JUMP!");
        }

        // Skor Hesaplama (ve Bitişe Kalan Mesafe)
        const dist = Math.floor(carBody.position.x / 40);
        document.getElementById('gameDistance').innerText = Math.max(0, dist);

        // Kamera Takibi
        Render.lookAt(render, {
            min: { x: carBody.position.x - window.innerWidth/3, y: carBody.position.y - window.innerHeight*0.6 },
            max: { x: carBody.position.x + window.innerWidth*0.66, y: carBody.position.y + window.innerHeight*0.4 }
        });

        // Önce Kazanma Durumunu Kontrol Et (Mesafe hedefine ulaşıldı mı?)
        if (dist >= 300) {
            winLunarGame();
            return;
        }

        // Kratere çok derin düşerse kaybet (Sadece aşağı düşme GameOver bırakıldı)
        if (carBody.position.y > 3000) {
            endLunarGame("Araç derin bir kratere düştü.");
        }
    });
}

function handleGameKeydown(e) {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
}
function handleGameKeyup(e) {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
}

function endLunarGame(reason) {
    if (isGameOver) return;
    isGameOver = true;
    document.getElementById('gameOverTitle').innerText = "GÖREV BAŞARISIZ";
    document.getElementById('gameOverTitle').style.color = "#e31837";
    document.getElementById('gameOverMsg').innerText = reason;
    document.getElementById('gameOverPanel').classList.remove('hidden');
    document.getElementById('btnExitGame').classList.remove('hidden');
}

function winLunarGame() {
    if (isGameOver) return;
    isGameOver = true;
    
    // YENİ MANTI: Oyun başarılı olduğunda eski pop-up'ı göstermek yerine doğrudan Sahne 7'ye geç.
    cleanupLunarGame();
    document.getElementById('gameOverlay').classList.add('hidden');
    
    // Geri sayım bittiği an final sahnesine atla (sahneler[5])
    if (typeof sahneDegistir === 'function') {
        const eTr = document.createElement('div');
        eTr.style.cssText = 'position:fixed;inset:0;background:#000;z-index:9999;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.8rem;text-align:center;letter-spacing:2px;font-family:var(--font-display);opacity:0;transition:opacity 1s ease;';
        eTr.innerHTML = 'KEŞİF BAŞARIYLA TAMAMLANDI.<br>DÜNYA\'YA VERİ AKTARILIYOR...';
        document.body.appendChild(eTr);
        setTimeout(() => eTr.style.opacity = '1', 50);

        setTimeout(() => {
            sahneDegistir(5);
            window.isGameActive = false; // Geçiş bittikten sonra kapalı duruma gelsin
            eTr.style.opacity = '0';
            setTimeout(() => eTr.remove(), 1000);
        }, 3000); // 3 saniyelik harika bir geçiş
    }
}

document.getElementById('btnRestartGame').addEventListener('click', () => {
    cleanupLunarGame();
    initLunarRoverGame();
});

const btnActiveRestart = document.getElementById('btnActiveRestart');
if (btnActiveRestart) {
    btnActiveRestart.addEventListener('click', () => {
        cleanupLunarGame();
        initLunarRoverGame();
    });
}

const btnActiveWin = document.getElementById('btnActiveWin');
if (btnActiveWin) {
    btnActiveWin.addEventListener('click', () => {
        winLunarGame();
    });
}

document.getElementById('btnExitGame').addEventListener('click', () => {
    cleanupLunarGame();
    window.isGameActive = false; // Normal çıkışta kapat!
    document.getElementById('gameOverlay').classList.add('hidden');
    
    // Sonraki state'e ilerle (Eğer ana site script.js'i sahnelerin bittiğini gösteriyorsa)
    // index.html'deki btnNext 'Hikaye Tamamlandı' yapabiliriz.
    const btnNext = document.getElementById('btnNext');
    if (btnNext) {
        btnNext.disabled = true;
        const nextSpan = btnNext.querySelector('span');
        if (nextSpan) nextSpan.textContent = 'Hikâye Tamamlandı ✓';
    }
});

function cleanupLunarGame() {
    // window.isGameActive burada değil, tam geçiş sonrası veya çıkış butonunda kapatılıyor.
    if (gameEngine) {
        Matter.World.clear(gameEngine.world, false);
        Matter.Engine.clear(gameEngine);
    }
    if (gameRender) {
        Matter.Render.stop(gameRender);
        if (gameRender.canvas && gameRender.canvas.parentNode) {
            gameRender.canvas.parentNode.removeChild(gameRender.canvas);
        }
    }
    if (gameRunner) {
        Matter.Runner.stop(gameRunner);
    }
    document.removeEventListener('keydown', handleGameKeydown);
    document.removeEventListener('keyup', handleGameKeyup);
    keys = { ArrowRight: false, ArrowLeft: false, ArrowUp: false, ArrowDown: false, Space: false };
}
