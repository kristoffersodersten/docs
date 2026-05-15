(() => {
  const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDesktopWidth = window.matchMedia("(min-width: 760px)").matches;

  if (!supportsFinePointer || prefersReducedMotion || !isDesktopWidth) {
    return;
  }

  const trail = document.createElement("div");
  trail.className = "cursor-trail";
  trail.setAttribute("aria-hidden", "true");
  document.body.appendChild(trail);
  document.body.classList.add("has-cursor-trail");

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let visible = false;

  const interactiveSelector = "a, button, summary, [role='button']";

  window.addEventListener("pointermove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    if (!visible) {
      visible = true;
      trail.classList.add("is-visible");
    }
  }, { passive: true });

  window.addEventListener("pointerover", (event) => {
    if (event.target.closest(interactiveSelector)) {
      trail.classList.add("is-active");
    }
  });

  window.addEventListener("pointerout", (event) => {
    if (event.target.closest(interactiveSelector)) {
      trail.classList.remove("is-active");
    }
  });

  window.addEventListener("pointerleave", () => {
    visible = false;
    trail.classList.remove("is-visible", "is-active");
  });

  const render = () => {
    currentX += (targetX - currentX) * 0.16;
    currentY += (targetY - currentY) * 0.16;
    trail.style.transform = `translate3d(${currentX - 15}px, ${currentY - 15}px, 0)`;
    requestAnimationFrame(render);
  };

  render();
})();
