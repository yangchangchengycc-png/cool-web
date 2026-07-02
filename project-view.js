/**
 * Project detail page — media tabs, YouTube playback, photo lightbox.
 */
(function initProjectView() {
  const pages = window.PROJECT_PAGES;
  if (!pages) return;

  const els = {
    titleBox: document.getElementById('project-title-box'),
    statement: document.getElementById('project-statement'),
    meta: document.getElementById('project-meta'),
    stage: document.getElementById('project-stage'),
    stageWrap: document.querySelector('.project-stage-wrap'),
    play: document.getElementById('project-play'),
    expand: document.getElementById('project-expand'),
    prev: document.getElementById('project-nav-prev'),
    next: document.getElementById('project-nav-next'),
    tabs: [...document.querySelectorAll('.project-tab')],
    viewer: document.getElementById('project-viewer'),
    info: document.getElementById('project-info'),
    lightbox: document.getElementById('project-lightbox'),
    lightboxImage: document.getElementById('project-lightbox-image'),
    lightboxPrev: document.getElementById('project-lightbox-prev'),
    lightboxNext: document.getElementById('project-lightbox-next'),
    lightboxClose: document.getElementById('project-lightbox-close'),
  };

  let currentSlug = '';
  let currentMode = 'photo';
  let mediaIndex = 0;
  let youtubePlaying = false;
  let touchStartY = 0;

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

  function getYouTubeId(item) {
    if (item.youtube) return item.youtube;
    if (!item.src) return '';
    const match = item.src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
    return match ? match[1] : '';
  }

  function buildYouTubeEmbedUrl(id, autoplay = false) {
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      enablejsapi: '1',
      origin: window.location.origin,
    });
    if (autoplay) params.set('autoplay', '1');
    return `https://www.youtube.com/embed/${id}?${params.toString()}`;
  }

  function setActiveTab(mode) {
    els.tabs.forEach((tab) => {
      tab.classList.toggle('is-active', tab.dataset.mode === mode);
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

  function stopYouTube() {
    youtubePlaying = false;
    els.stage?.classList.remove('is-playing');
    els.stageWrap?.classList.remove('is-playing');
    if (els.play) {
      els.play.classList.remove('is-playing');
      els.play.setAttribute('aria-label', 'Play video');
    }
  }

  function clearStage() {
    stopYouTube();
    els.stage.innerHTML = '';
    els.stage.classList.remove('is-empty', 'is-video', 'is-photo');
  }

  function updateChrome(project) {
    const photos = getMediaList(project, 'photo');
    const videos = getMediaList(project, 'video');
    const isPhoto = currentMode === 'photo';
    const isVideo = currentMode === 'video';

    if (els.prev) {
      els.prev.classList.toggle('is-inert', !isPhoto);
      els.prev.disabled = !isPhoto || photos.length <= 1;
    }
    if (els.next) {
      els.next.classList.toggle('is-inert', !isPhoto);
      els.next.disabled = !isPhoto || photos.length <= 1;
    }
    if (els.expand) {
      const showExpand = isPhoto && photos.length > 0;
      els.expand.classList.toggle('is-inert', !showExpand);
      if (showExpand) els.expand.removeAttribute('hidden');
    }
    if (els.play) {
      els.play.hidden = !isVideo || videos.length === 0;
      if (!els.play.hidden) els.play.removeAttribute('hidden');
    }

    els.stageWrap?.classList.toggle('is-video-mode', isVideo && videos.length > 0);
    els.stageWrap?.classList.toggle('is-photo-mode', isPhoto && photos.length > 0);
  }

  function renderPhotoStage(project) {
    const items = getMediaList(project, 'photo');
    if (!items.length) {
      els.stage.classList.add('is-empty');
      const empty = document.createElement('p');
      empty.className = 'project-stage__empty';
      empty.textContent = 'Image coming soon';
      els.stage.appendChild(empty);
      return;
    }

    els.stage.classList.add('is-photo');
    mediaIndex = ((mediaIndex % items.length) + items.length) % items.length;
    const item = items[mediaIndex];
    const img = document.createElement('img');
    img.className = 'project-stage__media';
    img.src = item.src;
    img.alt = item.alt || project.title;
    img.decoding = 'async';
    els.stage.appendChild(img);
  }

  function renderVideoStage(project) {
    const items = getMediaList(project, 'video');
    if (!items.length) {
      els.stage.classList.add('is-empty');
      const empty = document.createElement('p');
      empty.className = 'project-stage__empty';
      empty.textContent = 'Video coming soon';
      els.stage.appendChild(empty);
      return;
    }

    els.stage.classList.add('is-video');
    mediaIndex = ((mediaIndex % items.length) + items.length) % items.length;
    const item = items[mediaIndex];
    const youtubeId = getYouTubeId(item);

    if (item.poster) {
      const poster = document.createElement('img');
      poster.className = 'project-stage__poster';
      poster.src = item.poster;
      poster.alt = item.alt || project.title;
      els.stage.appendChild(poster);
    }

    if (youtubeId) {
      const iframe = document.createElement('iframe');
      iframe.className = 'project-stage__youtube';
      iframe.title = item.alt || `${project.title} video`;
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      iframe.dataset.youtubeId = youtubeId;
      iframe.src = buildYouTubeEmbedUrl(youtubeId, false);
      els.stage.appendChild(iframe);
    } else if (item.src) {
      const video = document.createElement('video');
      video.className = 'project-stage__media';
      video.src = item.src;
      video.poster = item.poster || '';
      video.playsInline = true;
      video.preload = 'metadata';
      if (item.alt) video.setAttribute('aria-label', item.alt);
      els.stage.appendChild(video);
    }

    els.play.hidden = false;
  }

  function renderStage(project) {
    clearStage();
    if (currentMode === 'video') renderVideoStage(project);
    else renderPhotoStage(project);
    updateChrome(project);
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
    if (mode === currentMode) return;
    closeLightbox();
    currentMode = mode;
    mediaIndex = 0;
    setActiveTab(mode);
    renderStage(getProject());
  }

  function stepPhoto(delta) {
    if (currentMode !== 'photo') return;
    const items = getMediaList(getProject(), 'photo');
    if (items.length <= 1) return;
    mediaIndex = (mediaIndex + delta + items.length) % items.length;
    renderStage(getProject());
  }

  function playVideo() {
    if (currentMode !== 'video') return;

    const iframe = els.stage.querySelector('.project-stage__youtube');
    const video = els.stage.querySelector('video');

    if (iframe && !youtubePlaying) {
      const id = iframe.dataset.youtubeId;
      iframe.src = buildYouTubeEmbedUrl(id, true);
      youtubePlaying = true;
      els.stage.classList.add('is-playing');
      els.stageWrap?.classList.add('is-playing');
      els.play.classList.add('is-playing');
      els.play.setAttribute('aria-label', 'Video playing');
      return;
    }

    if (video) {
      if (video.paused) {
        video.play();
        els.stage.classList.add('is-playing');
        els.stageWrap?.classList.add('is-playing');
        els.play.classList.add('is-playing');
        els.play.setAttribute('aria-label', 'Pause video');
      } else {
        video.pause();
        els.stage.classList.remove('is-playing');
        els.stageWrap?.classList.remove('is-playing');
        els.play.classList.remove('is-playing');
        els.play.setAttribute('aria-label', 'Play video');
      }
    }
  }

  function getPhotoItems() {
    return getMediaList(getProject(), 'photo');
  }

  function openLightbox() {
    if (currentMode !== 'photo') return;
    const items = getPhotoItems();
    if (!items.length || !els.lightbox || !els.lightboxImage) return;

    mediaIndex = ((mediaIndex % items.length) + items.length) % items.length;
    els.lightboxImage.src = items[mediaIndex].src;
    els.lightboxImage.alt = items[mediaIndex].alt || getProject().title;
    els.lightbox.hidden = false;
    els.lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('project-lightbox-open');

    const multi = items.length > 1;
    if (els.lightboxPrev) els.lightboxPrev.disabled = !multi;
    if (els.lightboxNext) els.lightboxNext.disabled = !multi;
  }

  function closeLightbox() {
    if (!els.lightbox) return;
    els.lightbox.hidden = true;
    els.lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('project-lightbox-open');
    if (els.lightboxImage) els.lightboxImage.src = '';
  }

  function stepLightbox(delta) {
    const items = getPhotoItems();
    if (items.length <= 1 || !els.lightboxImage) return;
    mediaIndex = (mediaIndex + delta + items.length) % items.length;
    const item = items[mediaIndex];
    els.lightboxImage.src = item.src;
    els.lightboxImage.alt = item.alt || getProject().title;

    const img = els.stage.querySelector('.project-stage__media');
    if (img) {
      img.src = item.src;
      img.alt = item.alt || getProject().title;
    }
  }

  els.tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchMode(tab.dataset.mode));
  });

  els.prev?.addEventListener('click', () => stepPhoto(-1));
  els.next?.addEventListener('click', () => stepPhoto(1));
  els.play?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    playVideo();
  });

  els.stageWrap?.addEventListener('click', (event) => {
    if (currentMode !== 'video' || youtubePlaying) return;
    if (event.target.closest('.project-play, .project-expand')) return;
    playVideo();
  });
  els.expand?.addEventListener('click', openLightbox);
  els.lightboxClose?.addEventListener('click', closeLightbox);
  els.lightboxPrev?.addEventListener('click', () => stepLightbox(-1));
  els.lightboxNext?.addEventListener('click', () => stepLightbox(1));

  els.lightbox?.addEventListener('click', (event) => {
    if (event.target === els.lightbox) closeLightbox();
  });

  els.lightbox?.addEventListener('touchstart', (event) => {
    touchStartY = event.changedTouches[0]?.clientY ?? 0;
  }, { passive: true });

  els.lightbox?.addEventListener('touchend', (event) => {
    const touchEndY = event.changedTouches[0]?.clientY ?? 0;
    const deltaY = touchStartY - touchEndY;
    if (Math.abs(deltaY) < 40) return;
    stepLightbox(deltaY > 0 ? 1 : -1);
  }, { passive: true });

  els.lightbox?.addEventListener('wheel', (event) => {
    if (els.lightbox.hidden) return;
    event.preventDefault();
    stepLightbox(event.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  window.addEventListener('keydown', (event) => {
    if (els.lightbox?.hidden) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowUp') stepLightbox(-1);
    if (event.key === 'ArrowDown') stepLightbox(1);
  });

  window.addEventListener('hashchange', () => {
    closeLightbox();
    currentMode = pickDefaultMode(getProject());
    mediaIndex = 0;
    renderProject();
  });

  renderProject();
})();
