/**
 * MindBloom — Canvas Mood Trend Chart & Emotional Analytics
 * Lightweight, dependency-free charting engine.
 */

class MoodAnalytics {
  constructor() {
    this.canvas = document.getElementById('moodChart');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
  }

  render(entries) {
    if (!this.canvas || !this.ctx) return;
    this.updateMetrics(entries);
    this.drawChart(entries);
    this.renderFactorsBreakdown(entries);
  }

  updateMetrics(entries) {
    const totalCountEl = document.getElementById('metric-total-entries');
    const avgMoodEl = document.getElementById('metric-avg-mood');
    const topBoosterEl = document.getElementById('metric-top-booster');

    if (!entries || entries.length === 0) {
      if (totalCountEl) totalCountEl.textContent = '0';
      if (avgMoodEl) avgMoodEl.textContent = '--';
      if (topBoosterEl) topBoosterEl.textContent = '--';
      return;
    }

    if (totalCountEl) totalCountEl.textContent = entries.length;

    // Average Mood
    const sum = entries.reduce((acc, curr) => acc + Number(curr.mood), 0);
    const avg = (sum / entries.length).toFixed(1);
    
    let moodLabel = 'Okay';
    if (avg >= 4.5) moodLabel = 'Radiant ✨';
    else if (avg >= 3.5) moodLabel = 'Good 😊';
    else if (avg >= 2.5) moodLabel = 'Okay 😐';
    else if (avg >= 1.5) moodLabel = 'Low 😔';
    else moodLabel = 'Overwhelmed 🌧️';

    if (avgMoodEl) avgMoodEl.textContent = `${avg} (${moodLabel})`;

    // Top Booster Tag (Tags associated with mood >= 4)
    const positiveTags = {};
    entries.filter(e => Number(e.mood) >= 4).forEach(e => {
      (e.tags || []).forEach(t => {
        positiveTags[t] = (positiveTags[t] || 0) + 1;
      });
    });

    const sortedBoosters = Object.entries(positiveTags).sort((a, b) => b[1] - a[1]);
    if (topBoosterEl) {
      topBoosterEl.textContent = sortedBoosters.length > 0 ? `${sortedBoosters[0][0]} (${sortedBoosters[0][1]}x)` : 'Self-Care';
    }
  }

  drawChart(entries) {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 240 * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = 240;
    const padding = { top: 30, right: 30, bottom: 40, left: 40 };

    ctx.clearRect(0, 0, width, height);

    // Get last 7 days of entries
    const daysToShow = 7;
    const last7Days = [];
    const today = new Date();

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      // Find entry on this date
      const match = entries.find(e => e.date === dateStr);
      last7Days.push({
        date: dateStr,
        dayName: dayName,
        mood: match ? Number(match.mood) : null
      });
    }

    // Draw Grid Lines & Y-axis labels
    const moodLevels = [
      { val: 5, label: '5 ✨' },
      { val: 4, label: '4 😊' },
      { val: 3, label: '3 😐' },
      { val: 2, label: '2 😔' },
      { val: 1, label: '1 🌧️' }
    ];

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.font = '11px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'right';

    const plotHeight = height - padding.top - padding.bottom;
    const plotWidth = width - padding.left - padding.right;

    moodLevels.forEach(lvl => {
      const y = padding.top + plotHeight - ((lvl.val - 1) / 4) * plotHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText(lvl.label, padding.left - 8, y + 4);
    });

    // Draw X-axis day names and points
    const stepX = plotWidth / (daysToShow - 1);
    const points = [];

    last7Days.forEach((day, index) => {
      const x = padding.left + index * stepX;
      
      // X Label
      ctx.textAlign = 'center';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(day.dayName, x, height - 12);

      if (day.mood !== null) {
        const y = padding.top + plotHeight - ((day.mood - 1) / 4) * plotHeight;
        points.push({ x, y, mood: day.mood });
      }
    });

    // Draw Smooth Mood Line
    if (points.length > 1) {
      // Gradient Fill
      const grad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      grad.addColorStop(0, 'rgba(129, 140, 248, 0.35)');
      grad.addColorStop(1, 'rgba(129, 140, 248, 0.0)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      
      // Close path for area fill
      ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
      ctx.lineTo(points[0].x, height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Stroke Line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Draw Dots on points
    points.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = pt.mood >= 4 ? '#4ade80' : pt.mood === 3 ? '#fbbf24' : '#f87171';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0e121a';
      ctx.stroke();
    });

    if (points.length === 0) {
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'center';
      ctx.font = '13px Plus Jakarta Sans, sans-serif';
      ctx.fillText('No check-ins logged for the past 7 days yet. Start logging above! 🌸', width / 2, height / 2);
    }
  }

  renderFactorsBreakdown(entries) {
    const posList = document.getElementById('positive-factors-list');
    const negList = document.getElementById('negative-factors-list');

    if (!posList || !negList) return;

    const highMoodTags = {};
    const lowMoodTags = {};

    entries.forEach(e => {
      const mood = Number(e.mood);
      (e.tags || []).forEach(t => {
        if (mood >= 4) {
          highMoodTags[t] = (highMoodTags[t] || 0) + 1;
        } else if (mood <= 2) {
          lowMoodTags[t] = (lowMoodTags[t] || 0) + 1;
        }
      });
    });

    this.renderTagList(posList, highMoodTags, '#4ade80');
    this.renderTagList(negList, lowMoodTags, '#f87171');
  }

  renderTagList(container, tagMap, color) {
    const entries = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 4);
    if (entries.length === 0) {
      container.innerHTML = '<p class="empty-hint">Check in more to see your personal patterns!</p>';
      return;
    }

    const maxVal = entries[0][1];
    container.innerHTML = entries.map(([tag, count]) => `
      <div class="tag-freq-row">
        <span>${tag}</span>
        <div class="tag-freq-bar-bg">
          <div class="tag-freq-bar-fill" style="width: ${(count / maxVal) * 100}%; background: ${color};"></div>
        </div>
        <strong>${count}x</strong>
      </div>
    `).join('');
  }
}

window.moodAnalytics = new MoodAnalytics();
