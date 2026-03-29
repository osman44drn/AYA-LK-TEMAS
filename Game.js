import Player from './Player.js';
import EnemyShip from './EnemyShip.js';
import CelestialBody from './CelestialBody.js';
import InputHandler from './InputHandler.js';
import UI from './UI.js';
import Background from './Background.js';
import ParticleSystem from './ParticleSystem.js';

/**
 * Game Orchestrator upgraded for High-Fidelity Physics and Graphics Pipeline.
 */
export default class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.ui = new UI();
        this.bg = new Background(this.width, this.height);
        this.input = new InputHandler();
        
        // Massive VFX Manager
        this.particles = new ParticleSystem();
        
        this.player = new Player(this.width, this.height);
        
        this.projectiles = [];
        this.enemies = [];
        this.asteroids = [];
        
        this.score = 0;
        this.distanceTraveled = 0; 
        this.maxDistance = 1500; // %50 uzatıldı (Oyun süresi arttı) 
        
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 1500; 
        this.asteroidSpawnTimer = 0;
        this.asteroidSpawnInterval = 2800;
        
        // Screen Shake mechanics
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        
        this.gameOver = false;
        this.victory = false;
        
        this.ui.bindRestart(() => this.reset());
    }

    reset() {
        this.player = new Player(this.width, this.height);
        this.projectiles = [];
        this.enemies = [];
        this.asteroids = [];
        this.particles = new ParticleSystem(); // Wipe particulate memory
        
        this.score = 0;
        this.distanceTraveled = 0;
        this.gameOver = false;
        this.victory = false;
        this.enemySpawnTimer = 0;
        this.asteroidSpawnTimer = 0;
        this.shakeTimer = 0;
    }

    /**
     * Trigger a brutal screen displacement effect.
     */
    triggerShake(intensity = 15, duration = 0.3) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration; // seconds
    }

    update(dt) {
        if (this.gameOver || this.victory) {
            // Let particles continue falling even if game ends
            this.particles.update(dt);
            return; 
        }

        // Reduce screen shake over time
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            if (this.shakeTimer <= 0) this.shakeIntensity = 0;
        }

        this.bg.update(dt);
        
        // Player takes in ParticleSystem to violently emit thrust vectors
        this.player.update(this.input, dt, this.projectiles, this.particles);
        this.particles.update(dt);

        this.distanceTraveled += 50 * dt; 
        if (this.distanceTraveled >= this.maxDistance) {
            this.victory = true;
            this.ui.showVictory(this.score);
        }

        // Pool Array Garbage Collection loops
        this.projectiles.forEach(p => p.update(dt, this.width));
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
        this.enemies.forEach(e => e.update(dt, this.height));
        this.enemies = this.enemies.filter(e => !e.markedForDeletion);
        this.asteroids.forEach(a => a.update(dt));
        this.asteroids = this.asteroids.filter(a => !a.markedForDeletion);

        // Dynamic Difficulty Spawning
        this.enemySpawnTimer += dt * 1000;
        const dynamicEnemyInterval = this.enemySpawnInterval - (this.distanceTraveled / this.maxDistance) * 800;
        if (this.enemySpawnTimer > dynamicEnemyInterval) {
            this.enemies.push(new EnemyShip(this.width, this.height));
            this.enemySpawnTimer = 0;
        }

        this.asteroidSpawnTimer += dt * 1000;
        if (this.asteroidSpawnTimer > this.asteroidSpawnInterval) {
            this.asteroids.push(new CelestialBody(this.width, this.height));
            this.asteroidSpawnTimer = 0;
        }

        this.checkCollisions();

        if (this.player.hp <= 0) {
            this.gameOver = true;
            const percentCompletion = (this.distanceTraveled / this.maxDistance) * 100;
            this.ui.showGameOver(this.score, percentCompletion);
            
            // Final death explosion
            this.particles.emitExplosion(this.player.x + 30, this.player.y + 15, '#ef4444', 100, 500);
        }

        this.ui.update(this.player.hp, this.player.maxHp, this.distanceTraveled, this.maxDistance, this.score);
    }
    
    checkCollisions() {
        this.enemies.forEach(enemy => {
            if (this.isAABBIntersecting(this.player, enemy)) {
                enemy.markedForDeletion = true;
                this.player.hp -= 20; 
                this.triggerShake(10, 0.2);
                
                // Explode metal and green core shards
                this.particles.emitExplosion(enemy.x, enemy.y, '#10b981', 30, 250); 
            }

            this.projectiles.forEach(proj => {
                if (this.isAABBIntersecting(proj, enemy)) {
                    proj.markedForDeletion = true;
                    enemy.hp--; 
                    
                    // Minor hit sparks
                    this.particles.emitExplosion(proj.x, proj.y, '#38bdf8', 5, 100);

                    if (enemy.hp <= 0 && !enemy.markedForDeletion) {
                        enemy.markedForDeletion = true;
                        this.score += 150; 
                        
                        // Massive enemy death
                        this.particles.emitExplosion(enemy.x + 30, enemy.y + 20, '#f59e0b', 40, 300); 
                    }
                }
            });
        });

        this.asteroids.forEach(asteroid => {
            if (this.isAABBIntersecting(this.player, asteroid)) {
                asteroid.markedForDeletion = true; 
                this.player.hp -= asteroid.damage; 
                
                this.triggerShake(20, 0.4); // Asteroids hit hard
                
                // Blast stone dust
                this.particles.emitExplosion(asteroid.x + 30, asteroid.y + 30, '#a8a29e', 50, 400); 
            }

            this.projectiles.forEach(proj => {
                if (this.isAABBIntersecting(proj, asteroid)) {
                    proj.markedForDeletion = true;
                    // Chip stone bits off asteroid
                    this.particles.emitExplosion(proj.x, proj.y, '#d6d3d1', 10, 80); 
                }
            });
        });
    }

    isAABBIntersecting(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    draw(ctx, timestamp) {
        ctx.save();

        // Apply Screen Shake via Camera Translation 
        if (this.shakeTimer > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.translate(dx, dy);
        }
        
        this.bg.draw(ctx, timestamp); 
        this.asteroids.forEach(a => a.draw(ctx));
        
        // Let Projectiles hook directly into the particle pool map while painting (Trailing Plasma)
        this.projectiles.forEach(p => p.draw(ctx, this.particles));
        
        this.enemies.forEach(e => e.draw(ctx));
        
        // Draw physical particle debris layer behind the player but over asteroids
        this.particles.draw(ctx);
        
        if (!this.gameOver || this.victory) {
           this.player.draw(ctx);
        }
        
        ctx.restore(); // Ensure camera shakes undo cleanly
    }
}
