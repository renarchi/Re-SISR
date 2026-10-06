(function () {
  'use strict';

  function buildCatalog(data) {
    if (!data || !Number.isFinite(data.width) || data.width <= 0 ||
        !Number.isFinite(data.height) || data.height <= 0 || !Array.isArray(data.models) || !data.models.length) {
      throw new Error('Comparison data is unavailable.');
    }
    const ids = new Set();
    const models = data.models.map(model => {
      if (!model || ['id', 'name', 'src', 'method'].some(key => typeof model[key] !== 'string' || !model[key].trim()) || ids.has(model.id)) {
        throw new Error('Comparison model data is incomplete.');
      }
      ids.add(model.id);
      return { ...model, name: model.name.replace(/^Anime4K_/, '') };
    });
    return {
      width: data.width,
      height: data.height,
      models,
      defaults: [ids.has('marina') ? 'marina' : models[0].id,
        ids.has('Upscale_CNN_x2_S') ? 'Upscale_CNN_x2_S' : (models[1] || models[0]).id]
    };
  }

  function createCamera(imageWidth, imageHeight) {
    let width = 1;
    let height = 1;
    let scale = 1;
    let x = 0;
    let y = 0;
    let fitted = true;
    const fitScale = () => Math.min(width / imageWidth, height / imageHeight);
    const clamp = (value, size, viewport) => size <= viewport ? (viewport - size) / 2 : Math.min(0, Math.max(viewport - size, value));
    function constrain() {
      x = clamp(x, imageWidth * scale, width);
      y = clamp(y, imageHeight * scale, height);
      // At 1:1, half-pixel centering or fractional pointer motion blurs pixels.
      if (scale === 1) {
        x = Math.round(x);
        y = Math.round(y);
      }
    }
    function fit() {
      fitted = true;
      scale = fitScale();
      x = (width - imageWidth * scale) / 2;
      y = (height - imageHeight * scale) / 2;
      constrain();
    }
    function setScale(value, anchorX = width / 2, anchorY = height / 2) {
      const next = Math.max(Math.min(1, fitScale()), Math.min(Math.max(8, fitScale()), value));
      x = anchorX - (anchorX - x) * next / scale;
      y = anchorY - (anchorY - y) * next / scale;
      scale = next;
      fitted = false;
      constrain();
    }
    function zoom(factor, anchorX, anchorY) {
      setScale(scale * factor, anchorX, anchorY);
    }
    return {
      fit,
      zoom,
      resize(nextWidth, nextHeight) {
        if (nextWidth <= 0 || nextHeight <= 0) return;
        x += (nextWidth - width) / 2;
        y += (nextHeight - height) / 2;
        width = nextWidth;
        height = nextHeight;
        if (fitted) fit();
        // Reconcile zoom bounds now, before the next zoom gesture uses them.
        else setScale(scale);
      },
      oneToOne() { setScale(1); },
      pan(dx, dy) { x += dx; y += dy; constrain(); },
      getView() { return { scale, x, y }; }
    };
  }

  function createPairLoader(loadImage) {
    return (left, right) => {
      // Only this selection is requested. The browser handles reuse through its HTTP cache.
      const pending = new Map();
      return Promise.all([left, right].map(model => {
        if (!pending.has(model.src)) pending.set(model.src, Promise.resolve().then(() => loadImage(model.src)));
        return pending.get(model.src);
      }));
    };
  }

  // Keep the data, geometry and loading behavior runnable in dependency-free Node tests.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildCatalog, createCamera, createPairLoader };
  }
  if (typeof document === 'undefined') return;

  const get = id => document.getElementById(`comparison-${id}`);
  const viewer = get('viewer');
  if (!viewer) return;
  const stage = get('stage');
  // Programmatic focus after preventDefault can retain keyboard focus rings.
  viewer.addEventListener('pointerdown', () => { viewer.dataset.pointerFocus = 'true'; }, true);
  document.addEventListener('keydown', () => { viewer.dataset.pointerFocus = 'false'; }, true);
  const divider = get('divider');
  const status = get('status');
  const empty = get('empty');
  const retry = get('retry');
  const selectors = [get('left'), get('right')];
  const layers = [get('image-left'), get('image-right')];
  let catalog;
  try { catalog = buildCatalog(window.COMPARISON_DATA); }
  catch (_) {
    status.textContent = 'The comparison will be available when its images and model data are ready.';
    return;
  }

  const camera = createCamera(catalog.width, catalog.height);
  const byId = new Map(catalog.models.map(model => [model.id, model]));
  let images = [];
  let ready = false;
  let active = false;
  let request = 0;
  let split = 50;
  const pointers = new Map();
  let dividerPointer = null;
  let dividerTouchPoint = null;
  let tap = null;
  let lastTap = null;

  function render() {
    const view = camera.getView();
    images.forEach(image => {
      image.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
    });
    get('zoom').textContent = `${Math.round(view.scale * 100)}%`;
  }

  function resize() {
    camera.resize(stage.clientWidth, stage.clientHeight);
    render();
    setSplit(split);
  }

  function setSplit(value) {
    split = Math.max(0, Math.min(100, value));
    stage.style.setProperty('--comparison-split', `${split}%`);
    // The handle stays fully reachable while the clipping boundary can reach 0 / 100%.
    const position = stage.clientWidth * split / 100;
    const handlePosition = Math.max(22, Math.min(stage.clientWidth - 22, position));
    divider.style.setProperty('--comparison-line-offset', `${position - handlePosition + 22}px`);
    divider.setAttribute('aria-valuenow', String(Math.round(split)));
    divider.setAttribute('aria-valuetext', `${Math.round(split)}% left model, ${Math.round(100 - split)}% right model`);
  }

  selectors.forEach((select, index) => {
    catalog.models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      select.append(option);
    });
    select.value = catalog.defaults[index];
    select.addEventListener('change', () => { if (active) loadSelection(); else updateMetadata(); });
  });

  function selectedModels() { return selectors.map(select => byId.get(select.value)); }

  function updateMetadata() {
    selectedModels().forEach((model, index) => {
      const side = index === 0 ? 'left' : 'right';
      const parameters = typeof model.parameters === 'number' ? model.parameters.toLocaleString('en-US') : model.parameters;
      get(`${side}-parameters`).textContent = `Parameters: ${parameters ?? 'Not provided'}`;
    });
  }

  const loadPair = createPairLoader(src => new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = async () => {
      try {
        if (image.decode) await image.decode();
        if (image.naturalWidth !== catalog.width || image.naturalHeight !== catalog.height) {
          throw new Error('Image dimensions do not match the comparison.');
        }
        resolve(image);
      } catch (error) { reject(error); }
    };
    image.onerror = () => reject(new Error('Image unavailable.'));
    image.src = src;
  }));

  async function loadSelection() {
    const currentRequest = ++request;
    const pair = selectedModels();
    ready = false;
    pointers.clear();
    tap = lastTap = null;
    stage.classList.remove('is-ready', 'is-dragging');
    stage.setAttribute('aria-busy', 'true');
    divider.hidden = true;
    divider.setAttribute('aria-disabled', 'true');
    retry.hidden = true;
    empty.hidden = false;
    empty.textContent = 'Loading selected images…';
    updateMetadata();
    status.textContent = `Loading ${pair[0].name} and ${pair[1].name}…`;
    try {
      const loaded = await loadPair(pair[0], pair[1]);
      if (currentRequest !== request) return;
      // Duplicate choices need separate DOM nodes but only one image request.
      images = loaded.map((image, index) => {
        const node = index === 1 && image === loaded[0] ? image.cloneNode() : image;
        node.alt = `${index === 0 ? 'Left' : 'Right'}: ${pair[index].name}`;
        node.width = catalog.width;
        node.height = catalog.height;
        node.draggable = false;
        layers[index].replaceChildren(node);
        return node;
      });
      render();
      ready = true;
      stage.classList.add('is-ready');
      divider.hidden = false;
      divider.setAttribute('aria-disabled', 'false');
      empty.hidden = true;
      status.textContent = `${pair[0].name} / ${pair[1].name} · ${catalog.width} × ${catalog.height}`;
    } catch (_) {
      if (currentRequest !== request) return;
      empty.textContent = 'The selected images could not be displayed.';
      status.textContent = 'Choose another model or retry. Both images must be available at the comparison dimensions.';
      retry.hidden = false;
    } finally {
      if (currentRequest === request) stage.setAttribute('aria-busy', 'false');
    }
  }

  get('controls').disabled = false;
  updateMetadata();
  retry.addEventListener('click', loadSelection);
  stage.addEventListener('dblclick', event => {
    if (!ready || event.target.closest('.comparison-divider')) return;
    event.preventDefault();
    camera.fit();
    render();
  });

  function localPoint(event) {
    const bounds = stage.getBoundingClientRect();
    return { x: event.clientX - bounds.left - stage.clientLeft, y: event.clientY - bounds.top - stage.clientTop };
  }

  function moveDivider(event) { setSplit(localPoint(event).x / stage.clientWidth * 100); }

  divider.addEventListener('pointerdown', event => {
    if (!ready || event.button !== 0) return;
    // A second finger belongs to the pinch gesture, even over the divider.
    if (event.pointerType === 'touch' && (pointers.size || dividerPointer !== null)) return;
    event.preventDefault();
    event.stopPropagation();
    dividerPointer = event.pointerId;
    dividerTouchPoint = event.pointerType === 'touch' ? localPoint(event) : null;
    divider.focus({ preventScroll: true });
    divider.setPointerCapture(event.pointerId);
    moveDivider(event);
  });
  divider.addEventListener('pointermove', event => {
    if (event.pointerId === dividerPointer) {
      if (event.pointerType === 'touch') dividerTouchPoint = localPoint(event);
      moveDivider(event);
    }
  });
  divider.addEventListener('lostpointercapture', () => { dividerPointer = null; dividerTouchPoint = null; });
  divider.addEventListener('keydown', event => {
    const step = event.shiftKey ? 10 : 1;
    const values = { ArrowLeft: split - step, ArrowRight: split + step, Home: 0, End: 100 };
    if (!ready || !(event.key in values)) return;
    event.preventDefault();
    event.stopPropagation();
    setSplit(values[event.key]);
  });

  function gesture() {
    const points = [...pointers.values()];
    if (points.length < 2) return { ...points[0], distance: 0 };
    return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2,
      distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) };
  }

  stage.addEventListener('pointerdown', event => {
    const joiningTouch = event.pointerType === 'touch' && (pointers.size || dividerPointer !== null);
    if (!ready || event.button !== 0 || (event.target.closest('.comparison-divider') && !joiningTouch)) return;
    if (joiningTouch && dividerPointer !== null && dividerTouchPoint) {
      const previous = dividerPointer;
      pointers.set(previous, dividerTouchPoint);
      stage.setPointerCapture(previous);
      dividerPointer = null;
      dividerTouchPoint = null;
    }
    event.preventDefault();
    stage.focus({ preventScroll: true });
    pointers.set(event.pointerId, localPoint(event));
    if (event.pointerType === 'touch' && pointers.size === 1) {
      tap = { ...localPoint(event), time: performance.now() };
    } else tap = lastTap = null;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    const before = gesture();
    pointers.set(event.pointerId, localPoint(event));
    if (tap && Math.hypot(localPoint(event).x - tap.x, localPoint(event).y - tap.y) > 8) tap = lastTap = null;
    const after = gesture();
    if (before.distance > 0 && after.distance > 0) camera.zoom(after.distance / before.distance, before.x, before.y);
    camera.pan(after.x - before.x, after.y - before.y);
    render();
  });
  function releasePointer(event) {
    if (event.type === 'pointerup' && event.pointerType === 'touch' && tap && pointers.size === 1) {
      const now = performance.now();
      if (now - tap.time < 300) {
        if (lastTap && now - lastTap.time < 320 && Math.hypot(tap.x - lastTap.x, tap.y - lastTap.y) < 24) {
          camera.fit(); render(); lastTap = null;
        } else lastTap = { ...tap, time: now };
      } else lastTap = null;
    }
    tap = null;
    if (event.type === 'pointercancel') lastTap = null;
    pointers.delete(event.pointerId);
    if (!pointers.size) stage.classList.remove('is-dragging');
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => stage.addEventListener(type, releasePointer));
  stage.addEventListener('wheel', event => {
    if (!ready) return;
    event.preventDefault();
    const point = localPoint(event);
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1);
    camera.zoom(Math.exp(-Math.max(-240, Math.min(240, delta)) * 0.002), point.x, point.y);
    render();
  }, { passive: false });
  stage.addEventListener('keydown', event => {
    if (!ready || event.target !== stage || event.ctrlKey || event.metaKey || event.altKey) return;
    const step = event.shiftKey ? 100 : 32;
    const actions = {
      ArrowLeft: () => camera.pan(step, 0), ArrowRight: () => camera.pan(-step, 0),
      ArrowUp: () => camera.pan(0, step), ArrowDown: () => camera.pan(0, -step),
      '+': () => camera.zoom(1.25), '=': () => camera.zoom(1.25), '-': () => camera.zoom(0.8),
      '0': () => camera.fit()
    };
    if (!Object.hasOwn(actions, event.key)) return;
    event.preventDefault();
    actions[event.key]();
    render();
  });

  const fullscreen = get('fullscreen');
  fullscreen.disabled = !document.fullscreenEnabled || !viewer.requestFullscreen;
  if (fullscreen.disabled) fullscreen.title = 'Fullscreen is not supported in this browser.';
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === viewer) await document.exitFullscreen();
      else await viewer.requestFullscreen();
    } catch (_) { status.textContent = 'Fullscreen is unavailable. You can still zoom and pan here.'; }
  });
  document.addEventListener('fullscreenchange', () => {
    const expanded = document.fullscreenElement === viewer;
    fullscreen.textContent = expanded ? 'Exit fullscreen' : 'Fullscreen';
    fullscreen.setAttribute('aria-pressed', String(expanded));
    resize();
  });

  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize);

  function activate() {
    if (active) return;
    active = true;
    loadSelection();
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); activate(); }
    }, { rootMargin: '200px' });
    observer.observe(viewer);
    viewer.addEventListener('focusin', activate, { once: true });
  } else activate();
})();
