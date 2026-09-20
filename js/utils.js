export function debounce(fn, wait = 200) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

export function parseExtension(fileName) {
    const i = fileName.lastIndexOf('.');
    if (i <= 0) return '';
    return fileName.substring(i + 1).toLowerCase();
}

export function splitName(fileName) {
    const i = fileName.lastIndexOf('.');
    if (i <= 0) return { stem: fileName, ext: '' };
    return { stem: fileName.substring(0, i), ext: fileName.substring(i) };
}

export async function fileExists(dirHandle, name) {
    try {
        await dirHandle.getFileHandle(name);
        return true;
    } catch {
        return false;
    }
}

export async function uniqueFileName(dirHandle, fileName) {
    if (!(await fileExists(dirHandle, fileName))) return fileName;
    const { stem, ext } = splitName(fileName);
    let i = 1;
    while (true) {
        const candidate = `${stem} (${i})${ext}`;
        if (!(await fileExists(dirHandle, candidate))) return candidate;
        i++;
    }
}

export function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function escapeHtml(str) {
    return String(str).replace(/[[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

export async function getNestedDirectoryHandle(parentHandle, folderPath, { create = true } = {}) {
    const parts = folderPath.split('/').filter(p => p.length > 0);
    let current = parentHandle;
    for (const part of parts) {
        current = await current.getDirectoryHandle(part, { create });
    }
    return current;
}

export function formatTime(ts) {
    return new Date(ts).toLocaleTimeString('vi-VN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

export function uid() {
    return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const DOWNLOAD_EXTS = ['.crswap', '.crdownload', '.part', '.partial', '.download'];
export function isDownloading(fileName) {
  const lower = fileName.toLowerCase();
  return DOWNLOAD_EXTS.some(e => lower.endsWith(e));
}
