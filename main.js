import Game from './Game.js';

let game = null;
let animId = null;

window.startSpaceGame = function () {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (game) {
            game.width = canvas.width;
            game.height = canvas.height;
        }
    });

    game = new Game(canvas.width, canvas.height);

    let lastTime = 0;

    function animate(timestamp) {
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        game.update(dt || 0);
        game.draw(ctx, timestamp);

        animId = requestAnimationFrame(animate);
    }

    animId = requestAnimationFrame(animate);
};

window.stopSpaceGame = function () {
    if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
    }
    game = null;
};
