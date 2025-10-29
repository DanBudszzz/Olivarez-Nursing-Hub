// Add a type declaration for netlifyIdentity on the window object
declare global {
  interface Window {
    netlifyIdentity: any;
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    
    // --- Element Selectors ---
    const preloader = document.getElementById('preloader');
    const loginGate = document.getElementById('login-gate');
    const appContainer = document.getElementById('app-container');

    let appInitialized = false;
    let identityInitialized = false; // Flag to track Netlify init

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
                // Don't close for logout button, let Netlify handle it
                if(item.hasAttribute('data-netlify-identity-button')) {
                    return;
                }
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

    // --- Fallback Timer for Netlify Identity ---
    // If the init event doesn't fire, we don't want to be stuck on the preloader.
    setTimeout(() => {
        if (!identityInitialized) {
            console.warn("Netlify Identity failed to initialize in a timely manner. Showing login as a fallback.");
            showLogin();
        }
    }, 4000); // 4-second timeout


    // --- Netlify Identity Integration ---
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on('init', user => {
            identityInitialized = true; // Mark as initialized
            if (user) {
                showApp();
                initializeMainApp();
            } else {
                showLogin();
            }
        });

        window.netlifyIdentity.on('login', user => {
            showApp();
            initializeMainApp();
            window.netlifyIdentity.close();
        });

        window.netlifyIdentity.on('logout', () => {
            appInitialized = false; // Reset init flag on logout
            showLogin();
        });
    } else {
        identityInitialized = true; // Mark as "initialized" as there's nothing to wait for
        // Fallback if script fails to load
        console.error("Netlify Identity widget not found.");
        showLogin();
    }
});

// FIX: Export an empty object to treat this file as a module. This allows global augmentation.
export {};