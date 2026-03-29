import { generateAsteroidTexture } from './ProceduralTextures.js';

/**
 * Represents terrifying deep-space asteroid debris using highly realistic 
 * cached procedural textures (craters, rocks, lighting).
 */
export default class CelestialBody {
    constructor(canvasWidth, canvasHeight) {
        // Size variation for debris (40x40 to 120x120 bounding boxes)
        // Bigger for realistic feeling
        const size = Math.random() * 80 + 40;
        this.width = size;
        this.height = size;
        
        // Cache our procedural HD sprite directly mapped to this asteroids unique size footprint
        this.spriteTexture = generateAsteroidTexture(size);

        // Start off-screen right
        this.x = canvasWidth + this.width;
        
        const margin = 80;
        this.y = Math.random() * (canvasHeight - margin - this.height) + margin;
        
        this.speedX = Math.random() * 120 + 30; 
        
        this.angle = 0;
        this.spinSpeed = (Math.random() - 0.5) * 1.5; 
        
        this.markedForDeletion = false; 
        this.damage = 40; // Heavy hitting collisions
    }

    update(dt) {
        this.x -= this.speedX * dt;
        this.angle += this.spinSpeed * dt;
        
        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Set transform anchor center for physical rotation simulation
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        ctx.translate(centerX, centerY);
        ctx.rotate(this.angle);
        
        // We no longer draw raw primitive `.lineTo` paths! We render the highly detailed
        // cached off-screen canvas sprite. This brings O(n) rendering cost WAY down while maximizing fidelity.
        ctx.drawImage(this.spriteTexture, -(this.width / 2), -(this.height / 2));

        ctx.restore();
    }
}
