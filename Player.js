import Projectile from './Projectile.js';

/**
 * Handles the main interceptor spacecraft controllable by the user.
 * Features heavy metallic gradients and hooks into the Game's particle system
 * to emit realistic plasma thrust trails visually.
 */
export default class Player {
    constructor(canvasWidth, canvasHeight) {
        this.gameWidth = canvasWidth;
        this.gameHeight = canvasHeight;
        
        // Adjusted slightly for a sleeker footprint
        this.width = 65;
        this.height = 35;
        this.x = 50; 
        this.y = 80 + (this.gameHeight - 80) / 2 - this.height / 2;
        
        this.speedLimit = 400; 
        this.maxHp = 100;
        this.hp = this.maxHp;
        
        this.fireCooldown = 150; 
        this.fireTimer = 0;
        
        // Banking aesthetics logic
        this.bankAngle = 0;
        this.targetBankAngle = 0;
    }

    update(input, dt, projectiles, particleSystem) {
        let vx = 0;
        let vy = 0;
        this.targetBankAngle = 0; // Reset expected bank

        if (input.isPressed('w') || input.isPressed('arrowup')) {
            vy -= this.speedLimit;
            this.targetBankAngle = -0.15; // Pitch up slightly
        }
        if (input.isPressed('s') || input.isPressed('arrowdown')) {
            vy += this.speedLimit;
            this.targetBankAngle = 0.15; // Pitch down slightly
        }
        if (input.isPressed('a') || input.isPressed('arrowleft')) vx -= this.speedLimit;
        if (input.isPressed('d') || input.isPressed('arrowright')) vx += this.speedLimit;
        
        // Smoothly interpolate current bank towards target
        this.bankAngle += (this.targetBankAngle - this.bankAngle) * dt * 10;
        
        // Diagonal normalization
        if (vx !== 0 && vy !== 0) {
            const length = Math.sqrt(vx * vx + vy * vy);
            vx = (vx / length) * this.speedLimit;
            vy = (vy / length) * this.speedLimit;
        }

        this.x += vx * dt;
        this.y += vy * dt;
        
        // Emit engine particles consistently (idle thrust)
        // If moving forward (+vx), emit more violently
        const engineOutput = (vx > 0) ? 600 : 300;
        // The engine nozzle is located left center
        particleSystem.emitThruster(this.x, this.y + this.height / 2, Math.PI, engineOutput, '#38bdf8');
        // Secondary thruster port
        particleSystem.emitThruster(this.x + 10, this.y + this.height * 0.2, Math.PI + 0.2, engineOutput * 0.5, '#0ea5e9');
        particleSystem.emitThruster(this.x + 10, this.y + this.height * 0.8, Math.PI - 0.2, engineOutput * 0.5, '#0ea5e9');

        // Bounds checking
        if (this.x < 0) this.x = 0;
        // Keep from clipping completely behind HUD UI 
        if (this.y < 80) this.y = 80; 
        if (this.x > this.gameWidth - this.width) this.x = this.gameWidth - this.width;
        if (this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height;

        // Weapons Handling
        if (this.fireTimer < this.fireCooldown) {
            this.fireTimer += dt * 1000;
        }

        if (input.isPressed(' ') && this.fireTimer >= this.fireCooldown) {
            // Spawn Projectile at tip of wing cannons
            projectiles.push(new Projectile(this.x + this.width, this.y + this.height / 2));
            
            // Recoil/Muzzle flash effect at cannon tips
            particleSystem.emitExplosion(this.x + this.width, this.y + this.height / 2, '#4ade80', 5, 100);
            
            this.fireTimer = 0; 
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Translate to center to allow banking rotations based on Y movement
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.bankAngle);
        ctx.translate(-(this.width / 2), -(this.height / 2));
        
        // -----------------------------------------------------------
        // High-Fidelity Interceptor Vector Drafting
        // -----------------------------------------------------------
        
        // Central Hull (Dark Metallic Grey)
        const hullGrad = ctx.createLinearGradient(0, 0, this.width, this.height);
        hullGrad.addColorStop(0, '#64748b'); // Slate 500
        hullGrad.addColorStop(0.5, '#334155'); // Slate 700
        hullGrad.addColorStop(1, '#0f172a'); // Slate 900
        
        ctx.fillStyle = hullGrad;
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.5;
        
        // Draw stealth-bomber inspired sleek geometry
        ctx.beginPath();
        // Nose
        ctx.moveTo(this.width, this.height / 2);
        // Top cowl
        ctx.lineTo(this.width * 0.6, this.height * 0.1);
        ctx.lineTo(this.width * 0.3, this.height * 0.2);
        // Back top engine intake
        ctx.lineTo(0, this.height * 0.1);
        // Mid Engine block tail
        ctx.lineTo(this.width * 0.1, this.height / 2);
        // Back bottom engine intake
        ctx.lineTo(0, this.height * 0.9);
        // Bottom cowl
        ctx.lineTo(this.width * 0.3, this.height * 0.8);
        ctx.lineTo(this.width * 0.6, this.height * 0.9);
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();

        // Cockpit Glass (Holographic Gold/Orange visor-style)
        const glassGrad = ctx.createLinearGradient(this.width * 0.4, 0, this.width * 0.7, this.height);
        glassGrad.addColorStop(0, '#fcd34d');
        glassGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = glassGrad;
        
        ctx.beginPath();
        ctx.moveTo(this.width * 0.75, this.height / 2);
        ctx.lineTo(this.width * 0.5, this.height * 0.25);
        ctx.lineTo(this.width * 0.35, this.height / 2);
        ctx.lineTo(this.width * 0.5, this.height * 0.75);
        ctx.fill();

        // Engine Thruster Glow Caps
        ctx.fillStyle = '#bae6fd'; // Bright white/blue
        ctx.shadowColor = '#0ea5e9';
        ctx.shadowBlur = 15;
        ctx.fillRect(-2, this.height / 2 - 4, 6, 8); // main exhaust
        ctx.shadowBlur = 0; // reset
        
        // Hull details / Panel lines (simulating textures)
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.width * 0.2, this.height * 0.2);
        ctx.lineTo(this.width * 0.2, this.height * 0.8);
        ctx.stroke();

        ctx.restore();
    }
}
