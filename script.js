import stars from "./scripts/stars.js";

window.onload = () => {
  stars.event_resize();
};

window.addEventListener("resize", stars.event_resize);
window.addEventListener("pointermove", stars.event_mousemove);

window.addEventListener("DOMContentLoaded", () => {
  const classes = [
    "text-shadow-p1",
    "text-shadow-p2",
    "text-shadow-a1",
    "text-shadow-a2"
  ];

  const randomClass = classes[Math.floor(Math.random() * classes.length)];
  [...document.getElementsByClassName("text-shadow-random")].forEach(e => {
    e.classList.add(randomClass);
  })
});
