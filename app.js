// Mock Historical Data Generator
function generateMockData(count, base, volatility) {
  const data = [];
  const labels = [];
  let currentVal = base;
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const change = (Math.random() - 0.48) * volatility;
    currentVal = parseFloat((currentVal + change).toFixed(2));
    
    // Labels formatting
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    if (count <= 24) {
      labels.push(`${24 - i}:00`);
    } else if (count <= 7) {
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      labels.push(days[date.getDay()] + '曜');
    } else if (count <= 30) {
      labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
    } else {
      labels.push(`${date.getFullYear()}/${date.getMonth() + 1}`);
    }
    
    data.push(currentVal);
  }
  return { labels, data };
}

// Data Stores for Chart
const chartDataSets = {
  '1d': generateMockData(24, 156.45, 0.25),
  '1w': generateMockData(7, 155.80, 0.90),
  '1m': generateMockData(30, 154.50, 1.50),
  '1y': generateMockData(12, 142.00, 5.00)
};

let rateChartInstance = null;

// Initialize Chart
function initChart() {
  const ctx = document.getElementById('mainRateChart').getContext('2d');
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
  gradient.addColorStop(1, 'rgba(138, 43, 226, 0.01)');

  const defaultData = chartDataSets['1m'];

  rateChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: defaultData.labels,
      datasets: [{
        label: 'USD/JPY',
        data: defaultData.data,
        borderColor: '#00e5ff',
        borderWidth: 3,
        pointBackgroundColor: '#00e5ff',
        pointBorderColor: 'rgba(255,255,255,0.8)',
        pointHoverRadius: 6,
        pointRadius: 2,
        fill: true,
        backgroundColor: gradient,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#0f0e1d',
          titleColor: '#a0aec0',
          bodyColor: '#fff',
          bodyFont: { family: 'Space Grotesk', weight: 'bold' },
          borderColor: 'rgba(0, 229, 255, 0.3)',
          borderWidth: 1,
          padding: 10,
          displayColors: false
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.03)'
          },
          ticks: {
            color: '#718096',
            font: { family: 'Outfit', size: 10 }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: '#718096',
            font: { family: 'Space Grotesk', size: 11 }
          }
        }
      }
    }
  });
}

// Update Chart Data
function updateChart(period) {
  if (!rateChartInstance) return;
  
  const dataset = chartDataSets[period];
  rateChartInstance.data.labels = dataset.labels;
  rateChartInstance.data.datasets[0].data = dataset.data;
  rateChartInstance.update('active');
}

// Current rates live simulation
const currentRates = {
  usdjpy: { base: 156.45, elementId: 'val-usdjpy', changeId: 'change-usdjpy', pct: 0.24, abs: 0.38 },
  eurjpy: { base: 169.82, elementId: 'val-eurjpy', changeId: 'change-eurjpy', pct: 0.12, abs: 0.20 },
  gbpjpy: { base: 199.15, elementId: 'val-gbpjpy', changeId: 'change-gbpjpy', pct: -0.08, abs: -0.16 },
  audjpy: { base: 103.58, elementId: 'val-audjpy', changeId: 'change-audjpy', pct: 0.05, abs: 0.05 }
};

function simulateLiveRates() {
  setInterval(() => {
    // Pick one pair to update randomly
    const keys = Object.keys(currentRates);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const pair = currentRates[randomKey];
    
    // Tiny change (-0.05 to +0.05 JPY)
    const delta = (Math.random() - 0.49) * 0.08;
    const oldVal = pair.base;
    pair.base = parseFloat((pair.base + delta).toFixed(2));
    
    const element = document.getElementById(pair.elementId);
    if (!element) return;
    
    element.textContent = pair.base.toFixed(2);
    
    // Flash visual feedback
    if (delta > 0) {
      element.className = 'rate-value flash-up';
      pair.abs += Math.abs(delta);
    } else {
      element.className = 'rate-value flash-down';
      pair.abs -= Math.abs(delta);
    }
    
    // Reset class after animation
    setTimeout(() => {
      element.className = 'rate-value';
    }, 800);

    // Calculate new percentage change
    const pctChange = (pair.abs / (pair.base - pair.abs)) * 100;
    pair.pct = parseFloat(pctChange.toFixed(2));
    
    const changeElement = document.getElementById(pair.changeId);
    if (changeElement) {
      if (pair.abs >= 0) {
        changeElement.className = 'rate-change up';
        changeElement.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> <span>+${pair.pct.toFixed(2)}% (+${pair.abs.toFixed(2)})</span>`;
      } else {
        changeElement.className = 'rate-change down';
        changeElement.innerHTML = `<i class="fa-solid fa-arrow-trend-down"></i> <span>${pair.pct.toFixed(2)}% (${pair.abs.toFixed(2)})</span>`;
      }
    }
  }, 4000);
}

// Simulator computations
function runSimulator() {
  const interestDiffEl = document.getElementById('range-interest-diff');
  const riskEl = document.getElementById('range-risk');
  const tradeEl = document.getElementById('range-trade');
  
  if (!interestDiffEl || !riskEl || !tradeEl) return;
  
  const interestDiff = parseFloat(interestDiffEl.value);
  const riskVal = parseInt(riskEl.value);
  const tradeVal = parseInt(tradeEl.value);
  
  // Labels updates
  document.getElementById('label-interest-diff').textContent = `${interestDiff.toFixed(2)} %`;
  
  const riskLabels = ['円高圧力(極端なリスクオフ)', 'やや円高(リスク警戒)', 'ニュートラル', 'やや円安(リスク選好)', '強烈な円安圧力(リスクオン)'];
  document.getElementById('label-risk').textContent = riskLabels[riskVal - 1];
  
  const tradeLabels = ['巨額の赤字(円売り強)', '中程度の赤字', '軽微な赤字', '均衡状態', '黒字傾向', '顕著な黒字(円買い)', '巨額の黒字(円安抑制)'];
  document.getElementById('label-trade').textContent = tradeLabels[tradeVal + 3];
  
  // Theoretical rate computation formula:
  // Base constant: 110.0 JPY
  // Interest impact: +7.5 JPY per 1% diff
  // Risk impact: (riskVal - 3) * 2.2 JPY
  // Trade balance impact: tradeVal * -1.8 JPY
  let predictedRate = 110.0 + (interestDiff * 8.2) + ((riskVal - 3) * 2.5) + (tradeVal * -2.0);
  
  // Add minor deterministic noise based on sliders to prevent flat numbers
  const noise = (Math.sin(interestDiff) * 0.15) + (Math.cos(riskVal) * 0.1);
  predictedRate += noise;
  
  const predictedRateStr = predictedRate.toFixed(2);
  document.getElementById('sim-predicted-rate').textContent = `${predictedRateStr} 円`;
  
  // Gauge computations (Min 110 JPY = 0% 円安圧力, Max 175 JPY = 100% 円安圧力)
  let pressurePercentage = Math.round(((predictedRate - 110) / (175 - 110)) * 100);
  pressurePercentage = Math.max(0, Math.min(100, pressurePercentage));
  
  document.getElementById('gauge-percentage').innerHTML = `${pressurePercentage}<span>円安圧力</span>`;
  
  // SVG Stroke offset
  const circleRadius = 40;
  const circumference = 2 * Math.PI * circleRadius; // ~251.2
  const offset = circumference - (pressurePercentage / 100) * circumference;
  
  const gaugeBar = document.getElementById('gauge-progress');
  if (gaugeBar) {
    gaugeBar.style.strokeDasharray = `${circumference}`;
    gaugeBar.style.strokeDashoffset = `${offset}`;
  }
  
  // Description and technical update dynamically
  const descEl = document.getElementById('sim-predicted-desc');
  const rsiValEl = document.getElementById('val-rsi');
  const rsiBadge = document.getElementById('badge-rsi');
  
  let descText = "";
  if (predictedRate > 158) {
    descText = "危険水準の円安：日本政府による為替介入警戒感が極めて高まります。";
    rsiValEl.textContent = `RSI: ${Math.min(92, Math.round(55 + (predictedRate - 150) * 3))} (買われすぎ)`;
    rsiBadge.textContent = "Overbought";
    rsiBadge.className = "indicator-badge badge-sell";
  } else if (predictedRate < 140) {
    descText = "顕著な円高基調：金利差縮小およびリスク回避傾向による円買戻しが優勢です。";
    rsiValEl.textContent = `RSI: ${Math.max(15, Math.round(45 - (145 - predictedRate) * 2.5))} (売られすぎ)`;
    rsiBadge.textContent = "Oversold";
    rsiBadge.className = "indicator-badge badge-buy";
  } else {
    descText = "金利差と需給のバランスが安定している中立的〜マイルドな為替レンジです。";
    rsiValEl.textContent = "RSI: 52.1 (中立)";
    rsiBadge.textContent = "Neutral";
    rsiBadge.className = "indicator-badge badge-neutral";
  }
  descEl.textContent = descText;
}

// Smooth scroll & Navigation active highlighting
function handleNavigation() {
  const sections = document.querySelectorAll('main > section');
  const navLinks = document.querySelectorAll('nav a');
  
  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPosition = window.pageYOffset + 120; // offset header height

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').includes(current) && current !== '') {
        link.classList.add('active');
      }
    });
  });
}

// Setup Event Listeners
function setupEventListeners() {
  // Chart Tabs
  const tabButtons = document.querySelectorAll('.btn-tab');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const period = e.target.getAttribute('data-period');
      updateChart(period);
    });
  });

  // Simulator Inputs
  const inputs = ['range-interest-diff', 'range-risk', 'range-trade'];
  inputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', runSimulator);
    }
  });
}

// Entry Point
document.addEventListener('DOMContentLoaded', () => {
  initChart();
  simulateLiveRates();
  runSimulator();
  setupEventListeners();
  handleNavigation();
});
