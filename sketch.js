// ============================================
// Generative Art Canvas - Kova Portfolio
// ============================================

// Global State
const state = {
    pattern: 'flow',
    palette: 'neon',
    speed: 1.0,
    complexity: 5,
    seed: Math.random() * 10000,
    colors: [],
    initialized: false
};

// Color Palettes
const palettes = {
    neon: ['#bf5af2', '#9b4dca', '#64ffda', '#ff6b9d', '#c084fc'],
    sunset: ['#ff6b35', '#f7931e', '#ffd23f', '#ff3864', '#ff9e00'],
    ocean: ['#0077b6', '#00b4d8', '#90e0ef', '#023e8a', '#48cae4'],
    forest: ['#2d6a4f', '#40916c', '#74c69d', '#95d5b2', '#b7e4c7']
};

// Pattern Instances
let flowField = null;
let geometric = null;
let particleSystem = null;

// DOM Elements
let sidebar, menuToggle, overlay;

// ============================================
// p5.js Main Functions
// ============================================

function setup() {
    const container = document.getElementById('canvas-container');
    const canvas = createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent('canvas-container');
    
    frameRate(60);
    colorMode(RGB, 255, 255, 255, 1);
    
    // Initialize DOM
    initializeControls();
    
    // Initialize patterns
    updateColors();
    initPattern();
    
    state.initialized = true;
}

function draw() {
    background(10, 10, 10);
    
    switch (state.pattern) {
        case 'flow':
            if (flowField) flowField.update();
            if (flowField) flowField.display();
            break;
        case 'geometric':
            if (geometric) geometric.update();
            if (geometric) geometric.display();
            break;
        case 'particles':
            if (particleSystem) particleSystem.update();
            if (particleSystem) particleSystem.display();
            break;
    }
}

function windowResized() {
    const container = document.getElementById('canvas-container');
    resizeCanvas(container.offsetWidth, container.offsetHeight);
    initPattern();
}

function mousePressed() {
    // Close mobile menu when clicking canvas
    if (sidebar && sidebar.classList.contains('open')) {
        closeMobileMenu();
        return;
    }
    
    // Interactive response on canvas click
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        addInteraction(mouseX, mouseY);
    }
}

// ============================================
// Control Panel Initialization
// ============================================

function initializeControls() {
    sidebar = document.getElementById('sidebar');
    menuToggle = document.getElementById('menu-toggle');
    overlay = document.getElementById('overlay');
    
    // Pattern Select
    const patternSelect = document.getElementById('pattern-select');
    patternSelect.addEventListener('change', (e) => {
        state.pattern = e.target.value;
        initPattern();
    });
    
    // Palette Select
    const paletteSelect = document.getElementById('palette-select');
    paletteSelect.addEventListener('change', (e) => {
        state.palette = e.target.value;
        updateColors();
        initPattern();
    });
    
    // Speed Slider
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    speedSlider.addEventListener('input', (e) => {
        state.speed = parseFloat(e.target.value);
        speedValue.textContent = state.speed.toFixed(1);
    });
    
    // Complexity Slider
    const complexitySlider = document.getElementById('complexity-slider');
    const complexityValue = document.getElementById('complexity-value');
    complexitySlider.addEventListener('input', (e) => {
        state.complexity = parseInt(e.target.value);
        complexityValue.textContent = state.complexity;
        initPattern();
    });
    
    // Randomize Button
    document.getElementById('randomize-btn').addEventListener('click', () => {
        state.seed = Math.random() * 10000;
        noiseSeed(state.seed);
        randomSeed(state.seed);
        initPattern();
    });
    
    // Save Button
    document.getElementById('save-btn').addEventListener('click', () => {
        saveCanvas('generative-art', 'png');
    });
    
    // Mobile Menu Toggle
    menuToggle.addEventListener('click', toggleMobileMenu);
    overlay.addEventListener('click', closeMobileMenu);
}

function toggleMobileMenu() {
    sidebar.classList.toggle('open');
    menuToggle.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeMobileMenu() {
    sidebar.classList.remove('open');
    menuToggle.classList.remove('active');
    overlay.classList.remove('active');
}

// ============================================
// Pattern Initialization
// ============================================

function updateColors() {
    state.colors = palettes[state.palette].map(hex => color(hex));
}

function initPattern() {
    noiseSeed(state.seed);
    randomSeed(state.seed);
    
    switch (state.pattern) {
        case 'flow':
            flowField = new FlowField();
            break;
        case 'geometric':
            geometric = new GeometricPattern();
            break;
        case 'particles':
            particleSystem = new ParticleSystem();
            break;
    }
}

function addInteraction(x, y) {
    switch (state.pattern) {
        case 'flow':
            if (flowField) flowField.addBurst(x, y);
            break;
        case 'geometric':
            if (geometric) geometric.pulse();
            break;
        case 'particles':
            if (particleSystem) particleSystem.addBurst(x, y);
            break;
    }
}

// ============================================
// Flow Field Pattern
// ============================================

class FlowField {
    constructor() {
        this.resolution = map(state.complexity, 1, 10, 40, 15);
        this.cols = ceil(width / this.resolution);
        this.rows = ceil(height / this.resolution);
        this.field = [];
        this.particles = [];
        this.zoff = 0;
        
        // Particle count based on complexity
        const particleCount = map(state.complexity, 1, 10, 300, 2000);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new FlowParticle());
        }
        
        this.generateField();
    }
    
    generateField() {
        this.field = [];
        let yoff = 0;
        for (let y = 0; y < this.rows; y++) {
            let xoff = 0;
            for (let x = 0; x < this.cols; x++) {
                const angle = noise(xoff, yoff, this.zoff) * TWO_PI * 2;
                this.field.push(p5.Vector.fromAngle(angle));
                xoff += 0.1;
            }
            yoff += 0.1;
        }
    }
    
    update() {
        this.zoff += 0.002 * state.speed;
        
        // Only regenerate field every 3 frames for performance
        if (frameCount % 3 === 0) {
            this.generateField();
        }
        
        for (const p of this.particles) {
            p.follow(this);
            p.update();
            p.edges();
        }
    }
    
    display() {
        for (const p of this.particles) {
            p.display();
        }
    }
    
    addBurst(x, y) {
        for (let i = 0; i < 50; i++) {
            const p = new FlowParticle();
            p.pos.set(x, y);
            p.vel = p5.Vector.random2D().mult(random(2, 5));
            this.particles.push(p);
        }
        // Keep particle count manageable
        while (this.particles.length > 3000) {
            this.particles.shift();
        }
    }
}

class FlowParticle {
    constructor() {
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.maxSpeed = 4;
        this.prevPos = this.pos.copy();
        this.color = random(state.colors);
        this.alpha = random(0.3, 0.8);
    }
    
    follow(flowField) {
        const x = floor(this.pos.x / flowField.resolution);
        const y = floor(this.pos.y / flowField.resolution);
        const index = x + y * flowField.cols;
        
        if (index >= 0 && index < flowField.field.length) {
            const force = flowField.field[index].copy();
            force.mult(0.5);
            this.applyForce(force);
        }
    }
    
    applyForce(force) {
        this.acc.add(force);
    }
    
    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed * state.speed);
        this.prevPos = this.pos.copy();
        this.pos.add(this.vel);
        this.acc.mult(0);
    }
    
    edges() {
        if (this.pos.x > width) { this.pos.x = 0; this.prevPos.x = 0; }
        if (this.pos.x < 0) { this.pos.x = width; this.prevPos.x = width; }
        if (this.pos.y > height) { this.pos.y = 0; this.prevPos.y = 0; }
        if (this.pos.y < 0) { this.pos.y = height; this.prevPos.y = height; }
    }
    
    display() {
        const c = this.color;
        stroke(red(c), green(c), blue(c), this.alpha);
        strokeWeight(1);
        line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);
    }
}

// ============================================
// Geometric Pattern
// ============================================

class GeometricPattern {
    constructor() {
        this.shapes = [];
        this.rotation = 0;
        this.pulseScale = 1;
        this.pulseDir = 0;
        
        const layerCount = map(state.complexity, 1, 10, 3, 12);
        const shapesPerLayer = map(state.complexity, 1, 10, 4, 16);
        
        for (let layer = 0; layer < layerCount; layer++) {
            const radius = map(layer, 0, layerCount - 1, 50, min(width, height) * 0.45);
            const sides = floor(random(3, 8));
            const rotationSpeed = random(-0.02, 0.02);
            const colorIndex = layer % state.colors.length;
            
            this.shapes.push({
                radius,
                sides,
                rotationSpeed,
                rotation: random(TWO_PI),
                color: state.colors[colorIndex],
                count: floor(shapesPerLayer),
                alpha: map(layer, 0, layerCount - 1, 0.8, 0.3)
            });
        }
    }
    
    update() {
        this.rotation += 0.01 * state.speed;
        
        // Pulse decay
        if (this.pulseDir !== 0) {
            this.pulseScale += this.pulseDir * 0.02;
            if (this.pulseScale > 1.15) this.pulseDir = -1;
            if (this.pulseScale <= 1) {
                this.pulseScale = 1;
                this.pulseDir = 0;
            }
        }
        
        for (const shape of this.shapes) {
            shape.rotation += shape.rotationSpeed * state.speed;
        }
    }
    
    display() {
        push();
        translate(width / 2, height / 2);
        scale(this.pulseScale);
        rotate(this.rotation);
        
        // Draw from back to front
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            this.drawShapeLayer(shape);
        }
        
        pop();
    }
    
    drawShapeLayer(shape) {
        push();
        rotate(shape.rotation);
        
        const c = shape.color;
        
        for (let i = 0; i < shape.count; i++) {
            const angle = (TWO_PI / shape.count) * i;
            
            push();
            rotate(angle);
            translate(shape.radius * 0.5, 0);
            
            // Glow effect
            drawingContext.shadowBlur = 15;
            drawingContext.shadowColor = c.toString();
            
            stroke(red(c), green(c), blue(c), shape.alpha);
            strokeWeight(2);
            noFill();
            
            this.drawPolygon(0, 0, shape.radius * 0.3, shape.sides);
            
            // Lines to center
            stroke(red(c), green(c), blue(c), shape.alpha * 0.5);
            strokeWeight(1);
            line(0, 0, -shape.radius * 0.4, 0);
            
            pop();
        }
        
        pop();
    }
    
    drawPolygon(x, y, radius, sides) {
        beginShape();
        for (let i = 0; i < sides; i++) {
            const angle = (TWO_PI / sides) * i - HALF_PI;
            vertex(x + cos(angle) * radius, y + sin(angle) * radius);
        }
        endShape(CLOSE);
    }
    
    pulse() {
        this.pulseDir = 1;
    }
}

// ============================================
// Particle System Pattern
// ============================================

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxDistSquared = 100 * 100; // Pre-compute squared distance threshold
        const count = map(state.complexity, 1, 10, 50, 400);
        
        for (let i = 0; i < count; i++) {
            this.particles.push(new PhysicsParticle());
        }
    }
    
    update() {
        for (const p of this.particles) {
            p.update();
            p.edges();
        }
        
        // Simple attraction between nearby particles
        if (state.complexity > 5) {
            this.applyConnections();
        }
    }
    
    applyConnections() {
        // Use squared distance to avoid expensive sqrt operations
        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p2.pos.x - p1.pos.x;
                const dy = p2.pos.y - p1.pos.y;
                const d2 = dx * dx + dy * dy;
                
                if (d2 < this.maxDistSquared) {
                    // Use sqrt only when we need to draw (for alpha mapping)
                    const d = Math.sqrt(d2);
                    const alpha = map(d, 0, 100, 0.3, 0);
                    const c = p1.color;
                    stroke(red(c), green(c), blue(c), alpha);
                    strokeWeight(0.5);
                    line(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y);
                }
            }
        }
    }
    
    display() {
        for (const p of this.particles) {
            p.display();
        }
    }
    
    addBurst(x, y) {
        for (let i = 0; i < 20; i++) {
            const p = new PhysicsParticle();
            p.pos.set(x, y);
            p.vel = p5.Vector.random2D().mult(random(3, 8));
            this.particles.push(p);
        }
        // Keep particle count manageable
        while (this.particles.length > 600) {
            this.particles.shift();
        }
    }
}

class PhysicsParticle {
    constructor() {
        this.pos = createVector(random(width), random(height));
        this.vel = p5.Vector.random2D().mult(random(0.5, 2));
        this.acc = createVector(0, 0);
        this.size = random(3, 12);
        this.color = random(state.colors);
        this.glowSize = this.size * 3;
        this.friction = 0.99;
        this.maxSpeed = 5;
    }
    
    applyForce(force) {
        this.acc.add(force);
    }
    
    update() {
        // Add slight random movement
        const jitter = p5.Vector.random2D().mult(0.1 * state.speed);
        this.applyForce(jitter);
        
        this.vel.add(this.acc);
        this.vel.mult(this.friction);
        this.vel.limit(this.maxSpeed * state.speed);
        this.pos.add(this.vel.copy().mult(state.speed));
        this.acc.mult(0);
    }
    
    edges() {
        // Bounce off edges
        if (this.pos.x < this.size) {
            this.pos.x = this.size;
            this.vel.x *= -0.8;
        }
        if (this.pos.x > width - this.size) {
            this.pos.x = width - this.size;
            this.vel.x *= -0.8;
        }
        if (this.pos.y < this.size) {
            this.pos.y = this.size;
            this.vel.y *= -0.8;
        }
        if (this.pos.y > height - this.size) {
            this.pos.y = height - this.size;
            this.vel.y *= -0.8;
        }
    }
    
    display() {
        const c = this.color;
        
        // Glow effect using shadow
        push();
        drawingContext.shadowBlur = this.glowSize;
        drawingContext.shadowColor = c.toString();
        
        noStroke();
        fill(red(c), green(c), blue(c), 0.9);
        ellipse(this.pos.x, this.pos.y, this.size);
        
        // Inner bright core
        fill(255, 255, 255, 0.8);
        ellipse(this.pos.x, this.pos.y, this.size * 0.3);
        
        pop();
    }
}
