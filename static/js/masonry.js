const initMagnifier = (dialog, img) => {
  const handlePointerMove = (e) => {
    const isTouch = e.touches && e.touches.length > 0;
    const pointerEvent = isTouch ? e.touches[0] : e;

    const rect = img.getBoundingClientRect();
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = rect.width / rect.height;

    let renderWidth, renderHeight, renderLeft, renderTop;

    if (containerRatio > imgRatio) {
      renderHeight = rect.height;
      renderWidth = rect.height * imgRatio;
      renderLeft = (rect.width - renderWidth) / 2;
      renderTop = 0;
    } else {
      renderWidth = rect.width;
      renderHeight = rect.width / imgRatio;
      renderLeft = 0;
      renderTop = (rect.height - renderHeight) / 2;
    }

    const glassSize = renderWidth / 1.5;
    glass.style.width = `${glassSize}px`;
    glass.style.height = `${glassSize}px`;

    // Exakte Position relativ zum sichtbaren Bild berechnen
    const rawX = pointerEvent.clientX - rect.left - renderLeft;
    const rawY = pointerEvent.clientY - rect.top - renderTop;

    // Clamping für die Lupe selbst (Bewegungsgrenzen)
    const x = Math.max(0, Math.min(rawX, renderWidth));
    const y = Math.max(0, Math.min(rawY, renderHeight));

    // Randerkennung zum Ausblenden
    if (rawX < 0 || rawX > renderWidth || rawY < 0 || rawY > renderHeight) {
      hideGlass();
    } else {
      showGlass();
    }

    // Hintergrundgröße der Lupe anpassen
    const bgWidth = renderWidth * zoom;
    const bgHeight = renderHeight * zoom;
    glass.style.backgroundSize = `${bgWidth}px ${bgHeight}px`;

    const mobileOffset = isTouch ? 60 : 0;

    // Lupe im Container positionieren
    glass.style.left = `${(x + renderLeft) - (glassSize / 2)}px`;
    glass.style.top = `${(y + renderTop) - (glassSize / 2) - mobileOffset}px`;

    // --- FIX: ABSOLUTES CLAMPING FÜR DAS HINTERGRUNDBILD ---
    // Wir berechnen die Verschiebung und zwingen sie, zwischen 0 und der maximalen Bildgröße zu bleiben.
    let bgX = (x * zoom) - (glassSize / 2);
    let bgY = (y * zoom) - (glassSize / 2) - (mobileOffset * zoom);

    // Begrenzung für Links & Oben (darf nicht negativ sein vor dem CSS-Minus)
    bgX = Math.max(0, Math.min(bgX, bgWidth - glassSize));
    bgY = Math.max(0, Math.min(bgY, bgHeight - glassSize));

    // Zuweisung an CSS (das Minus dreht den Wert um, sodass das Bild nach links/oben geschoben wird)
    glass.style.backgroundPosition = `-${bgX}px -${bgY}px`;
  };

  // 1. Erstelle das Lupen-Element
  const glass = document.createElement('div');
  glass.className = 'img-magnifier-glass';

  Object.assign(glass.style, {
    position: 'absolute',
    border: '3px solid #000',
    borderRadius: '50%',
    cursor: 'none',
    pointerEvents: 'none',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    opacity: '0',
    transition: 'opacity 0.2s ease',
    backgroundImage: `url('${img.src}')`,
    backgroundRepeat: 'no-repeat',
    zIndex: '1000'
  });

  const zoom = 2;
  img.parentElement.appendChild(glass);
  img.style.cursor = 'none';

  const showGlass = () => { glass.style.opacity = '1'; };
  const hideGlass = () => { glass.style.opacity = '0'; };

  // --- DESKTOP / MAUS EVENTS ---
  img.parentElement.addEventListener('mouseenter', showGlass);
  img.parentElement.addEventListener('mouseleave', hideGlass);
  img.parentElement.addEventListener('mousemove', handlePointerMove);

  // --- MOBILE / TOUCH EVENTS ---
  let isMoving = false;
  let startX = 0;
  let startY = 0;

  img.parentElement.addEventListener('touchstart', (e) => {
    if (e.cancelable) e.preventDefault();
    isMoving = false;

    if (e.touches && e.touches.length > 0) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    showGlass();
    handlePointerMove(e);
  }, { passive: false });

  img.parentElement.addEventListener('touchmove', (e) => {
    if (e.cancelable) e.preventDefault();

    if (e.touches && e.touches.length > 0) {
      const diffX = Math.abs(e.touches[0].clientX - startX);
      const diffY = Math.abs(e.touches[0].clientY - startY);

      // Wenn sich der Finger mehr als 6 Pixel bewegt, aktivieren wir den Wisch-Modus
      if (diffX > 6 || diffY > 6) {
        isMoving = true;
      }
    }

    handlePointerMove(e);
  }, { passive: false });

  img.parentElement.addEventListener('touchend', (e) => {
    hideGlass();
    if (!isMoving) {
      dialog.close();
      dialog.remove();
    }
  });
};

export const onClick = (container, template, magnifier = false) => {
  container.onclick = (event) => {
    const isImage = event.target && event.target instanceof HTMLImageElement;
    const target = (isImage) ? event.target : null;
    if (target) {
      const clone = template.content.cloneNode(true);
      const dialog = clone.querySelector('dialog');
      const img = clone.querySelector('img');

      img.onload = () => { if (magnifier) { initMagnifier(dialog, img); }}
      if (img && 'src' in img) { img.src = target.src; }
      document.body.appendChild(dialog);

      dialog.showModal();
      dialog.addEventListener('click', (e) => {
        dialog.close();
        dialog.remove();
      });
    };
  };
};

export const loadImage = (path, prefix, template, callback) => {
  const host = window.location.protocol + "//" + window.location.host;
  const src = new URL(path, `${host}${prefix}`);
  const img = template.content.querySelector('img');
  if (img && 'src' in img) {
    img.src = src.toString();
    callback(template);
  }
}
