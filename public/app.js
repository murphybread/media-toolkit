(() => {
  // DOM references
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileInfoPanel = document.getElementById('fileInfoPanel');
  const resultsPanel = document.getElementById('resultsPanel');
  const resultsList = document.getElementById('resultsList');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const convertBtn = document.getElementById('convertBtn');
  const resetBtn = document.getElementById('resetBtn');
  const formatOptions = document.getElementById('formatOptions');

  // Display elements
  const fileName = document.getElementById('fileName');
  const fileFormat = document.getElementById('fileFormat');
  const fileSize = document.getElementById('fileSize');
  const fileDimensions = document.getElementById('fileDimensions');
  const prefixInput = document.getElementById('prefixInput');
  const postfixInput = document.getElementById('postfixInput');
  const namePreview = document.getElementById('namePreview');

  // State
  let currentFile = null; // server response after upload

  // --- Utility ---
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
  }

  function formatTime(ms) {
    if (ms < 1000) return ms + 'ms';
    return (ms / 1000).toFixed(1) + 's';
  }

  // --- Drop Zone ---
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  // --- Upload & Analyze ---
  async function handleFile(file) {
    resetUI();
    const formData = new FormData();
    formData.append('file', file);

    try {
      loadingOverlay.classList.remove('hidden');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      currentFile = await res.json();
      renderFileInfo();
    } catch (err) {
      alert('Failed to upload file: ' + err.message);
    } finally {
      loadingOverlay.classList.add('hidden');
    }
  }

  // --- Render File Info ---
  function renderFileInfo() {
    const f = currentFile;
    fileName.textContent = f.originalName;
    fileFormat.textContent = f.metadata.format ? f.metadata.format.toUpperCase() : f.extension.toUpperCase();
    fileSize.textContent = formatBytes(f.sizeBytes);
    fileDimensions.textContent = f.metadata.width
      ? `${f.metadata.width} x ${f.metadata.height}px`
      : 'N/A';

    // Render format cards
    formatOptions.innerHTML = '';
    f.estimates.forEach(est => {
      const card = document.createElement('div');
      card.className = 'format-card';
      card.dataset.format = est.format;

      const reductionClass = est.reductionPercent > 0 ? 'reduction-positive' : 'reduction-negative';
      const reductionSign = est.reductionPercent > 0 ? '-' : '+';
      const reductionAbs = Math.abs(est.reductionPercent);

      card.innerHTML = `
        <div class="format-card__header">
          <input type="checkbox" data-fmt="${est.format}">
          <span class="format-card__name">${est.format}</span>
          ${est.isSameFormat ? '<span class="format-card__same">same fmt</span>' : ''}
        </div>
        <div class="format-card__details">
          <span>~${formatBytes(est.estimatedSizeBytes)}</span>
          <span class="${reductionClass}">${reductionSign}${reductionAbs}%</span>
          <span>~${formatTime(est.estimatedTimeMs)}</span>
        </div>
      `;

      // Toggle checkbox on card click
      card.addEventListener('click', e => {
        if (e.target.tagName === 'INPUT') return;
        const cb = card.querySelector('input[type="checkbox"]');
        cb.checked = !cb.checked;
        card.classList.toggle('selected', cb.checked);
        updateConvertBtn();
      });

      card.querySelector('input[type="checkbox"]').addEventListener('change', function () {
        card.classList.toggle('selected', this.checked);
        updateConvertBtn();
      });

      formatOptions.appendChild(card);
    });

    updateNamePreview();
    fileInfoPanel.classList.remove('hidden');
    resultsPanel.classList.add('hidden');
  }

  // --- Name Preview ---
  function updateNamePreview() {
    if (!currentFile) return;
    const pfx = prefixInput.value;
    const sfx = postfixInput.value;
    namePreview.textContent = `${pfx}${currentFile.baseName}${sfx}.{fmt}`;
  }

  prefixInput.addEventListener('input', updateNamePreview);
  postfixInput.addEventListener('input', updateNamePreview);

  // --- Convert Button State ---
  function updateConvertBtn() {
    const checked = formatOptions.querySelectorAll('input[type="checkbox"]:checked');
    convertBtn.disabled = checked.length === 0;
  }

  // --- Convert ---
  convertBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    const checkedFormats = [...formatOptions.querySelectorAll('input[type="checkbox"]:checked')]
      .map(cb => cb.dataset.fmt);

    if (checkedFormats.length === 0) return;

    try {
      loadingOverlay.classList.remove('hidden');
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storedFilename: currentFile.storedFilename,
          baseName: currentFile.baseName,
          formats: checkedFormats,
          prefix: prefixInput.value,
          postfix: postfixInput.value
        })
      });

      if (!res.ok) throw new Error('Conversion failed');
      const data = await res.json();
      renderResults(data.results);
    } catch (err) {
      alert('Conversion error: ' + err.message);
    } finally {
      loadingOverlay.classList.add('hidden');
    }
  });

  // --- Render Results ---
  function renderResults(results) {
    resultsList.innerHTML = '';
    results.forEach(r => {
      const item = document.createElement('div');
      item.className = 'result-item';

      if (r.success) {
        const reduction = currentFile.sizeBytes > 0
          ? Math.round((1 - r.sizeBytes / currentFile.sizeBytes) * 100)
          : 0;
        const redClass = reduction > 0 ? 'reduction-positive' : 'reduction-negative';
        const redSign = reduction > 0 ? '-' : '+';

        item.innerHTML = `
          <div class="result-item__info">
            <span class="result-item__name">${r.outputName}</span>
            <span class="result-item__meta">
              ${formatBytes(r.sizeBytes)}
              <span class="${redClass}">(${redSign}${Math.abs(reduction)}%)</span>
              &middot; ${formatTime(r.elapsedMs)}
            </span>
          </div>
          <a class="btn-download" href="/api/download/${encodeURIComponent(r.outputName)}" download>
            Download
          </a>
        `;
      } else {
        item.innerHTML = `
          <div class="result-item__info">
            <span class="result-item__name">${r.format.toUpperCase()}</span>
            <span class="result-item__error">${r.error}</span>
          </div>
        `;
      }

      resultsList.appendChild(item);
    });
    resultsPanel.classList.remove('hidden');
  }

  // --- Reset ---
  resetBtn.addEventListener('click', resetUI);

  function resetUI() {
    currentFile = null;
    fileInfoPanel.classList.add('hidden');
    resultsPanel.classList.add('hidden');
    formatOptions.innerHTML = '';
    resultsList.innerHTML = '';
    prefixInput.value = '';
    postfixInput.value = '';
    namePreview.textContent = '';
    convertBtn.disabled = true;
    fileInput.value = '';
  }
})();
