var R_CanvasResize = (_e) => {
  let cnv = document.getElementById("cnv");
  cnv.width = window.innerWidth;
  cnv.height = window.innerHeight;
};

document.addEventListener("load", R_CanvasResize);
document.addEventListener("resize", R_CanvasResize);

