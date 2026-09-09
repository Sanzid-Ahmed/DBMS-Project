document.addEventListener('DOMContentLoaded', () => {

  // ==================== THEME TOGGLE ====================
  const themeToggleBtn = document.getElementById('themeToggle');
  const body = document.body;


  const email = localStorage.getItem("pcbuilder_user_email");
    console.log(email);

  // Retrieve saved theme preference from LocalStorage
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'light') {
    body.classList.add('light-theme');
  }

  themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    
    // Save state in LocalStorage
    if (body.classList.contains('light-theme')) {
      localStorage.setItem('theme', 'light');
    } else {
      localStorage.setItem('theme', 'dark');
    }
  });


  // ==================== MOBILE MENU ====================
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });

  // Close mobile navigation menu on link selection
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
    });
  });








  
  // ==================== HERO SLIDER ====================
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  let currentSlide = 0;
  const slideCount = slides.length;
  let autoSlideInterval;

  function showSlide(index) {
    // Handle index bounds wrapping
    if (index >= slideCount) {
      currentSlide = 0;
    } else if (index < 0) {
      currentSlide = slideCount - 1;
    } else {
      currentSlide = index;
    }

    // Toggle active class on slides
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentSlide);
    });

    // Toggle active state on dots
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  function prevSlide() {
    showSlide(currentSlide - 1);
  }

  // Event Listeners for Slider Controls
  nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoSlide();
  });

  prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAutoSlide();
  });

  // Dot Click Navigation
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      showSlide(index);
      resetAutoSlide();
    });
  });

  
  
  
  // Automatic Slide Rotation Cycle
  function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 5000);
  }

  function resetAutoSlide() {
    clearInterval(autoSlideInterval);
    startAutoSlide();
  }

  // Initialize Slider Auto-Play
  startAutoSlide();

});