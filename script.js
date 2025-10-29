var D_Canvas_Stardata = {
  star_radius: 2,
  stars: [],
};

(() => {
  for (let i = 0; i < 100; i++) {
    D_Canvas_Stardata.stars.push([Math.random(), Math.random()]);
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
  for (const star in D_Canvas_Stardata.stars) {
    let p = [star[0] * cnv.width, star[1] * cnv.height];
	ctx.beginPath();
	ctx.arc(p[0], p[1], D_Canvas_Stardata.star_radius, 0, 2*Math.PI);
	ctx.fill();
  }
};

window.onload = () => {
  E_CanvasResize();
};
window.addEventListener("resize", E_CanvasResize);


setInterval(F_CanvasFrame, 1000 / D_Canvas_Framerate);

