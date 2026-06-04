const designWidth = 375;
const designHeight = 812;
const phoneFrame = document.querySelector(".phone-frame");
const designCanvas = document.querySelector(".design-canvas");

const applyResponsiveScale = () => {
  if (!phoneFrame || !designCanvas) return;

  const viewportWidth = window.innerWidth;
  const scale = viewportWidth / designWidth;

  phoneFrame.style.width = `${Math.round(viewportWidth)}px`;
  phoneFrame.style.height = `${Math.round(designHeight * scale)}px`;
  designCanvas.style.transform = `scale(${scale})`;
};

applyResponsiveScale();
window.addEventListener("resize", applyResponsiveScale);
window.visualViewport?.addEventListener("resize", applyResponsiveScale);

const cards = Array.from(document.querySelectorAll(".interactive-card"));
const rail = document.querySelector(".card-rail");

if (cards.length) {
  const cardDetails = [
    {
      count: "084/160",
      rank: "A",
      price: "RM 2,486.40",
      market: "RM118.72",
      trend: 8.43,
      title: "Sylveon City Pet- 0797",
      probability: "0.080%",
      number: "#0797",
      set: "City Walk Foil",
      tags: ["City Pet", "Gold Foil", "Art Card"],
    },
    {
      count: "120/200",
      rank: "S",
      price: "RM 50,200.00",
      market: "RM840.29",
      trend: 15.76,
      title: "Mega Charizard Y ex- 294/217",
      probability: "0.025%",
      number: "#294/217",
      set: "ME: Ascended Heroes",
      tags: ["Pokemon", "Mega Hyper Rare", "Foil Only"],
    },
    {
      count: "151/240",
      rank: "S",
      price: "RM 18,734.60",
      market: "RM622.18",
      trend: 31.42,
      title: "Blastoise Surf ex- 125/217",
      probability: "0.040%",
      number: "#125/217",
      set: "Ocean Arcade",
      tags: ["Water Type", "Prism Foil", "Secret Art"],
    },
  ];
  const details = {
    count: document.querySelector(".count"),
    rank: document.querySelector(".rank-badge"),
    price: document.querySelector(".price-line strong"),
    market: document.querySelector(".market-line > span:nth-child(2)"),
    trend: document.querySelector(".trend-value"),
    title: document.querySelector(".info-panel h1"),
    meta: document.querySelectorAll(".meta-row span"),
    tags: document.querySelectorAll(".tag-row .tag"),
  };
  let activeIndex = 1;
  let activeCard = null;
  let activePointerId = null;
  let activeTilt = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let trendAnimation = 0;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const setTrendValue = (targetValue) => {
    cancelAnimationFrame(trendAnimation);
    details.trend.textContent = `RM${targetValue.toFixed(2)}`;
  };

  const animateTrendValue = (targetValue) => {
    cancelAnimationFrame(trendAnimation);

    const duration = 680;
    const start = performance.now();
    const tick = (now) => {
      const progress = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      details.trend.textContent = `RM${(targetValue * eased).toFixed(2)}`;

      if (progress < 1) {
        trendAnimation = requestAnimationFrame(tick);
      }
    };

    details.trend.textContent = "RM0.00";
    trendAnimation = requestAnimationFrame(tick);
  };

  const updateDetails = (index, { animateTrend = false } = {}) => {
    const data = cardDetails[index];
    details.count.textContent = data.count;
    details.rank.textContent = data.rank;
    details.price.textContent = data.price;
    details.market.textContent = data.market;
    details.title.textContent = data.title;
    details.meta[1].textContent = data.probability;
    details.meta[2].textContent = data.number;
    details.meta[3].textContent = data.set;
    details.tags.forEach((tag, tagIndex) => {
      tag.textContent = data.tags[tagIndex];
    });
    if (animateTrend) {
      animateTrendValue(data.trend);
    } else {
      setTrendValue(data.trend);
    }
  };

  const resetCardTilt = (card) => {
    card.classList.remove("is-dragging");
    card.style.setProperty("--rotate-x", "0deg");
    card.style.setProperty("--rotate-y", "0deg");
    card.style.setProperty("--shine-x", "50%");
    card.style.setProperty("--shine-y", "50%");
    card.style.setProperty("--holo-shift", "0px");
  };

  const setActiveCard = (nextIndex, { animateTrend = false } = {}) => {
    const resolvedIndex = clamp(nextIndex, 0, cards.length - 1);
    const didChange = resolvedIndex !== activeIndex;
    activeIndex = resolvedIndex;

    cards.forEach((card, index) => {
      const offset = index - activeIndex;
      const isCenter = offset === 0;
      const isAdjacent = Math.abs(offset) === 1;
      const isVisible = isCenter || isAdjacent;

      card.classList.toggle("is-side", isAdjacent);
      card.classList.toggle("is-center", isCenter);
      card.classList.toggle("is-hidden", !isVisible);
      card.style.setProperty("--slot-x", `${offset * 264}px`);
      card.style.setProperty("--slot-scale", isCenter ? "1" : "1");
      card.style.setProperty("--slot-opacity", isCenter ? "1" : isAdjacent ? "0.3" : "0");
      card.style.setProperty("--slot-z", isCenter ? "3" : isAdjacent ? "1" : "0");
      card.setAttribute("aria-current", isCenter ? "true" : "false");
      card.setAttribute("aria-hidden", isVisible ? "false" : "true");
      card.setAttribute("aria-label", isCenter ? "当前卡牌" : offset < 0 ? "切换到左侧卡牌" : "切换到右侧卡牌");
      resetCardTilt(card);
    });

    updateDetails(activeIndex, { animateTrend: animateTrend && didChange });
  };

  const renderTilt = (card, event) => {
    const rect = card.getBoundingClientRect();
    const px = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const py = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const rotateY = (px - 0.5) * 16;
    const rotateX = (0.5 - py) * 14;
    const holoShift = (px - py) * 46;

    card.style.setProperty("--rotate-x", `${rotateX.toFixed(2)}deg`);
    card.style.setProperty("--rotate-y", `${rotateY.toFixed(2)}deg`);
    card.style.setProperty("--shine-x", `${(px * 100).toFixed(1)}%`);
    card.style.setProperty("--shine-y", `${(py * 100).toFixed(1)}%`);
    card.style.setProperty("--holo-shift", `${holoShift.toFixed(2)}px`);
  };

  const maybeSwipe = () => {
    const dx = lastX - startX;
    const dy = lastY - startY;
    const isHorizontalSwipe = Math.abs(dx) >= 54 && Math.abs(dx) > Math.abs(dy) * 1.25;

    if (!isHorizontalSwipe) return false;

    const nextIndex = dx < 0 ? activeIndex + 1 : activeIndex - 1;
    const resolvedIndex = clamp(nextIndex, 0, cards.length - 1);

    if (resolvedIndex === activeIndex) return false;

    setActiveCard(resolvedIndex, { animateTrend: true });
    return true;
  };

  const releasePointer = ({ swipe = false } = {}) => {
    if (!activeCard) return;

    const card = activeCard;
    const pointerId = activePointerId;
    if (swipe) maybeSwipe();
    activeCard = null;
    activePointerId = null;
    activeTilt = false;

    if (pointerId !== null && card.releasePointerCapture && card.hasPointerCapture?.(pointerId)) {
      card.releasePointerCapture(pointerId);
    }
    resetCardTilt(card);
  };

  const beginGesture = (card, event, { tilt = true } = {}) => {
    event.preventDefault();
    releasePointer();
    activeCard = card;
    activePointerId = event.pointerId;
    activeTilt = tilt;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;
    lastX = event.clientX;
    lastY = event.clientY;

    if (tilt) {
      card.classList.add("is-dragging");
    }

    if (card.setPointerCapture) {
      try {
        card.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic pointer events used in visual tests may not be capturable.
      }
    }

    if (tilt) renderTilt(card, event);
  };

  cards.forEach((card, index) => {
    card.addEventListener("pointerdown", (event) => {
      beginGesture(card, event);
    });

    card.addEventListener("pointermove", (event) => {
      if (card !== activeCard || event.pointerId !== activePointerId) return;
      lastX = event.clientX;
      lastY = event.clientY;
      moved = Math.abs(lastX - startX) > 8 || Math.abs(lastY - startY) > 8;
      renderTilt(card, event);
    });

    card.addEventListener("click", () => {
      if (moved) return;
      if (index !== activeIndex) setActiveCard(index, { animateTrend: true });
    });
  });

  rail.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".interactive-card")) return;
    beginGesture(cards[activeIndex], event, { tilt: false });
  });

  window.addEventListener("pointermove", (event) => {
    if (!activeCard || event.pointerId !== activePointerId) return;
    lastX = event.clientX;
    lastY = event.clientY;
    moved = Math.abs(lastX - startX) > 8 || Math.abs(lastY - startY) > 8;
    if (activeTilt) renderTilt(activeCard, event);
  });

  window.addEventListener("pointerup", (event) => {
    if (activeCard && event.pointerId === activePointerId) releasePointer({ swipe: true });
  });

  window.addEventListener("pointercancel", (event) => {
    if (activeCard && event.pointerId === activePointerId) releasePointer();
  });

  setActiveCard(activeIndex, { animateTrend: false });
}
