/**
 * Project detail page — renders layout from hash + handles media controls.
 */
(function initProjectView() {
  const pages = window.PROJECT_PAGES;
  if (!pages) return;

  const els = {
    titleBox: document.getElementById('project-title-box'),
    statement: document.getElementById('project-statement'),
    meta: document.getElementById('project-meta'),
    stage: document.getElementById('project-stage'),
    play: document.getElementById('project-play'),
    expand: document.getElementById('project-expand'),
    prev: document.getElementById('project-nav-prev'),
    next: document.getElementById('project-nav-next'),
    tabs: [...document.querySelectorAll('.project-tab')],
    viewer: document.getElementById('project-viewer'),
    info: document.getElementById('project-info'),
    contact: document.getElementById('project-contact'),
  };

  let currentSlug = '';
  let currentMode = 'photo';
  let mediaIndex = 0;

  function getSlug() {
    return window.location.hash.replace('#', '') || 'precarious-force';
  }

  function getProject() {
    return pages[getSlug()] || pages['precarious-force'];
  }

  function getMediaList(project, mode) {
    const list = project.media?.[mode] ?? [];
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }

  function pickDefaultMode(project) {
    if (getMediaList(project, 'photo').length) return 'photo';
    if (getMediaList(project, 'video').length) return 'video';
    return 'photo';
  }

  function setActiveTab(mode) {
    els.tabs.forEach((tab) => {
      tab.classList.toggle('is-active', tab.dataset.mode === mode);
      tab.disabled = getMediaList(getProject(), tab.dataset.mode).length === 0;
    });
  }

  function renderMeta(project) {
    if (!els.meta) return;
    els.meta.innerHTML = '';

    if (project.contact) {
      const contact = document.createElement('p');
      contact.className = 'project-contact-line';
      contact.innerHTML = `<span class="project-meta__label">Email</span> ${project.contact}`;
      els.meta.appendChild(contact);
      return;
    }

    const rows = [
      ['Materials', project.materials],
      ['Dimensions', project.dimensions],
      ['Year', project.year],
    ].filter(([, value]) => value);

    if (!rows.length) {
      els.meta.hidden = true;
      return;
    }

    els.meta.hidden = false;
    const dl = document.createElement('dl');
    dl.className = 'project-meta__list';

    rows.forEach(([label, value]) => {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      dl.appendChild(dt);
      dl.appendChild(dd);
    });

    els.meta.appendChild(dl);
  }

  function clearStage() {
    els.stage.innerHTML = '';
    els.stage.classList.remove('is-empty');
  }

  function renderStage(project) {
    clearStage();
    const items = getMediaList(project, currentMode);

    if (!items.length) {
      els.stage.classList.add('is-empty');
      const empty = document.createElement('p');
      empty.className = 'project-stage__empty';
      empty.textContent = currentMode === 'video' ? 'Video coming soon' : 'Image coming soon';
      els.stage.appendChild(empty);
      els.play.hidden = true;
      els.expand.hidden = true;
      els.prev.disabled = true;
      els.next.disabled = true;
      return;
    }

    mediaIndex = ((mediaIndex % items.length) + items.length) % items.length;
    const item = items[mediaIndex];

    if (currentMode === 'video') {
      const video = document.createElement('video');
      video.className = 'project-stage__media';
      video.src = item.src;
      video.poster = item.poster || '';
      video.playsInline = true;
      video.preload = 'metadata';
      if (item.alt) video.setAttribute('aria-label', item.alt);
      els.stage.appendChild(video);
      els.play.hidden = false;
      els.expand.hidden = false;
    } else {
      const img = document.createElement('img');
      img.className = 'project-stage__media';
      img.src = item.src;
      img.alt = item.alt || project.title;
      img.decoding = 'async';
      els.stage.appendChild(img);
      els.play.hidden = true;
      els.expand.hidden = false;
    }

    els.prev.disabled = items.length <= 1;
    els.next.disabled = items.length <= 1;
  }

  function renderProject() {
    const project = getProject();
    const slug = project.slug;

    if (slug !== currentSlug) {
      currentMode = pickDefaultMode(project);
      mediaIndex = 0;
    }
    currentSlug = slug;
    document.title = `Portfolio — ${project.title}`;

    if (els.titleBox) els.titleBox.textContent = project.title;
    if (els.statement) els.statement.textContent = project.statement;

    const hasMedia = getMediaList(project, 'photo').length || getMediaList(project, 'video').length;
    if (els.viewer) els.viewer.hidden = !hasMedia && !project.contact;
    if (els.info) els.info.hidden = false;

    setActiveTab(currentMode);
    renderMeta(project);
    renderStage(project);
  }

  function switchMode(mode) {
    const project = getProject();
    if (!getMediaList(project, mode).length) return;
    currentMode = mode;
    mediaIndex = 0;
    setActiveTab(mode);
    renderStage(project);
  }

  function stepMedia(delta) {
    const items = getMediaList(getProject(), currentMode);
    if (items.length <= 1) return;
    mediaIndex = (mediaIndex + delta + items.length) % items.length;
    renderStage(getProject());
  }

  function toggleVideoPlay() {
    const video = els.stage.querySelector('video');
    if (!video) return;
    if (video.paused) {
      video.play();
      els.play.classList.add('is-playing');
      els.play.setAttribute('aria-label', 'Pause video');
    } else {
      video.pause();
      els.play.classList.remove('is-playing');
      els.play.setAttribute('aria-label', 'Play video');
    }
  }

  function expandMedia() {
    const target = els.stage.querySelector('.project-stage-wrap') || els.stage.querySelector('video, img');
    if (!target) return;
    if (target.requestFullscreen) target.requestFullscreen();
    else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
  }

  els.tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchMode(tab.dataset.mode));
  });

  els.prev?.addEventListener('click', () => stepMedia(-1));
  els.next?.addEventListener('click', () => stepMedia(1));
  els.play?.addEventListener('click', toggleVideoPlay);
  els.expand?.addEventListener('click', expandMedia);

  window.addEventListener('hashchange', () => {
    currentMode = pickDefaultMode(getProject());
    mediaIndex = 0;
    renderProject();
  });

  renderProject();
})();
