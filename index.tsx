// Fix: Add export {} to make this file a module, which allows global scope augmentation.
export {};

// Fix: Add type definition for PeriodicSyncManager, which may not be in default TS libs.
interface PeriodicSyncManager {
    register(tag: string, options?: { minInterval: number }): Promise<void>;
    getTags(): Promise<string[]>;
    unregister(tag: string): Promise<void>;
}

// Fix: Add type definition for SyncManager for the Background Sync API.
interface SyncManager {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
}

declare global {
  interface Window {
    netlifyIdentity: any;
  }
  // Fix: Augment ServiceWorkerRegistration to include periodicSync property.
  interface ServiceWorkerRegistration {
    readonly periodicSync: PeriodicSyncManager;
    // Fix: Augment ServiceWorkerRegistration to include the sync property for Background Sync.
    readonly sync: SyncManager;
  }
}

// Type for Netlify Identity User
interface NetlifyUser {
  app_metadata: {
    provider: string;
    roles?: string[];
  };
  [key: string]: any;
}

// Type for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed',
        platform: string
    }>;
    prompt(): Promise<void>;
}


// Rework: Use the `load` event to ensure all external scripts, like the Netlify Identity widget,
// are fully loaded before the application logic runs. This prevents race conditions.
window.addEventListener('load', () => {
    // --- AUTHENTICATION ELEMENTS ---
    const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
    const pendingLogoutBtn = document.getElementById('pending-logout-btn') as HTMLButtonElement;
    const authContainer = document.getElementById('auth-container') as HTMLElement;
    const pendingContainer = document.getElementById('pending-approval-container') as HTMLElement;
    const appContainer = document.getElementById('app-container') as HTMLElement;
    const body = document.body;
    let appInitialized = false;

    if (!loginBtn || !pendingLogoutBtn || !authContainer || !pendingContainer || !appContainer) {
        console.error('Authentication containers not found');
        return;
    }

    // --- PWA Feature Setup ---
    async function setupPwaFeatures(registration: ServiceWorkerRegistration) {
        const statusEl = document.getElementById('pwa-status');
        if (!statusEl) return;
        let statusMessages: string[] = [];
        if ('periodicSync' in registration) {
            try {
                // Fix: Cast permission name to `any` to handle non-standard permission names without using @ts-ignore.
                const status = await navigator.permissions.query({ name: 'periodic-background-sync' } as any);
                if (status.state === 'granted') {
                    // Fix: Type definitions for periodicSync are now available, so @ts-ignore is not needed.
                    await registration.periodicSync.register('content-update', { minInterval: 24 * 60 * 60 * 1000 });
                    statusMessages.push('Auto-updates enabled.');
                }
            } catch (error) { console.error('Periodic Sync registration failed:', error); }
        }
        if ('sync' in registration) {
            try {
                await registration.sync.register('data-sync-request');
                statusMessages.push('Offline-sync ready.');
            } catch (error) { console.error('Background Sync registration failed:', error); }
        }
        if(statusMessages.length > 0) {
             statusEl.textContent = `PWA Status: ${statusMessages.join(' ')}`;
        }
    }

    // --- Main App Initialization Logic ---
    function initializeMainApp() {
        const currentYearEl = document.getElementById('current-year');
        if(currentYearEl) currentYearEl.textContent = new Date().getFullYear().toString();

        // --- PWA Installation & Service Worker ---
        let deferredPrompt: BeforeInstallPromptEvent | null;
        const installBtnDesktop = document.getElementById('install-btn-desktop');
        const installBtnMobile = document.getElementById('install-btn-mobile');
        const iosInstallModal = document.getElementById('ios-install-modal');
        const closeIosModalBtn = document.getElementById('ios-modal-close');
        const allInstallBtns = [installBtnDesktop, installBtnMobile].filter(Boolean) as HTMLElement[];
        const isIos = () => /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
        // @ts-ignore
        const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);
        
        if (isInStandaloneMode()) {
            allInstallBtns.forEach(btn => btn.style.display = 'none');
        } else {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e as BeforeInstallPromptEvent;
                allInstallBtns.forEach(btn => btn.style.display = 'inline-flex');
                if (installBtnMobile) installBtnMobile.style.display = 'flex';
            });
            if (isIos()) {
                allInstallBtns.forEach(btn => btn.style.display = 'inline-flex');
                if (installBtnMobile) installBtnMobile.style.display = 'flex';
            }
        }
        async function installApp(e: Event) {
            e.preventDefault();
            if (isIos() && !isInStandaloneMode()) {
                if (iosInstallModal) {
                    iosInstallModal.classList.add('visible');
                }
                return;
            }
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    allInstallBtns.forEach(btn => btn.style.display = 'none');
                }
                deferredPrompt = null;
            }
        }
        allInstallBtns.forEach(btn => btn.addEventListener('click', installApp));
        
        const closeIosModal = () => {
            if (iosInstallModal) {
                iosInstallModal.classList.remove('visible');
            }
        };
        
        closeIosModalBtn?.addEventListener('click', closeIosModal);
        iosInstallModal?.addEventListener('click', (e) => {
            if (e.target === iosInstallModal) closeIosModal();
        });

        let newWorker: ServiceWorker | null;
        function showUpdateNotification() {
            const notification = document.getElementById('update-notification');
            const reloadButton = document.getElementById('reload-button');
            if (notification && reloadButton) {
                notification.style.display = 'flex';
                notification.style.alignItems = 'center';
                reloadButton.addEventListener('click', () => {
                    newWorker?.postMessage({ action: 'skipWaiting' });
                });
            }
        }
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => {
                    if (reg.active) { setupPwaFeatures(reg); }
                    reg.addEventListener('updatefound', () => {
                        newWorker = reg.installing;
                        newWorker?.addEventListener('statechange', () => {
                            if (newWorker?.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateNotification();
                            }
                        });
                    });
                }).catch(err => console.error('Service worker registration failed:', err));
            
            let refreshing: boolean;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                window.location.reload();
                refreshing = true;
            });
        }

        // --- UI/UX LOGIC ---
        const indicator = document.querySelector<HTMLElement>('.nav-indicator');
        const items = document.querySelectorAll<HTMLElement>('.nav-item:not(.logout-btn)');
        const sections = document.querySelectorAll<HTMLElement>('main .section-wrapper');

        function handleIndicator(el: HTMLElement | null) {
          items.forEach(item => {
            item.classList.remove('is-active');
            item.removeAttribute('style');
          });
          if (el && indicator) {
              indicator.style.width = `${el.offsetWidth}px`;
              indicator.style.left = `${el.offsetLeft}px`;
              indicator.style.backgroundColor = el.getAttribute('active-color') || '';
              el.classList.add('is-active');
              el.style.color = el.getAttribute('active-color') || '';
          }
        }
        items.forEach(item => {
          item.addEventListener('click', (e) => {
            if (!(e.target as HTMLElement).id?.includes('install')) {
                handleIndicator(e.target as HTMLElement);
            }
          });
        });
        handleIndicator(document.querySelector('.nav-item.is-active'));

        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const navItem = document.querySelector<HTMLElement>(`.nav-item[href="#${entry.target.id}"]`);
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
        document.querySelectorAll('.section-wrapper').forEach(section => animationObserver.observe(section));

        const menuToggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
        const menuOverlay = document.getElementById('menu-overlay');
        const sideNavItems = document.querySelectorAll<HTMLAnchorElement>('.side-nav-item');
        function closeMenu() {
            body.classList.remove('menu-open');
            menuToggle?.setAttribute('aria-expanded', 'false');
        }
        function openMenu() {
            body.classList.add('menu-open');
            menuToggle?.setAttribute('aria-expanded', 'true');
        }
        menuToggle?.addEventListener('click', () => { body.classList.contains('menu-open') ? closeMenu() : openMenu(); });
        menuOverlay?.addEventListener('click', closeMenu);
        sideNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (item.id?.includes('install') || item.classList.contains('logout-btn')) {
                    closeMenu(); return;
                }
                e.preventDefault();
                const targetId = item.getAttribute('href');
                if (!targetId) return;
                const targetSection = document.querySelector<HTMLElement>(targetId);
                closeMenu();
                if (targetSection) {
                    setTimeout(() => {
                        targetSection.scrollIntoView({ behavior: 'smooth' });
                        const desktopNavItem = document.querySelector<HTMLElement>(`.nav-item[href="${targetId}"]`);
                        handleIndicator(desktopNavItem);
                    }, 500);
                }
            });
        });
    }

    // --- Preloader & Startup Sequence ---
    function runPreloader() {
        const preloader = document.getElementById('preloader');
        setTimeout(() => {
            if (preloader) preloader.classList.add('preloader-hidden');
            body.classList.add('loaded');
            setTimeout(() => { body.classList.remove('preloading'); }, 800);
        }, 2000);
    }
    
    // --- REWORKED: AUTHENTICATION FLOW ---
    
    // A single, clear function to update the entire UI based on authentication state.
    const updateAuthState = (user: NetlifyUser | null) => {
        if (user) {
            // User is logged in, check for approval roles.
            const isApproved = user.app_metadata?.roles && user.app_metadata.roles.length > 0;
            
            if (isApproved) {
                // Show the main application.
                authContainer.style.display = 'none';
                pendingContainer.style.display = 'none';
                appContainer.style.display = 'block';
                
                // Initialize the app's interactive elements only once.
                if (!appInitialized) {
                    body.classList.add('preloading');
                    runPreloader();
                    initializeMainApp();
                    appInitialized = true;
                }
            } else {
                // Show the "pending approval" screen.
                authContainer.style.display = 'none';
                pendingContainer.style.display = 'flex';
                appContainer.style.display = 'none';
            }
        } else {
            // No user, show the login screen.
            authContainer.style.display = 'flex';
            pendingContainer.style.display = 'none';
            appContainer.style.display = 'none';
        }
    };

    // Attach click handlers to auth buttons. Optional chaining (`?.`) provides safety.
    loginBtn.addEventListener('click', () => window.netlifyIdentity?.open());
    pendingLogoutBtn.addEventListener('click', () => window.netlifyIdentity?.logout());
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.netlifyIdentity?.logout();
        });
    });
    
    // Check if the Netlify Identity widget is available now that the page is fully loaded.
    if (window.netlifyIdentity) {
        // Attach to the widget's lifecycle events.
        window.netlifyIdentity.on('init', (user: NetlifyUser | null) => {
            updateAuthState(user);
        });

        window.netlifyIdentity.on('login', (user: NetlifyUser) => {
            updateAuthState(user);
            window.netlifyIdentity.close();
        });

        window.netlifyIdentity.on('logout', () => {
            updateAuthState(null);
            appInitialized = false; // Allow re-initialization if the user logs back in.
        });

        // Manually initialize the widget. This is a robust way to ensure
        // the 'init' event fires after our listeners are attached.
        window.netlifyIdentity.init();
    } else {
        console.error('Netlify Identity widget not found. App cannot authenticate.');
        // Fallback to showing the login page, although it will be non-functional.
        updateAuthState(null);
    }
});
