/**
 * Enemy class shifted to render complex, glowing mechanical sci-fi drones and interceptors.
 */
export default class EnemyShip {
    constructor(canvasWidth, canvasHeight) {
        this.width = 75;
        this.height = 55;

        this.x = canvasWidth + this.width;
        
        // Ensure UI overlay margin
        const hMargin = 100;
        this.y = Math.random() * (canvasHeight - hMargin - this.height) + hMargin;
        
        // Slower, bulkier movement to allow player to aim accurately
        this.speedX = Math.random() * 80 + 70; 
        
        // Sway drift mapping
        this.driftSeed = Math.random() * Math.PI * 2;
        this.driftSpeed = Math.random() * 2 + 1;
        this.baseY = this.y;
        
        this.hp = 3; // Metallic armor makes them tankier
        this.markedForDeletion = false; 
    }

    /**
     * @param {number} dt 
     * @param {number} canvasHeight 
     */
    update(dt, canvasHeight) {
        this.x -= this.speedX * dt;
        
        // Sine wave procedural vertical drifting (Organic sci-fi drone search pattern hover)
        this.driftSeed += this.driftSpeed * dt;
        this.y = this.baseY + Math.sin(this.driftSeed) * 30;

        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }

    /**
     * Draw heavy futuristic geometry featuring glowing core drives.
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Mechanical Wings Design Outline
        ctx.fillStyle = '#1e293b'; // Slate dark blue
        ctx.strokeStyle = '#475569'; // Slate trim
        ctx.lineWidth = 2;
        
        // Top Wing geometry
        ctx.beginPath();
        ctx.moveTo(this.width, this.height * 0.4);
        ctx.lineTo(this.width * 0.4, 0);
        ctx.lineTo(0, this.height * 0.2);
        ctx.lineTo(this.width * 0.8, this.height * 0.4);
        ctx.fill();
        ctx.stroke();

        // Bottom Wing geometry
        ctx.beginPath();
        ctx.moveTo(this.width, this.height * 0.6);
        ctx.lineTo(this.width * 0.4, this.height);
        ctx.lineTo(0, this.height * 0.8);
        ctx.lineTo(this.width * 0.8, this.height * 0.6);
        ctx.fill();
        ctx.stroke();

        // Glowing Internal Antimatter Core Matrix
        ctx.fillStyle = '#10b981'; // Alien Emerald green
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 20;

        ctx.beginPath();
        // The core acts as the physical visual center mass
        ctx.arc(this.width * 0.6, this.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset shadow early
        ctx.shadowBlur = 0;

        // Front Cockpit / Sensor Array paneling
        ctx.fillStyle = '#ef4444'; // Threat sensor coloring (Red)
        ctx.beginPath();
        ctx.fillRect(0, this.height * 0.4, 15, this.height * 0.2);

        // Aft thrusters
        ctx.fillStyle = '#f59e0b'; // Amber yellow
        ctx.fillRect(this.width - 5, this.height * 0.2, 5, 8);
        ctx.fillRect(this.width - 5, this.height * 0.8 - 8, 5, 8);

        ctx.restore();
    }
}
