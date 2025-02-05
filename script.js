// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('nav ul');

menuToggle.addEventListener('click', () => {
  navMenu.classList.toggle('active');
  menuToggle.setAttribute('aria-expanded', navMenu.classList.contains('active'));
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Facebook Feed Loader
async function loadFacebookPosts() {
  const container = document.getElementById('facebook-feed-container');
  const spinner = document.querySelector('.loading-spinner');
  const errorElement = document.getElementById('feed-error');

  try {
    container.innerHTML = '';
    errorElement.style.display = 'none';
    spinner.style.display = 'block';

    const response = await fetch('https://rss.app/feeds/YcJYp5AdNjDK7Vmq.xml');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const xml = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");
    const items = xmlDoc.querySelectorAll('item');

    let html = '';
    items.forEach(item => {
      const title = item.querySelector('title').textContent;
      const link = item.querySelector('link').textContent;
      const date = new Date(item.querySelector('pubDate').textContent).toLocaleDateString();
      const image = item.querySelector('media\\:content, content')?.getAttribute('url');

      html += `
        <article class="fb-post">
          ${image ? `<img src="${image}" alt="" loading="lazy">` : ''}
          <h3><a href="${link}" target="_blank" rel="noopener">${title}</a></h3>
          <time datetime="${date}">Posted: ${date}</time>
        </article>
      `;
    });

    container.innerHTML = html;
  } catch (error) {
    errorElement.textContent = 'Failed to load updates. Please try again later.';
    errorElement.style.display = 'block';
    console.error('Feed Error:', error);
  } finally {
    spinner.style.display = 'none';
  }
}

// Intersection Observer for Header
const header = document.querySelector('header');
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px'
};

const headerObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    header.classList.toggle('hidden', !entry.isIntersecting);
  });
}, observerOptions);

headerObserver.observe(header);

// Initialize Feed Loader
window.addEventListener('DOMContentLoaded', loadFacebookPosts);