// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('nav ul');

menuToggle.addEventListener('click', () => {
    const isExpanded = navMenu.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', isExpanded);
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = document.querySelector('header').offsetHeight;
            const elementPosition = target.offsetTop;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // Close mobile menu
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', false);
            }
        }
    });
});

// Facebook Feed Loader (same as before - no changes needed here)
async function loadFacebookPosts() {
    const container = document.getElementById('facebook-feed-container');
    const spinner = document.querySelector('.loading-spinner');
    const errorElement = document.getElementById('feed-error');

    try {
        container.innerHTML = '';
        errorElement.style.display = 'none';
        spinner.style.display = 'block';

        const response = await fetch('https://rss.app/feeds/YcJYp5AdNjDK7Vmq.xml');
        if (!response.ok) {
             throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const xml = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "text/xml");
        const items = xmlDoc.querySelectorAll('item');

        if (items.length === 0) {
          errorElement.textContent = 'No updates found.';
          errorElement.style.display = 'block';
          return;
        }

        items.forEach((item, index) => {
            const title = item.querySelector('title').textContent;
            const link = item.querySelector('link').textContent;
            const date = new Date(item.querySelector('pubDate').textContent).toLocaleDateString();
            const mediaContents = item.querySelectorAll('media\\:content, content');
            let image = null;

            for (const media of mediaContents) {
                const url = media.getAttribute('url');
                if (url && (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.jpeg') || url.endsWith('.gif'))) {
                    image = url;
                    break;
                }
            }

            const article = document.createElement('article');
            article.classList.add('fb-post');
            article.style.animationDelay = `${index * 0.1}s`;

            let contentHTML = '';

             if (image) {
                const imgElement = document.createElement('img');
                imgElement.src = image;
                imgElement.alt = title;
                imgElement.loading = "lazy";
                contentHTML += imgElement.outerHTML;
            }

            contentHTML += `<h3><a href="${link}" target="_blank" rel="noopener">${title}</a></h3>`;
            contentHTML += `<time datetime="${date}">Posted: ${date}</time>`;
            article.innerHTML = contentHTML;
            container.appendChild(article);
        });

    } catch (error) {
        errorElement.textContent = 'Failed to load updates. Please try again later.';
        errorElement.style.display = 'block';
        console.error('Feed Error:', error);
    } finally {
        spinner.style.display = 'none';
    }
}

// Intersection Observer for Header (same as before - no changes needed here)
const header = document.querySelector('header');
const heroSection = document.querySelector('.hero');

const headerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        header.classList.toggle('hidden', !entry.isIntersecting && window.scrollY > heroSection.offsetHeight);
    });
}, {
    rootMargin: '-1px 0px 0px 0px',
    threshold: 0
});
headerObserver.observe(heroSection);

// Initialize
window.addEventListener('DOMContentLoaded', loadFacebookPosts);


