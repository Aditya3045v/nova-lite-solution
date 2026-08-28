// ===== NOVA LITE SOLUTION – JS INTERACTIVITY =====

// Navbar background change on scroll
window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  if (header) {
    if (window.scrollY > 40) {
      header.style.background = 'rgba(18, 19, 22, 0.96)';
    } else {
      header.style.background = 'rgba(18, 19, 22, 0.85)';
    }
  }
});

// Hamburger mobile menu toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('open');
  });
}

// Product filter pills
const filterPills = document.querySelectorAll('.filter-pill');
const productCards = document.querySelectorAll('.arch-prod-card[data-category]');

if (filterPills.length && productCards.length) {
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const filter = pill.dataset.filter;

      productCards.forEach(card => {
        const cat = card.dataset.category;
        if (filter === 'all' || cat === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// Form Handlers routing to WhatsApp (+91 9142651626)
function handleQuickEnquiry(e) {
  e.preventDefault();
  const phone = document.getElementById('quickPhone').value;
  const text = `Hello Nova Lite Solution! I want to get started. My phone number is ${phone}.`;
  window.open(`https://wa.me/919142651626?text=${encodeURIComponent(text)}`, '_blank');
}

function handleGeneralEnquiry(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value;
  const phone = form.phone.value;
  const product = form.product.value;
  const msg = form.message.value;
  const text = `Hello Nova Lite Solution!\nName: ${name}\nPhone: ${phone}\nProduct: ${product}\nMessage: ${msg}`;
  window.open(`https://wa.me/919142651626?text=${encodeURIComponent(text)}`, '_blank');
  form.reset();
}

function handleDealerSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value;
  const business = form.business.value;
  const phone = form.phone.value;
  const city = form.city.value;
  const type = form.type.value;
  const volume = form.volume.value;
  const text = `Hello Nova Lite Solution!\n*Dealer Registration Request*\nName: ${name}\nBusiness: ${business}\nPhone: ${phone}\nCity: ${city}\nType: ${type}\nVolume: ${volume}`;
  window.open(`https://wa.me/919142651626?text=${encodeURIComponent(text)}`, '_blank');
  form.reset();
}

function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value;
  const phone = form.phone.value;
  const subject = form.subject.value;
  const msg = form.message.value;
  const text = `Hello Nova Lite Solution!\n*Contact Message*\nName: ${name}\nPhone: ${phone}\nSubject: ${subject}\nMessage: ${msg}`;
  window.open(`https://wa.me/919142651626?text=${encodeURIComponent(text)}`, '_blank');
  form.reset();
}