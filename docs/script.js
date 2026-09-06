'use strict';

const filters = document.querySelector('.scale-filters');
const filterButtons = [...filters.querySelectorAll('button')];
const models = [...document.querySelectorAll('.model')];
const status = document.getElementById('filter-status');

function filterModels(scale, announce = true) {
  filterButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.scale === scale));
  });

  let visibleCount = 0;
  models.forEach(model => {
    model.hidden = scale !== 'all' && model.dataset.modelScale !== scale;
    if (!model.hidden) visibleCount += 1;
  });

  if (announce) {
    status.textContent = `${visibleCount} ${visibleCount === 1 ? 'model' : 'models'} shown${scale === 'all' ? '.' : ` at ${scale}× scale.`}`;
  }
}

filterButtons.forEach(button => {
  button.addEventListener('click', () => filterModels(button.dataset.scale));
});
filters.hidden = false;

function openLinkedModel() {
  const model = models.find(item => `#${item.id}` === window.location.hash);
  if (!model) return;
  filterModels('all', false);
  model.open = true;
  model.scrollIntoView({ block: 'start', behavior: 'instant' });
}

window.addEventListener('hashchange', openLinkedModel);
openLinkedModel();
