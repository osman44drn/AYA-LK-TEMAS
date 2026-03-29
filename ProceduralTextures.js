/**
 * Procedural Doku ve Sprite Üreticisi
 * 
 * Amaç: Dışarıdan PNG yüklemeden %100 saf kodla Canvas API üzerinden yüksek
 * çözünürlüklü ve son derece gerçekçi materyaller, uzay gemisi kaplamaları 
 * ve krater dokuları üretmek. Çalışma anında üretilip RAM'de önbelleklenir.
 */

// Genel yardımcı fonksiyon
function createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

/**
 * Derin, detaylı ve karanlık bir uzay nebulası dokusu üretir.
 * Arkaplanda Parallax katmanı olarak devasa boyutta çizilmesi içindir.
 * @returns {HTMLCanvasElement} Nebula sprite'ı (Örn: 800x800)
 */
export function generateNebulaTexture(width = 1000, height = 1000) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Siyah Zemin
    ctx.fillStyle = '#010205';
    ctx.fillRect(0, 0, width, height);

    // Composite operation 'lighter' kullanarak parlak galaktik toz bulutları oluşturma
    ctx.globalCompositeOperation = 'screen';

    // Rastgele 10-15 devasa radyal renk bombası (Nebula tozu)
    const numClouds = 15;
    for (let i = 0; i < numClouds; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 400 + 200;
        
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        
        // Rastgele koyu mavi, mor, hafif neon camgöbeği
        const colors = [
            `rgba(20, 10, 40, ${Math.random() * 0.4 + 0.1})`, // Derin Mor
            `rgba(5, 15, 30, ${Math.random() * 0.4 + 0.1})`,  // Derin Mavi
            `rgba(10, 30, 35, ${Math.random() * 0.3 + 0.1})`  // Koyu Camgöbeği
        ];
        const selectedColor = colors[Math.floor(Math.random() * colors.length)];

        grad.addColorStop(0, selectedColor);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Rastgele perlin gürültüsü benzeri statik toz (Noise)
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for(let i=0; i<data.length; i+=4) {
        if(Math.random() > 0.95) {
            const noise = Math.random() * 20;
            data[i] += noise;     // R
            data[i+1] += noise;   // G
            data[i+2] += noise;   // B
        }
    }
    ctx.putImageData(imgData, 0, 0);

    return canvas;
}

/**
 * Kraterli, çatlaklı pürüzlü göktaşı (Asteroid) sprite'ı üretir.
 * @returns {HTMLCanvasElement} Asteroid Texture
 */
export function generateAsteroidTexture(size = 100) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const radius = size / 2;
    const cx = size / 2;
    const cy = size / 2;

    // Kaba organik göktaşı silueti
    ctx.beginPath();
    const vertices = 12;
    const offsets = [];
    for (let i = 0; i < vertices; i++) {
        const angle = (i / vertices) * Math.PI * 2;
        // %70 ile %100 arası radius varyasyonu
        const r = radius * (0.7 + Math.random() * 0.3);
        offsets.push(r);
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.clip(); // Maske olarak kullan

    // Temel Koyu Kaya Rengi
    ctx.fillStyle = '#292524'; // Stone-800
    ctx.fillRect(0, 0, size, size);

    // Kaba Pürüzlü Noise Doku Yapısı
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.05)';
        ctx.fillRect(x, y, Math.random() * 3, Math.random() * 3);
    }

    // Gerçekçi Krater Gölgelendirmeleri
    const numCraters = Math.floor(Math.random() * 4) + 3;
    for (let i = 0; i < numCraters; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const cRadius = Math.random() * (size * 0.2) + 5;

        // Krater İçi (Karanlık)
        ctx.beginPath();
        ctx.arc(x, y, cRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fill();

        // Krater Dudağı Işıltsı (Sol üstten ışık vuruyor simülasyonu)
        ctx.beginPath();
        ctx.arc(x - 1, y - 1, cRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Krater Dudağı Gölgesi (Sağ alt)
        ctx.beginPath();
        ctx.arc(x + 1, y + 1, cRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // 3 Boyutlu Küre Gradient Gölgesi (Tüm taşa derinlik katar)
    const sphereGrad = ctx.createRadialGradient(cx - size*0.2, cy - size*0.2, 0, cx, cy, size);
    sphereGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
    sphereGrad.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.fillStyle = sphereGrad;
    ctx.fillRect(0, 0, size, size);

    return canvas;
}
