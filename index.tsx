document.addEventListener('DOMContentLoaded', async () => {
    const body = document.body;
    
    // --- Element Selectors ---
    const preloader = document.getElementById('preloader');
    const loginGate = document.getElementById('login-gate');
    const appContainer = document.getElementById('app-container');

    let appInitialized = false;

    // --- Main App Initialization Logic (runs only once per session) ---
    function initializeMainApp() {
        if (appInitialized) return;
        appInitialized = true;

        // FIX: Convert number to string for textContent
        document.getElementById('current-year').textContent = new Date().getFullYear().toString();
        const indicator = document.querySelector('.nav-indicator') as HTMLElement;
        const items = document.querySelectorAll('.nav-item:not(.logout-btn)');
        const sections = document.querySelectorAll('main .section-wrapper');

        function handleIndicator(el: HTMLElement) {
          // Clear previous active states
          items.forEach(item => {
            item.classList.remove('is-active');
            (item as HTMLElement).removeAttribute('style');
          });
          
          if (el) {
              indicator.style.width = `${el.offsetWidth}px`;
              indicator.style.left = `${el.offsetLeft}px`;
              indicator.style.backgroundColor = el.getAttribute('active-color');
              el.classList.add('is-active');
              el.style.color = el.getAttribute('active-color');
          }
        }

        items.forEach(item => {
          item.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLElement;
            const href = target.getAttribute('href');
            if (href && href.startsWith('#') && href.length > 1) {
                handleIndicator(target);
            }
          });
        });

        handleIndicator(document.querySelector('.nav-item.is-active') as HTMLElement);

        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const navItem = document.querySelector(`.nav-item[href="#${entry.target.id}"]`) as HTMLElement;
                    if (navItem) handleIndicator(navItem);
                }
            });
        }, { rootMargin: "-50% 0px -50% 0px" });

        sections.forEach(section => scrollObserver.observe(section));
        
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('in-view');
            });
        }, { threshold: 0.2 });

        document.querySelectorAll('.section-wrapper').forEach(section => {
            animationObserver.observe(section);
        });
        
        const menuToggle = document.querySelector('.menu-toggle');
        const menuOverlay = document.getElementById('menu-overlay');
        const sideNavItems = document.querySelectorAll('.side-nav-item');

        function closeMenu() {
            body.classList.remove('menu-open');
            menuToggle.setAttribute('aria-expanded', 'false');
        }

        function openMenu() {
            body.classList.add('menu-open');
            menuToggle.setAttribute('aria-expanded', 'true');
        }

        menuToggle.addEventListener('click', () => {
            body.classList.contains('menu-open') ? closeMenu() : openMenu();
        });

        menuOverlay.addEventListener('click', closeMenu);

        sideNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                closeMenu();
                
                const href = item.getAttribute('href');
                if (href && href.startsWith('#') && href.length > 1) {
                    e.preventDefault();
                    const targetSection = document.querySelector(href);
                    if (targetSection) {
                        setTimeout(() => {
                            targetSection.scrollIntoView({ behavior: 'smooth' });
                            const desktopNavItem = document.querySelector(`.nav-item[href="${href}"]`) as HTMLElement;
                            if (desktopNavItem) handleIndicator(desktopNavItem);
                        }, 350);
                    }
                }
            });
        });
    }

    // --- Preloader and UI state management ---
    function showApp() {
        if (loginGate) loginGate.style.display = 'none';
        if (appContainer) appContainer.style.display = 'block';
        
        setTimeout(() => {
            if (preloader) preloader.classList.add('preloader-hidden');
            body.classList.add('loaded');
            setTimeout(() => {
                body.classList.remove('preloading');
            }, 800);
        }, 500); // Shorter delay when logged in
    }

    function showLogin() {
        if (preloader) preloader.classList.add('preloader-hidden');
        body.classList.remove('preloading', 'loaded');
        if (loginGate) loginGate.style.display = 'grid';
        if (appContainer) appContainer.style.display = 'none';
    }

    // --- Auth0 Integration via Netlify ---
    async function checkAuthStatus() {
        try {
            const response = await fetch('/.netlify/identity/user');
            // A 401 response is expected for logged-out users, which is not 'ok'
            if (response.ok) {
                const user = await response.json();
                // Verify we have actual user data
                if (user && user.user_metadata) { 
                    showApp();
                    initializeMainApp();
                    return;
                }
            }
            // If response is not ok, or doesn't contain user data, show the login gate
            showLogin();
        } catch (error) {
            console.error("Error checking authentication status:", error);
            showLogin();
        }
    }

    // Check user status on initial load
    await checkAuthStatus();
});

// FIX: Export an empty object to treat this file as a module.
export {};