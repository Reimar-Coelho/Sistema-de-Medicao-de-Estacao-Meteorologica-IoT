document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('leituras-container');
    const refreshBtn = document.getElementById('refresh-btn');
    const API_URL = 'http://localhost:5000/ultimas';
    const INTERVALO_MS = 30000;

    let isLoading = false; // evita requisições simultâneas

    function setLoading(state) {
        isLoading = state;
        refreshBtn.disabled = state;
        refreshBtn.textContent = state ? 'Atualizando...' : 'Atualizar';
    }

    function showError(tipo) {
        const mensagens = {
            offline: `
                <div class="error-card">
                    <p>⚠️ Servidor offline ou inacessível.</p>
                    <small>Verifique se o servidor Flask está rodando em <code>${API_URL}</code></small>
                </div>`,
            dados: `
                <div class="error-card">
                    <p>❌ Erro ao processar os dados recebidos.</p>
                </div>`,
        };
        container.innerHTML = mensagens[tipo] || '<p>Erro desconhecido.</p>';
    }

    let graficoTemperatura = null;
    let graficoUmidade = null;
    let graficoPressao = null;

    function displayLeituras(leituras) {
        container.innerHTML = '';

        if (!Array.isArray(leituras) || leituras.length === 0) {
            container.innerHTML = '<p>Nenhuma leitura encontrada.</p>';
            updateCharts([]);
            return;
        }

        leituras.forEach(leitura => {
            const card = document.createElement('div');
            card.className = 'leitura-card';
            card.innerHTML = `
                <h3>Leitura ID: ${leitura.id}</h3>
                <p class="temp">Temperatura: ${leitura.temperatura} °C</p>
                <p class="umidade">Umidade: ${leitura.umidade} %</p>
                <p class="pressao">Pressão: ${leitura.pressao} hPa</p>
                <p class="timestamp">
                    ${new Date(leitura.timestamp).toLocaleString('pt-BR')}
                </p>
            `;
            container.appendChild(card);
        });

        updateCharts(leituras);
    }

    function createSingleChart(canvasId, label, color) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label,
                    data: [],
                    borderColor: color,
                    backgroundColor: `${color}33`,
                    tension: 0.2,
                    pointRadius: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Tempo' }
                    },
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: label }
                    }
                }
            }
        });
    }

    function initCharts() {
        if (!graficoTemperatura) graficoTemperatura = createSingleChart('chart-temperatura', 'Temperatura (°C)', '#e74c3c');
        if (!graficoUmidade) graficoUmidade = createSingleChart('chart-umidade', 'Umidade (%)', '#3498db');
        if (!graficoPressao) graficoPressao = createSingleChart('chart-pressao', 'Pressão (hPa)', '#27ae60');
    }

    function updateCharts(leituras) {
        initCharts();

        if (!Array.isArray(leituras) || leituras.length === 0) {
            [graficoTemperatura, graficoUmidade, graficoPressao].forEach(chart => {
                chart.data.labels = [];
                chart.data.datasets[0].data = [];
                chart.update();
            });
            return;
        }

        const sorted = [...leituras].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const labels = sorted.map(l => new Date(l.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }));

        graficoTemperatura.data.labels = labels;
        graficoTemperatura.data.datasets[0].data = sorted.map(l => Number(l.temperatura));

        graficoUmidade.data.labels = labels;
        graficoUmidade.data.datasets[0].data = sorted.map(l => Number(l.umidade));

        graficoPressao.data.labels = labels;
        graficoPressao.data.datasets[0].data = sorted.map(l => Number(l.pressao));

        [graficoTemperatura, graficoUmidade, graficoPressao].forEach(chart => chart.update());
    }

    async function loadLeituras() {
        if (isLoading) return; // bloqueia chamadas simultâneas
        setLoading(true);

        // Mantém conteúdo anterior visível enquanto recarrega (não pisca "Carregando...")
        const temConteudo = container.querySelector('.leitura-card');
        if (!temConteudo) {
            container.innerHTML = '<p>Carregando leituras...</p>';
        }

        try {
            const response = await fetch(API_URL, {
                signal: AbortSignal.timeout(8000) // timeout de 8s
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            displayLeituras(data);

        } catch (error) {
            // TypeError (fetch falhou) ou AbortError (timeout) = servidor inacessível
            if (error instanceof TypeError || error.name === 'AbortError' || error.name === 'TimeoutError') {
                console.warn('Servidor inacessível:', error.message);
                showError('offline');
            } else {
                console.error('Erro inesperado:', error);
                showError('dados');
            }
        } finally {
            setLoading(false);
        }
    }

    refreshBtn.addEventListener('click', loadLeituras);
    loadLeituras();
    setInterval(loadLeituras, INTERVALO_MS);
});