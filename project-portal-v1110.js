(() => {
  'use strict';
  const style = document.createElement('style');
  style.textContent = '.project-private-expenses .project-card-top{margin-top:84px}.project-private-expenses .project-label{margin-top:15px}';
  document.head.append(style);
  function updatePortal() {
    const grid = document.querySelector('#content .project-grid');
    if (!grid) return;
    const privateCard = grid.querySelector('.project-private-expenses');
    if (privateCard && !privateCard.querySelector('.project-card-cover')) {
      const cover = document.createElement('span');
      cover.className = 'project-card-cover';
      cover.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < 4; i++) cover.append(document.createElement('i'));
      privateCard.prepend(cover);
    }
    const count = Array.from(grid.children).filter(card => card.matches('.project-card:not(.project-card-empty)') && !card.hidden).length;
    const badge = document.querySelector('.project-welcome-count');
    if (!badge) return;
    const number = badge.querySelector('b');
    const label = badge.querySelector('small');
    const word = count % 10 === 1 && count % 100 !== 11 ? 'projekat' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'projekta' : 'projekata';
    if (number && number.textContent !== String(count)) number.textContent = String(count);
    if (label && label.textContent !== word) label.textContent = word;
  }
  new MutationObserver(updatePortal).observe(document.body, {childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
  updatePortal();
})();
