// Based on http://www.dgp.toronto.edu/people/stam/reality/Research/pdf/GDC03.pdf
/**
 * Original license:
 * Copyright (c) 2009 Oliver Hunt <http://nerget.com>
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Modification:
 * Copyright (c) 2026 Gus Stoermer <https://xlumen1.github.io>
 * 
 * This file is derived from the original work and is licensed under the same terms as the original license above.
 * 
 * Modifications include:
 * -[/] Refactoring the code for better readability and maintainability.
 * -[ ] Adding comments and documentation to explain the functionality of the code.
 * -[X] Defining a javascript exportable class for the fluid simulation.
 * -[X] Switching from using walls to toroidal wrapping for the fluid simulation.
 * -[ ] Adding rapidly adjustable and stable resolution control.
 * -[X] Exposing the fluid velocity field to the user interface for manipulation and visualization.
 * 
 * The original license and copyright notice are retained to acknowledge the original author and the terms under which the software was released.
 */

class FluidField {
  constructor(options = {}) {
    this._iterations = 10;
    this._visc = 0.5;
    this._dt = 0.1;
    this._dens = null;
    this._densPrev = null;
    this._u = null;
    this._uPrev = null;
    this._v = null;
    this._vPrev = null;
    this._width = 0;
    this._height = 0;
    this._rowSize = 0;
    this._size = 0;
    this._displayFunc = function() {};
    this._uiCallback = function() {};

    const width = options.width || 64;
    const height = options.height || 64;
    this.setResolution(width, height);
  }

  setVelocity(x, y, xv, yv) {
    this._u[(x + 1) + (y + 1) * this._rowSize] = xv;
    this._v[(x + 1) + (y + 1) * this._rowSize] = yv;
  }

  addFields(x, s, dt) {
    for (let i = 0; i < this._size; i++) {
      x[i] += dt * s[i];
    }
  }

  set_bnd(b, x) {
    const W = this._width;
    const H = this._height;
    const R = this._rowSize;

    // Wrap left/right
    for (let j = 1; j <= H; j++) {
      const row = j * R;
      x[row] = x[row + W];
      x[row + W + 1] = x[row + 1];
    }

    // Wrap top/bottom
    for (let i = 1; i <= W; i++) {
      x[i] = x[i + H * R];
      x[i + (H + 1) * R] = x[i + R];
    }

    // Corner cells
    x[0] = x[1 + R];
    x[(H + 1) * R] = x[1 + H * R];
    x[W + 1] = x[W + R];
    x[(W + 1) + (H + 1) * R] = x[W + H * R];
  }

  lin_solve(b, x, x0, a, c) {
    if (a === 0 && c === 1) {
      for (let j = 1; j <= this._height; j++) {
        let currentRow = j * this._rowSize;
        currentRow += 1;
        for (let i = 0; i < this._width; i++) {
          x[currentRow] = x0[currentRow];
          currentRow += 1;
        }
      }
      this.set_bnd(b, x);
    } else {
      const invC = 1 / c;
      for (let k = 0; k < this._iterations; k++) {
        for (let j = 1; j <= this._height; j++) {
          let lastRow = (j - 1) * this._rowSize;
          let currentRow = j * this._rowSize;
          let nextRow = (j + 1) * this._rowSize;
          let lastX = x[currentRow];
          let currentIndex = currentRow + 1;
          for (let i = 1; i <= this._width; i++) {
            lastX = x[currentIndex] = (x0[currentIndex] + a * (lastX + x[currentIndex + 1] + x[lastRow + i] + x[nextRow + i])) * invC;
            currentIndex += 1;
          }
        }
        this.set_bnd(b, x);
      }
    }
  }

  diffuse(b, x, x0) {
    const a = 0;
    this.lin_solve(b, x, x0, a, 1 + 4 * a);
  }

  lin_solve2(x, x0, y, y0, a, c) {
    if (a === 0 && c === 1) {
      for (let j = 1; j <= this._height; j++) {
        let currentRow = j * this._rowSize;
        currentRow += 1;
        for (let i = 0; i < this._width; i++) {
          x[currentRow] = x0[currentRow];
          y[currentRow] = y0[currentRow];
          currentRow += 1;
        }
      }
      this.set_bnd(1, x);
      this.set_bnd(2, y);
    } else {
      const invC = 1 / c;
      for (let k = 0; k < this._iterations; k++) {
        for (let j = 1; j <= this._height; j++) {
          let lastRow = (j - 1) * this._rowSize;
          let currentRow = j * this._rowSize;
          let nextRow = (j + 1) * this._rowSize;
          let lastX = x[currentRow];
          let lastY = y[currentRow];
          let currentIndex = currentRow + 1;
          for (let i = 1; i <= this._width; i++) {
            lastX = x[currentIndex] = (x0[currentIndex] + a * (lastX + x[currentIndex] + x[lastRow + i] + x[nextRow + i])) * invC;
            lastY = y[currentIndex] = (y0[currentIndex] + a * (lastY + y[currentIndex] + y[lastRow + i] + y[nextRow + i])) * invC;
            currentIndex += 1;
          }
        }
        this.set_bnd(1, x);
        this.set_bnd(2, y);
      }
    }
  }

  diffuse2(x, x0, y, y0) {
    const a = 0;
    this.lin_solve2(x, x0, y, y0, a, 1 + 4 * a);
  }

  advect(b, d, d0, u, v) {
    const Wdt0 = this._dt * this._width;
    const Hdt0 = this._dt * this._height;
    const Wp5 = this._width + 0.5;
    const Hp5 = this._height + 0.5;

    for (let j = 1; j <= this._height; j++) {
      let pos = j * this._rowSize;
      for (let i = 1; i <= this._width; i++) {
        let x = i - Wdt0 * u[++pos];
        let y = j - Hdt0 * v[pos];

        if (x < 0.5) {
          x = 0.5;
        } else if (x > Wp5) {
          x = Wp5;
        }

        const i0 = x | 0;
        const i1 = i0 + 1;

        if (y < 0.5) {
          y = 0.5;
        } else if (y > Hp5) {
          y = Hp5;
        }

        const j0 = y | 0;
        const j1 = j0 + 1;
        const s1 = x - i0;
        const s0 = 1 - s1;
        const t1 = y - j0;
        const t0 = 1 - t1;
        const row1 = j0 * this._rowSize;
        const row2 = j1 * this._rowSize;

        d[pos] = s0 * (t0 * d0[i0 + row1] + t1 * d0[i0 + row2]) + s1 * (t0 * d0[i1 + row1] + t1 * d0[i1 + row2]);
      }
    }

    this.set_bnd(b, d);
  }

  project(u, v, p, div) {
    const h = -0.5 / Math.sqrt(this._width * this._height);
    for (let j = 1; j <= this._height; j++) {
      let row = j * this._rowSize;
      let previousRow = (j - 1) * this._rowSize;
      let prevValue = row - 1;
      let currentRow = row;
      let nextValue = row + 1;
      let nextRow = (j + 1) * this._rowSize;
      for (let i = 1; i <= this._width; i++) {
        div[++currentRow] = h * (u[++nextValue] - u[++prevValue] + v[++nextRow] - v[++previousRow]);
        p[currentRow] = 0;
      }
    }

    this.set_bnd(0, div);
    this.set_bnd(0, p);

    this.lin_solve(0, p, div, 1, 4);
    const wScale = 0.5 * this._width;
    const hScale = 0.5 * this._height;

    for (let j = 1; j <= this._height; j++) {
      let prevPos = j * this._rowSize - 1;
      let currentPos = j * this._rowSize;
      let nextPos = j * this._rowSize + 1;
      let prevRow = (j - 1) * this._rowSize;
      let currentRow = j * this._rowSize;
      let nextRow = (j + 1) * this._rowSize;

      for (let i = 1; i <= this._width; i++) {
        u[++currentPos] -= wScale * (p[++nextPos] - p[++prevPos]);
        v[currentPos] -= hScale * (p[++nextRow] - p[++prevRow]);
      }
    }

    this.set_bnd(1, u);
    this.set_bnd(2, v);
  }

  dens_step(x, x0, u, v) {
    this.addFields(x, x0, this._dt);
    this.diffuse(0, x0, x);
    this.advect(0, x, x0, u, v);
  }

  vel_step(u, v, u0, v0) {
    this.addFields(u, u0, this._dt);
    this.addFields(v, v0, this._dt);

    let temp = u0;
    u0 = u;
    u = temp;

    temp = v0;
    v0 = v;
    v = temp;

    this.diffuse2(u, u0, v, v0);
    this.project(u, v, u0, v0);

    temp = u0;
    u0 = u;
    u = temp;

    temp = v0;
    v0 = v;
    v = temp;

    this.advect(1, u, u0, u0, v0);
    this.advect(2, v, v0, u0, v0);
    this.project(u, v, u0, v0);
  }

  createField(dens, u, v) {
    return {
      setDensity: (x, y, d) => {
        dens[(x + 1) + (y + 1) * this._rowSize] = d;
      },
      getDensity: (x, y) => dens[(x + 1) + (y + 1) * this._rowSize],
      setVelocity: (x, y, xv, yv) => {
        u[(x + 1) + (y + 1) * this._rowSize] = xv;
        v[(x + 1) + (y + 1) * this._rowSize] = yv;
      },
      getXVelocity: (x, y) => u[(x + 1) + (y + 1) * this._rowSize],
      getYVelocity: (x, y) => v[(x + 1) + (y + 1) * this._rowSize],
      width: () => this._width,
      height: () => this._height
    };
  }

  queryUI(d, u, v) {
    for (let i = 0; i < this._size; i++) {
      u[i] = v[i] = d[i] = 0.0;
    }
    this._uiCallback(this.createField(d, u, v));
  }

  update() {
    this.queryUI(this._densPrev, this._uPrev, this._vPrev);
    this.vel_step(this._u, this._v, this._uPrev, this._vPrev);
    this.dens_step(this._dens, this._densPrev, this._u, this._v);
    this._displayFunc(this.createField(this._dens, this._u, this._v));
  }

  setDisplayFunction(func) {
    this._displayFunc = func;
  }

  iterations() {
    return this._iterations;
  }

  setIterations(iters) {
    if (iters > 0 && iters <= 100) {
      this._iterations = iters;
    }
  }

  setUICallback(callback) {
    this._uiCallback = callback;
  }

  reset() {
    this._rowSize = this._width + 2;
    this._size = (this._width + 2) * (this._height + 2);
    this._dens = new Array(this._size);
    this._densPrev = new Array(this._size);
    this._u = new Array(this._size);
    this._uPrev = new Array(this._size);
    this._v = new Array(this._size);
    this._vPrev = new Array(this._size);

    for (let i = 0; i < this._size; i++) {
      this._densPrev[i] = this._uPrev[i] = this._vPrev[i] = this._dens[i] = this._u[i] = this._v[i] = 0;
    }
  }

  setResolution(hRes, wRes) {
    const res = wRes * hRes;
    if (res > 0 && res < 1000000 && (wRes !== this._width || hRes !== this._height)) {
      this._width = wRes;
      this._height = hRes;
      this.reset();
      return true;
    }
    return false;
  }

  width() {
    return this._width;
  }

  height() {
    return this._height;
  }

  getXVelocity(x, y) {
    return this._u[(x + 1) + (y + 1) * this._rowSize];
  }

  getYVelocity(x, y) {
    return this._v[(x + 1) + (y + 1) * this._rowSize];
  }

  getVelocity(x, y) {
    return {
      x: this.getXVelocity(x, y),
      y: this.getYVelocity(x, y)
    };
  }

  getVelocityField() {
    return {
      u: this._u,
      v: this._v,
      width: this._width,
      height: this._height,
      rowSize: this._rowSize
    };
  }
}

export default FluidField;

