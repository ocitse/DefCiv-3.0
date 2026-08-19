// BALANCE / ESTADISTICAS
// Lee data/datos.json y arma los totales del año + el grafico mensual.
// Para actualizar los numeros, solo hay que editar data/datos.json (no este archivo).

const METRICAS = {
  relevamientos: 'Relevamientos',
  familias_asistidas: 'Familias asistidas',
  reportes: 'Reportes'
};

let datosAnuales = [];
let chart = null;

function sumar(campo) {
  return datosAnuales.reduce((acc, mes) => acc + (mes[campo] || 0), 0);
}

function pintarTotales() {
  document.getElementById('total-relevamientos').textContent = sumar('relevamientos');
  document.getElementById('total-familias').textContent = sumar('familias_asistidas');
  document.getElementById('total-reportes').textContent = sumar('reportes');
}

function pintarGrafico(campo) {
  const ctx = document.getElementById('balance-chart');
  const labels = datosAnuales.map(m => m.mes);
  const valores = datosAnuales.map(m => m[campo]);

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = valores;
    chart.data.datasets[0].label = METRICAS[campo];
    chart.update();
    return;
  }

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: METRICAS[campo],
        data: valores,
        backgroundColor: '#1c2c56',
        borderRadius: 4,
        maxBarThickness: 42
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

fetch('data/datos.json')
  .then(res => res.json())
  .then(data => {
    datosAnuales = data['2026'] || [];
    pintarTotales();
    pintarGrafico('relevamientos');
  })
  .catch(err => console.error('No se pudo cargar data/datos.json', err));

document.getElementById('stat-metric').addEventListener('change', (e) => {
  pintarGrafico(e.target.value);
});
