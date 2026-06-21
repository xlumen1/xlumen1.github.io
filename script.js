import stars from "./scripts/stars.js";


window.onload = () => {
  stars.event_resize();
};
window.addEventListener("resize", stars.event_resize);
