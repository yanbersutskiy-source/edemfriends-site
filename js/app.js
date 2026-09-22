(() => {
  'use strict';

  const cfg = window.EDEM_CONFIG || {};
  const products = Array.isArray(window.EDEM_PRODUCTS) ? window.EDEM_PRODUCTS : [];
  const formatUAH = value => new Intl.NumberFormat('uk-UA').format(Math.round(value));
  const isUsableUrl = value => typeof value === 'string' && /^https?:\/\//i.test(value.trim());

  const setExternalLink = (selector, url, optional = false) => {
    document.querySelectorAll(selector).forEach(link => {
      if (!isUsableUrl(url)) {
        link.removeAttribute('href');
        if (optional) link.hidden = true;
        return;
      }
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.hidden = false;
    });
  };

  setExternalLink('[data-telegram]', cfg.telegramUrl);
  setExternalLink('[data-instagram]', cfg.instagramUrl, true);
  setExternalLink('[data-reports]', cfg.reportsUrl, true);

  const grid = document.querySelector('[data-product-grid]');
  if (grid) {
    grid.innerHTML = products.map(product => `
      <article class="product-card" data-product-id="${product.id}">
        <button class="product-image-wrap js-open-product" type="button" aria-label="Відкрити картку хустинки «${product.name}»">
          <img src="${product.main}" alt="Собака в хустинці «${product.name}»" loading="lazy" width="1024" height="1280">
        </button>
        <div class="product-card-body">
          <h3>${product.name}</h3>
          <p class="product-mood">${product.mood}</p>
          <div class="product-price-row">
            <span class="product-price">${formatUAH(product.price)} грн</span>
            <button class="details-button js-open-product" type="button">Детальніше <img class="icon" src="assets/icons/arrow-right.svg" alt=""></button>
          </div>
        </div>
      </article>
    `).join('');
  }

  const header = document.querySelector('[data-site-header]');
  const menuButton = document.querySelector('[data-menu-button]');
  const navigation = document.querySelector('[data-navigation]');
  const closeMenu = ({ restoreFocus = false } = {}) => {
    if (!header || !menuButton) return;
    header.classList.remove('menu-is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Відкрити меню');
    document.body.classList.remove('menu-open');
    if (restoreFocus) menuButton.focus();
  };

  menuButton?.addEventListener('click', () => {
    const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
    if (!willOpen) {
      closeMenu();
      return;
    }
    header.classList.add('menu-is-open');
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Закрити меню');
    document.body.classList.add('menu-open');
    navigation?.querySelector('a')?.focus();
  });
  navigation?.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) closeMenu();
  });

  const backdrop = document.querySelector('[data-modal-backdrop]');
  const modal = document.querySelector('[data-product-modal]');
  const closeButton = document.querySelector('[data-modal-close]');
  const mainImage = document.querySelector('[data-modal-main-image]');
  const thumbs = document.querySelector('[data-modal-thumbs]');
  const previousButton = document.querySelector('[data-gallery-prev]');
  const nextButton = document.querySelector('[data-gallery-next]');
  const galleryStatus = document.querySelector('[data-gallery-status]');
  const swipeTarget = document.querySelector('[data-swipe-target]');
  let currentProduct = null;
  let currentIndex = 0;
  let pointerStartX = null;
  let pointerStartY = null;
  let touchStartX = null;
  let touchStartY = null;
  let lastFocusedElement = null;

  const getGallery = () => currentProduct?.gallery?.filter(Boolean) || [];
  const renderGallery = () => {
    const gallery = getGallery();
    if (!mainImage || gallery.length === 0) return;
    currentIndex = Math.min(currentIndex, gallery.length - 1);
    mainImage.src = gallery[currentIndex];
    mainImage.alt = `Хустинка «${currentProduct.name}», фото ${currentIndex + 1} з ${gallery.length}`;
    swipeTarget?.classList.toggle('is-size-guide', /-size\.(?:jpe?g|png|webp)$/i.test(gallery[currentIndex]));
    if (galleryStatus) galleryStatus.textContent = `${currentIndex + 1} / ${gallery.length}`;

    const hasMultipleImages = gallery.length > 1;
    if (previousButton) previousButton.hidden = !hasMultipleImages;
    if (nextButton) nextButton.hidden = !hasMultipleImages;
    if (thumbs) {
      thumbs.hidden = !hasMultipleImages;
      thumbs.style.setProperty('--thumb-count', String(Math.min(gallery.length, 5)));
      thumbs.innerHTML = gallery.map((src, index) => `
        <button class="thumb ${index === currentIndex ? 'is-active' : ''}" type="button" data-thumb-index="${index}" aria-label="Показати фото ${index + 1} з ${gallery.length}" aria-current="${index === currentIndex ? 'true' : 'false'}">
          <img src="${src}" alt="" loading="lazy">
        </button>
      `).join('');
    }
  };

  const fillProduct = product => {
    currentProduct = product;
    currentIndex = 0;
    document.querySelector('[data-modal-title]').textContent = product.name;
    document.querySelector('[data-modal-price]').textContent = `${formatUAH(product.price)} грн`;
    document.querySelector('[data-modal-character]').textContent = product.character;
    document.querySelector('[data-modal-description]').textContent = product.description;
    document.querySelector('[data-modal-mood]').textContent = product.mood;
    document.querySelectorAll('[data-modal-order]').forEach(link => {
      link.href = cfg.telegramUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('aria-label', `Замовити хустинку «${product.name}» у Telegram`);
    });
    renderGallery();
  };

  const openModal = productId => {
    const product = products.find(item => item.id === productId);
    if (!product || !backdrop || !modal) return;
    closeMenu();
    lastFocusedElement = document.activeElement;
    fillProduct(product);
    modal.scrollTop = 0;
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    window.setTimeout(() => closeButton?.focus(), 0);
  };

  const closeModal = () => {
    if (!backdrop?.classList.contains('is-open')) return;
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocusedElement instanceof HTMLElement && lastFocusedElement.isConnected) lastFocusedElement.focus();
  };

  const moveGallery = delta => {
    const gallery = getGallery();
    if (gallery.length < 2) return;
    currentIndex = (currentIndex + delta + gallery.length) % gallery.length;
    renderGallery();
  };

  document.addEventListener('click', event => {
    const opener = event.target.closest('.js-open-product');
    if (opener) {
      const card = opener.closest('[data-product-id]');
      if (card) openModal(card.dataset.productId);
    }
    const thumb = event.target.closest('[data-thumb-index]');
    if (thumb) {
      currentIndex = Number(thumb.dataset.thumbIndex);
      renderGallery();
    }
  });
  closeButton?.addEventListener('click', closeModal);
  let lastGalleryControlTouch = 0;
  const bindGalleryControl = (button, direction) => {
    if (!button) return;
    button.addEventListener('touchend', event => {
      event.preventDefault();
      event.stopPropagation();
      lastGalleryControlTouch = Date.now();
      moveGallery(direction);
    }, { passive: false });
    button.addEventListener('click', event => {
      event.stopPropagation();
      if (Date.now() - lastGalleryControlTouch < 500) return;
      moveGallery(direction);
    });
  };
  bindGalleryControl(previousButton, -1);
  bindGalleryControl(nextButton, 1);
  backdrop?.addEventListener('click', event => {
    if (event.target === backdrop) closeModal();
  });

  document.addEventListener('keydown', event => {
    const modalIsOpen = backdrop?.classList.contains('is-open');
    if (!modalIsOpen) {
      if (event.key === 'Escape' && header?.classList.contains('menu-is-open')) closeMenu({ restoreFocus: true });
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key === 'ArrowLeft') moveGallery(-1);
    if (event.key === 'ArrowRight') moveGallery(1);
    if (event.key === 'Tab' && modal) {
      const focusable = [...modal.querySelectorAll('a[href], button:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"])')]
        .filter(element => !element.hidden && element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const getSwipeDirection = (startX, startY, endX, endY) => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return 0;
    return deltaX > 0 ? -1 : 1;
  };
  const resetPointerSwipe = () => {
    pointerStartX = null;
    pointerStartY = null;
  };
  const resetTouchSwipe = () => {
    touchStartX = null;
    touchStartY = null;
  };
  const handlePointerSwipe = event => {
    if (pointerStartX === null || pointerStartY === null) return false;
    const direction = getSwipeDirection(pointerStartX, pointerStartY, event.clientX, event.clientY);
    if (!direction) return false;
    moveGallery(direction);
    resetPointerSwipe();
    return true;
  };

  swipeTarget?.addEventListener('pointerdown', event => {
    if (event.target.closest('button')) return;
    if (event.pointerType === 'touch' || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    swipeTarget.setPointerCapture?.(event.pointerId);
  });
  swipeTarget?.addEventListener('pointermove', handlePointerSwipe);
  swipeTarget?.addEventListener('pointerup', event => {
    handlePointerSwipe(event);
    resetPointerSwipe();
  });
  swipeTarget?.addEventListener('pointercancel', resetPointerSwipe);

  swipeTarget?.addEventListener('touchstart', event => {
    if (event.target.closest('button')) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });
  swipeTarget?.addEventListener('touchmove', event => {
    if (touchStartX === null || touchStartY === null) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const direction = getSwipeDirection(touchStartX, touchStartY, touch.clientX, touch.clientY);
    if (!direction) return;
    event.preventDefault();
    moveGallery(direction);
    resetTouchSwipe();
  }, { passive: false });
  swipeTarget?.addEventListener('touchend', event => {
    if (touchStartX !== null && touchStartY !== null) {
      const touch = event.changedTouches[0];
      const direction = touch && getSwipeDirection(touchStartX, touchStartY, touch.clientX, touch.clientY);
      if (direction) moveGallery(direction);
    }
    resetTouchSwipe();
  }, { passive: true });
  swipeTarget?.addEventListener('touchcancel', resetTouchSwipe, { passive: true });
  document.querySelector('[data-gallery-expand]')?.addEventListener('click', () => {
    if (mainImage?.requestFullscreen) mainImage.requestFullscreen();
  });

  const progressTrack = document.querySelector('[data-progress-track]');
  const progressNote = document.querySelector('[data-progress-note]');
  const goal = Number(cfg.goalAmount) > 0 ? Number(cfg.goalAmount) : 100000;
  document.querySelectorAll('[data-goal]').forEach(element => { element.textContent = formatUAH(goal); });
  if (progressTrack) progressTrack.setAttribute('aria-valuemax', String(goal));

  const applyRaisedAmount = raised => {
    const safeAmount = Math.max(0, Number(raised));
    if (!Number.isFinite(safeAmount)) return;
    const percentage = Math.min(100, safeAmount / goal * 100);
    document.querySelectorAll('[data-raised]').forEach(element => { element.textContent = formatUAH(safeAmount); });
    document.querySelectorAll('[data-progress-percent]').forEach(element => { element.textContent = `${Math.round(percentage)}%`; });
    document.querySelectorAll('[data-progress-fill]').forEach(element => { element.style.width = `${percentage}%`; });
    if (progressTrack) progressTrack.setAttribute('aria-valuenow', String(safeAmount));
    if (progressNote) progressNote.textContent = 'Суму оновлено за підтвердженими даними.';
  };

  const parseRaisedAmount = csv => {
    const cells = csv.split(/[\n;\t,]/).map(value => value.trim()).filter(Boolean);
    for (const cell of cells) {
      const normalized = cell.replace(/\s/g, '').replace(/[^0-9.-]/g, '');
      const amount = Number(normalized);
      if (Number.isFinite(amount) && amount >= 0) return amount;
    }
    return null;
  };

  const hasManualAmount = cfg.manualRaisedAmount !== null && cfg.manualRaisedAmount !== '' && Number.isFinite(Number(cfg.manualRaisedAmount));
  if (hasManualAmount) applyRaisedAmount(cfg.manualRaisedAmount);
  if (isUsableUrl(cfg.googleSheetsCsvUrl)) {
    fetch(cfg.googleSheetsCsvUrl, { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error(`Google Sheets HTTP ${response.status}`);
        return response.text();
      })
      .then(csv => {
        const amount = parseRaisedAmount(csv);
        if (amount === null) throw new Error('У CSV немає числового значення');
        applyRaisedAmount(amount);
      })
      .catch(error => console.warn('Не вдалося оновити підтверджену суму:', error));
  }
})();
