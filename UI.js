/**
 * Handles DOM manipulations for the Advanced Telemetry HUD.
 */
export default class UI {
    constructor() {
        this.hpBar = document.getElementById('hp-bar');
        this.distanceBar = document.getElementById('distance-bar');
        this.scoreVal = document.getElementById('score-val');
        
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.finalScore = document.getElementById('final-score');
        this.finalDistance = document.getElementById('final-distance');
        this.restartBtn = document.getElementById('restart-btn');
        
        this.victoryScreen = document.getElementById('victory-screen');
        this.victoryScore = document.getElementById('victory-score');
        this.playAgainBtn = document.getElementById('play-again-btn');
        
        // Dynamic waveform readout simulation string array prefix 
        this.waveformTick = 0;
    }

    /**
     * Updates telemetry outputs.
     */
    update(currentHp, maxHp, distanceTraveled, maxDistance, score) {
        // Increment fake holographic telemetry tick
        this.waveformTick++;

        const hpPercent = Math.max(0, (currentHp / maxHp) * 100);
        const distancePercent = Math.min(100, (distanceTraveled / maxDistance) * 100);

        this.hpBar.style.width = `${hpPercent}%`;
        this.distanceBar.style.width = `${distancePercent}%`;
        
        // Dynamic Warning State
        if (hpPercent < 25) {
            // Pulse critical red telemetry
            this.hpBar.style.background = this.waveformTick % 20 < 10 ? '#7f1d1d' : '#ef4444';
        } else {
            this.hpBar.style.background = '#0ea5e9'; // Change base HP to high-tech blue for shield flavor
        }

        // Format score like a memory address / telemetry chunk for the aesthetic
        // e.g. "0x00A52"
        const formattedScore = Math.floor(score).toString(16).toUpperCase().padStart(5, '0');
        this.scoreVal.innerText = `0x${formattedScore}`;
    }

    showGameOver(score, percentComplete) {
        this.gameOverScreen.classList.remove('hidden');
        this.finalScore.innerText = Math.floor(score);
        this.finalDistance.innerText = Math.floor(percentComplete);
    }

    hideGameOver() {
        this.gameOverScreen.classList.add('hidden');
    }
    
    showVictory(score) {
        this.victoryScreen.classList.remove('hidden');
        this.victoryScore.innerText = Math.floor(score);
    }
    
    hideVictory() {
        this.victoryScreen.classList.add('hidden');
    }

    bindRestart(restartCallback) {
        this.restartBtn.addEventListener('click', () => {
            this.hideGameOver();
            restartCallback();
        });
        
        this.playAgainBtn.addEventListener('click', () => {
            this.hideVictory();
            restartCallback();
        });
    }
}
