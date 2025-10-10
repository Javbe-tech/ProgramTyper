<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    default: 'line' // line, bar, doughnut
  },
  title: {
    type: String,
    default: ''
  }
});

const canvasRef = ref(null);
let chartInstance = null;

// Create chart
function createChart() {
  if (!canvasRef.value) return;

  const ctx = canvasRef.value.getContext('2d');
  
  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy();
  }

  const config = {
    type: props.type,
    data: props.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!props.title,
          text: props.title,
          color: '#e5e7eb',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          labels: {
            color: '#9ca3af'
          }
        }
      },
      scales: props.type !== 'doughnut' ? {
        x: {
          ticks: {
            color: '#9ca3af'
          },
          grid: {
            color: '#374151'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#9ca3af'
          },
          grid: {
            color: '#374151'
          }
        }
      } : {}
    }
  };

  chartInstance = new Chart(ctx, config);
}

// Watch for data changes
watch(() => props.data, () => {
  if (chartInstance) {
    chartInstance.data = props.data;
    chartInstance.update();
  }
}, { deep: true });

// Watch for type changes
watch(() => props.type, () => {
  createChart();
});

onMounted(() => {
  createChart();
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>

<template>
  <div class="chart-container">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 300px;
}
</style>
