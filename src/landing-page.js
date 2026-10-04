import template from './landing-page.html?raw';
import './landing-page.css';

// Keep authentication in main.js; this module owns the public page's presentation.
export function setupLandingPage({ register }) {
  const root = document.querySelector('#section-landing');
  if (!root || root.dataset.initialized) return;
  const loginCard = root.querySelector('.landing-auth-card');
  root.innerHTML = template;
  root.querySelector('[data-login-slot]').append(loginCard);
  root.dataset.initialized = 'true';

  const dialog = root.querySelector('.landing-dialog');
  const menu = root.querySelector('.menu');
  const navigation = root.querySelector('.navlinks');
  const closeMenu = () => {
    navigation.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open navigation');
  };
  menu.addEventListener('click', () => {
    const open = navigation.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  root.querySelectorAll('a').forEach(link => link.addEventListener('click', event => {
    closeMenu();
    if (link.dataset.landingAuth) {
      event.preventDefault();
      if (link.dataset.landingAuth === 'register') {
        register();
        window.scrollTo(0, 0);
      } else {
        dialog.showModal();
        root.querySelector('#landing-login-email').focus();
      }
    }
  }));
  root.querySelector('.landing-dialog-close').addEventListener('click', () => dialog.close());

  const journeys = {
    help: [
      ['Find your starting point', 'Browse an ongoing service, post a one-time request, or look for peer mentoring.'],
      ['Connect and agree', 'Discuss the scope, timing, and price in messages so you both know what to expect.'],
      ['Complete and reflect', 'Finish the engagement and share honest feedback about your experience.'],
    ],
    offer: [
      ['Show what you bring', 'Introduce your skills on your profile and post a service offer students can discover.'],
      ['Find the right fit', 'Respond to requests or connect with a student who needs your service. Agree on the details together.'],
      ['Deliver and grow', 'Complete the work, receive feedback, and keep your ongoing service available for the next student.'],
    ],
  };
  root.querySelectorAll('[data-journey]').forEach(button => button.addEventListener('click', () => {
    root.querySelectorAll('[data-journey]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    root.querySelectorAll('.step').forEach((step, index) => {
      const [title, description] = journeys[button.dataset.journey][index];
      step.querySelector('h3').textContent = title;
      step.querySelector('p').textContent = description;
    });
  }));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-shown');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.04 });
    root.classList.add('motion-ready');
    root.querySelectorAll('.t-stagger').forEach(block => observer.observe(block));
  }
  const progress = root.querySelector('.progress');
  const updateProgress = () => {
    if (root.classList.contains('hidden')) return;
    const height = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${height > 0 ? scrollY / height * 100 : 0}%`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
}
