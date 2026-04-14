// Community tab is mostly static HTML.
// This module handles any minor interactive behaviors.

export function initCommunity() {
  // Founder card hover accent effect (optional enhancement)
  document.querySelectorAll('.founder-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const avatar = card.querySelector('.founder-avatar');
      if (avatar) avatar.style.transform = 'scale(1.05)';
    });
    card.addEventListener('mouseleave', () => {
      const avatar = card.querySelector('.founder-avatar');
      if (avatar) avatar.style.transform = 'scale(1)';
    });
  });

  // Thread reply count animate-in
  document.querySelectorAll('.thread-meta span:first-child').forEach(el => {
    const num = parseInt(el.textContent);
    if (isNaN(num)) return;
    let count = 0;
    const target = num;
    const step = Math.ceil(target / 20);
    const timer = setInterval(() => {
      count = Math.min(count + step, target);
      el.textContent = `${count} replies`;
      if (count >= target) clearInterval(timer);
    }, 30);
  });
}
