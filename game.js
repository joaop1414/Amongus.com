const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const visionLimit = document.getElementById('visionLimit');
const playerSize = 30;
const botSize = 30;
const numBots = 3;
let player, bots, impostor, tasks, gameState, moveX, moveY, visionRadius = 150;

function createCharacter(x, y, color, isImpostor = false) {
    return { x, y, color, isImpostor, isDead: false };
}

function createTask(x, y) {
    return { x, y, isComplete: false };
}

function updateVision() {
    visionLimit.style.width = visionRadius * 2 + 'px';
    visionLimit.style.height = visionRadius * 2 + 'px';
    visionLimit.style.left = player.x + playerSize / 2 - visionRadius + 'px';
    visionLimit.style.top = player.y + playerSize / 2 - visionRadius + 'px';
}

function drawCharacter(character) {
    if (character.isDead) {
        ctx.fillStyle = 'gray';
    } else {
        ctx.fillStyle = character.color;
    }
    ctx.beginPath();
    ctx.arc(character.x, character.y, botSize / 2, 0, 2 * Math.PI);
    ctx.fill();
}

function drawTask(task) {
    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.arc(task.x, task.y, 10, 0, 2 * Math.PI);
    ctx.fill();
}

function handleChat(message) {
    const chatMessage = document.createElement('div');
    chatMessage.textContent = message;
    chatBox.appendChild(chatMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function vote(votes) {
    let voteCounts = {};
    votes.forEach(vote => {
        if (!voteCounts[vote]) voteCounts[vote] = 0;
        voteCounts[vote]++;
    });

    let maxVotes = Math.max(...Object.values(voteCounts));
    let potentialEjections = Object.keys(voteCounts).filter(v => voteCounts[v] === maxVotes);

    if (potentialEjections.length === 1) {
        const ejected = potentialEjections[0];
        const ejectedPlayer = bots.find(bot => bot.x === ejected);
        if (ejectedPlayer) {
            if (ejectedPlayer.isImpostor) {
                handleChat(`${ejectedPlayer.color} era o impostor!`);
                gameState = 'ended';
            } else {
                handleChat(`${ejectedPlayer.color} era um tripulante.`);
                gameState = 'ended';
            }
        }
    } else if (potentialEjections.length === 0) {
        handleChat('Ninguém foi ejetado (pulado).');
    } else {
        handleChat('Ninguém foi ejetado (empate).');
    }
}

function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === 'playing') {
        bots.forEach(bot => {
            if (!bot.isDead) drawCharacter(bot);
        });
        drawCharacter(player);
        tasks.forEach(task => {
            if (!task.isComplete) drawTask(task);
        });
    } else if (gameState === 'meeting') {
        // Desenha a tela de reunião
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        handleChat('Reunião de Emergência chamada!');
        handleChat('Votem em quem vocês acham que é o impostor.');

        // Exibe as opções de voto
        const voteOptions = bots.map(bot => bot.color).filter(color => !player.color.includes(color));
        handleChat(`Votem: ${voteOptions.join(', ')}`);

        // Adiciona evento de votação
        chatInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const vote = chatInput.value;
                chatInput.value = '';
                vote(voteOptions);
            }
        });
    }
    updateVision();
}

function initializeBots() {
    bots = [];
    for (let i = 0; i < numBots; i++) {
        const x = Math.random() * (canvas.width - botSize);
        const y = Math.random() * (canvas.height - botSize);
        const color = i === 0 ? 'black' : ['blue', 'green', 'red', 'yellow', 'cyan', 'purple'][Math.floor(Math.random() * 6)];
        bots.push(createCharacter(x, y, color, i === 0));
    }
    impostor = bots.find(bot => bot.isImpostor);
}

function setupEventListeners() {
    document.getElementById('up').addEventListener('click', () => moveY = -1);
    document.getElementById('down').addEventListener('click', () => moveY = 1);
    document.getElementById('left').addEventListener('click', () => moveX = -1);
    document.getElementById('right').addEventListener('click', () => moveX = 1);
    document.getElementById('upMobile').addEventListener('touchstart', () => moveY = -1);
    document.getElementById('downMobile').addEventListener('touchstart', () => moveY = 1);
    document.getElementById('leftMobile').addEventListener('touchstart', () => moveX = -1);
    document.getElementById('rightMobile').addEventListener('touchstart', () => moveX = 1);
    document.getElementById('upMobile').addEventListener('touchend', () => moveY = 0);
    document.getElementById('downMobile').addEventListener('touchend', () => moveY = 0);
    document.getElementById('leftMobile').addEventListener('touchend', () => moveX = 0);
    document.getElementById('rightMobile').addEventListener('touchend', () => moveX = 0);
    document.getElementById('startGame').addEventListener('click', initGame);
}

function moveBots() {
    bots.forEach(bot => {
        if (!bot.isDead) {
            const dx = player.x - bot.x;
            const dy = player.y - bot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < visionRadius) {
                const angle = Math.atan2(dy, dx);
                bot.x += Math.cos(angle) * 2;
                bot.y += Math.sin(angle) * 2;
            }

            // Imita comportamento do impostor
            if (bot.isImpostor) {
                if (Math.random() < 0.02) {
                    const target = bots.find(b => !b.isImpostor && !b.isDead && Math.hypot(b.x - bot.x, b.y - bot.y) < 30);
                    if (target) {
                        target.isDead = true;
                        handleChat(`${bot.color} matou ${target.color}`);
                        gameState = 'meeting';
                        return;
                    }
                }
            }

            // Checa se os bots encontram o jogador
            if (Math.random() < 0.01) {
                const target = bots.find(b => !b.isImpostor && !b.isDead && Math.hypot(b.x - bot.x, b.y - bot.y) < 30);
                if (target) {
                    target.isDead = true;
                    handleChat(`${bot.color} matou ${target.color}`);
                    gameState = 'meeting';
                }
            }
        }
    });
}

function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === 'playing') {
        moveBots();
        bots.forEach(bot => {
            if (!bot.isDead) drawCharacter(bot);
        });
        drawCharacter(player);
        tasks.forEach(task => {
            if (!task.isComplete) drawTask(task);
        });

        // Verifica se o jogador está perto de alguma tarefa
        tasks.forEach(task => {
            if (!task.isComplete) {
                const dx = player.x - task.x;
                const dy = player.y - task.y;
                if (Math.sqrt(dx * dx + dy * dy) < playerSize / 2 + 10) {
                    task.isComplete = true;
                    handleChat('Tarefa completada!');
                }
            }
        });

        // Checa se todos os bots estão mortos ou não
        if (bots.every(bot => bot.isDead || bot.isImpostor)) {
            handleChat('Você completou todas as tarefas!');
            gameState = 'ended';
        }

        updateVision();
    } else if (gameState === 'meeting') {
        // Desenha a tela de reunião
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        handleChat('Reunião de Emergência chamada!');
        handleChat('Votem em quem vocês acham que é o impostor.');

        // Adiciona eventos de chat para votar
        chatInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const vote = chatInput.value;
                chatInput.value = '';
                if (vote === 'skip') {
                    handleChat('A votação foi pulada.');
                    gameState = 'ended';
                } else {
                    vote([vote]);
                }
            }
        });
    }
}

function initGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player = createCharacter(100, 100, 'red');
    initializeBots();
    tasks = [
        createTask(200, 200),
        createTask(400, 100),
        createTask(600, 300),
    ];
    gameState = 'playing';
    document.getElementById('status').textContent = 'Encontre o impostor e complete as tarefas!';
    updateGame();
}

// Configura eventos de controles
setupEventListeners();
window.addEventListener('load', checkIfMobile);
window.addEventListener('resize', checkIfMobile);
