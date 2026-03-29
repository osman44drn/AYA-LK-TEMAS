/**
 * Upgraded projectiles focusing on neon glow and "Dynamic Lighting".
 */
export default class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 4;        
        this.width = this.radius * 2;
        this.height = this.radius * 2;
        this.speed = 1200; // Increased massively for highly responsive shooter feel

        this.markedForDeletion = false; 
    }

    update(dt, canvasWidth) {
        this.x += this.speed * dt;

        if (this.x - this.radius > canvasWidth) {
            this.markedForDeletion = true;
        }
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     * @param {ParticleSystem} particleSystem - Pass to allow trail emitting
     */
    draw(ctx, particleSystem) {
        // Emit a tiny blue/white glowing particle behind exactly where the bullet is right now 
        // every single frame it is travelling. This generates a plasma trail automatically.
        if (particleSystem && Math.random() > 0.5) {
            particleSystem.emitThruster(this.x, this.y, Math.PI, 100, '#a5f3fc');
        }

        ctx.save();
        
        // Dynamic Lighting effect setup using Screen composite ops and shadow spreading
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = '#f8fafc'; // White heat core
        ctx.shadowColor = '#22d3ee'; // Bright cyan glow cast onto asteroids nearby
        ctx.shadowBlur = 35; // Massive blur to "cast" light
        
        ctx.beginPath();
        // Morph the dot into a realistic elongated laser bolt moving rapidly horizontally
        ctx.ellipse(this.x, this.y, this.radius * 4, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        
        ctx.restore();
    }
}
