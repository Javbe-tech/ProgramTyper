<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  wpmHistory: {
    type: Array,
    required: true,
  },
});

const canvasRef = ref(null);

function drawGraph() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const padding = 20; // Space for labels

  // Get theme colors from CSS variables
  const computedStyle = getComputedStyle(document.documentElement);
  const bgColor = computedStyle.getPropertyValue('--terminal-bg').trim() || '#1a1a1a';
  const borderColor = computedStyle.getPropertyValue('--border-color').trim() || '#2a2a2a';
  const textColor = computedStyle.getPropertyValue('--gray').trim() || '#808080';
  const lineColor = computedStyle.getPropertyValue('--completed-green').trim() || '#4d8d4d';
  const accentColor = computedStyle.getPropertyValue('--keyword').trim() || '#8b5cf6';

  // Clear canvas
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  
  // If no data yet, show a nice placeholder
  if (props.wpmHistory.length === 0) {
    // Draw subtle grid pattern
    ctx.strokeStyle = borderColor;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let x = padding; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = padding; y < height - padding; y += 20) {
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    
    // Add placeholder text
    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px Consolas';
    ctx.textAlign = 'center';
    ctx.fillText('WPM Chart', width / 2, height / 2 - 20);
    
    ctx.font = '11px Consolas';
    ctx.fillStyle = accentColor;
    ctx.fillText('Start typing to see your progress!', width / 2, height / 2 + 10);
    
    // Reset text alignment
    ctx.textAlign = 'left';
    return;
  }
  
  // --- Draw Axis Labels and Grid ---
  const maxWpm = Math.max(...props.wpmHistory, 100);
  ctx.strokeStyle = borderColor;
  ctx.fillStyle = textColor;
  ctx.font = '10px Consolas';
  
  // Y-axis labels and grid lines
  for (let i = 0; i <= 4; i++) {
      const y = padding + (height - padding * 2) * (i / 4);
      const wpmLabel = Math.round(maxWpm * (1 - i / 4));
      ctx.fillText(wpmLabel, 0, y + 3);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width, y);
      ctx.stroke();
  }

  // --- Draw WPM Line ---
  if (props.wpmHistory.length < 2) {
    // Show single data point message
    ctx.fillStyle = textColor;
    ctx.font = 'bold 12px Consolas';
    ctx.textAlign = 'center';
    ctx.fillText('First run completed!', width / 2, height / 2 - 10);
    ctx.font = '10px Consolas';
    ctx.fillStyle = accentColor;
    ctx.fillText('Complete more runs to see the chart', width / 2, height / 2 + 10);
    ctx.textAlign = 'left';
    return;
  }

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  props.wpmHistory.forEach((wpm, index) => {
    const x = padding + (width - padding) * (index / (props.wpmHistory.length - 1));
    const y = (height - padding) - ((height - padding * 2) * (wpm / maxWpm));
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    // X-axis labels (run number)
    if ((props.wpmHistory.length < 15) || (index % 5 === 0)) { // Don't crowd the axis
      ctx.fillText(index + 1, x - 3, height - 5);
    }
  });
  ctx.stroke();
}

onMounted(drawGraph);
watch(() => props.wpmHistory, drawGraph, { deep: true });

// Watch for theme changes
watch(() => document.documentElement.getAttribute('data-theme'), () => {
  setTimeout(drawGraph, 100); // Small delay to ensure CSS variables are updated
}, { immediate: false });
</script>

<template>
  <div class="graph-container">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<style scoped>
.graph-container {
  width: 300px;
  height: 100%;
  padding: 10px;
  border-left: 1px solid var(--border-color);
  flex-shrink: 0;
}
canvas {
  width: 100%;
  height: 100%;
}
</style>