export default class ForestChaseGame {
  constructor(container, options = {}) {
    if (!container) throw new Error('ForestChaseGame needs a container element.');

    this.container = container;
    this.options = options;
    this.levelDuration = options.levelDuration ?? 60;
    this.level = 1;
    this.running = false;
    this.ended = false;
    this.keys = new Set();
    this.lastTime = 0;
    this.elapsed = 0;
    this.animationFrame = null;
    this.arrows = [];
    this.resizeObserver = new ResizeObserver(() => this.resize());

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'forest-chase-canvas';
    this.canvas.setAttribute('aria-label', 'Forest chase game');
    this.context = this.canvas.getContext('2d');
    this.container.replaceChildren(this.canvas);
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.background = '#17382b';

    this.player = { x: 0, y: 0, radius: 16, speed: 235 };
    this.fox = { x: 0, y: 0, radius: 24, speed: 300, angle: 0, hitbox: 22 };

    this.handleKeyDown = (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'r', 'R'].includes(event.key)) {
        event.preventDefault();
      }
      if (event.key.toLowerCase() === 'r' && this.ended) {
        this.start();
        return;
      }
      this.keys.add(event.key.toLowerCase());
    };
    this.handleKeyUp = (event) => this.keys.delete(event.key.toLowerCase());

    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    window.addEventListener('keyup', this.handleKeyUp);
    this.resizeObserver.observe(this.container);
    this.resize();
  }

  start() {
    this.level = 1;
    this.running = true;
    this.ended = false;
    this.elapsed = 0;
    this.arrows = [];
    this.resetRound();
    this.lastTime = performance.now();
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame((time) => this.tick(time));
  }

  resetRound() {
    const padding = 70;
    this.player.x = this.viewWidth * 0.2;
    this.player.y = this.playTop + (this.playHeight * 0.58);
    this.fox.x = this.viewWidth * 0.78;
    this.fox.y = this.playTop + (this.playHeight * 0.58);
    this.fox.radius = this.level === 2 ? 30 : 24;
    this.fox.hitbox = this.level === 2 ? 34 : 22;
    this.fox.speed = this.randomSpeed();
    this.fox.angle = this.randomAngle();
    this.player.x = Math.max(padding, Math.min(this.viewWidth - padding, this.player.x));
    this.player.y = Math.max(this.playTop + padding, Math.min(this.viewHeight - padding, this.player.y));
    this.levelStartedAt = performance.now();
  }

  resize() {
    const width = Math.max(320, this.container.clientWidth || 800);
    const height = Math.max(260, this.container.clientHeight || 520);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = width * ratio;
    this.canvas.height = height * ratio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.viewWidth = width;
    this.viewHeight = height;
    this.hudHeight = 90;
    this.playTop = this.hudHeight;
    this.playHeight = Math.max(170, height - this.hudHeight);
  }

  tick(time) {
    if (!this.running) return;
    const delta = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.update(delta);
    this.draw();
    if (this.running) this.animationFrame = requestAnimationFrame((next) => this.tick(next));
  }

  update(delta) {
    this.elapsed += delta;
    const direction = {
      x: Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft')),
      y: Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup'))
    };
    const length = Math.hypot(direction.x, direction.y) || 1;
    this.player.x += (direction.x / length) * this.player.speed * delta;
    this.player.y += (direction.y / length) * this.player.speed * delta;
    this.player.x = Math.max(this.player.radius, Math.min(this.viewWidth - this.player.radius, this.player.x));
    this.player.y = Math.max(this.playTop + this.player.radius, Math.min(this.viewHeight - this.player.radius, this.player.y));

    this.fox.x += Math.cos(this.fox.angle) * this.fox.speed * delta;
    this.fox.y += Math.sin(this.fox.angle) * this.fox.speed * delta;
    if (this.fox.x < this.fox.radius || this.fox.x > this.viewWidth - this.fox.radius) {
      this.fox.x = Math.max(this.fox.radius, Math.min(this.viewWidth - this.fox.radius, this.fox.x));
      this.bounceFox('x');
    }
    if (this.fox.y < this.playTop + this.fox.radius || this.fox.y > this.viewHeight - this.fox.radius) {
      this.fox.y = Math.max(this.playTop + this.fox.radius, Math.min(this.viewHeight - this.fox.radius, this.fox.y));
      this.bounceFox('y');
    }

    if (this.level === 2) this.updateArrows(delta);
    if (Math.hypot(this.player.x - this.fox.x, this.player.y - this.fox.y) < this.player.radius + this.fox.hitbox) {
      this.end(false, 'The fox caught you.');
      return;
    }
    if (this.elapsed >= this.levelDuration) {
      if (this.level === 1) {
        this.level = 2;
        this.elapsed = 0;
        this.arrows = [];
        this.resetRound();
      } else {
        this.end(true, 'You escaped the forest!');
      }
    }
  }

  bounceFox(axis) {
    const reflected = axis === 'x' ? Math.PI - this.fox.angle : -this.fox.angle;
    this.fox.angle = reflected + (Math.random() - 0.5) * 1.25;
    this.fox.speed = this.randomSpeed();
  }

  randomAngle() {
    return Math.random() * Math.PI * 2;
  }

  randomSpeed() {
    return this.level === 2 ? 345 + Math.random() * 85 : 285 + Math.random() * 75;
  }

  updateArrows(delta) {
    if (Math.floor(this.elapsed * 2) !== Math.floor((this.elapsed - delta) * 2)) {
      const angle = Math.atan2(this.player.y - this.fox.y, this.player.x - this.fox.x);
      this.arrows.push({ x: this.fox.x, y: this.fox.y, angle, speed: 260 });
    }
    this.arrows = this.arrows.filter((arrow) => {
      arrow.x += Math.cos(arrow.angle) * arrow.speed * delta;
      arrow.y += Math.sin(arrow.angle) * arrow.speed * delta;
      const hit = Math.hypot(arrow.x - this.player.x, arrow.y - this.player.y) < this.player.radius + 7;
      if (hit) this.end(false, 'A hunter arrow found you.');
      return !hit && arrow.x > -20 && arrow.x < this.viewWidth + 20 && arrow.y > this.playTop - 20 && arrow.y < this.viewHeight + 20;
    });
  }

  draw() {
    const context = this.context;
    context.clearRect(0, 0, this.viewWidth, this.viewHeight);
    this.drawForest(context);
    this.arrows.forEach((arrow) => this.drawArrow(context, arrow));
    this.drawHuman(context, this.player.x, this.player.y);
    this.drawFox(context, this.fox.x, this.fox.y);
    this.drawHud(context);
    if (this.ended) this.drawEndScreen(context);
  }

  drawForest(context) {
    context.fillStyle = '#08131b';
    context.fillRect(0, 0, this.viewWidth, this.hudHeight);
    const gradient = context.createLinearGradient(0, 0, 0, this.viewHeight);
    gradient.addColorStop(0, '#0c1d29');
    gradient.addColorStop(0.52, '#163b3c');
    gradient.addColorStop(1, '#172d25');
    context.fillStyle = gradient;
    context.fillRect(0, this.playTop, this.viewWidth, this.playHeight);

    context.fillStyle = '#f4f0c7';
    context.beginPath();
    context.arc(this.viewWidth * 0.78, this.playTop + 105, 41, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(244, 240, 199, 0.12)';
    context.beginPath();
    context.arc(this.viewWidth * 0.78, this.playTop + 105, 115, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#a2ad85';
    for (let index = 0; index < 34; index += 1) {
      const x = (index * 137 + 48) % this.viewWidth;
      const y = this.playTop + ((index * 83 + 22) % Math.max(40, this.playHeight - 80));
      context.fillRect(x, y, 3, 3);
    }

    for (let index = 0; index < 25; index += 1) {
      const x = (index * 97 + 20) % this.viewWidth;
      const y = this.playTop + 120 + ((index * 53 + 35) % Math.max(40, this.playHeight - 150));
      const size = 22 + (index % 4) * 8;
      context.fillStyle = index % 2 ? '#173936' : '#205044';
      context.fillRect(x - 5, y + size * 0.4, 10, size * 1.6);
      context.beginPath();
      context.moveTo(x, y - size);
      context.lineTo(x - size, y + size);
      context.lineTo(x + size, y + size);
      context.closePath();
      context.fill();
    }

    context.fillStyle = 'rgba(32, 52, 39, 0.9)';
    context.fillRect(0, this.viewHeight - 210, this.viewWidth, 210);
    this.drawLog(context, this.viewWidth * 0.55, this.playTop + 220, -0.2);
    this.drawLog(context, this.viewWidth * 0.78, this.viewHeight - 145, -0.18);
    this.drawRock(context, this.viewWidth * 0.42, this.viewHeight - 120, 25);
    this.drawRock(context, this.viewWidth * 0.15, this.viewHeight - 70, 18);
    for (let index = 0; index < 16; index += 1) {
      const x = (index * 89 + 33) % this.viewWidth;
      const y = this.playTop + 130 + ((index * 47) % Math.max(50, this.playHeight - 170));
      context.fillStyle = '#d6df82';
      context.globalAlpha = 0.75;
      context.beginPath(); context.arc(x, y, 3, 0, Math.PI * 2); context.fill();
      context.globalAlpha = 1;
    }
  }

  drawLog(context, x, y, angle) {
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.fillStyle = '#653c2d';
    context.fillRect(-56, -12, 112, 24);
    context.fillStyle = '#aa7b4e';
    context.beginPath(); context.arc(-56, 0, 13, 0, Math.PI * 2); context.fill();
    context.strokeStyle = '#765035';
    context.lineWidth = 3;
    context.beginPath(); context.arc(-56, 0, 7, 0, Math.PI * 2); context.stroke();
    context.fillStyle = '#77a05b';
    context.beginPath(); context.arc(8, -18, 10, 0, Math.PI * 2); context.arc(30, -18, 9, 0, Math.PI * 2); context.fill();
    context.restore();
  }

  drawRock(context, x, y, size) {
    context.fillStyle = '#26352e';
    context.beginPath();
    context.moveTo(x - size, y + size); context.lineTo(x - size * 0.55, y - size);
    context.lineTo(x + size * 0.55, y - size * 1.25); context.lineTo(x + size, y + size);
    context.closePath(); context.fill();
    context.fillStyle = '#68715e';
    context.beginPath(); context.moveTo(x - size * 0.55, y - size); context.lineTo(x + size * 0.55, y - size * 1.25); context.lineTo(x + size * 0.2, y - size * 0.2); context.closePath(); context.fill();
  }

  drawHuman(context, x, y) {
    context.save();
    context.translate(x, y);
    context.fillStyle = '#e7b98a';
    context.beginPath();
    context.arc(0, -18, 8, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#315a75';
    context.fillRect(-10, -10, 20, 25);
    context.strokeStyle = '#e7b98a';
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(-7, 14); context.lineTo(-13, 30);
    context.moveTo(7, 14); context.lineTo(13, 30);
    context.moveTo(-8, -5); context.lineTo(-19, 7);
    context.moveTo(8, -5); context.lineTo(19, 7);
    context.stroke();
    context.restore();
  }

  drawFox(context, x, y) {
    context.save();
    context.translate(x, y);
    context.rotate(this.fox.angle);
    context.fillStyle = '#c45b2f';
    context.beginPath();
    context.ellipse(0, 0, this.fox.radius * 1.25, this.fox.radius * 0.75, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#f2c39b';
    context.beginPath();
    context.arc(this.fox.radius * 0.8, 0, this.fox.radius * 0.58, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#c45b2f';
    context.beginPath();
    context.moveTo(this.fox.radius * 0.55, -this.fox.radius * 0.35);
    context.lineTo(this.fox.radius * 0.8, -this.fox.radius * 1.05);
    context.lineTo(this.fox.radius * 1.1, -this.fox.radius * 0.25);
    context.moveTo(this.fox.radius * 0.55, this.fox.radius * 0.35);
    context.lineTo(this.fox.radius * 0.8, this.fox.radius * 1.05);
    context.lineTo(this.fox.radius * 1.1, this.fox.radius * 0.25);
    context.fill();
    if (this.level === 2) {
      context.strokeStyle = '#7b321e';
      context.lineWidth = 9;
      context.beginPath();
      context.moveTo(-this.fox.radius * 0.45, -this.fox.radius * 0.45);
      context.lineTo(-this.fox.radius * 1.1, -this.fox.radius * 0.95);
      context.moveTo(-this.fox.radius * 0.45, this.fox.radius * 0.45);
      context.lineTo(-this.fox.radius * 1.1, this.fox.radius * 0.95);
      context.stroke();
    }
    context.restore();
  }

  drawArrow(context, arrow) {
    context.save();
    context.translate(arrow.x, arrow.y);
    context.rotate(arrow.angle);
    context.strokeStyle = '#ead7a3';
    context.lineWidth = 3;
    context.beginPath(); context.moveTo(-12, 0); context.lineTo(12, 0); context.stroke();
    context.fillStyle = '#8d2f25';
    context.beginPath(); context.moveTo(12, 0); context.lineTo(5, -5); context.lineTo(5, 5); context.fill();
    context.restore();
  }

  drawHud(context) {
    context.fillStyle = '#d8ef84';
    context.font = 'bold 14px monospace';
    context.fillText('LEVEL', 16, 28); context.fillText('TIME', 135, 28); context.fillText('BEST', 280, 28);
    context.font = 'bold 27px monospace';
    context.fillStyle = '#f7f3dc';
    context.fillText(String(this.level).padStart(2, '0'), 16, 66);
    context.fillText(this.formatTime(this.elapsed), 135, 66);
    context.fillText('01:00', 280, 66);
    this.drawBar(context, 424, 56, 230, this.level === 2 ? 0.65 : 0.75, 'HEALTH', '#d8ef84');
    this.drawBar(context, 724, 56, 190, 1, 'STAMINA', '#96d8c2');
  }

  drawBar(context, x, y, width, value, label, color) {
    context.fillStyle = '#d8ef84';
    context.font = 'bold 14px monospace';
    context.fillText(label, x, 36);
    context.fillStyle = '#f7f3dc';
    context.fillText(`${Math.round(value * 100)}%`, x + width - 35, 36);
    context.fillStyle = '#28342d'; context.fillRect(x, y, width, 8);
    context.fillStyle = color; context.fillRect(x, y, width * value, 8);
  }

  formatTime(seconds) {
    const remaining = Math.max(0, Math.floor(seconds));
    return `00:${String(remaining).padStart(2, '0')}`;
  }

  drawEndScreen(context) {
    context.fillStyle = 'rgba(5, 16, 12, 0.78)';
    context.fillRect(0, 0, this.viewWidth, this.viewHeight);
    context.textAlign = 'center';
    context.fillStyle = '#f6e6b8';
    context.font = 'bold 30px sans-serif';
    context.fillText(this.won ? 'YOU ESCAPED' : 'CAUGHT', this.viewWidth / 2, this.viewHeight / 2 - 18);
    context.font = '16px sans-serif';
    context.fillText(`${this.endMessage} Press R to restart.`, this.viewWidth / 2, this.viewHeight / 2 + 20);
    context.textAlign = 'start';
  }

  end(won, message) {
    this.running = false;
    this.ended = true;
    this.won = won;
    this.endMessage = message;
    this.draw();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.resizeObserver.disconnect();
    this.container.replaceChildren();
  }
}