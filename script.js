// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('nav ul');

menuToggle.addEventListener('click', () => {
  navMenu.classList.toggle('active');
  const isExpanded = navMenu.classList.contains('active');
  menuToggle.setAttribute('aria-expanded', isExpanded);

    // Rotate the menu toggle icon for a visual cue
   menuToggle.style.transform = isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
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

      // Close mobile menu after clicking a link.  Important for UX.
      if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', false);
            menuToggle.style.transform = 'rotate(0deg)';
      }
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

    items.forEach(item => {
      const title = item.querySelector('title').textContent;
      const link = item.querySelector('link').textContent;
      const date = new Date(item.querySelector('pubDate').textContent).toLocaleDateString();
      const image = item.querySelector('media\\:content, content')?.getAttribute('url');

      const article = document.createElement('article');
        article.classList.add('fb-post');
        article.style.animation = 'fadeIn 0.8s ease forwards'; // Apply fadeIn

        let contentHTML = '';
        if(image){
          const img = document.createElement('img');
            img.src = image;
            img.alt = title; // More descriptive alt text
            img.loading = "lazy"; // Ensure lazy loading
            contentHTML += img.outerHTML;
        }
      contentHTML += `<h3><a href="${link}" target="_blank" rel="noopener">${title}</a></h3>`;
      contentHTML += `<time datetime="${date}">Posted: ${date}</time>`;
      article.innerHTML = contentHTML;
      container.appendChild(article);
    });

    if (items.length === 0) {
        errorElement.textContent = 'No updates found.';
        errorElement.style.display = 'block';
    }

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
  threshold: 0,  // Trigger as soon as any part of the header leaves
  rootMargin: '-1px 0px 0px 0px' // Add a small negative margin
};

const headerObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    // Use more specific condition, checking if the top of the header is above the viewport
    header.classList.toggle('hidden', !entry.isIntersecting && window.scrollY > header.offsetHeight );
  });
}, observerOptions);

headerObserver.observe(header);

// Initialize Feed Loader
window.addEventListener('DOMContentLoaded', loadFacebookPosts);
