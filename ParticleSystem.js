export default class ParticleSystem {
    constructor() {
        /**
         * The primary array storing all active particles in the scene.
         * Educational Note: In a fully professional AAA engine, this might use a static 
         * array pool swapping indexing instead of dynamic .push() to completely bypass 
         * the Garbage Collector. However, JS `.filter()` runs exceptionally fast in V8
         * and fulfills the modern ES6 paradigm nicely.
         */
        this.particles = [];
    }

    /**
     * Spawns a burst of generic physical debris suitable for explosions or rock crushing.
     */
    emitExplosion(x, y, color = '#f97316', count = 20, maxSpeed = 300) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * maxSpeed;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const lifeTracker = Math.random() * 0.5 + 0.2; // 0.2 to 0.7 seconds lifespan
            
            this.particles.push(new Particle(x, y, vx, vy, color, lifeTracker, 3));
        }
    }

    /**
     * Spawns localized directional plasma thruster emissions tapering out backwards.
     */
    emitThruster(x, y, angle = Math.PI, speedX = 400, color = '#38bdf8') {
        const spread = (Math.random() - 0.5) * 0.5; // rad angular spread
        const speed = Math.random() * 150 + speedX;
        const vx = Math.cos(angle + spread) * speed;
        const vy = Math.sin(angle + spread) * speed;
        
        // Very hot particles have short lifespans
        this.particles.push(new Particle(x, y, vx, vy, color, 0.2, 4, true)); // True = glowing
    }

    update(dt) {
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => p.life > 0);
    }

    draw(ctx) {
        // Optimizing standard rendering by bunching "screen" light blending operations
        // If we switch compositeOperations for every particle it is massively slow.
        
        ctx.save();
        // Separate out glowing from standard solid debris for render passes
        const glowers = this.particles.filter(p => p.glow);
        const solids = this.particles.filter(p => !p.glow);

        // Draw Solids (Rock Debris / Metals)
        solids.forEach(p => p.draw(ctx));

        // Draw Glowers (Plasma / Thrusters)
        ctx.globalCompositeOperation = 'screen';
        glowers.forEach(p => {
            // Apply intense dynamic lighting scaling
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            p.draw(ctx);
        });

        ctx.restore();
    }
}

/**
 * Highly optimized internal data structure class explicitly for handling micro particles.
 */
class Particle {
    constructor(x, y, vx, vy, color, maxLife, radius, glow = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = maxLife;
        this.maxLife = maxLife;
        this.radius = radius;
        this.glow = glow;
        
        // Simulate dragging physics strictly across velocity vectors over time
        this.friction = 0.95; 
    }

    update(dt) {
        // Decrease life timer mapped perfectly to CPU clock
        this.life -= dt;
        
        // Move particle
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Apply friction artificially scaling backwards against movement vector
        this.vx *= this.friction;
        this.vy *= this.friction;
    }

    draw(ctx) {
        const ratio = this.life / this.maxLife; // 1.0 down to 0.0
        
        // Fast alpha parse
        ctx.globalAlpha = Math.max(0, ratio);
        ctx.fillStyle = this.color;
        
        // Draw primitive rects for higher performance instead of perfect circles
        // For sub 4px limits, eyes cannot determine circles vs squares.
        ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2 * ratio, this.radius * 2 * ratio);
        
        ctx.globalAlpha = 1.0; 
    }
}
