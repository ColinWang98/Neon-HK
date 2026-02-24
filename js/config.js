/**
 * 香港霓虹灯 AR 2.0 - 配置文件
 * 移动端友好配置
 */

// 设备检测
const Device = {
    isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
    isAndroid: /Android/i.test(navigator.userAgent),
    isLowEnd: false,
    pixelRatio: 1
};

// 性能检测
if (Device.isMobile) {
    Device.isLowEnd = navigator.hardwareConcurrency <= 4;
    Device.pixelRatio = Math.min(window.devicePixelRatio, 2);
} else {
    Device.pixelRatio = Math.min(window.devicePixelRatio, 2);
}

// 应用配置
const APP_CONFIG = {
    // 显示设置
    display: {
        pixelRatio: Device.pixelRatio,
        antialias: !Device.isLowEnd,
        shadows: false
    },

    // AR.js 配置
    ar: {
        markerSize: 1.5,
        detectionMode: 'mono_and_matrix',
        matrixCodeType: '3x3',
        cameraParamsUrl: 'assets/data/camera_para.dat',
        maxPlanes: Device.isLowEnd ? 3 : 10
    },

    // 霓虹灯管道配置
    neon: {
        defaultColor: 0xff00ff,
        pipeRadius: 0.015,
        glassRadius: 0.02,
        emissiveIntensity: 3.0,
        // 移动端降级配置
        pipeSegments: Device.isLowEnd ? 32 : 64,
        radialSegments: Device.isLowEnd ? 6 : 8,
        curveSamples: Device.isLowEnd ? 25 : 50,
        maxTextLength: 10 // 限制字数以保证性能
    },

    // 霓虹色彩方案
    neonColors: {
        magenta: { hex: 0xff00ff, name: '洋红' },
        cyan: { hex: 0x00ffff, name: '青色' },
        orange: { hex: 0xff6600, name: '橙红' },
        yellow: { hex: 0xffff00, name: '暖黄' },
        green: { hex: 0x00ff00, name: '翠绿' },
        red: { hex: 0xff0066, name: '暖红' }
    },

    // AI 服务配置
    ai: {
        // 默认服务（用户可在设置中更改）
        defaultProvider: 'USER_PROVIDED', // 'USER_PROVIDED' | 'ALIYUN' | 'BAIDU' | 'HUGGINGFACE'

        // 服务端点
        services: {
            // 用户自带 Key
            USER_PROVIDED: {
                name: '用户API Key',
                requiresKey: true,
                // 用户配置的服务器地址（自建代理）
                url: 'https://your-proxy.com/api/generate'
            },

            // 通义万相
            ALIYUN: {
                name: '通义万相',
                url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
                requiresKey: true,
                model: 'wanx-v1'
            },

            // 百度文心一格
            BAIDU: {
                name: '文心一格',
                url: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/plugin/26b9121a',
                requiresKey: true
            },

            // Hugging Face（免费，有速率限制）
            HUGGINGFACE: {
                name: 'Hugging Face',
                url: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
                requiresKey: false,
                free: true
            }
        },

        // 生成参数
        generation: {
            defaultSize: '512x512', // 移动端使用较小尺寸
            maxSteps: 30,
            timeout: 30000
        },

        // 风格预设
        styles: {
            cyberpunk: 'neon lights, Hong Kong style, glowing, cyberpunk, night city, vibrant colors',
            traditional: 'traditional Chinese art, Hong Kong heritage, vintage signage, nostalgic',
            abstract: 'abstract art, geometric shapes, vibrant colors, modern, street art',
            minimal: 'minimalist design, clean lines, simple, elegant'
        }
    },

    // 存储键名
    storageKeys: {
        apiKey: 'neon_ar_api_key',
        aiProvider: 'neon_ar_ai_provider',
        recentPrompts: 'neon_ar_recent_prompts'
    },

    // 字体配置
    fonts: {
        // CSS字体栈（优先微软雅黑，后备Noto Sans SC）
        default: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
        fallback: 'sans-serif',
        // OpenType.js字体路径（用于3D文字生成）
        chineseFontPath: 'assets/fonts/NotoSansSC-Regular.otf',
        // 可选：使用在线CDN字体（无需下载）
        chineseFontUrl: 'https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/fonts/NotoSansSC-Regular.otf'
    }
};

// 保存用户配置
function saveUserConfig(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('无法保存配置:', e);
    }
}

// 获取用户配置
function getUserConfig(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

// 获取 API Key
function getApiKey() {
    return getUserConfig(APP_CONFIG.storageKeys.apiKey, '');
}

// 保存 API Key
function saveApiKey(key) {
    saveUserConfig(APP_CONFIG.storageKeys.apiKey, key);
}

// 获取 AI 服务提供商
function getAIProvider() {
    return getUserConfig(APP_CONFIG.storageKeys.aiProvider, APP_CONFIG.ai.defaultProvider);
}

// 保存 AI 服务提供商
function saveAIProvider(provider) {
    saveUserConfig(APP_CONFIG.storageKeys.aiProvider, provider);
}

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APP_CONFIG, Device, saveUserConfig, getUserConfig, getApiKey, saveApiKey, getAIProvider, saveAIProvider };
}
