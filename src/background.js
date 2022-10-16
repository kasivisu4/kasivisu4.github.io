function* canvas() {
  const width = 1152;
  const height = width;
  const n = 10000;
  const speed = 0.001;
  const randomZ = d3.randomLcg(42);
  const randomX = d3.randomUniform.source(randomZ)(-width / 2, width / 2);
  const randomY = d3.randomUniform.source(randomZ)(-height / 2, height / 2);
  const X = Float64Array.from({ length: n }, randomX);
  const Y = Float64Array.from({ length: n }, randomY);
  const Z = Float64Array.from({ length: n }, randomZ);
  const canvas = document.createElement("canvas");
  const scale = window.devicePixelRatio;
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style = `max-width: 100%; width: ${width}px; height: auto;`;
  const context = canvas.getContext("2d");
  context.scale(scale, scale);
  context.translate(width / 2, height / 2);
  context.lineWidth = 1.5;
  context.lineCap = "round";
  while (true) {
    context.fillStyle = `rgba(7,17,29,0.05)`;
    context.fillRect(-width / 2, -height / 2, width, height);
    for (let i = 0; i < n; ++i) {
      const x1 = X[i] / Z[i],
        y1 = Y[i] / Z[i];
      Z[i] -= speed;
      const x2 = X[i] / Z[i],
        y2 = Y[i] / Z[i];
      if (Z[i] < 0) (X[i] = randomX()), (Y[i] = randomY()), (Z[i] = 1);
      const b = 1 - Z[i] * Z[i];
      context.strokeStyle = `rgba(255,255,255,${b})`;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
    }
    console.log(X);
    yield canvas;
  }
}
