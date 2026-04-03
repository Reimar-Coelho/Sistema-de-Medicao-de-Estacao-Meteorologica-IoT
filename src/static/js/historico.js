document.addEventListener('DOMContentLoaded', function () {
    const API_URL = 'http://localhost:5000/leituras';
    const STATS_URL = 'http://localhost:5000/api/estatisticas';
    const historicoBody = document.getElementById('historico-body');
    const refreshBtn = document.getElementById('refresh-historico');
    const statsContainer = document.getElementById('estatisticas-container');

    function buildRow(leitura) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${leitura.id}</td>
            <td>${leitura.temperatura}</td>
            <td>${leitura.umidade}</td>
            <td>${leitura.pressao}</td>
            <td>${new Date(leitura.timestamp).toLocaleString('pt-BR')}</td>
            <td>
                <a href="/editar/${leitura.id}" class="historic-action-btn historic-action-btn-editar">Editar</a>
                <button class="historic-action-btn historic-action-btn-excluir" data-id="${leitura.id}">Excluir</button>
            </td>
        `;
        return row;
    }

    function showMessage(text, type = 'info') {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="6" style="color:${type === 'error' ? '#e74c3c' : '#2c3e50'}; text-align:center;">${text}</td>`;
        historicoBody.innerHTML = '';
        historicoBody.appendChild(tr);
    }

    async function fetchEstatisticas() {
        try {
            const response = await fetch(STATS_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const stats = await response.json();
            displayEstatisticas(stats);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            statsContainer.innerHTML = '<p>Erro ao carregar estatísticas</p>';
        }
    }

    function displayEstatisticas(stats) {
        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Temperatura</h4>
                    <div class="stat-values">
                        <p><strong>Média:</strong> ${stats.temperatura_media ? stats.temperatura_media.toFixed(2) : 'N/A'} °C</p>
                        <p><strong>Mínima:</strong> ${stats.temperatura_minima ? stats.temperatura_minima.toFixed(2) : 'N/A'} °C</p>
                        <p><strong>Máxima:</strong> ${stats.temperatura_maxima ? stats.temperatura_maxima.toFixed(2) : 'N/A'} °C</p>
                    </div>
                </div>
                <div class="stat-card">
                    <h4>Umidade</h4>
                    <div class="stat-values">
                        <p><strong>Média:</strong> ${stats.umidade_media ? stats.umidade_media.toFixed(2) : 'N/A'} %</p>
                        <p><strong>Mínima:</strong> ${stats.umidade_minima ? stats.umidade_minima.toFixed(2) : 'N/A'} %</p>
                        <p><strong>Máxima:</strong> ${stats.umidade_maxima ? stats.umidade_maxima.toFixed(2) : 'N/A'} %</p>
                    </div>
                </div>
                <div class="stat-card">
                    <h4>Pressão</h4>
                    <div class="stat-values">
                        <p><strong>Média:</strong> ${stats.pressao_media ? stats.pressao_media.toFixed(2) : 'N/A'} hPa</p>
                        <p><strong>Mínima:</strong> ${stats.pressao_minima ? stats.pressao_minima.toFixed(2) : 'N/A'} hPa</p>
                        <p><strong>Máxima:</strong> ${stats.pressao_maxima ? stats.pressao_maxima.toFixed(2) : 'N/A'} hPa</p>
                    </div>
                </div>
            </div>
        `;
    }

    async function fetchLeituras() {
        showMessage('Carregando histórico...');
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const leituras = await response.json();
            populateTable(leituras);
            await fetchEstatisticas(); // Buscar estatísticas também
        } catch (error) {
            showMessage('Erro ao carregar histórico: ' + error.message, 'error');
        }
    }

    function populateTable(leituras) {
        if (!Array.isArray(leituras) || leituras.length === 0) {
            showMessage('Nenhuma leitura disponível.', 'info');
            return;
        }

        historicoBody.innerHTML = '';
        leituras.forEach(leitura => historicoBody.appendChild(buildRow(leitura)));
        addActionListeners();
    }

    function addActionListeners() {
        const btnsExcluir = historicoBody.querySelectorAll('.historic-action-btn-excluir');

        btnsExcluir.forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (!confirm('Tem certeza que deseja excluir a leitura ID ' + id + '?')) return;

                try {
                    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    await fetchLeituras();
                } catch (error) {
                    alert('Erro ao excluir leitura: ' + error.message);
                }
            });
        });
    }

    refreshBtn.addEventListener('click', fetchLeituras);

    fetchLeituras();
});