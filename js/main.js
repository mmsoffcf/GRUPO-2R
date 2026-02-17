/* main.js - Shared Logic */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initAnimations();

    // Only init carousel if element exists (index.html)
    if (document.getElementById('carouselTrack')) {
        initCarousel();
    }
});

/* --- Mobile Menu --- */
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener('click', () => {
        const isActive = navLinks.classList.toggle('active');
        menuToggle.setAttribute('aria-expanded', isActive);
    });

    // Close on link click
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.focus();
            }
        }
    });

    // Close on Scroll
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (Math.abs(currentScroll - lastScroll) > 50) {
            navLinks.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
        lastScroll = currentScroll;
    });
}

/* --- Scroll Animations (IntersectionObserver) --- */
function initAnimations() {
    const animatedElements = document.querySelectorAll('.fade-up, .slide-left, .slide-right');

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });
}

/* --- Ping-Pong Carousel (Centered, Smooth) --- */
function initCarousel() {
    const container = document.querySelector('.carousel-container');
    const track = document.getElementById('carouselTrack');
    if (!container || !track) return;

    const items = Array.from(track.querySelectorAll('.carousel-item'));
    if (items.length === 0) return;

    const totalItems = items.length; // 9 items
    let currentIndex = 0;
    let direction = 1; // 1 = forward, -1 = backward
    let autoScrollInterval;
    let isPaused = false;
    let manualPauseTimeout;

    function getItemWidth() {
        const item = items[0];
        const style = window.getComputedStyle(track);
        const gap = parseFloat(style.gap) || 40;
        return item.offsetWidth + gap;
    }

    function getMaxIndex() {
        // Calculate how many items can fit in the visible container
        const containerWidth = container.offsetWidth;
        const itemWidth = getItemWidth();
        const visibleItems = Math.floor(containerWidth / itemWidth);

        // Max index is total items minus visible items
        return Math.max(0, totalItems - visibleItems);
    }

    function updateCarousel(animate = true) {
        const itemWidth = getItemWidth();
        const offset = currentIndex * itemWidth;

        if (animate) {
            track.style.transition = 'transform 1s ease-in-out'; // Slower transition (1s)
        } else {
            track.style.transition = 'none';
        }
        track.style.transform = `translateX(-${offset}px)`;
    }

    function autoScroll() {
        if (isPaused) return;

        const maxIndex = getMaxIndex();

        currentIndex += direction;

        // Check boundaries and reverse direction
        if (currentIndex >= maxIndex) {
            currentIndex = maxIndex;
            direction = -1; // Start going backward
        } else if (currentIndex <= 0) {
            currentIndex = 0;
            direction = 1; // Start going forward
        }

        updateCarousel(true);
    }

    function startAutoScroll() {
        stopAutoScroll();
        autoScrollInterval = setInterval(autoScroll, 2000); // Faster interval (2s)
    }

    function stopAutoScroll() {
        clearInterval(autoScrollInterval);
    }

    // Manual controls
    window.moveCarousel = function (dir) {
        // Stop auto-scroll immediately
        stopAutoScroll();
        isPaused = true;

        // Clear any existing manual pause timeout
        clearTimeout(manualPauseTimeout);

        const maxIndex = getMaxIndex();

        if (dir > 0) {
            // Right button
            currentIndex++;
            if (currentIndex > maxIndex) {
                currentIndex = maxIndex;
            }
        } else {
            // Left button
            currentIndex--;
            if (currentIndex < 0) {
                currentIndex = 0;
            }
        }

        updateCarousel(true);

        // Resume auto-scroll after 5 seconds of no manual interaction
        manualPauseTimeout = setTimeout(() => {
            isPaused = false;
            startAutoScroll();
        }, 5000);
    };

    // Pause on hover
    container.addEventListener('mouseenter', () => {
        isPaused = true;
    });

    container.addEventListener('mouseleave', () => {
        // Only resume if not in manual pause mode
        if (!manualPauseTimeout) {
            isPaused = false;
        }
    });

    // Responsive: recalculate on resize
    window.addEventListener('resize', () => {
        const maxIndex = getMaxIndex();
        if (currentIndex > maxIndex) {
            currentIndex = maxIndex;
        }
        updateCarousel(false);
    });

    // Initialize
    updateCarousel(false);
    startAutoScroll();
}

/* --- Image Gallery Navigation --- */
function changeImage(button, direction) {
    const container = button.closest('.gallery-container');
    const image = container.querySelector('.gallery-image');
    const dots = container.querySelectorAll('.dot');

    // Get images from data-images attribute
    const imagesData = container.getAttribute('data-images');
    if (!imagesData) return;

    let images;
    try {
        images = JSON.parse(imagesData);
    } catch (e) {
        console.error('Invalid data-images format:', e);
        return;
    }

    if (!images || images.length === 0) return;

    // Get or initialize current index for this gallery
    if (!container.hasAttribute('data-current-index')) {
        container.setAttribute('data-current-index', '0');
    }

    let currentIndex = parseInt(container.getAttribute('data-current-index'));

    // Update current index
    currentIndex = (currentIndex + direction + images.length) % images.length;
    container.setAttribute('data-current-index', currentIndex.toString());

    // Fade out
    image.style.opacity = '0';

    setTimeout(() => {
        // Update image
        image.src = images[currentIndex];

        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });

        // Fade in
        image.style.opacity = '1';
    }, 250);
}

// Allow clicking on dots to jump to specific image
document.addEventListener('DOMContentLoaded', () => {
    const allGalleries = document.querySelectorAll('.gallery-container');

    allGalleries.forEach((container) => {
        const dots = container.querySelectorAll('.dot');
        const image = container.querySelector('.gallery-image');

        // Get images from data-images attribute
        const imagesData = container.getAttribute('data-images');
        if (!imagesData) return;

        let images;
        try {
            images = JSON.parse(imagesData);
        } catch (e) {
            console.error('Invalid data-images format:', e);
            return;
        }

        if (!images || images.length === 0) return;

        // Initialize current index
        if (!container.hasAttribute('data-current-index')) {
            container.setAttribute('data-current-index', '0');
        }

        dots.forEach((dot, dotIndex) => {
            dot.addEventListener('click', () => {
                // Update index
                container.setAttribute('data-current-index', dotIndex.toString());

                // Fade out
                image.style.opacity = '0';

                setTimeout(() => {
                    // Update image
                    image.src = images[dotIndex];

                    // Update dots
                    dots.forEach((d, i) => {
                        d.classList.toggle('active', i === dotIndex);
                    });

                    // Fade in
                    image.style.opacity = '1';
                }, 250);
            });
        });
    });
});
