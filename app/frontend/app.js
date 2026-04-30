/**
 * Application JavaScript pour le système de détection d'anomalies
 * Version améliorée avec mode sombre et animations fluides
 */

const API_BASE_URL = 'http://localhost:5000/api';

// État de l'application
const state = {
    selectedFiles: [],
    totalImages: 0,
    anomaliesCount: 0,
    normalCount: 0,
    errors: [],
    batchChart: null,
    errorDistributionChart: null,
    darkMode: false
};

// Éléments DOM
const elements = {
    uploadZone: document.getElementById('uploadZone'),
    fileInput: document.getElementById('fileInput'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    compareBtn: document.getElementById('compareBtn'),
    clearBtn: document.getElementById('clearBtn'),
    threshold: document.getElementById('threshold'),
    thresholdValue: document.getElementById('thresholdValue'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    resultsSection: document.getElementById('resultsSection'),
    singleResult: document.getElementById('singleResult'),
    comparisonResult: document.getElementById('comparisonResult'),
    batchResult: document.getElementById('batchResult'),
    status: document.getElementById('status'),
    themeToggle: document.getElementById('themeToggle')
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeEventListeners();
    checkAPIHealth();
    animateStatsOnLoad();
});

function initializeTheme() {
    // Charger le thème depuis localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        enableDarkMode();
    }
}

function enableDarkMode() {
    document.body.classList.add('dark');
    state.darkMode = true;
    localStorage.setItem('theme', 'dark');
    updateThemeIcon();
}

function disableDarkMode() {
    document.body.classList.remove('dark');
    state.darkMode = false;
    localStorage.setItem('theme', 'light');
    updateThemeIcon();
}

function updateThemeIcon() {
    const sunIcon = elements.themeToggle.querySelector('.sun-icon');
    const moonIcon = elements.themeToggle.querySelector('.moon-icon');
    
    if (state.darkMode) {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
}

function toggleTheme() {
    if (state.darkMode) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

function animateStatsOnLoad() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        }, index * 100);
    });
}

function initializeEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Upload zone
    elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    elements.uploadZone.addEventListener('dragover', handleDragOver);
    elements.uploadZone.addEventListener('dragleave', handleDragLeave);
    elements.uploadZone.addEventListener('drop', handleDrop);
    
    // Buttons
    elements.analyzeBtn.addEventListener('click', handleAnalyze);
    elements.compareBtn.addEventListener('click', handleCompare);
    elements.clearBtn.addEventListener('click', handleClear);
    
    // Threshold slider
    elements.threshold.addEventListener('input', (e) => {
        elements.thresholdValue.textContent = parseFloat(e.target.value).toFixed(3);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            toggleTheme();
        }
    });
}

async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        if (data.status === 'healthy') {
            elements.status.textContent = 'Connecté';
            elements.status.previousElementSibling.classList.add('bg-green-500');
            elements.status.previousElementSibling.classList.remove('bg-red-500');
        }
    } catch (error) {
        elements.status.textContent = 'Déconnecté';
        elements.status.previousElementSibling.classList.add('bg-red-500');
        elements.status.previousElementSibling.classList.remove('bg-green-500');
        console.error('API Health Check Failed:', error);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    elements.uploadZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadZone.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/') || file.name.endsWith('.tif')
    );
    
    if (files.length > 0) {
        state.selectedFiles = files;
        updateUploadZone();
        enableButtons();
    }
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        state.selectedFiles = files;
        updateUploadZone();
        enableButtons();
    }
}

function updateUploadZone() {
    const count = state.selectedFiles.length;
    elements.uploadZone.innerHTML = `
        <svg class="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-base sm:text-lg font-semibold mb-2">${count} fichier(s) sélectionné(s)</p>
        <p class="text-sm opacity-60">Cliquez pour changer la sélection</p>
    `;
    
    // Animation
    elements.uploadZone.style.animation = 'scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
}

function enableButtons() {
    elements.analyzeBtn.disabled = false;
    elements.compareBtn.disabled = state.selectedFiles.length !== 1;
}

function showLoading() {
    elements.loadingOverlay.classList.remove('hidden');
    elements.loadingOverlay.style.animation = 'fadeIn 0.3s ease-out';
}

function hideLoading() {
    elements.loadingOverlay.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
        elements.loadingOverlay.classList.add('hidden');
    }, 300);
}

async function handleAnalyze() {
    if (state.selectedFiles.length === 0) return;
    
    showLoading();
    
    try {
        const selectedModel = document.querySelector('input[name="model"]:checked').value;
        const threshold = parseFloat(elements.threshold.value);
        
        if (state.selectedFiles.length === 1) {
            await analyzeSingleImage(state.selectedFiles[0], selectedModel, threshold);
        } else {
            await analyzeBatchImages(state.selectedFiles, selectedModel, threshold);
        }
    } catch (error) {
        console.error('Analysis Error:', error);
        showNotification('Erreur lors de l\'analyse: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function showNotification(message, type = 'info') {
    // Créer une notification toast
    const notification = document.createElement('div');
    notification.className = `fixed top-24 right-4 glass-card rounded-xl p-4 shadow-2xl z-50 max-w-sm animate-slide-in`;
    
    const colors = {
        success: 'border-l-4 border-green-500',
        error: 'border-l-4 border-red-500',
        info: 'border-l-4 border-blue-500'
    };
    
    notification.className += ` ${colors[type] || colors.info}`;
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <svg class="w-6 h-6 ${type === 'error' ? 'text-red-500' : type === 'success' ? 'text-green-500' : 'text-blue-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'error' ? 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : type === 'success' ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}" />
            </svg>
            <p class="text-sm font-medium">${message}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function analyzeSingleImage(file, modelId, threshold) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('model_id', modelId);
    formData.append('threshold', threshold);
    
    const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
        displaySingleResult(data);
        updateStats(1, data.is_anomaly ? 1 : 0, data.reconstruction_error);
    } else {
        throw new Error(data.error);
    }
}

async function analyzeBatchImages(files, modelId, threshold) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    formData.append('model_id', modelId);
    formData.append('threshold', threshold);
    
    const response = await fetch(`${API_BASE_URL}/batch-predict`, {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
        displayBatchResult(data);
        updateStats(data.total_images, data.anomalies_detected, data.average_error);
    } else {
        throw new Error(data.error);
    }
}

async function handleCompare() {
    if (state.selectedFiles.length !== 1) return;
    
    showLoading();
    
    try {
        const threshold = parseFloat(elements.threshold.value);
        const formData = new FormData();
        formData.append('image', state.selectedFiles[0]);
        formData.append('threshold', threshold);
        
        const response = await fetch(`${API_BASE_URL}/compare-models`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayComparisonResult(data);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Comparison Error:', error);
        alert('Erreur lors de la comparaison: ' + error.message);
    } finally {
        hideLoading();
    }
}

function displaySingleResult(data) {
    elements.resultsSection.classList.remove('hidden');
    elements.singleResult.classList.remove('hidden');
    elements.comparisonResult.classList.add('hidden');
    elements.batchResult.classList.add('hidden');
    
    // Images
    document.getElementById('originalImg').src = data.images.original;
    document.getElementById('reconstructedImg').src = data.images.reconstructed;
    document.getElementById('differenceImg').src = data.images.difference;
    
    // Classification
    const classificationBadge = document.getElementById('classificationBadge');
    const classIcon = document.getElementById('classIcon');
    const classLabel = document.getElementById('classLabel');
    const classConfidence = document.getElementById('classConfidence');
    
    if (data.is_anomaly) {
        classificationBadge.className = 'mb-6 p-6 rounded-xl text-center bg-red-100 border-2 border-red-300 anomaly-badge';
        classIcon.className = 'fas fa-exclamation-triangle text-6xl mb-3 text-red-600';
        classLabel.textContent = 'ANOMALIE DÉTECTÉE';
        classLabel.className = 'text-2xl font-bold mb-2 text-red-600';
        classConfidence.textContent = `Confiance: ${(data.confidence * 100).toFixed(1)}%`;
        classConfidence.className = 'text-sm text-red-700';
    } else {
        classificationBadge.className = 'mb-6 p-6 rounded-xl text-center bg-green-100 border-2 border-green-300';
        classIcon.className = 'fas fa-check-circle text-6xl mb-3 text-green-600';
        classLabel.textContent = 'IMAGE NORMALE';
        classLabel.className = 'text-2xl font-bold mb-2 text-green-600';
        classConfidence.textContent = `Confiance: ${(100 - data.confidence * 50).toFixed(1)}%`;
        classConfidence.className = 'text-sm text-green-700';
    }
    
    // Metrics
    document.getElementById('reconError').textContent = data.reconstruction_error.toFixed(4);
    document.getElementById('usedThreshold').textContent = data.threshold.toFixed(3);
    document.getElementById('usedModel').textContent = data.model_used === 'best_cae' ? 'Best CAE' : 'CAE Optuna';
    document.getElementById('timestamp').textContent = new Date(data.timestamp).toLocaleString('fr-FR');
    
    // Error bar
    const errorBar = document.getElementById('reconErrorBar');
    const errorPercent = Math.min((data.reconstruction_error / data.threshold) * 100, 100);
    errorBar.style.width = `${errorPercent}%`;
    errorBar.className = `h-2 rounded-full transition-all duration-500 ${
        data.is_anomaly ? 'bg-red-500' : 'bg-green-500'
    }`;
    
    // Scroll to results
    elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function displayComparisonResult(data) {
    elements.resultsSection.classList.remove('hidden');
    elements.singleResult.classList.add('hidden');
    elements.comparisonResult.classList.remove('hidden');
    elements.batchResult.classList.add('hidden');
    
    // Original image
    document.getElementById('compOriginalImg').src = data.original_image;
    
    // Model comparisons
    data.comparisons.forEach((comp, index) => {
        const modelNum = index + 1;
        document.getElementById(`model${modelNum}Img`).src = comp.reconstructed_image;
        document.getElementById(`model${modelNum}Error`).textContent = comp.reconstruction_error.toFixed(4);
        
        const classSpan = document.getElementById(`model${modelNum}Class`);
        if (comp.is_anomaly) {
            classSpan.textContent = 'Anomalie';
            classSpan.className = 'font-bold text-red-600';
        } else {
            classSpan.textContent = 'Normal';
            classSpan.className = 'font-bold text-green-600';
        }
        
        // Highlight better model
        const card = document.getElementById(`model${modelNum}Card`);
        if (index === 0 && data.comparisons[0].reconstruction_error < data.comparisons[1].reconstruction_error) {
            card.classList.add('ring-2', 'ring-purple-500');
        } else if (index === 1 && data.comparisons[1].reconstruction_error < data.comparisons[0].reconstruction_error) {
            card.classList.add('ring-2', 'ring-purple-500');
        }
    });
    
    elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function displayBatchResult(data) {
    elements.resultsSection.classList.remove('hidden');
    elements.singleResult.classList.add('hidden');
    elements.comparisonResult.classList.add('hidden');
    elements.batchResult.classList.remove('hidden');
    
    // Chart
    createBatchChart(data);
    createErrorDistributionChart(data);
    updateErrorStats(data);
    
    // Table
    const tbody = document.getElementById('batchTableBody');
    tbody.innerHTML = '';
    
    data.results.forEach(result => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50';
        
        const isAnomaly = result.is_anomaly;
        
        row.innerHTML = `
            <td class="px-4 py-3 text-sm text-slate-700">${result.filename}</td>
            <td class="px-4 py-3 text-sm font-mono">${result.reconstruction_error?.toFixed(4) || 'N/A'}</td>
            <td class="px-4 py-3">
                <span class="px-3 py-1 rounded-full text-xs font-medium ${
                    isAnomaly ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }">
                    ${isAnomaly ? 'Anomalie' : 'Normal'}
                </span>
            </td>
            <td class="px-4 py-3 text-sm text-slate-700">${
                result.confidence ? (result.confidence * 100).toFixed(1) + '%' : 'N/A'
            }</td>
        `;
        
        tbody.appendChild(row);
    });
    
    elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function createBatchChart(data) {
    const ctx = document.getElementById('batchChart');
    
    if (state.batchChart) {
        state.batchChart.destroy();
    }
    
    const labels = data.results.map(r => r.filename.substring(0, 15) + '...');
    const errors = data.results.map(r => r.reconstruction_error || 0);
    const colors = data.results.map(r => r.is_anomaly ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)');
    
    state.batchChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Erreur de Reconstruction',
                data: errors,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.8', '1')),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Erreur: ${context.parsed.y.toFixed(4)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Erreur de Reconstruction'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Images'
                    }
                }
            }
        }
    });
}

function updateStats(totalNew, anomaliesNew, avgError) {
    state.totalImages += totalNew;
    state.anomaliesCount += anomaliesNew;
    state.normalCount += (totalNew - anomaliesNew);
    state.errors.push(avgError);
    
    document.getElementById('totalImages').textContent = state.totalImages;
    document.getElementById('anomaliesCount').textContent = state.anomaliesCount;
    document.getElementById('normalCount').textContent = state.normalCount;
    
    const overallAvg = state.errors.reduce((a, b) => a + b, 0) / state.errors.length;
    document.getElementById('avgError').textContent = overallAvg.toFixed(3);
}

function handleClear() {
    state.selectedFiles = [];
    elements.fileInput.value = '';
    
    elements.uploadZone.innerHTML = `
        <i class="fas fa-cloud-upload-alt text-6xl text-slate-400 mb-4"></i>
        <p class="text-lg font-medium text-slate-700 mb-2">Glissez-déposez vos images ici</p>
        <p class="text-sm text-slate-500 mb-4">ou cliquez pour sélectionner</p>
        <p class="text-xs text-slate-400">Formats supportés: JPG, PNG, TIF</p>
    `;
    
    elements.analyzeBtn.disabled = true;
    elements.compareBtn.disabled = true;
    elements.resultsSection.classList.add('hidden');
}

// Check API health every 30 seconds
setInterval(checkAPIHealth, 30000);

function displaySingleResult(data) {
    elements.resultsSection.classList.remove('hidden');
    elements.singleResult.classList.remove('hidden');
    elements.comparisonResult.classList.add('hidden');
    elements.batchResult.classList.add('hidden');
    
    // Images
    document.getElementById('originalImg').src = data.images.original;
    document.getElementById('reconstructedImg').src = data.images.reconstructed;
    document.getElementById('differenceImg').src = data.images.difference;
    
    // Classification
    const classificationBadge = document.getElementById('classificationBadge');
    const classIcon = document.getElementById('classIcon');
    const classLabel = document.getElementById('classLabel');
    const classConfidence = document.getElementById('classConfidence');
    
    if (data.is_anomaly) {
        classificationBadge.className = 'mb-6 p-6 sm:p-8 rounded-2xl text-center glass-card border-2 border-red-500 anomaly-badge';
        classIcon.innerHTML = `
            <svg class="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        `;
        classLabel.textContent = 'ANOMALIE DÉTECTÉE';
        classLabel.className = 'text-xl sm:text-2xl font-bold mb-2 text-red-500';
        classConfidence.textContent = `Confiance: ${(data.confidence * 100).toFixed(1)}%`;
        classConfidence.className = 'text-sm opacity-80';
    } else {
        classificationBadge.className = 'mb-6 p-6 sm:p-8 rounded-2xl text-center glass-card border-2 border-green-500';
        classIcon.innerHTML = `
            <svg class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        `;
        classLabel.textContent = 'IMAGE NORMALE';
        classLabel.className = 'text-xl sm:text-2xl font-bold mb-2 text-green-500';
        classConfidence.textContent = `Confiance: ${(100 - data.confidence * 50).toFixed(1)}%`;
        classConfidence.className = 'text-sm opacity-80';
    }
    
    // Metrics
    document.getElementById('reconError').textContent = data.reconstruction_error.toFixed(4);
    document.getElementById('usedThreshold').textContent = data.threshold.toFixed(3);
    document.getElementById('usedModel').textContent = data.model_used === 'best_cae' ? 'Best CAE' : 'CAE Optuna';
    document.getElementById('timestamp').textContent = new Date(data.timestamp).toLocaleString('fr-FR');
    
    // Error bar
    const errorBar = document.getElementById('reconErrorBar');
    const errorPercent = Math.min((data.reconstruction_error / data.threshold) * 100, 100);
    errorBar.style.width = `${errorPercent}%`;
    errorBar.className = `h-2.5 rounded-full progress-bar ${
        data.is_anomaly ? 'bg-red-500' : 'bg-green-500'
    }`;
    
    // Scroll to results with smooth animation
    setTimeout(() => {
        elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // Show success notification
    showNotification('Analyse terminée avec succès!', 'success');
}

function displayComparisonResult(data) {
    elements.resultsSection.classList.remove('hidden');
    elements.singleResult.classList.add('hidden');
    elements.comparisonResult.classList.remove('hidden');
    elements.batchResult.classList.add('hidden');
    
    // Original image
    document.getElementById('compOriginalImg').src = data.original_image;
    
    // Model comparisons
    data.comparisons.forEach((comp, index) => {
        const modelNum = index + 1;
        document.getElementById(`model${modelNum}Img`).src = comp.reconstructed_image;
        document.getElementById(`model${modelNum}Error`).textContent = comp.reconstruction_error.toFixed(4);
        
        const classSpan = document.getElementById(`model${modelNum}Class`);
        if (comp.is_anomaly) {
            classSpan.textContent = 'Anomalie';
            classSpan.className = 'font-bold text-red-500';
        } else {
            classSpan.textContent = 'Normal';
            classSpan.className = 'font-bold text-green-500';
        }
        
        // Highlight better model
        const card = document.getElementById(`model${modelNum}Card`);
        card.classList.remove('ring-2', 'ring-indigo-500', 'ring-purple-500');
        if (index === 0 && data.comparisons[0].reconstruction_error < data.comparisons[1].reconstruction_error) {
            card.classList.add('ring-2', 'ring-indigo-500');
        } else if (index === 1 && data.comparisons[1].reconstruction_error < data.comparisons[0].reconstruction_error) {
            card.classList.add('ring-2', 'ring-purple-500');
        }
    });
    
    setTimeout(() => {
        elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    showNotification('Comparaison terminée!', 'success');
}

function displayBatchResult(data) {
    elements.resultsSection.classList.remove('hidden');
    elements.singleResult.classList.add('hidden');
    elements.comparisonResult.classList.add('hidden');
    elements.batchResult.classList.remove('hidden');
    
    // Chart
    createBatchChart(data);
    
    // Table
    const tbody = document.getElementById('batchTableBody');
    tbody.innerHTML = '';
    
    data.results.forEach((result, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors';
        row.style.animation = `fadeIn 0.3s ease-out ${index * 0.05}s both`;
        
        const isAnomaly = result.is_anomaly;
        
        row.innerHTML = `
            <td class="px-4 py-3 text-sm">${result.filename}</td>
            <td class="px-4 py-3 text-sm font-mono">${result.reconstruction_error?.toFixed(4) || 'N/A'}</td>
            <td class="px-4 py-3">
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                    isAnomaly ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                }">
                    ${isAnomaly ? 'Anomalie' : 'Normal'}
                </span>
            </td>
            <td class="px-4 py-3 text-sm">${
                result.confidence ? (result.confidence * 100).toFixed(1) + '%' : 'N/A'
            }</td>
        `;
        
        tbody.appendChild(row);
    });
    
    setTimeout(() => {
        elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    showNotification(`${data.total_images} images analysées!`, 'success');
}

function createBatchChart(data) {
    const ctx = document.getElementById('batchChart');
    
    if (state.batchChart) {
        state.batchChart.destroy();
    }
    
    const labels = data.results.map(r => r.filename.substring(0, 15) + '...');
    const errors = data.results.map(r => r.reconstruction_error || 0);
    const colors = data.results.map(r => r.is_anomaly ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)');
    
    state.batchChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Erreur de Reconstruction',
                data: errors,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.8', '1')),
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: state.darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: state.darkMode ? '#f1f5f9' : '#0f172a',
                    bodyColor: state.darkMode ? '#f1f5f9' : '#0f172a',
                    borderColor: state.darkMode ? 'rgba(71, 85, 105, 0.4)' : 'rgba(226, 232, 240, 0.6)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return `Erreur: ${context.parsed.y.toFixed(4)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: state.darkMode ? 'rgba(71, 85, 105, 0.2)' : 'rgba(226, 232, 240, 0.5)'
                    },
                    ticks: {
                        color: state.darkMode ? '#94a3b8' : '#64748b'
                    },
                    title: {
                        display: true,
                        text: 'Erreur de Reconstruction',
                        color: state.darkMode ? '#f1f5f9' : '#0f172a',
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: state.darkMode ? '#94a3b8' : '#64748b'
                    },
                    title: {
                        display: true,
                        text: 'Images',
                        color: state.darkMode ? '#f1f5f9' : '#0f172a',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
}

function createErrorDistributionChart(data) {
    const ctx = document.getElementById('errorDistributionChart');
    if (!ctx) return;

    if (state.errorDistributionChart) {
        state.errorDistributionChart.destroy();
    }

    const dist = data.error_distribution;
    let binEdges = null;
    let countsNormal = [];
    let countsAnomaly = [];

    if (dist && Array.isArray(dist.bins)) {
        binEdges = dist.bins;
        countsNormal = Array.isArray(dist.counts_normal) ? dist.counts_normal : [];
        countsAnomaly = Array.isArray(dist.counts_anomaly) ? dist.counts_anomaly : [];
    } else {
        const errors = data.results
            .filter(r => typeof r.reconstruction_error === 'number')
            .map(r => ({
                error: r.reconstruction_error,
                isAnomaly: Boolean(r.is_anomaly)
            }));

        if (errors.length === 0) return;

        const errorValues = errors.map(e => e.error);
        const minVal = Math.min(...errorValues);
        const maxVal = Math.max(...errorValues);
        const safeMax = minVal === maxVal ? minVal + 1e-6 : maxVal;
        const binCount = 24;
        const step = (safeMax - minVal) / binCount;
        binEdges = Array.from({ length: binCount + 1 }, (_, i) => minVal + i * step);

        const normalErrors = errors.filter(e => !e.isAnomaly).map(e => e.error);
        const anomalyErrors = errors.filter(e => e.isAnomaly).map(e => e.error);
        countsNormal = buildHistogramCounts(normalErrors, binEdges);
        countsAnomaly = buildHistogramCounts(anomalyErrors, binEdges);
    }

    const labels = binEdges.slice(0, -1).map((edge, i) => {
        const next = binEdges[i + 1];
        return `${edge.toFixed(4)}-${next.toFixed(4)}`;
    });

    if (countsNormal.length !== labels.length) {
        countsNormal = new Array(labels.length).fill(0);
    }
    if (countsAnomaly.length !== labels.length) {
        countsAnomaly = new Array(labels.length).fill(0);
    }

    state.errorDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Normal',
                    data: countsNormal,
                    backgroundColor: 'rgba(16, 185, 129, 0.55)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Anomalie',
                    data: countsAnomaly,
                    backgroundColor: 'rgba(239, 68, 68, 0.55)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: state.darkMode ? '#f1f5f9' : '#0f172a'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: state.darkMode ? '#94a3b8' : '#64748b',
                        maxRotation: 45,
                        autoSkip: true
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: state.darkMode ? '#94a3b8' : '#64748b'
                    },
                    grid: {
                        color: state.darkMode ? 'rgba(71, 85, 105, 0.2)' : 'rgba(226, 232, 240, 0.5)'
                    },
                    title: {
                        display: true,
                        text: 'Nombre d\'images',
                        color: state.darkMode ? '#f1f5f9' : '#0f172a',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
}

function buildHistogramCounts(values, binEdges) {
    const counts = new Array(binEdges.length - 1).fill(0);
    if (!values || values.length === 0) return counts;
    const minVal = binEdges[0];
    const maxVal = binEdges[binEdges.length - 1];
    const span = maxVal - minVal || 1e-6;

    values.forEach(value => {
        const normalized = Math.max(0, Math.min(1, (value - minVal) / span));
        const idx = Math.min(Math.floor(normalized * (counts.length)), counts.length - 1);
        counts[idx] += 1;
    });

    return counts;
}

function updateErrorStats(data) {
    const meanEl = document.getElementById('errorMean');
    const stdEl = document.getElementById('errorStd');
    const minEl = document.getElementById('errorMin');
    const maxEl = document.getElementById('errorMax');

    if (!meanEl || !stdEl || !minEl || !maxEl) return;

    const dist = data.error_distribution;
    if (dist && typeof dist.mean === 'number') {
        meanEl.textContent = dist.mean.toFixed(6);
        stdEl.textContent = dist.std.toFixed(6);
        minEl.textContent = dist.min.toFixed(6);
        maxEl.textContent = dist.max.toFixed(6);
        return;
    }

    const errors = data.results
        .filter(r => typeof r.reconstruction_error === 'number')
        .map(r => r.reconstruction_error);

    if (errors.length === 0) {
        meanEl.textContent = '-';
        stdEl.textContent = '-';
        minEl.textContent = '-';
        maxEl.textContent = '-';
        return;
    }

    const mean = errors.reduce((a, b) => a + b, 0) / errors.length;
    const variance = errors.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / errors.length;
    const std = Math.sqrt(variance);

    meanEl.textContent = mean.toFixed(6);
    stdEl.textContent = std.toFixed(6);
    minEl.textContent = Math.min(...errors).toFixed(6);
    maxEl.textContent = Math.max(...errors).toFixed(6);
}

function updateStats(totalNew, anomaliesNew, avgError) {
    state.totalImages += totalNew;
    state.anomaliesCount += anomaliesNew;
    state.normalCount += (totalNew - anomaliesNew);
    state.errors.push(avgError);
    
    // Animate counter updates
    animateValue('totalImages', state.totalImages - totalNew, state.totalImages, 500);
    animateValue('anomaliesCount', state.anomaliesCount - anomaliesNew, state.anomaliesCount, 500);
    animateValue('normalCount', state.normalCount - (totalNew - anomaliesNew), state.normalCount, 500);
    
    const overallAvg = state.errors.reduce((a, b) => a + b, 0) / state.errors.length;
    document.getElementById('avgError').textContent = overallAvg.toFixed(3);
}

function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

function handleClear() {
    state.selectedFiles = [];
    elements.fileInput.value = '';
    
    elements.uploadZone.innerHTML = `
        <svg class="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="text-base sm:text-lg font-semibold mb-2">Glissez-déposez vos images ici</p>
        <p class="text-sm opacity-60 mb-4">ou cliquez pour sélectionner</p>
        <p class="text-xs opacity-40">Formats: JPG, PNG, TIF</p>
    `;
    
    elements.analyzeBtn.disabled = true;
    elements.compareBtn.disabled = true;
    elements.resultsSection.classList.add('hidden');

    if (state.batchChart) {
        state.batchChart.destroy();
        state.batchChart = null;
    }
    if (state.errorDistributionChart) {
        state.errorDistributionChart.destroy();
        state.errorDistributionChart = null;
    }
    
    showNotification('Sélection effacée', 'info');
}

// Check API health every 30 seconds
setInterval(checkAPIHealth, 30000);
