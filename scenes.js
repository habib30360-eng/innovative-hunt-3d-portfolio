class MeshScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.type = canvas.dataset.scene || 'torus';
    this.color = canvas.dataset.color || '#c9ff49';
    this.rotation = { x: -.25, y: .25, z: 0 };
    this.target = { ...this.rotation };
    this.dragging = false;
    this.last = { x: 0, y: 0 };
    this.visible = true;
    this.resize();
    this.bind();
  }

  bind() {
    this.canvas.addEventListener('pointerdown', (event) => {
      this.dragging = true;
      this.last = { x: event.clientX, y: event.clientY };
      this.canvas.setPointerCapture(event.pointerId);
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.dragging) return;
      this.target.y += (event.clientX - this.last.x) * .009;
      this.target.x += (event.clientY - this.last.y) * .007;
      this.last = { x: event.clientX, y: event.clientY };
    });
    this.canvas.addEventListener('pointerup', () => { this.dragging = false; });
    this.canvas.addEventListener('pointercancel', () => { this.dragging = false; });
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.dpr = Math.min(devicePixelRatio || 1, 1.6);
    this.canvas.width = Math.max(1, Math.round(this.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.height * this.dpr));
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  rotate(point) {
    const cx = Math.cos(this.rotation.x);
    const sx = Math.sin(this.rotation.x);
    const cy = Math.cos(this.rotation.y);
    const sy = Math.sin(this.rotation.y);
    const cz = Math.cos(this.rotation.z);
    const sz = Math.sin(this.rotation.z);
    const y1 = point.y * cx - point.z * sx;
    const z1 = point.y * sx + point.z * cx;
    const x2 = point.x * cy + z1 * sy;
    const z2 = -point.x * sy + z1 * cy;
    return { x: x2 * cz - y1 * sz, y: x2 * sz + y1 * cz, z: z2 };
  }

  project(point, scale = 1) {
    const p = this.rotate(point);
    const depth = 4.4 - p.z;
    const perspective = 3.8 / depth;
    return {
      x: this.width / 2 + p.x * Math.min(this.width, this.height) * .22 * perspective * scale,
      y: this.height / 2 + p.y * Math.min(this.width, this.height) * .22 * perspective * scale,
      z: p.z,
      alpha: Math.max(.08, Math.min(1, .38 + p.z * .15))
    };
  }

  line(a, b, alpha = .5, width = .8) {
    this.ctx.strokeStyle = this.hexToRgba(this.color, alpha * Math.min(a.alpha, b.alpha));
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.moveTo(a.x, a.y);
    this.ctx.lineTo(b.x, b.y);
    this.ctx.stroke();
  }

  dot(point, radius = 1.5, alpha = 1) {
    this.ctx.fillStyle = this.hexToRgba(this.color, alpha * point.alpha);
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  hexToRgba(hex, alpha) {
    const value = hex.replace('#', '');
    const full = value.length === 3 ? value.split('').map((v) => v + v).join('') : value;
    const number = parseInt(full, 16);
    return `rgba(${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`;
  }

  drawTorus(time) {
    const rows = 15;
    const columns = 34;
    const points = [];
    const pulse = 1 + Math.sin(time * .0012) * .035;
    for (let v = 0; v < rows; v += 1) {
      const phi = v / rows * Math.PI * 2;
      points[v] = [];
      for (let u = 0; u < columns; u += 1) {
        const theta = u / columns * Math.PI * 2;
        const major = 1.08;
        const minor = .42 * pulse;
        points[v][u] = this.project({
          x: (major + minor * Math.cos(phi)) * Math.cos(theta),
          y: minor * Math.sin(phi),
          z: (major + minor * Math.cos(phi)) * Math.sin(theta)
        });
      }
    }
    for (let v = 0; v < rows; v += 1) {
      for (let u = 0; u < columns; u += 1) {
        this.line(points[v][u], points[v][(u + 1) % columns], .38);
        if (u % 2 === 0) this.line(points[v][u], points[(v + 1) % rows][u], .22);
      }
    }
  }

  drawBlob(time) {
    const rows = 17;
    const columns = 29;
    const points = [];
    for (let v = 0; v <= rows; v += 1) {
      const phi = v / rows * Math.PI;
      points[v] = [];
      for (let u = 0; u < columns; u += 1) {
        const theta = u / columns * Math.PI * 2;
        const noise = 1 + .16 * Math.sin(theta * 3 + time * .001) * Math.sin(phi * 4 - time * .0008);
        points[v][u] = this.project({
          x: Math.sin(phi) * Math.cos(theta) * noise,
          y: Math.cos(phi) * noise * 1.1,
          z: Math.sin(phi) * Math.sin(theta) * noise
        }, 1.15);
      }
    }
    for (let v = 0; v < rows; v += 1) {
      for (let u = 0; u < columns; u += 1) {
        this.line(points[v][u], points[v][(u + 1) % columns], .3);
        this.line(points[v][u], points[v + 1][u], .24);
      }
    }
  }

  drawWave(time) {
    const size = 21;
    const points = [];
    for (let z = 0; z < size; z += 1) {
      points[z] = [];
      for (let x = 0; x < size; x += 1) {
        const px = (x / (size - 1) - .5) * 3.2;
        const pz = (z / (size - 1) - .5) * 3.2;
        const distance = Math.sqrt(px * px + pz * pz);
        const py = Math.sin(distance * 4 - time * .002) * .18 * Math.exp(-distance * .3);
        points[z][x] = this.project({ x: px, y: py, z: pz }, .8);
      }
    }
    for (let z = 0; z < size; z += 1) {
      for (let x = 0; x < size; x += 1) {
        if (x < size - 1) this.line(points[z][x], points[z][x + 1], .38);
        if (z < size - 1) this.line(points[z][x], points[z + 1][x], .24);
      }
    }
  }

  drawCrystal(time) {
    const vertices = [
      { x: 0, y: -1.7, z: 0 }, { x: 0, y: 1.7, z: 0 },
      { x: -1, y: -.45, z: -.65 }, { x: .9, y: -.35, z: -.75 },
      { x: 1.15, y: .35, z: .55 }, { x: -.85, y: .5, z: .8 },
      { x: 0, y: -.25, z: 1.25 }, { x: 0, y: .2, z: -1.2 }
    ].map((point) => this.project(point, 1.05));
    const edges = [
      [0,2],[0,3],[0,4],[0,5],[0,6],[1,2],[1,3],[1,4],[1,5],[1,7],
      [2,3],[3,4],[4,6],[6,5],[5,2],[2,7],[7,3],[7,4],[4,5]
    ];
    edges.forEach(([a,b], index) => this.line(vertices[a], vertices[b], index % 3 === 0 ? .9 : .4, index % 3 === 0 ? 1.3 : .7));
    vertices.forEach((point) => this.dot(point, 2, .9));
  }

  drawKnot(time) {
    const points = [];
    const count = 220;
    for (let i = 0; i < count; i += 1) {
      const t = i / count * Math.PI * 2;
      points.push(this.project({
        x: (2 + Math.cos(3 * t)) * Math.cos(2 * t) / 2.5,
        y: Math.sin(3 * t) / 1.25,
        z: (2 + Math.cos(3 * t)) * Math.sin(2 * t) / 2.5
      }, 1.15));
    }
    points.forEach((point, index) => {
      this.line(point, points[(index + 1) % count], .78, 1.25);
      if (index % 9 === 0) this.dot(point, 2.3, 1);
    });
  }

  drawRings(time) {
    const rings = 6;
    for (let r = 0; r < rings; r += 1) {
      const points = [];
      const count = 100;
      const radius = .45 + r * .25;
      for (let i = 0; i < count; i += 1) {
        const a = i / count * Math.PI * 2;
        const tilt = r * .38 + Math.sin(time * .0004 + r) * .1;
        points.push(this.project({
          x: Math.cos(a) * radius,
          y: Math.sin(a) * radius * Math.cos(tilt),
          z: Math.sin(a) * radius * Math.sin(tilt)
        }, 1.05));
      }
      points.forEach((point, index) => this.line(point, points[(index + 1) % count], .22 + r * .08, .7 + r * .09));
    }
  }

  draw(time) {
    if (!this.visible) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.rotation.x += (this.target.x - this.rotation.x) * .045;
    this.rotation.y += (this.target.y - this.rotation.y) * .045;
    if (!this.dragging && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.target.y += .0022;
    const glow = this.ctx.createRadialGradient(this.width / 2, this.height / 2, 0, this.width / 2, this.height / 2, Math.min(this.width, this.height) * .48);
    glow.addColorStop(0, this.hexToRgba(this.color, .1));
    glow.addColorStop(1, this.hexToRgba(this.color, 0));
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(0, 0, this.width, this.height);
    const method = `draw${this.type.charAt(0).toUpperCase()}${this.type.slice(1)}`;
    (this[method] || this.drawTorus).call(this, time);
  }
}

const scenes = [...document.querySelectorAll('.scene-canvas')].map((canvas) => new MeshScene(canvas));
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const scene = scenes.find((item) => item.canvas === entry.target);
    if (scene) scene.visible = entry.isIntersecting;
  });
}, { rootMargin: '120px' });
scenes.forEach((scene) => observer.observe(scene.canvas));

const render = (time) => {
  scenes.forEach((scene) => scene.draw(time));
  requestAnimationFrame(render);
};
window.addEventListener('resize', () => scenes.forEach((scene) => scene.resize()));
requestAnimationFrame(render);
