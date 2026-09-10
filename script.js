const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const dot = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
let mouseX = innerWidth / 2;
let mouseY = innerHeight / 2;
let ringX = mouseX;
let ringY = mouseY;

if (dot && ring) {
  window.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    dot.style.left = `${mouseX}px`;
    dot.style.top = `${mouseY}px`;
  });

  const animateCursor = () => {
    ringX += (mouseX - ringX) * .13;
    ringY += (mouseY - ringY) * .13;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    requestAnimationFrame(animateCursor);
  };
  animateCursor();
}

const registerHoverTargets = () => {
  document.querySelectorAll('a, button, .tilt-card').forEach((element) => {
    element.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    element.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
  });
};
registerHoverTargets();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .1 });

document.querySelectorAll('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
  revealObserver.observe(element);
});

if (!prefersReducedMotion && matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.tilt-card').forEach((card) => {
    const art = card.querySelector('.project-art');
    if (!art) return;
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      art.style.transform = `rotateX(${-y * 5}deg) rotateY(${x * 7}deg) scale(.985)`;
    });
    card.addEventListener('mouseleave', () => {
      art.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    });
  });

  document.querySelectorAll('.magnetic').forEach((element) => {
    element.addEventListener('mousemove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * .12}px, ${y * .12}px)`;
    });
    element.addEventListener('mouseleave', () => { element.style.transform = ''; });
  });
}

const canvas = document.getElementById('orb');
if (canvas) {
  const context = canvas.getContext('2d');
  const host = canvas.parentElement;
  const points = [];
  const pointCount = 190;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let rotationX = -.15;
  let rotationY = .3;
  let targetX = rotationX;
  let targetY = rotationY;
  let dragging = false;
  let lastPointerX = 0;
  let lastPointerY = 0;

  for (let i = 0; i < pointCount; i += 1) {
    const y = 1 - (i / (pointCount - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = Math.PI * (3 - Math.sqrt(5)) * i;
    points.push({
      x: Math.cos(theta) * radius,
      y,
      z: Math.sin(theta) * radius,
      pulse: Math.random() * Math.PI * 2,
      size: .6 + Math.random() * 1.4
    });
  }

  const resizeOrb = () => {
    const rect = host.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const transformPoint = (point) => {
    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const x1 = point.x * cosY - point.z * sinY;
    const z1 = point.x * sinY + point.z * cosY;
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);
    return {
      x: x1,
      y: point.y * cosX - z1 * sinX,
      z: point.y * sinX + z1 * cosX
    };
  };

  const drawOrb = (time = 0) => {
    context.clearRect(0, 0, width, height);
    const sphereRadius = Math.min(width, height) * .325;
    const cx = width * .51;
    const cy = height * .5;
    rotationX += (targetX - rotationX) * .045;
    rotationY += (targetY - rotationY) * .045;
    if (!dragging && !prefersReducedMotion) targetY += .0015;

    const projected = points.map((point) => {
      const p = transformPoint(point);
      const perspective = 1 / (1.7 - p.z * .28);
      return {
        x: cx + p.x * sphereRadius * perspective * 1.55,
        y: cy + p.y * sphereRadius * perspective * 1.55,
        z: p.z,
        size: point.size,
        pulse: point.pulse
      };
    });

    context.lineWidth = .55;
    for (let i = 0; i < projected.length; i += 1) {
      const a = projected[i];
      for (let j = i + 1; j < Math.min(i + 12, projected.length); j += 1) {
        const b = projected[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < sphereRadius * .27) {
          const opacity = Math.max(0, 1 - distance / (sphereRadius * .27)) * .2 * ((a.z + b.z + 2) / 4);
          context.strokeStyle = `rgba(202, 255, 73, ${opacity})`;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }
    }

    projected.sort((a, b) => a.z - b.z).forEach((point) => {
      const depth = (point.z + 1) / 2;
      const pulse = 1 + Math.sin(time * .0015 + point.pulse) * .25;
      const radius = point.size * pulse * (.55 + depth * .9);
      context.fillStyle = `rgba(${190 + depth * 25}, ${205 + depth * 50}, ${125 - depth * 50}, ${.22 + depth * .72})`;
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.fill();
    });

    context.save();
    context.translate(cx, cy);
    context.rotate(-.23 + Math.sin(time * .0003) * .025);
    context.strokeStyle = 'rgba(255,255,255,.08)';
    context.lineWidth = 1;
    context.beginPath();
    context.ellipse(0, 0, sphereRadius * 1.03, sphereRadius * .34, 0, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = 'rgba(201,255,73,.16)';
    context.beginPath();
    context.ellipse(0, 0, sphereRadius * 1.13, sphereRadius * .39, 0, Math.PI * .08, Math.PI * .88);
    context.stroke();
    context.restore();
    requestAnimationFrame(drawOrb);
  };

  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    targetY += (event.clientX - lastPointerX) * .009;
    targetX += (event.clientY - lastPointerY) * .006;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  window.addEventListener('resize', resizeOrb);
  resizeOrb();
  requestAnimationFrame(drawOrb);
}
