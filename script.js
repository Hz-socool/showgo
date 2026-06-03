const card = document.querySelector(".interactive-card");

if (card) {
  let active = false;
  let rafId = 0;
  let latestPointer = null;
  let activePointerId = null;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const resetCard = () => {
    const pointerId = activePointerId;
    active = false;
    activePointerId = null;
    latestPointer = null;
    cancelAnimationFrame(rafId);
    rafId = 0;
    if (pointerId !== null && card.releasePointerCapture && card.hasPointerCapture?.(pointerId)) {
      card.releasePointerCapture(pointerId);
    }
    card.classList.remove("is-dragging");
    card.style.setProperty("--rotate-x", "0deg");
    card.style.setProperty("--rotate-y", "0deg");
    card.style.setProperty("--shine-x", "50%");
    card.style.setProperty("--shine-y", "50%");
    card.style.setProperty("--holo-shift", "0px");
  };

  const renderTilt = () => {
    if (!latestPointer) return;

    const rect = card.getBoundingClientRect();
    const px = clamp((latestPointer.clientX - rect.left) / rect.width, 0, 1);
    const py = clamp((latestPointer.clientY - rect.top) / rect.height, 0, 1);
    const rotateY = (px - 0.5) * 16;
    const rotateX = (0.5 - py) * 14;
    const holoShift = (px - py) * 46;

    card.style.setProperty("--rotate-x", `${rotateX.toFixed(2)}deg`);
    card.style.setProperty("--rotate-y", `${rotateY.toFixed(2)}deg`);
    card.style.setProperty("--shine-x", `${(px * 100).toFixed(1)}%`);
    card.style.setProperty("--shine-y", `${(py * 100).toFixed(1)}%`);
    card.style.setProperty("--holo-shift", `${holoShift.toFixed(2)}px`);

    rafId = 0;
  };

  const queueTilt = (event) => {
    latestPointer = event;
    renderTilt();
  };

  card.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (active) resetCard();
    active = true;
    activePointerId = event.pointerId;
    card.classList.add("is-dragging");
    if (card.setPointerCapture) {
      try {
        card.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic pointer events used in visual tests may not be capturable.
      }
    }
    queueTilt(event);
  });

  card.addEventListener("pointermove", (event) => {
    if (!active || event.pointerId !== activePointerId) return;
    queueTilt(event);
  });

  window.addEventListener("pointermove", (event) => {
    if (!active || event.pointerId !== activePointerId) return;
    queueTilt(event);
  });

  window.addEventListener("pointerup", (event) => {
    if (active && event.pointerId === activePointerId) resetCard();
  });

  window.addEventListener("pointercancel", (event) => {
    if (active && event.pointerId === activePointerId) resetCard();
  });
}
