/**
 * 工具函数
 */

/**
 * 显示提示信息
 */
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

/**
 * 切换屏幕
 */
function showScreen(screenId) {
    // 隐藏所有屏幕
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // 显示目标屏幕
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

/**
 * 颜色转CSS字符串
 */
function colorToHex(color) {
    return '#' + color.toString(16).padStart(6, '0');
}

/**
 * 创建颜色按钮
 */
function createColorButton(color, name, isSelected = false) {
    const btn = document.createElement('button');
    btn.className = 'color-btn' + (isSelected ? ' selected' : '');
    btn.style.backgroundColor = colorToHex(color);
    btn.dataset.color = color;
    btn.title = name;
    return btn;
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 加载图片
 */
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

/**
 * 下载文件
 */
function downloadFile(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
}

/**
 * 检测移动设备
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * 检测iOS设备
 */
function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * 触觉反馈（支持的设备）
 */
function vibrate(duration = 50) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

/**
 * 复制到剪贴板
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('已复制到剪贴板');
        return true;
    } catch (err) {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('已复制到剪贴板');
            return true;
        } catch (err) {
            showToast('复制失败');
            return false;
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

/**
 * 生成唯一ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 深度克隆对象
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * 格式化日期
 */
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 本地存储封装
 */
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('Storage set failed:', e);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    clear() {
        localStorage.clear();
    }
};

/**
 * DOM元素是否存在
 */
function elementExists(id) {
    return document.getElementById(id) !== null;
}

/**
 * 等待元素出现
 */
function waitForElement(id, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.getElementById(id);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const element = document.getElementById(id);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${id} not found within ${timeout}ms`));
        }, timeout);
    });
}

/**
 * 设置按钮加载状态
 */
function setButtonLoading(button, loading, originalText = '') {
    if (loading) {
        button.dataset.originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = '<span class="loading"><span class="loading-spinner"></span>处理中...</span>';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || originalText;
    }
}

/**
 * 导出
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showToast,
        showScreen,
        colorToHex,
        createColorButton,
        formatFileSize,
        debounce,
        throttle,
        loadImage,
        downloadFile,
        isMobileDevice,
        isIOSDevice,
        vibrate,
        copyToClipboard,
        generateId,
        deepClone,
        formatDate,
        Storage,
        elementExists,
        waitForElement,
        setButtonLoading
    };
}
