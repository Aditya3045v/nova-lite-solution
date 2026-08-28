// ===== NOVA LITE SOLUTION – JS (AUDITED) =====

document.documentElement.classList.add('js');

// Header background on scroll
window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  if (header) {
    header.style.background = window.scrollY > 40
      ? 'rgba(13, 14, 18, 0.96)'
      : 'rgba(13, 14, 18, 0.88)';
  }
}, { passive: true });

// Mobile hamburger menu
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('open');
  });
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navMenu.classList.remove('open'));
  });
}

// Product filter pills
const filterPills = document.querySelectorAll('.filter-pill');
const filterableCards = document.querySelectorAll('.arch-prod-card[data-category]');
if (filterPills.length && filterableCards.length) {
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const filter = pill.dataset.filter;
      filterableCards.forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.style.display = show ? '' : 'none';
        if (show) card.classList.add('reveal');
      });
    });
  });
}

// Scroll-reveal via IntersectionObserver (graceful fallback = always visible)
const revealTargets = document.querySelectorAll('.arch-prod-card, .smart-card, .form-shell, .get-started-card');
if ('IntersectionObserver' in window && revealTargets.length) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  revealTargets.forEach(el => revealObserver.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('reveal'));
}

// ===== FORM HANDLERS – route to WhatsApp +91 9142651626 =====
const WA_NUMBER = '919142651626';

function handleQuickEnquiry(e) {
  e.preventDefault();
  const phone = document.getElementById('quickPhone').value;
  const text = `Hello Nova Lite Solution! I want to get started. My phone number is ${phone}.`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  e.target.reset();
}

function handleGeneralEnquiry(e) {
  e.preventDefault();
  const form = e.target;
  const text = `Hello Nova Lite Solution!\nName: ${form.name.value}\nPhone: ${form.phone.value}\nProduct: ${form.product.value}\nMessage: ${form.message.value}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  form.reset();
}

function handleDealerSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const text = `Hello Nova Lite Solution!\n*Dealer Registration Request*\nName: ${form.name.value}\nBusiness: ${form.business.value}\nPhone: ${form.phone.value}\nCity: ${form.city.value}\nType: ${form.type.value}\nProducts: ${form.volume.value}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  form.reset();
}

function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const text = `Hello Nova Lite Solution!\n*Contact Enquiry*\nName: ${form.name.value}\nPhone: ${form.phone.value}\nSubject: ${form.subject.value}\nMessage: ${form.message.value}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  form.reset();
}