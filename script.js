import stars from "./scripts/stars.js";

window.onload = () => {
  stars.event_resize();
};

window.addEventListener("resize", stars.event_resize);
window.addEventListener("mousemove", stars.event_mousemove);
window.addEventListener("mouseleave", stars.event_mouseleave);
window.addEventListener("mouseenter", stars.event_mouseenter);
