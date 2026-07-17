import FluidField from "./vendor/pressure.js";

const D_Fluid = new FluidField({ width: 100, height: 100});

function U_MoveToward(a, b, delta) {
  return a + Math.sign(b - a) * Math.min(Math.abs(b - a), delta);
}

function U_Lerp(a, b, t) {
  return a + (b - a) * t;
}


function U_VectorLerp(a, b, t) {
  return {
    x: U_Lerp(a.x, b.x, t),
    y: U_Lerp(a.y, b.y, t)
  };
}

function U_Average(p) {
  let o = 0;
  p.forEach(value => {
    o += value;
  });
  return o / p.length;
}

function U_VectorAverage(v) {
  let x = [];
  let y = [];

  v.forEach(vec => {
    x.push(vec.x);
    y.push(vec.y);
  });

  return {x: U_Average(x), y: U_Average(y)};
}

var D_Canvas_Stardata = {
  star_radius: 2,
  stars: [],
  count: 5000,
};

// mouse state (normalized 0..1)
const D_Canvas_Mouse = { x: 0.5, y: 0.5, vx: 0.0, vy: 0.0, active: false };

const D_Canvas_InfluenceRadius = 0.06; // small radius (fraction of canvas)
const D_Canvas_TurnStrength = 0.12; // how fast stars turn toward mouse
const D_Canvas_FalloffPower = 2; // smooth falloff exponent

const D_Canvas_Framerate = 60;

const M_Initialize = (() => {
  for (let i = 0; i < D_Canvas_Stardata.count; i++) {
    D_Canvas_Stardata.stars.push({
      x: Math.random(),
      y: Math.random(),
      vx: 0,
      vy: 0,
      r: 1 + Math.random() * D_Canvas_Stardata.star_radius,
    });
  }

  setInterval(M_CanvasFrame, 1000 / D_Canvas_Framerate);
  
  return {
    refresh: M_CanvasFrame,
    event_resize: E_CanvasResize,
    event_mousemove: E_CanvasMouseMove,
    event_mouseleave: E_CanvasMouseLeave,
    event_mouseenter: E_CanvasMouseEnter,
  };
});

const E_CanvasResize = (_e) => {
  let cnv = document.getElementById("cnv");
  cnv.width = window.innerWidth;
  cnv.height = window.innerHeight;
};

const E_CanvasMouseMove = (e) => {
  let cnv = document.getElementById("cnv");
  D_Canvas_Mouse.x = e.offsetX / cnv.width;
  D_Canvas_Mouse.y = e.offsetY / cnv.height;

  if (true) {
    D_Canvas_Mouse.vx = e.movementX / cnv.width;
    D_Canvas_Mouse.vy = e.movementY / cnv.height;
  } else {
    D_Canvas_Mouse.vx = 0;
    D_Canvas_Mouse.vy = 0;
  }

  const mx = Math.floor(D_Canvas_Mouse.x * D_Fluid.width());
  const my = Math.floor(D_Canvas_Mouse.y * D_Fluid.height());
  const oldvx = D_Fluid.getXVelocity(mx, my);
  const oldvy = D_Fluid.getYVelocity(mx, my);

  D_Fluid.setVelocity(mx, my, oldvx + D_Canvas_Mouse.vx, oldvy + D_Canvas_Mouse.vy);
}

const E_CanvasMouseLeave = (_e) => {
  D_Canvas_Mouse.active = false;
}

const E_CanvasMouseEnter = (_e) => {
  D_Canvas_Mouse.active = true;
}

const M_CanvasFrame = () => {
  // Update fluid field
  D_Fluid.update();

  let cnv = document.getElementById("cnv");
  let ctx = cnv.getContext("2d");
  ctx.fillStyle = "oklch(0.2 0.005 75)";
  ctx.fillRect(0, 0, cnv.width, cnv.height);
  ctx.fillStyle = "#FFFFFF";
  for (const star of D_Canvas_Stardata.stars) {

    // Update star velocity based on fluid field

    let cell_x = Math.floor(star.x * D_Fluid.width());
    let cell_y = Math.floor(star.y * D_Fluid.height());

    let offset_x = star.x * D_Fluid.width() - cell_x;
    let offset_y = star.y * D_Fluid.height() - cell_y;

    // Origin is TR

    let v00 = D_Fluid.getVelocity(cell_x-1, cell_y-1);
    let v01 = D_Fluid.getVelocity(cell_x-1, cell_y+0);
    let v02 = D_Fluid.getVelocity(cell_x-1, cell_y+1);
    let v10 = D_Fluid.getVelocity(cell_x+0, cell_y-1);
    let v11 = D_Fluid.getVelocity(cell_x+0, cell_y+0);
    let v12 = D_Fluid.getVelocity(cell_x+0, cell_y+1);
    let v20 = D_Fluid.getVelocity(cell_x+1, cell_y-1);
    let v21 = D_Fluid.getVelocity(cell_x+1, cell_y+0);
    let v22 = D_Fluid.getVelocity(cell_x+1, cell_y+1);
    
    let p00 = U_VectorAverage([v00, v01, v10, v11]);
    let p01 = U_VectorAverage([v10, v11, v20, v21]);
    let p10 = U_VectorAverage([v01, v02, v11, v12]);
    let p11 = U_VectorAverage([v11, v12, v21, v22]);

    let fv = U_VectorLerp(
      U_VectorLerp(p00, p10, offset_x),
      U_VectorLerp(p01, p11, offset_x),
      offset_y
    );

    star.vx = U_MoveToward(star.vx, fv.x, 0.2 / star.r);
    star.vy = U_MoveToward(star.vy, fv.y, 0.2 / star.r);

    // Update position based on velocity
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

export default M_Initialize();