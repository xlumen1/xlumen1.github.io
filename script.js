var D_Canvas_Stardata = {
  star_radius: 2,
  stars: [],
  count: 120,
};

// mouse state (normalized 0..1)
const D_Canvas_Mouse = { x: 0.5, y: 0.5, active: false };

const D_Canvas_InfluenceRadius = 0.06; // small radius (fraction of canvas)
const D_Canvas_TurnStrength = 0.12; // how fast stars turn toward mouse
const D_Canvas_FalloffPower = 2; // smooth falloff exponent

(() => {
  for (let i = 0; i < D_Canvas_Stardata.count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.0003 + Math.random() * 0.0008;
    D_Canvas_Stardata.stars.push({
      x: Math.random(),
      y: Math.random(),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 1 + Math.random() * 2,
    });
  }
})();

const D_Canvas_Framerate = 60;

const E_CanvasResize = (_e) => {
  let cnv = document.getElementById("cnv");
  cnv.width = window.innerWidth;
  cnv.height = window.innerHeight;
};

const F_CanvasFrame = () => {
  let cnv = document.getElementById("cnv");
  let ctx = cnv.getContext("2d");
  ctx.fillStyle = "oklch(0.2 0.005 75)";
  ctx.fillRect(0, 0, cnv.width, cnv.height);
  ctx.fillStyle = "#FFFFFF";
  for (const star of D_Canvas_Stardata.stars) {
    star.x += star.vx;
    star.y += star.vy;

    if (star.x < 0) star.x += 1;
    else if (star.x > 1) star.x -= 1;
    if (star.y < 0) star.y += 1;
    else if (star.y > 1) star.y -= 1;

    const px = star.x * cnv.width;
    const py = star.y * cnv.height;
    ctx.beginPath();
    ctx.arc(px, py, star.r, 0, 2 * Math.PI);
    ctx.fill();
  }
};

window.onload = () => {
  E_CanvasResize();
};
window.addEventListener("resize", E_CanvasResize);


setInterval(F_CanvasFrame, 1000 / D_Canvas_Framerate);

