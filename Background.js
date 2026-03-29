import { generateNebulaTexture } from './ProceduralTextures.js';

/**
 * Manages the parallax background, drawing sparse stars, procedural HD nebula, and comet.
 */
export default class Background {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;

        // Cache the massive high-resolution nebula sprite on boot
        // We draw it significantly larger than the screen so we can pan/parallax it slowly
        this.nebulaWidth = this.width * 1.5;
        this.nebulaHeight = this.height * 1.5;
        this.nebulaCanvas = generateNebulaTexture(this.nebulaWidth, this.nebulaHeight);

        // Parallax position for the main nebula
        this.nebulaX = 0;
        this.nebulaSpeed = 10; // Very slow panning

        // Pre-generate static stars
        this.stars = [];
        const numStars = 150; // Increased density for realistic depth
        for (let i = 0; i < numStars; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 1.5 + 0.5,
                baseAlpha: Math.random() * 0.5 + 0.3,
                twinkleSpeed: Math.random() * 2 + 0.5,
                parallaxFactor: Math.random() * 0.5 + 0.1 // Distance scalar
            });
        }

        // Comet State properties
        this.comet = {
            active: false,
            x: 0,
            y: 0,
            speedX: 600,
            speedY: 200,
            length: 250,
            timer: 0,
            interval: Math.random() * 5000 + 4000
        };
    }

    update(dt) {
        // Scroll the deep nebula background slightly to give feeling of movement
        this.nebulaX -= this.nebulaSpeed * dt;
        if (this.nebulaX <= -(this.nebulaWidth - this.width)) {
            this.nebulaX = 0; // Reset Seamlessly or just pan to edge (we'll just let it loop arbitrarily)
        }

        // Move stars based on parallax distance factor
        this.stars.forEach(star => {
            star.x -= (this.nebulaSpeed * 3 * star.parallaxFactor) * dt;
            if (star.x < 0) {
                star.x = this.width;
                star.y = Math.random() * this.height;
            }
        });

        // Comet logic
        if (!this.comet.active) {
            this.comet.timer += dt * 1000;
            if (this.comet.timer > this.comet.interval) {
                this.spawnComet();
            }
        } else {
            this.comet.x -= this.comet.speedX * dt;
            this.comet.y += this.comet.speedY * dt;
            if (this.comet.x + this.comet.length < 0 || this.comet.y - this.comet.length > this.height) {
                this.comet.active = false;
                this.comet.timer = 0;
                this.comet.interval = Math.random() * 8000 + 5000;
            }
        }
    }

    spawnComet() {
        this.comet.active = true;
        this.comet.x = this.width + this.comet.length;
        this.comet.y = Math.random() * (this.height / 2) - 100;
    }

    draw(ctx, timestamp) {
        ctx.save();

        // 1. Draw deepest layer (High-Res Procedural Nebula)
        // This completely replaces the default gradient background
        ctx.drawImage(this.nebulaCanvas, this.nebulaX, 0);

        // 2. Draw starfield
        this.stars.forEach(star => {
            const currentAlpha = star.baseAlpha + Math.sin(timestamp / 1000 * star.twinkleSpeed) * 0.2;

            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, currentAlpha)})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // 3. Draw realistic majestic Comet
        if (this.comet.active) {
            // Dual Tail: Ion (Blue) and Dust (White/Yellow)

            // Ion Tail (Straight, intense, blue)
            const ionGrad = ctx.createLinearGradient(
                this.comet.x, this.comet.y,
                this.comet.x + this.comet.length * 1.2, this.comet.y - this.comet.length * 0.2
            );
            ionGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
            ionGrad.addColorStop(0.1, "rgba(56, 189, 248, 0.9)");
            ionGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

            ctx.fillStyle = ionGrad;
            ctx.globalCompositeOperation = 'screen';
            ctx.beginPath();
            ctx.moveTo(this.comet.x, this.comet.y);
            ctx.lineTo(this.comet.x + this.comet.length * 1.2, this.comet.y - this.comet.length * 0.25);
            ctx.lineTo(this.comet.x + this.comet.length * 1.2, this.comet.y - this.comet.length * 0.15);
            ctx.fill();

            // Dust Tail (Curving, wider, whiteish)
            ctx.globalCompositeOperation = 'source-over';
            const dustGrad = ctx.createLinearGradient(
                this.comet.x, this.comet.y,
                this.comet.x + this.comet.length, this.comet.y - this.comet.length * 0.4
            );
            dustGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
            dustGrad.addColorStop(0.3, "rgba(253, 224, 71, 0.4)"); // Pale Yellow
            dustGrad.addColorStop(1, "rgba(253, 224, 71, 0)");

            ctx.fillStyle = dustGrad;
            ctx.beginPath();
            ctx.moveTo(this.comet.x, this.comet.y);
            ctx.quadraticCurveTo(this.comet.x + 30, this.comet.y + 15, this.comet.x + this.comet.length, this.comet.y - this.comet.length * 0.4);
            ctx.quadraticCurveTo(this.comet.x + 10, this.comet.y - 30, this.comet.x, this.comet.y);
            ctx.fill();

            // Comet Head (Solid Rocky Nucleus core)
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(this.comet.x, this.comet.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        }

        ctx.restore();
    }
}
