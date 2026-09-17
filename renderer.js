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

// Global FileSystem Directory Handles (Kept in Browser Memory)
let sourceDirHandle = null;
let baseDestDirHandle = null;
const customCategoryHandles = {};

// Default Settings State
let settings = {
  sourceDirName: '',
  baseDestDirName: '',
  autoRun: false,
  categories: [
    {
      id: 'install',
      name: 'Bộ Cài Đặt (Install)',
      folderName: 'Install',
      extensions: ['exe', 'msi', 'dmg', 'pkg', 'apk', 'deb'],
      themeClass: 'cat-install',
      customPathName: ''
    },
    {
      id: 'pictures',
      name: 'Hình Ảnh (Pictures)',
      folderName: 'Pictures',
      extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'tiff', 'psd', 'ai'],
      themeClass: 'cat-picture',
      customPathName: ''
    },
    {
      id: 'media',
      name: 'Phim & Âm Nhạc (Media)',
      folderName: 'Media',
      extensions: ['mp3', 'wav', 'mp4', 'mkv', 'avi', 'mov', 'flac', 'ogg', 'webm', 'm4a'],
      themeClass: 'cat-media',
      customPathName: ''
    },
    {
      id: 'documents',
      name: 'Tài Liệu (Documents)',
      folderName: 'Documents',
      extensions: ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'csv', 'epub', 'doc', 'xls', 'ppt'],
      themeClass: 'cat-document',
      customPathName: ''
    },
    {
      id: 'archives',
      name: 'File Nén (Archives)',
      folderName: 'Archives',
      extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'iso'],
      themeClass: 'cat-archive',
      customPathName: ''
    },
    {
      id: 'markdown',
      name: 'Tài Liệu Markdown (Markdown)',
      folderName: 'Markdown',
      extensions: ['md', 'markdown'],
      themeClass: 'cat-document',
      customPathName: ''
    },
    {
      id: 'html_index',
      name: 'HTML Web Pages (Index)',
      folderName: 'HTML/index',
      extensions: ['html', 'htm'],
      themeClass: 'cat-picture',
      customPathName: ''
    },
    {
      id: 'html_css',
      name: 'CSS Stylesheets (CSS)',
      folderName: 'HTML/css',
      extensions: ['css'],
      themeClass: 'cat-picture',
      customPathName: ''
    },
    {
      id: 'html_json',
      name: 'JSON Data (Json)',
      folderName: 'HTML/json',
      extensions: ['json'],
      themeClass: 'cat-picture',
      customPathName: ''
    },
    {
      id: 'python',
      name: 'Mã Nguồn Python (Codes/Python)',
      folderName: 'Codes/Python',
      extensions: ['py', 'pyw', 'ipynb'],
      themeClass: 'cat-install',
      customPathName: ''
    },
    {
      id: 'cpp',
      name: 'Mã Nguồn C/C++ (Codes/C_CPP)',
      folderName: 'Codes/C_CPP',
      extensions: ['cpp', 'hpp', 'c', 'h', 'cc', 'cxx'],
      themeClass: 'cat-media',
      customPathName: ''
    },
    {
      id: 'javascript',
      name: 'Mã Nguồn JS/TS (Codes/JS)',
      folderName: 'Codes/JS',
      extensions: ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx'],
      themeClass: 'cat-install',
      customPathName: ''
    },
    {
      id: 'others',
      name: 'Tệp Khác (Others)',
      folderName: 'Others',
      extensions: ['*'],
      themeClass: 'cat-other',
      customPathName: ''
    }
  ],
  history: []
};

// Initialize Web Application
async function init() {
  // Check File System Access API support
  if (!('showDirectoryPicker' in window)) {
    showBrowserSupportWarning();
  }

  // Load saved settings from localStorage
  loadSavedSettings();

  // Update DOM inputs and views
  updateInputs();
  renderCategories();
  renderHistory();
  updateStats();
  setupEventListeners();

  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Display warning if browser does not support directory picking
function showBrowserSupportWarning() {
  const warningBanner = document.createElement('div');
  warningBanner.style.cssText = `
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(239, 68, 68, 0.5);
    color: #fca5a5;
    padding: 12px 16px;
    border-radius: 12px;
    margin-bottom: 20px;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  warningBanner.innerHTML = `
    <span>⚠️ <strong>Cảnh báo tương thích:</strong> Trình duyệt của bạn hiện chưa hỗ trợ <i>File System Access API</i>. Vui lòng sử dụng <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong> hoặc <strong>Brave</strong> để sử dụng tính năng chọn thư mục trên máy tính!</span>
  `;
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.insertBefore(warningBanner, mainContent.children[1]);
  }
}

// Load settings from localStorage
function loadSavedSettings() {
  try {
    const raw = localStorage.getItem('sorter_web_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      settings = {
        ...settings,
        ...parsed,
        categories: settings.categories.map(cat => {
          const savedCat = (parsed.categories || []).find(c => c.id === cat.id);
          return savedCat ? { ...cat, ...savedCat } : cat;
        })
      };
    }
  } catch (e) {
    console.error('Failed to parse saved settings from localStorage:', e);
  }
}

// Save settings to localStorage
function saveSettings() {
  try {
    localStorage.setItem('sorter_web_settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
}

// Update directory inputs in DOM
function updateInputs() {
  els.inputSourceDir.value = sourceDirHandle ? `📂 ${sourceDirHandle.name}` : (settings.sourceDirName ? `📂 ${settings.sourceDirName} (Cần chọn lại)` : '');
  els.inputDestDir.value = baseDestDirHandle ? `📂 ${baseDestDirHandle.name}` : (settings.baseDestDirName ? `📂 ${settings.baseDestDirName}` : 'Mặc định: Thư mục con "Organized"');
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
    item.addEventListener('click', () => {
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      const targetPage = item.getAttribute('data-page');
      
      document.querySelectorAll('.page-view').forEach(page => {
        page.classList.remove('active');
      });
      document.getElementById(targetPage).classList.add('active');
      
      if (targetPage === 'page-dashboard') {
        els.appTitleDisplay.innerText = 'Trang Chủ';
        els.appSubtitleDisplay.innerText = 'Quản lý và tự động sắp xếp tập tin nhanh chóng trên Web';
      } else if (targetPage === 'page-categories') {
        els.appTitleDisplay.innerText = 'Cấu Hình Quy Tắc';
        els.appSubtitleDisplay.innerText = 'Thiết lập định dạng tập tin và vị trí lưu trữ';
      } else if (targetPage === 'page-logs') {
        els.appTitleDisplay.innerText = 'Lịch Sử Hoạt Động';
        els.appSubtitleDisplay.innerText = 'Theo dõi chi tiết các file đã phân loại';
      }
    });
  });

  // Source Folder Selector (Web Directory Picker)
  els.btnBrowseSource.addEventListener('click', async () => {
    if (!('showDirectoryPicker' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ chọn thư mục. Vui lòng mở trang này trên Google Chrome, Edge hoặc Brave.');
      return;
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      sourceDirHandle = handle;
      settings.sourceDirName = handle.name;
      updateInputs();
      saveSettings();
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        alert(`Không thể truy cập thư mục: ${err.message}`);
      }
    }
  });

  // Destination Folder Selector
  els.btnBrowseDest.addEventListener('click', async () => {
    if (!('showDirectoryPicker' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ chọn thư mục. Vui lòng mở trang này trên Google Chrome, Edge hoặc Brave.');
      return;
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      baseDestDirHandle = handle;
      settings.baseDestDirName = handle.name;
      updateInputs();
      saveSettings();
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        alert(`Không thể truy cập thư mục: ${err.message}`);
      }
    }
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
function clearHistoryLogs() {
  if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử phân loại đã ghi lại trong ứng dụng không?')) {
    settings.history = [];
    saveSettings();
    renderHistory();
    updateStats();
  }
}

// Add extension to category
function addExtension(catId, inputEl) {
  const rawExt = inputEl.value.trim().toLowerCase();
  if (!rawExt) return;
  
  const ext = rawExt.startsWith('.') ? rawExt.substring(1) : rawExt;
  if (!ext) return;

  const category = settings.categories.find(c => c.id === catId);
  if (category) {
    if (!category.extensions.includes(ext)) {
      category.extensions.push(ext);
      saveSettings();
      renderCategories();
      inputEl.value = '';
    } else {
      alert('Định dạng này đã tồn tại trong danh mục!');
    }
  }
}

// Remove extension from category
function removeExtension(catId, ext) {
  const category = settings.categories.find(c => c.id === catId);
  if (category) {
    category.extensions = category.extensions.filter(e => e !== ext);
    saveSettings();
    renderCategories();
  }
}

// Choose custom destination directory for specific category
async function chooseCustomCategoryPath(catId) {
  if (!('showDirectoryPicker' in window)) {
    alert('Trình duyệt của bạn không hỗ trợ tính năng này. Vui lòng dùng Chrome / Edge / Brave.');
    return;
  }
  const category = settings.categories.find(c => c.id === catId);
  if (!category) return;

  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    customCategoryHandles[catId] = handle;
    category.customPathName = handle.name;
    saveSettings();
    renderCategories();
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error(err);
    }
  }
}

// Reset category custom path
function resetCategoryPath(catId) {
  const category = settings.categories.find(c => c.id === catId);
  if (category) {
    category.customPathName = '';
    delete customCategoryHandles[catId];
    saveSettings();
    renderCategories();
  }
}

// Render configuration cards for categories
function renderCategories() {
  els.categoriesListContainer.innerHTML = '';
  
  settings.categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'glass-panel category-card';
    
    let pathDisplay = '';
    if (cat.customPathName) {
      pathDisplay = `📂 Custom: ${cat.customPathName}`;
    } else if (baseDestDirHandle) {
      pathDisplay = `📂 ${baseDestDirHandle.name}/${cat.folderName}`;
    } else if (sourceDirHandle) {
      pathDisplay = `📂 ${sourceDirHandle.name}/Organized/${cat.folderName}`;
    } else {
      pathDisplay = `📂 [Mặc định] Organized/${cat.folderName}`;
    }

    const isCustom = !!cat.customPathName;
    
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
      
      <div class="category-path-label" id="path-lbl-${cat.id}" title="Nhấp để chọn thư mục riêng cho mục này: ${pathDisplay}">
        ${pathDisplay}
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

    document.getElementById(`path-lbl-${cat.id}`).addEventListener('click', () => {
      chooseCustomCategoryPath(cat.id);
    });

    if (isCustom) {
      document.getElementById(`reset-path-${cat.id}`).addEventListener('click', (e) => {
        e.stopPropagation();
        resetCategoryPath(cat.id);
      });
    }

    if (cat.id !== 'others') {
      const input = document.getElementById(`ext-input-${cat.id}`);
      const btn = document.getElementById(`ext-btn-${cat.id}`);
      
      btn.addEventListener('click', () => addExtension(cat.id, input));
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addExtension(cat.id, input);
      });
    }
  });

  document.querySelectorAll('.ext-badge-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = btn.getAttribute('data-cat');
      const ext = btn.getAttribute('data-ext');
      removeExtension(catId, ext);
    });
  });
}

// Render execution logs
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
      
      let themeClass = 'cat-other';
      if (isOK) {
        const foundCat = settings.categories.find(cat => cat.extensions.includes(item.ext.replace('.', '')));
        if (foundCat) themeClass = foundCat.themeClass;
      }

      return `
        <div class="activity-item">
          <div class="activity-item-details">
            <div class="activity-file-icon ${themeClass}">${extIcon.substring(0, 3)}</div>
            <div style="overflow: hidden;">
              <div class="activity-file-name" title="${item.name}">${item.name}</div>
              <div class="activity-file-paths" title="${isOK ? `${item.from} → ${item.to}` : item.from}">
                ${isOK ? `Từ: ${item.from} ➔ ${item.to}` : `Lỗi: ${item.error || 'Thất bại'}`}
              </div>
            </div>
          </div>
          <div>
            <span class="activity-badge ${isOK ? 'activity-badge-success' : 'activity-badge-error'}">
              ${isOK ? 'Hoàn tất' : 'Lỗi'}
            </span>
          </div>
        </div>
      `;
    }).join('');
  };

  const dashboardItems = [...settings.history].reverse().slice(0, 5);
  els.dashActivityList.innerHTML = generateHistoryHTML(dashboardItems);

  const fullItems = [...settings.history].reverse();
  els.fullActivityList.innerHTML = generateHistoryHTML(fullItems);
}

// Helper: Ensure subdirectories exist recursively for nested folder names (e.g. "HTML/index")
async function getNestedDirectoryHandle(parentHandle, folderPath) {
  const parts = folderPath.split('/').filter(p => p.length > 0);
  let currentHandle = parentHandle;
  for (const part of parts) {
    currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
  }
  return currentHandle;
}

// Core Web File System Access Organizer Engine
async function runOrganizer() {
  if (els.btnRunOrganizer.classList.contains('running')) return;

  // Prompt user if source directory handle is not set
  if (!sourceDirHandle) {
    alert('Vui lòng bấm vào nút "Chọn..." tại Thư mục nguồn để cấp quyền chọn thư mục trên máy bạn!');
    try {
      sourceDirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      settings.sourceDirName = sourceDirHandle.name;
      updateInputs();
      saveSettings();
    } catch (err) {
      return;
    }
  }

  // Request & verify readwrite permissions
  try {
    const opts = { mode: 'readwrite' };
    if ((await sourceDirHandle.queryPermission(opts)) !== 'granted') {
      if ((await sourceDirHandle.requestPermission(opts)) !== 'granted') {
        alert('Cần cấp quyền đọc/ghi để tiến hành phân loại các tệp tin trong thư mục!');
        return;
      }
    }
  } catch (permErr) {
    console.error('Permission check failed:', permErr);
  }

  // Update UI to running state
  els.btnRunOrganizer.classList.add('running');
  els.btnRunOrganizer.querySelector('span').innerText = 'ĐANG CHẠY';
  els.runStatusDesc.innerText = 'Đang quét & di chuyển tệp tin...';
  els.statusDot.className = 'status-indicator status-running';
  els.statusText.innerText = 'Đang xử lý';
  els.dashboardOverlay.classList.add('active');

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const newLogs = [];
  let movedCount = 0;
  let errorCount = 0;

  try {
    const tempExts = ['.crdownload', '.tmp', '.part', '.download', '.lock'];

    // Iterate through files in source directory
    for await (const entry of sourceDirHandle.values()) {
      if (entry.kind !== 'file') continue; // Skip folders

      const fileName = entry.name;
      const lastDotIndex = fileName.lastIndexOf('.');
      const extWithDot = lastDotIndex !== -1 ? fileName.substring(lastDotIndex).toLowerCase() : '';
      const cleanExt = extWithDot.startsWith('.') ? extWithDot.substring(1) : extWithDot;

      // Skip temporary download files
      if (tempExts.includes(extWithDot)) continue;

      // Match category based on extensions
      let matchedCat = settings.categories.find(c => c.extensions.includes(cleanExt));
      if (!matchedCat) {
        matchedCat = settings.categories.find(c => c.extensions.includes('*') || c.id === 'others');
      }

      if (!matchedCat) continue;

      // Determine target root directory handle
      let targetRootHandle = null;
      if (customCategoryHandles[matchedCat.id]) {
        targetRootHandle = customCategoryHandles[matchedCat.id];
      } else if (baseDestDirHandle) {
        targetRootHandle = baseDestDirHandle;
      } else {
        targetRootHandle = await sourceDirHandle.getDirectoryHandle('Organized', { create: true });
      }

      // Get target subfolder handle
      let destFolderHandle = null;
      if (customCategoryHandles[matchedCat.id]) {
        destFolderHandle = targetRootHandle;
      } else {
        destFolderHandle = await getNestedDirectoryHandle(targetRootHandle, matchedCat.folderName);
      }

      // Handle duplicate file names in destination
      let finalFileName = fileName;
      let counter = 1;
      const nameStem = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;

      while (true) {
        try {
          await destFolderHandle.getFileHandle(finalFileName);
          // File exists -> generate unique name
          finalFileName = `${nameStem} (${counter})${extWithDot}`;
          counter++;
        } catch (e) {
          // File does not exist -> safe to write
          break;
        }
      }

      // Execute file move
      try {
        if ('move' in entry && typeof entry.move === 'function') {
          await entry.move(destFolderHandle, finalFileName);
        } else {
          // Stream Copy + Remove fallback
          const fileData = await entry.getFile();
          const targetFileHandle = await destFolderHandle.getFileHandle(finalFileName, { create: true });
          const writableStream = await targetFileHandle.createWritable();
          await writableStream.write(fileData);
          await writableStream.close();
          await sourceDirHandle.removeEntry(fileName);
        }

        newLogs.push({
          status: 'OK',
          name: finalFileName,
          from: `${sourceDirHandle.name}/${fileName}`,
          to: `${destFolderHandle.name}/${finalFileName}`,
          ext: extWithDot,
          time: timestamp
        });
        movedCount++;
      } catch (moveErr) {
        console.error(`Error moving ${fileName}:`, moveErr);
        newLogs.push({
          status: 'ERROR',
          name: fileName,
          from: `${sourceDirHandle.name}/${fileName}`,
          error: moveErr.message || 'Không thể di chuyển file',
          time: timestamp
        });
        errorCount++;
      }
    }

    // Save and update UI
    if (newLogs.length > 0) {
      settings.history = [...settings.history, ...newLogs];
      saveSettings();

      if ('Notification' in window && Notification.permission === 'granted') {
        if (movedCount > 0) {
          new Notification('Sắp xếp hoàn tất!', {
            body: `Đã di chuyển thành công ${movedCount} tệp tin.`
          });
        }
      }
    }

    renderHistory();
    updateStats();

    els.runStatusDesc.innerText = `Hoàn tất! Đã di chuyển ${movedCount} tệp, lỗi ${errorCount} tệp.`;
  } catch (err) {
    console.error('Organizer execution error:', err);
    alert(`Lỗi khi xử lý phân loại: ${err.message}`);
    els.runStatusDesc.innerText = 'Gặp lỗi trong quá trình quét.';
  } finally {
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

// Start Web application
document.addEventListener('DOMContentLoaded', init);
