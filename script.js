const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

window.addEventListener('load', () => {
  window.setTimeout(() => document.querySelector('.page-loader')?.classList.add('loaded'), reducedMotion ? 0 : 750);
});
window.setTimeout(() => document.querySelector('.page-loader')?.classList.add('loaded'), 2200);

const header = document.querySelector('.site-header');
const progress = document.querySelector('.scroll-progress');
const navLinks = [...document.querySelectorAll('.desktop-nav a')];
const sections = [...document.querySelectorAll('[data-section]')];

const updateScrollUI = () => {
  const scrollTop = window.scrollY;
  const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  header?.classList.toggle('scrolled', scrollTop > 40);
  if (progress) progress.style.transform = `scaleX(${scrollTop / scrollRange})`;

  let current = 'home';
  const marker = scrollTop + window.innerHeight * .35;
  sections.forEach((section) => {
    if (section.offsetTop <= marker) current = section.dataset.section;
  });
  navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
};
window.addEventListener('scroll', updateScrollUI, { passive: true });
window.addEventListener('resize', updateScrollUI);
updateScrollUI();

const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const setMenu = (open) => {
  document.body.classList.toggle('menu-open', open);
  menuButton?.classList.toggle('active', open);
  menuButton?.setAttribute('aria-expanded', String(open));
  menuButton?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mobileMenu?.classList.toggle('open', open);
  mobileMenu?.setAttribute('aria-hidden', String(!open));
};
menuButton?.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});

const reveals = document.querySelectorAll('.reveal');
if (reducedMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((element) => element.classList.add('visible'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .09, rootMargin: '0px 0px -4% 0px' });
  reveals.forEach((element, index) => {
    element.style.transitionDelay = `${(index % 4) * 55}ms`;
    revealObserver.observe(element);
  });
}

const dot = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
let pointerX = innerWidth / 2;
let pointerY = innerHeight / 2;
let ringX = pointerX;
let ringY = pointerY;

if (finePointer && !reducedMotion && dot && ring) {
  window.addEventListener('mousemove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    dot.style.left = `${pointerX}px`;
    dot.style.top = `${pointerY}px`;
    document.documentElement.style.setProperty('--mouse-x', `${pointerX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${pointerY}px`);
  });
  const animateCursor = () => {
    ringX += (pointerX - ringX) * .14;
    ringY += (pointerY - ringY) * .14;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    requestAnimationFrame(animateCursor);
  };
  animateCursor();

  document.querySelectorAll('a, button, input, textarea, select, .pipeline-step').forEach((element) => {
    element.addEventListener('mouseenter', () => document.body.classList.add('is-hovering'));
    element.addEventListener('mouseleave', () => document.body.classList.remove('is-hovering'));
  });
  document.querySelectorAll('.service-card, .expertise-card, .why-card').forEach((element) => {
    element.addEventListener('mouseenter', () => document.body.classList.add('is-viewing'));
    element.addEventListener('mouseleave', () => document.body.classList.remove('is-viewing'));
  });
}

if (finePointer && !reducedMotion) {
  document.querySelectorAll('.magnetic').forEach((element) => {
    element.addEventListener('mousemove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * .09}px, ${y * .12}px)`;
    });
    element.addEventListener('mouseleave', () => { element.style.transform = ''; });
  });

  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.transform = `perspective(900px) rotateX(${-y * 4.5}deg) rotateY(${x * 5.5}deg) translateZ(0)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

const stage = document.querySelector('#hero-stage');
if (stage && finePointer && !reducedMotion) {
  const depthItems = stage.querySelectorAll('[data-depth]');
  stage.addEventListener('mousemove', (event) => {
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    depthItems.forEach((item) => {
      const depth = Number(item.dataset.depth || 1);
      const moveX = x * 13 * depth;
      const moveY = y * 10 * depth;
      if (item.classList.contains('portrait-shell')) {
        item.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px)) rotateY(${x * 3}deg) rotateX(${-y * 2.5}deg) translateZ(30px)`;
      } else {
        item.style.transform = `translate3d(${moveX}px, ${moveY}px, ${depth * 8}px)`;
      }
    });
  });
  stage.addEventListener('mouseleave', () => {
    depthItems.forEach((item) => { item.style.transform = ''; });
  });
}

const portraitPhoto = document.querySelector('.portrait-photo');
if (portraitPhoto?.getAttribute('src')) {
  if (portraitPhoto.complete && portraitPhoto.naturalWidth) portraitPhoto.classList.add('loaded');
  portraitPhoto.addEventListener('load', () => portraitPhoto.classList.add('loaded'));
  portraitPhoto.addEventListener('error', () => portraitPhoto.remove());
}

const pipelineSteps = [...document.querySelectorAll('.pipeline-step')];
const pipelineProgress = document.querySelector('#pipeline-progress');
const setPipelineStep = (index) => {
  pipelineSteps.forEach((step, itemIndex) => step.classList.toggle('active', itemIndex === index));
  if (!pipelineProgress) return;
  const amount = index / Math.max(1, pipelineSteps.length - 1) * 100;
  if (window.matchMedia('(max-width: 940px)').matches) {
    pipelineProgress.style.width = '1px';
    pipelineProgress.style.height = `${amount}%`;
  } else {
    pipelineProgress.style.height = '1px';
    pipelineProgress.style.width = `${amount}%`;
  }
};
pipelineSteps.forEach((step, index) => {
  step.addEventListener('mouseenter', () => setPipelineStep(index));
  step.addEventListener('focus', () => setPipelineStep(index));
  step.addEventListener('click', () => setPipelineStep(index));
});
window.addEventListener('resize', () => {
  const activeIndex = Math.max(0, pipelineSteps.findIndex((step) => step.classList.contains('active')));
  setPipelineStep(activeIndex);
});
setPipelineStep(0);

class ParticleField {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.density = options.density || 45;
    this.linkDistance = options.linkDistance || 115;
    this.region = options.region || window;
    this.points = [];
    this.pointer = { x: -1000, y: -1000 };
    this.resize();
    this.bind();
    this.populate();
    this.frame = requestAnimationFrame((time) => this.draw(time));
  }

  bind() {
    window.addEventListener('resize', () => {
      this.resize();
      this.populate();
    });
    if (this.region !== window) {
      this.region.addEventListener('mousemove', (event) => {
        const rect = this.canvas.getBoundingClientRect();
        this.pointer.x = event.clientX - rect.left;
        this.pointer.y = event.clientY - rect.top;
      });
      this.region.addEventListener('mouseleave', () => { this.pointer = { x: -1000, y: -1000 }; });
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width || innerWidth);
    this.height = Math.max(1, rect.height || innerHeight);
    this.dpr = Math.min(devicePixelRatio || 1, 1.7);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  populate() {
    const count = Math.max(18, Math.round(this.width * this.height / 25000 * (this.density / 45)));
    this.points = Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - .5) * .13,
      vy: (Math.random() - .5) * .13,
      size: .45 + Math.random() * 1.25,
      phase: Math.random() * Math.PI * 2
    }));
  }

  draw(time = 0) {
    const context = this.context;
    context.clearRect(0, 0, this.width, this.height);
    this.points.forEach((point) => {
      if (!reducedMotion) {
        point.x += point.vx;
        point.y += point.vy;
        if (point.x < -5) point.x = this.width + 5;
        if (point.x > this.width + 5) point.x = -5;
        if (point.y < -5) point.y = this.height + 5;
        if (point.y > this.height + 5) point.y = -5;
      }
      const pointerDistance = Math.hypot(point.x - this.pointer.x, point.y - this.pointer.y);
      if (pointerDistance < 120 && pointerDistance > 1 && !reducedMotion) {
        point.x += (point.x - this.pointer.x) / pointerDistance * .32;
        point.y += (point.y - this.pointer.y) / pointerDistance * .32;
      }
    });

    for (let i = 0; i < this.points.length; i += 1) {
      const a = this.points[i];
      for (let j = i + 1; j < this.points.length; j += 1) {
        const b = this.points[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > this.linkDistance) continue;
        context.strokeStyle = `rgba(77, 194, 155, ${(1 - distance / this.linkDistance) * .095})`;
        context.lineWidth = .5;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
      const alpha = .16 + (Math.sin(time * .001 + a.phase) + 1) * .09;
      context.fillStyle = `rgba(111, 225, 188, ${alpha})`;
      context.beginPath();
      context.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      context.fill();
    }
    this.frame = requestAnimationFrame((nextTime) => this.draw(nextTime));
  }
}

const ambientCanvas = document.querySelector('#ambient-canvas');
if (ambientCanvas) new ParticleField(ambientCanvas, { density: 19, linkDistance: 95 });
const heroCanvas = document.querySelector('#hero-network');
if (heroCanvas && stage) new ParticleField(heroCanvas, { density: 68, linkDistance: 105, region: stage });

const form = document.querySelector('#contact-form');
const messageInput = form?.querySelector('textarea[name="message"]');
const charCount = document.querySelector('#char-count');
if (messageInput) {
  messageInput.maxLength = 600;
  messageInput.addEventListener('input', () => {
    if (charCount) charCount.textContent = String(messageInput.value.length);
    messageInput.closest('label')?.classList.remove('invalid');
  });
}
form?.querySelectorAll('input, select').forEach((field) => {
  field.addEventListener('input', () => field.closest('label')?.classList.remove('invalid'));
  field.addEventListener('change', () => field.closest('label')?.classList.remove('invalid'));
});

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const checks = [
    [form.elements.name, String(data.get('name') || '').trim().length > 1],
    [form.elements.email, emailPattern.test(String(data.get('email') || '').trim())],
    [form.elements.category, Boolean(data.get('category'))],
    [form.elements.message, String(data.get('message') || '').trim().length >= 10]
  ];
  checks.forEach(([field, valid]) => field.closest('label')?.classList.toggle('invalid', !valid));
  const firstInvalid = checks.find(([, valid]) => !valid)?.[0];
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const button = form.querySelector('.submit-button');
  const status = form.querySelector('.form-status');
  button.classList.add('sending');
  button.disabled = true;
  status.textContent = 'Preparing your inquiry…';

  const subject = encodeURIComponent(`${data.get('category')} inquiry from ${data.get('name')}`);
  const body = encodeURIComponent([
    `Hi Habib,`,
    '',
    String(data.get('message')).trim(),
    '',
    `Name: ${data.get('name')}`,
    `Email: ${data.get('email')}`,
    `Company / Agency: ${data.get('company') || 'Not provided'}`,
    `Category: ${data.get('category')}`
  ].join('\n'));

  window.setTimeout(() => {
    button.classList.remove('sending');
    button.disabled = false;
    status.textContent = 'Your email app is ready. Review the message and press send.';
    window.location.href = `mailto:habib30360@gmail.com?subject=${subject}&body=${body}`;
  }, reducedMotion ? 0 : 850);
});
