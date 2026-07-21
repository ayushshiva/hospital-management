// Canvas chart rendering for the dashboard.
(() => {
  function renderTrendChart() {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(31,120,209,0.35)');
    gradient.addColorStop(1, 'rgba(66,184,255,0.05)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = '#1f78d1';
    context.lineWidth = 3;
    const points = [30, 80, 70, 95, 110, 150, 130];
    const stepX = width / (points.length - 1);
    context.beginPath();
    points.forEach((value, index) => {
      const x = index * stepX;
      const y = height - 20 - (value / 180) * (height - 40);
      if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
    });
    context.stroke();
    context.fillStyle = '#1f78d1';
    points.forEach((value, index) => {
      const x = index * stepX;
      const y = height - 20 - (value / 180) * (height - 40);
      context.beginPath();
      context.arc(x, y, 4, 0, Math.PI * 2);
      context.fill();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.page === 'dashboard') {
      renderTrendChart();
    }
  });
})();
