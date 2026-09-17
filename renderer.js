// Elements cache
const els = {
  menuDash: document.getElementById('menu-dash'),
  menuRules: document.getElementById('menu-rules'),
  menuLogs: document.getElementById('menu-logs'),
  pageDashboard: document.getElementById('page-dashboard'),
  pageCategories: document.getElementById('page-categories'),
  pageLogs: document.getElementById('page-logs'),
  
  appTitleDisplay: document.getElementById('app-title-display'),
  appSubtitleDisplay: document.getElementById('app-subtitle-display'),
  
  inputSourceDir: document.getElementById('input-source-dir'),
  inputDestDir: document.getElementById('input-dest-dir'),
  btnBrowseSource: document.getElementById('btn-browse-source'),
  btnBrowseDest: document.getElementById('btn-browse-dest'),
  
  btnRunOrganizer: document.getElementById('btn-run-organizer'),
  runStatusDesc: document.getElementById('run-status-desc'),
  statusDot: document.getElementById('status-dot'),
  statusText: document.getElementById('status-text'),
  toggleAutoRun: document.getElementById('toggle-auto-run'),
  dashboardOverlay: document.getElementById('dashboard-overlay'),
  
  statMoved: document.getElementById('stat-moved'),
  statErrors: document.getElementById('stat-errors'),
  statRulesCount: document.getElementById('stat-rules-count'),
  
  dashActivityList: document.getElementById('dash-activity-list'),
  fullActivityList: document.getElementById('full-activity-list'),
  
  btnClearDashLogs: document.getElementById('btn-clear-dash-logs'),
  btnClearAllLogs: document.getElementById('btn-clear-all-logs'),
  
  categoriesListContainer: document.getElementById('categories-list-container')
};

// Default Settings State
let settings = {
  sourceDir: '',
  baseDestDir: '',
  autoRun: false,
  categories: [
    {
      id: 'install',
      name: 'Bộ Cài Đặt (Install)',
      folderName: 'Install',
      extensions: ['exe', 'msi', 'dmg', 'pkg'],
      themeClass: 'cat-install',
      customPath: ''
    },
    {
      id: 'pictures',
      name: 'Hình Ảnh (Pictures)',
      folderName: 'Pictures',
      extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'tiff'],
      themeClass: 'cat-picture',
      customPath: ''
    },
    {
      id: 'media',
      name: 'Phim & Âm Nhạc (Media)',
      folderName: 'Media',
      extensions: ['mp3', 'wav', 'mp4', 'mkv', 'avi', 'mov', 'flac', 'ogg', 'webm', 'm4a'],
      themeClass: 'cat-media',
      customPath: ''
    },
    {
      id: 'documents',
      name: 'Tài Liệu (Documents)',
      folderName: 'Documents',
      extensions: ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'csv', 'epub', 'doc', 'xls', 'ppt'],
      themeClass: 'cat-document',
      customPath: ''
    },
    {
      id: 'archives',
      name: 'File Nén (Archives)',
      folderName: 'Archives',
      extensions: ['zip', 'rar', '7z', 'tar', 'gz'],
      themeClass: 'cat-archive',
      customPath: ''
    },
    {
      id: 'markdown',
      name: 'Tài Liệu Markdown (Markdown)',
      folderName: 'Markdown',
      extensions: ['md', 'markdown'],
      themeClass: 'cat-document',
      customPath: ''
    },
    {
      id: 'html_index',
      name: 'HTML Web Pages (Index)',
      folderName: 'HTML/index',
      extensions: ['html', 'htm'],
      themeClass: 'cat-picture',
      customPath: ''
    },
    {
      id: 'html_css',
      name: 'CSS Stylesheets (CSS)',
      folderName: 'HTML/css',
      extensions: ['css'],
      themeClass: 'cat-picture',
      customPath: ''
    },
    {
      id: 'html_json',
      name: 'JSON Data (Json)',
      folderName: 'HTML/json',
      extensions: ['json', 'jsion'],
      themeClass: 'cat-picture',
      customPath: ''
    },
    {
      id: 'python',
      name: 'Mã Nguồn Python (Codes/Python)',
      folderName: 'Codes/Python',
      extensions: ['py', 'pyw', 'ipynb'],
      themeClass: 'cat-install',
      customPath: ''
    },
    {
      id: 'cpp',
      name: 'Mã Nguồn C/C++ (Codes/C_CPP)',
      folderName: 'Codes/C_CPP',
      extensions: ['cpp', 'hpp', 'c', 'h', 'cc', 'cxx'],
      themeClass: 'cat-media',
      customPath: ''
    },
    {
      id: 'javascript',
      name: 'Mã Nguồn JS/TS (Codes/JS)',
      folderName: 'Codes/JS',
      extensions: ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx'],
      themeClass: 'cat-install',
      customPath: ''
    },
    {
      id: 'others',
      name: 'Tệp Khác (Others)',
      folderName: 'Others',
      extensions: ['*'],
      themeClass: 'cat-other',
      customPath: ''
    }
  ],
  history: []
};

// Initialize Application
async function init() {
  // Load saved settings
  const savedSettings = await window.api.loadSettings();
  if (savedSettings) {
    const originalCategoriesLength = (savedSettings.categories || []).length;
    // Merge loaded settings with default structure to prevent missing fields
    settings = {
      ...settings,
      ...savedSettings,
      categories: settings.categories.map(cat => {
        const savedCat = (savedSettings.categories || []).find(c => c.id === cat.id);
        if (savedCat) {
          const isOldDefaultFolder = 
            (cat.id === 'python' && savedCat.folderName === 'Python') ||
            (cat.id === 'cpp' && savedCat.folderName === 'C_CPP');
          return {
            ...cat,
            ...savedCat,
            folderName: (isOldDefaultFolder && !savedCat.customPath) ? cat.folderName : savedCat.folderName
          };
        }
        return cat;
      })
    };
    if (settings.categories.length !== originalCategoriesLength) {
      await saveSettings();
    }
  } else {
    // If no settings exist, fetch default downloads directory
    const defaultDownloads = await window.api.getDefaultDownloadsDir();
    settings.sourceDir = defaultDownloads;
    settings.baseDestDir = `${defaultDownloads}/Organized`;
    await saveSettings();
  }

  // Update inputs/views
  updateInputs();
  renderCategories();
  renderHistory();
  updateStats();
  setupEventListeners();

  // If auto-run is enabled, execute sorting on startup
  if (settings.autoRun) {
    runOrganizer();
  }
}

// Save settings to disk
async function saveSettings() {
  await window.api.saveSettings(settings);
}

// Update settings inputs in DOM
function updateInputs() {
  els.inputSourceDir.value = settings.sourceDir;
  els.inputDestDir.value = settings.baseDestDir;
  els.toggleAutoRun.checked = settings.autoRun;
}

// Update stats panel
function updateStats() {
  const totalMoved = settings.history.filter(item => item.status === 'OK').length;
  const totalErrors = settings.history.filter(item => item.status === 'ERROR').length;
  const rulesCount = settings.categories.length;

  els.statMoved.innerText = totalMoved;
  els.statErrors.innerText = totalErrors;
  els.statRulesCount.innerText = rulesCount;
}

// Event Listeners setup
function setupEventListeners() {
  // Navigation Menu Toggling
  const navItems = [els.menuDash, els.menuRules, els.menuLogs];
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      const targetPage = item.getAttribute('data-page');
      
      // Toggle visibility
      document.querySelectorAll('.page-view').forEach(page => {
        page.classList.remove('active');
      });
      document.getElementById(targetPage).classList.add('active');
      
      // Update header titles
      if (targetPage === 'page-dashboard') {
        els.appTitleDisplay.innerText = 'Trang Chủ';
        els.appSubtitleDisplay.innerText = 'Quản lý và tự động sắp xếp tập tin nhanh chóng';
      } else if (targetPage === 'page-categories') {
        els.appTitleDisplay.innerText = 'Cấu Hình Quy Tắc';
        els.appSubtitleDisplay.innerText = 'Thiết lập định dạng tập tin và vị trí lưu trữ';
      } else if (targetPage === 'page-logs') {
        els.appTitleDisplay.innerText = 'Lịch Sử Hoạt Động';
        els.appSubtitleDisplay.innerText = 'Theo dõi chi tiết các file đã phân loại';
      }
    });
  });

  // Source Folder Selector
  els.btnBrowseSource.addEventListener('click', async () => {
    const selected = await window.api.selectDirectory(settings.sourceDir);
    if (selected) {
      settings.sourceDir = selected;
      // Automatically adjust organized default folder if it is in the old folder
      if (settings.baseDestDir.includes('Organized')) {
        settings.baseDestDir = `${selected}/Organized`;
      }
      updateInputs();
      await saveSettings();
    }
  });

  // Destination Folder Selector
  els.btnBrowseDest.addEventListener('click', async () => {
    const selected = await window.api.selectDirectory(settings.baseDestDir || settings.sourceDir);
    if (selected) {
      settings.baseDestDir = selected;
      updateInputs();
      await saveSettings();
    }
  });

  // Auto Run Toggle Change
  els.toggleAutoRun.addEventListener('change', async (e) => {
    settings.autoRun = e.target.checked;
    await saveSettings();
  });

  // Run Organizer Button Click
  els.btnRunOrganizer.addEventListener('click', () => {
    runOrganizer();
  });

  // Clean dashboard / logs histories
  els.btnClearDashLogs.addEventListener('click', clearHistoryLogs);
  els.btnClearAllLogs.addEventListener('click', clearHistoryLogs);
}

// Clear all execution logs
async function clearHistoryLogs() {
  if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử phân loại đã ghi lại trong ứng dụng không?')) {
    settings.history = [];
    await saveSettings();
    renderHistory();
    updateStats();
  }
}

// Add extension to category
async function addExtension(catId, inputEl) {
  const rawExt = inputEl.value.trim().toLowerCase();
  if (!rawExt) return;
  
  // Clean dots
  const ext = rawExt.startsWith('.') ? rawExt.substring(1) : rawExt;
  if (!ext) return;

  const category = settings.categories.find(c => c.id === catId);
  if (category) {
    if (!category.extensions.includes(ext)) {
      category.extensions.push(ext);
      await saveSettings();
      renderCategories();
      inputEl.value = '';
    } else {
      alert('Định dạng này đã tồn tại trong danh mục!');
    }
  }
}

// Remove extension from category
async function removeExtension(catId, ext) {
  const category = settings.categories.find(c => c.id === catId);
  if (category) {
    category.extensions = category.extensions.filter(e => e !== ext);
    await saveSettings();
    renderCategories();
  }
}

// Change custom destination path for specific category
async function chooseCustomCategoryPath(catId) {
  const category = settings.categories.find(c => c.id === catId);
  if (!category) return;

  const defaultDir = category.customPath || settings.baseDestDir || settings.sourceDir;
  const selected = await window.api.selectDirectory(defaultDir);
  
  if (selected) {
    category.customPath = selected;
    await saveSettings();
    renderCategories();
  }
}

// Reset category destination to default
async function resetCategoryPath(catId) {
  const category = settings.categories.find(c => c.id === catId);
  if (category) {
    category.customPath = '';
    await saveSettings();
    renderCategories();
  }
}

// Render configuration cards for categories
function renderCategories() {
  els.categoriesListContainer.innerHTML = '';
  
  settings.categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'glass-panel category-card';
    
    // Determine current path display
    const currentPath = cat.customPath || `${settings.baseDestDir || settings.sourceDir}/${cat.folderName}`;
    const isCustom = !!cat.customPath;
    
    // Create badges HTML
    const badgesHtml = cat.extensions.map(ext => `
      <span class="ext-badge">
        .${ext}
        ${cat.id !== 'others' ? `<span class="ext-badge-remove" data-cat="${cat.id}" data-ext="${ext}">✕</span>` : ''}
      </span>
    `).join('');

    card.innerHTML = `
      <div class="category-card-header">
        <h3 class="category-title">
          <span class="category-title-icon ${cat.themeClass}">${cat.folderName.substring(0,2)}</span>
          ${cat.name}
        </h3>
        ${isCustom ? `
          <button class="btn btn-small" style="padding: 4px 8px; font-size: 0.7rem; border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red);" id="reset-path-${cat.id}">Khôi phục mặc định</button>
        ` : ''}
      </div>
      
      <div class="category-path-label" id="path-lbl-${cat.id}" title="Click để đổi thư mục: ${currentPath}">
        📂 ${currentPath}
      </div>

      <div class="extensions-header">Định dạng file liên kết:</div>
      <div class="extensions-list">
        ${badgesHtml || '<span style="color: var(--text-dark); font-size: 0.75rem;">(Trống - Thêm đuôi file bên dưới)</span>'}
      </div>

      ${cat.id !== 'others' ? `
        <div class="ext-add-form">
          <input type="text" placeholder="Thêm đuôi file (vd: pdf, png)..." class="ext-input" id="ext-input-${cat.id}">
          <button class="btn btn-primary btn-small" id="ext-btn-${cat.id}">Thêm</button>
        </div>
      ` : `
        <div style="margin-top: auto; font-size: 0.75rem; color: var(--text-dark); text-align: center;">
          <i>Hạng mục này chứa tất cả các tệp không trùng khớp với các danh mục trên.</i>
        </div>
      `}
    `;

    els.categoriesListContainer.appendChild(card);

    // Event listener for custom folder selection
    document.getElementById(`path-lbl-${cat.id}`).addEventListener('click', () => {
      chooseCustomCategoryPath(cat.id);
    });

    // Event listener for reset custom path
    if (isCustom) {
      document.getElementById(`reset-path-${cat.id}`).addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid triggering path label selection click
        resetCategoryPath(cat.id);
      });
    }

    // Add extension listeners
    if (cat.id !== 'others') {
      const input = document.getElementById(`ext-input-${cat.id}`);
      const btn = document.getElementById(`ext-btn-${cat.id}`);
      
      btn.addEventListener('click', () => addExtension(cat.id, input));
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addExtension(cat.id, input);
      });
    }
  });

  // Remove extension listeners delegation
  document.querySelectorAll('.ext-badge-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const catId = btn.getAttribute('data-cat');
      const ext = btn.getAttribute('data-ext');
      removeExtension(catId, ext);
    });
  });
}

// Render operations history logs
function renderHistory() {
  const generateHistoryHTML = (items) => {
    if (items.length === 0) {
      return `
        <div class="empty-state">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>Chưa có tập tin nào được xử lý.</p>
        </div>
      `;
    }

    return items.map(item => {
      const isOK = item.status === 'OK';
      const extIcon = item.ext ? item.ext.replace('.', '').toUpperCase() : '?';
      
      // Determine category theme class
      let themeClass = 'cat-other';
      if (isOK) {
        const foundCat = settings.categories.find(cat => cat.extensions.includes(item.ext.replace('.', '')));
        if (foundCat) themeClass = foundCat.themeClass;
      } else {
        themeClass = 'cat-other';
      }

      return `
        <div class="activity-item">
          <div class="activity-item-details">
            <div class="activity-file-icon ${themeClass}">${extIcon.substring(0, 3)}</div>
            <div style="overflow: hidden;">
              <div class="activity-file-name" title="${item.name}">${item.name}</div>
              <div class="activity-file-paths" title="${isOK ? `${item.from} → ${item.to}` : item.from}">
                ${isOK ? `Từ: ...\\${item.name} ➔ ${item.to}` : `Lỗi di chuyển: ${item.from}`}
              </div>
            </div>
          </div>
          <div>
            <span class="activity-badge ${isOK ? 'activity-badge-success' : 'activity-badge-error'}">
              ${isOK ? 'Hoàn tất' : `Lỗi: ${item.error || 'Thất bại'}`}
            </span>
          </div>
        </div>
      `;
    }).join('');
  };

  // Populate dashboard list (limited to 5 items for clean display)
  const dashboardItems = [...settings.history].reverse().slice(0, 5);
  els.dashActivityList.innerHTML = generateHistoryHTML(dashboardItems);

  // Populate full logs list
  const fullItems = [...settings.history].reverse();
  els.fullActivityList.innerHTML = generateHistoryHTML(fullItems);
}

// Run sorting engine
async function runOrganizer() {
  if (els.btnRunOrganizer.classList.contains('running')) return;

  // Change UI to running state
  els.btnRunOrganizer.classList.add('running');
  els.btnRunOrganizer.querySelector('span').innerText = 'ĐANG CHẠY';
  els.runStatusDesc.innerText = 'Đang di chuyển tệp tin...';
  els.statusDot.className = 'status-indicator status-running';
  els.statusText.innerText = 'Đang xử lý';
  els.dashboardOverlay.classList.add('active');

  try {
    // Call backend API
    const response = await window.api.runOrganizer({
      sourceDir: settings.sourceDir,
      baseDestDir: settings.baseDestDir,
      categories: settings.categories
    });

    if (response.success) {
      const timestamp = new Date().toLocaleString();
      
      // Parse backend output
      const newLogs = [];
      
      // Add success items
      response.movedFiles.forEach(file => {
        newLogs.push({
          status: 'OK',
          name: file.name,
          from: file.from,
          to: file.to,
          ext: file.ext,
          time: timestamp
        });
      });

      // Add error items
      response.errors.forEach(err => {
        newLogs.push({
          status: 'ERROR',
          name: err.file.split(/[\\/]/).pop(),
          from: err.file,
          error: err.message,
          time: timestamp
        });
      });

      // Update history in state
      if (newLogs.length > 0) {
        settings.history = [...settings.history, ...newLogs];
        await saveSettings();
        
        // Show desktop notification if files were organized
        if (response.summary.moved > 0) {
          new Notification('Đã sắp xếp tệp tin thành công!', {
            body: `Đã di chuyển ${response.summary.moved} tệp tin vào các thư mục phân loại.`
          });
        }
      } else {
        new Notification('Đã quét xong!', {
          body: `Không phát hiện tệp tin mới nào cần phân loại.`
        });
      }

      // Update tables & stats
      renderHistory();
      updateStats();

      els.runStatusDesc.innerText = `Hoàn tất! Đã di chuyển ${response.summary.moved} tệp, lỗi ${response.summary.errors} tệp.`;
    } else {
      alert(`Đã xảy ra lỗi khi khởi chạy công cụ phân loại C++:\n${response.error}`);
      els.runStatusDesc.innerText = 'Gặp lỗi trong quá trình quét.';
    }
  } catch (err) {
    console.error(err);
    alert(`Lỗi hệ thống: ${err.message}`);
    els.runStatusDesc.innerText = 'Lỗi hệ thống.';
  } finally {
    // Reset UI state after 2 seconds to let the user read results
    setTimeout(() => {
      els.btnRunOrganizer.classList.remove('running');
      els.btnRunOrganizer.querySelector('span').innerText = 'BẮT ĐẦU';
      els.runStatusDesc.innerText = 'Nhấp để sắp xếp thư mục';
      els.statusDot.className = 'status-indicator status-idle';
      els.statusText.innerText = 'Sẵn Sàng';
      els.dashboardOverlay.classList.remove('active');
    }, 1500);
  }
}

// Start app
document.addEventListener('DOMContentLoaded', init);
