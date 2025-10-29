var R_CanvasResize = (_e) => {
  let cnv = document.getElementById("cnv");
  cnv.width = window.innerWidth;
  cnv.height = window.innerHeight;
};

R_CanvasResize();
window.addEventListener("resize", R_CanvasResize);


