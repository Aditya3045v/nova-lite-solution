// ===== NOVA LITE SOLUTION – MAIN JS =====

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  if (header) {
    header.classList.toggle('scrolled', window.scrollY > 50);
  }
});

// Mobile hamburger
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('open');
  });
  // Close menu when link clicked
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });
}

// Product / Gallery filter
function initFilter(gridId) {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const grid = document.getElementById(gridId);
  if (!filterBtns.length || !grid) return;
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const items = grid.querySelectorAll('[data-category], [data-cat]');
      items.forEach(item => {
        const cat = item.dataset.category || item.dataset.cat;
        if (filter === 'all' || cat === filter || cat === 'all') {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}
initFilter('productsGrid');
initFilter('galleryGrid');

// Gallery lightbox
const galleryItems = document.querySelectorAll('.gallery-item');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
galleryItems.forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img');
    if (img && lightbox && lightboxImg) {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  });
});
function closeLightbox() {
  if (lightbox) {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
}
if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// Form handlers – redirect to WhatsApp on submit
function handleEnquiry(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value;
  const phone = form.phone.value;
  const product = form.product.value;
  const message = form.message.value;
  const text = `Hello Nova Lite Solution!%0AName: ${name}%0APhone: ${phone}%0AProduct: ${product}%0AMessage: ${message}`;
  window.open(`https://wa.me/919142651626?text=${text}`, '_blank');
  form.reset();
  showAlert('Enquiry sent! Redirecting to WhatsApp...');
}
function handleDealer(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value;
  const business = form.business.value;
  const phone = form.phone.value;
  const city = form.city.value;
  const type = form.type.value;
  const text = `Hello! I want to register as a ${type}.%0AName: ${name}%0ABusiness: ${business}%0APhone: ${phone}%0ACity: ${city}`;
  window.open(`https://wa.me/919142651626?text=${text}`, '_blank');
  form.reset();
  showAlert('Registration submitted! Redirecting to WhatsApp...');
}
function handleContact(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value;
  const phone = form.phone.value;
  const subject = form.subject.value;
  const message = form.message.value;
  const text = `Hello Nova Lite Solution!%0AName: ${name}%0APhone: ${phone}%0ASubject: ${subject}%0AMessage: ${message}`;
  window.open(`https://wa.me/919142651626?text=${text}`, '_blank');
  form.reset();
  showAlert('Message sent! Redirecting to WhatsApp...');
}
function showAlert(msg) {
  const el = document.createElement('div');
  el.textContent = msg;
  Object.assign(el.style, {
    position: 'fixed', top: '90px', right: '20px', background: '#25D366',
    color: '#fff', padding: '14px 24px', borderRadius: '10px',
    fontFamily: 'Poppins, sans-serif', fontWeight: '600', fontSize: '0.9rem',
    zIndex: '9999', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    animation: 'fadeIn 0.3s ease'
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// Scroll reveal animation
const revealEls = document.querySelectorAll('.product-card, .why-card, .stat-card, .testimonial-card, .gallery-item');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });
revealEls.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  revealObserver.observe(el);
});