/**
 * 香港霓虹灯 AR 2.0 - 主应用逻辑
 * 移动端友好版本
 */

class NeonARApp {
    constructor() {
        // 模块实例
        this.arManager = null;
        this.previewManager = null;
        this.neonGenerator = null;
        this.aiService = null;

        // 当前状态
        this.currentMode = null; // 'neon' | 'graffiti'
        this.currentNeonData = null;
        this.currentGraffitiUrl = null;

        // DOM元素缓存
        this.elements = {};

        // 初始化
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        console.log('初始化香港霓虹灯AR应用...');

        // 缓存DOM元素
        this.cacheElements();

        // 初始化模块
        this.arManager = new WebXRARManager();
        this.previewManager = new PreviewManager();
        this.neonGenerator = new NeonPipeGenerator();
        this.aiService = new AIGraffitiService();

        // 设置事件监听
        this.setupEventListeners();

        // 初始化颜色选择器
        this.initColorSelector();

        // 加载字体
        try {
            await this.neonGenerator.loadFont();
            console.log('字体加载成功');
        } catch (error) {
            console.warn('字体加载失败，将使用降级方案:', error);
        }

        console.log('应用初始化完成');
    }

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.elements = {
            // 屏幕
            startScreen: document.getElementById('start-screen'),
            neonInput: document.getElementById('neon-input'),
            neonPreview: document.getElementById('neon-preview-screen'),
            neonPreviewContainer: document.getElementById('neon-preview-container'),
            graffitiInput: document.getElementById('graffiti-input'),
            graffitiPreview: document.getElementById('graffiti-preview-screen'),
            graffitiPreviewContainer: document.getElementById('graffiti-preview-container'),
            arScreen: document.getElementById('ar-screen'),

            // 霓虹灯
            neonText: document.getElementById('neon-text'),
            neonColors: document.getElementById('neon-colors'),
            neonGenerateBtn: document.getElementById('neon-generate-btn'),
            neonCanvas: document.getElementById('neon-canvas'),
            neonArBtn: document.getElementById('neon-ar-btn'),
            neonPreviewBtn: document.getElementById('neon-preview-btn'),
            neonBackBtn: document.getElementById('neon-back-btn'),

            // AI涂鸦
            graffitiPrompt: document.getElementById('graffiti-prompt'),
            graffitiStyles: document.getElementById('graffiti-styles'),
            graffitiGenerateBtn: document.getElementById('graffiti-generate-btn'),
            graffitiPreviewContainer: document.getElementById('graffiti-preview-container'),
            graffitiArBtn: document.getElementById('graffiti-ar-btn'),
            graffitiPreviewBtn: document.getElementById('graffiti-preview-btn'),
            graffitiRegenerateBtn: document.getElementById('graffiti-regenerate-btn'),

            // AR控制
            arExitBtn: document.getElementById('ar-exit-btn'),
            arCaptureBtn: document.getElementById('ar-capture-btn'),
            arPlaceBtn: document.getElementById('ar-place-btn'),
            arResetBtn: document.getElementById('ar-reset-btn'),

            // 设置
            settingsTrigger: document.getElementById('settings-trigger'),
            settingsModal: document.getElementById('settings-modal'),
            settingsClose: document.getElementById('settings-close'),
            aiProviderSelect: document.getElementById('ai-provider-select'),
            apiKeyInput: document.getElementById('api-key-input'),
            apiKeyGroup: document.getElementById('api-key-group'),
            settingsSaveBtn: document.getElementById('settings-save-btn')
        };
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 模式选择
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectMode(btn.dataset.mode);
            });
        });

        // 返回按钮
        document.querySelectorAll('.back-btn[data-screen]').forEach(btn => {
            btn.addEventListener('click', () => {
                showScreen(btn.dataset.screen);
            });
        });

        // 霓虹灯生成
        this.elements.neonGenerateBtn.addEventListener('click', () => {
            this.generateNeon();
        });

        // 霓虹灯进入AR
        this.elements.neonArBtn.addEventListener('click', () => {
            this.enterNeonAR();
        });

        // 霓虹灯桌面预览
        this.elements.neonPreviewBtn.addEventListener('click', () => {
            this.enterNeonPreview();
        });

        // 霓虹灯预览返回
        this.elements.neonBackBtn.addEventListener('click', () => {
            showScreen('neon-input');
        });

        // AI涂鸦生成
        this.elements.graffitiGenerateBtn.addEventListener('click', () => {
            this.generateGraffiti();
        });

        // AI涂鸦风格选择
        this.elements.graffitiStyles.querySelectorAll('.style-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.graffitiStyles.querySelectorAll('.style-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                btn.classList.add('selected');
            });
        });

        // AI涂鸦进入AR
        this.elements.graffitiArBtn.addEventListener('click', () => {
            this.enterGraffitiAR();
        });

        // AI涂鸦桌面预览
        this.elements.graffitiPreviewBtn.addEventListener('click', () => {
            this.enterGraffitiPreview();
        });

        // AI涂鸦重新生成
        this.elements.graffitiRegenerateBtn.addEventListener('click', () => {
            showScreen('graffiti-input');
        });

        // AR控制
        this.elements.arExitBtn.addEventListener('click', () => {
            this.exitAR();
        });

        this.elements.arCaptureBtn.addEventListener('click', () => {
            this.captureAR();
        });

        this.elements.arPlaceBtn.addEventListener('click', () => {
            this.togglePlacementMode();
        });

        this.elements.arResetBtn.addEventListener('click', () => {
            this.arManager.reset();
        });

        // 下载 Hiro 标记按钮
        const downloadMarkerBtn = document.getElementById('download-marker-btn');
        if (downloadMarkerBtn) {
            downloadMarkerBtn.addEventListener('click', () => {
                this.downloadHiroMarker();
            });
        }

        // 设置模态框
        this.elements.settingsTrigger.addEventListener('click', () => {
            this.openSettings();
        });

        this.elements.settingsClose.addEventListener('click', () => {
            this.closeSettings();
        });

        this.elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.closeSettings();
            }
        });

        this.elements.aiProviderSelect.addEventListener('change', () => {
            this.updateApiKeyVisibility();
        });

        this.elements.settingsSaveBtn.addEventListener('click', () => {
            this.saveSettings();
        });

        // 加载保存的设置
        this.loadSettings();
    }

    /**
     * 初始化颜色选择器
     */
    initColorSelector() {
        const container = this.elements.neonColors;
        container.innerHTML = '';

        const colors = APP_CONFIG.neonColors;
        let isFirst = true;

        for (const [key, data] of Object.entries(colors)) {
            const btn = createColorButton(data.hex, data.name, isFirst);
            btn.addEventListener('click', () => {
                container.querySelectorAll('.color-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                btn.classList.add('selected');
            });
            container.appendChild(btn);
            isFirst = false;
        }
    }

    /**
     * 选择模式
     */
    selectMode(mode) {
        this.currentMode = mode;

        if (mode === 'neon') {
            showScreen('neon-input');
        } else if (mode === 'graffiti') {
            showScreen('graffiti-input');
        }

        vibrate();
    }

    /**
     * 生成霓虹灯预览
     */
    async generateNeon() {
        const text = this.elements.neonText.value.trim();
        if (!text) {
            showToast('请输入文字');
            return;
        }

        // 获取选中的颜色
        const selectedColorBtn = this.elements.neonColors.querySelector('.color-btn.selected');
        const color = selectedColorBtn ?
            parseInt(selectedColorBtn.dataset.color) :
            APP_CONFIG.neon.defaultColor;

        setButtonLoading(this.elements.neonGenerateBtn, true);

        try {
            // 生成Canvas预览
            const canvas = this.neonGenerator.generatePreview(text, color);
            this.elements.neonCanvas.replaceWith(canvas);
            this.elements.neonCanvas = canvas;

            // 生成3D模型
            const neonMesh = await this.neonGenerator.generateText(text, { color });
            this.currentNeonData = { text, color, mesh: neonMesh };

            showScreen('neon-preview-screen');
            vibrate();

        } catch (error) {
            console.error('生成霓虹灯失败:', error);
            showToast('生成失败，请重试');
        } finally {
            setButtonLoading(this.elements.neonGenerateBtn, false, '生成霓虹灯');
        }
    }

    /**
     * 进入霓虹灯AR模式
     */
    async enterNeonAR() {
        if (!this.currentNeonData) {
            showToast('请先生成霓虹灯');
            return;
        }

        showScreen('ar-screen');

        try {
            // 初始化AR
            if (!this.arManager.isRunning) {
                await this.arManager.init();
            }

            // 放置霓虹灯（使用 WebXR + 3D 管道）
            await this.arManager.placeNeon(
                this.currentNeonData.text,
                this.currentNeonData.color
            );

            showToast('移动设备检测平面...');
            vibrate();

        } catch (error) {
            console.error('启动AR失败:', error);
            showToast('启动AR失败: ' + error.message);
            showScreen('neon-preview-screen');
        }
    }

    /**
     * 进入霓虹灯桌面预览模式
     */
    async enterNeonPreview() {
        if (!this.currentNeonData) {
            showToast('请先生成霓虹灯');
            return;
        }

        showScreen('preview-screen');

        try {
            // 初始化预览管理器
            if (!this.previewManager.isRunning) {
                await this.previewManager.init();
            }

            // 添加霓虹灯到预览场景
            await this.previewManager.addNeonText(
                this.currentNeonData.text,
                this.currentNeonData.color
            );

            showToast('拖动调整位置，滚轮缩放');
            vibrate();

        } catch (error) {
            console.error('启动预览失败:', error);
            showToast('启动预览失败: ' + error.message);
            showScreen('neon-preview-screen');
        }
    }

    /**
     * 生成AI涂鸦
     */
    async generateGraffiti() {
        const prompt = this.elements.graffitiPrompt.value.trim();
        if (!prompt) {
            showToast('请输入描述');
            return;
        }

        // 检查AI服务配置
        if (!this.aiService.isConfigured()) {
            showToast('请先在设置中配置AI服务');
            this.openSettings();
            return;
        }

        const selectedStyleBtn = this.elements.graffitiStyles.querySelector('.style-btn.selected');
        const style = selectedStyleBtn ? selectedStyleBtn.dataset.style : '';

        setButtonLoading(this.elements.graffitiGenerateBtn, true);

        try {
            const imageUrl = await this.aiService.generateImage(prompt, { style });

            // 保存URL
            this.currentGraffitiUrl = imageUrl;

            // 显示预览
            const container = this.elements.graffitiPreviewContainer;
            container.innerHTML = `<img src="${imageUrl}" alt="AI生成的涂鸦" style="max-width:100%;max-height:100%;object-fit:contain;">`;

            // 保存提示词
            this.aiService.saveRecentPrompt(prompt);

            showScreen('graffiti-preview-screen');
            vibrate();

        } catch (error) {
            console.error('AI生成失败:', error);
            showToast('生成失败: ' + error.message);
        } finally {
            setButtonLoading(this.elements.graffitiGenerateBtn, false, 'AI生成');
        }
    }

    /**
     * 进入AI涂鸦AR模式
     */
    async enterGraffitiAR() {
        if (!this.currentGraffitiUrl) {
            showToast('请先生成涂鸦');
            return;
        }

        showScreen('ar-screen');

        try {
            // 初始化AR
            if (!this.arManager.isRunning) {
                await this.arManager.init();
            }

            // 设置涂鸦
            this.arManager.placeGraffiti(this.currentGraffitiUrl);

            showToast('点击屏幕放置涂鸦');
            vibrate();

        } catch (error) {
            console.error('启动AR失败:', error);
            showToast('启动AR失败: ' + error.message);
            showScreen('graffiti-preview-screen');
        }
    }

    /**
     * 进入AI涂鸦桌面预览模式
     */
    async enterGraffitiPreview() {
        if (!this.currentGraffitiUrl) {
            showToast('请先生成涂鸦');
            return;
        }

        showScreen('preview-screen');

        try {
            // 初始化预览管理器
            if (!this.previewManager.isRunning) {
                await this.previewManager.init();
            }

            // 添加涂鸦到预览场景
            this.previewManager.addGraffiti(this.currentGraffitiUrl);

            showToast('拖动调整位置，滚轮缩放');
            vibrate();

        } catch (error) {
            console.error('启动预览失败:', error);
            showToast('启动预览失败: ' + error.message);
            showScreen('graffiti-preview-screen');
        }
    }

    /**
     * 退出AR模式
     */
    exitAR() {
        this.arManager.stop();

        // 返回对应的上一个屏幕
        if (this.currentMode === 'neon') {
            showScreen('neon-preview-screen');
        } else if (this.currentMode === 'graffiti') {
            showScreen('graffiti-preview-screen');
        } else {
            showScreen('start-screen');
        }

        vibrate();
    }

    /**
     * 截图AR画面
     */
    captureAR() {
        try {
            this.arManager.downloadCapture();
            vibrate();
        } catch (error) {
            console.error('截图失败:', error);
            showToast('截图失败');
        }
    }

    /**
     * 切换放置模式
     */
    togglePlacementMode() {
        this.arManager.placementMode = !this.arManager.placementMode;

        if (this.arManager.placementMode) {
            showToast('点击屏幕放置内容');
            this.elements.arPlaceBtn.style.background = 'rgba(255, 0, 255, 0.3)';
        } else {
            showToast('放置模式已关闭');
            this.elements.arPlaceBtn.style.background = '';
        }

        vibrate();
    }

    /**
     * 打开设置
     */
    openSettings() {
        this.elements.settingsModal.classList.add('active');
    }

    /**
     * 关闭设置
     */
    closeSettings() {
        this.elements.settingsModal.classList.remove('active');
    }

    /**
     * 加载保存的设置
     */
    loadSettings() {
        const provider = getAIProvider() || APP_CONFIG.ai.defaultProvider;
        const apiKey = getApiKey();

        this.elements.aiProviderSelect.value = provider;
        this.elements.apiKeyInput.value = apiKey;

        this.updateApiKeyVisibility();
    }

    /**
     * 更新API Key输入框可见性
     */
    updateApiKeyVisibility() {
        const provider = this.elements.aiProviderSelect.value;
        const needsKey = provider !== 'HUGGINGFACE';

        this.elements.apiKeyGroup.style.display = needsKey ? 'block' : 'none';
    }

    /**
     * 保存设置
     */
    saveSettings() {
        const provider = this.elements.aiProviderSelect.value;
        const apiKey = this.elements.apiKeyInput.value.trim();

        saveAIProvider(provider);
        saveApiKey(apiKey);

        // 更新AI服务配置
        this.aiService.updateConfig(provider, apiKey);

        showToast('设置已保存');
        this.closeSettings();
        vibrate();
    }

    /**
     * 下载 Hiro 标记图片
     */
    downloadHiroMarker() {
        // 使用 GitHub 上的 Hiro 标记图片
        const markerUrl = 'https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png';

        // 创建一个隐藏的下载链接
        fetch(markerUrl)
            .then(response => response.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'hiro-marker.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                showToast('Hiro 标记已下载，可打印后使用');
                vibrate();
            })
            .catch(error => {
                console.error('下载标记失败:', error);

                // 备用方案：直接在新标签页打开图片
                window.open(markerUrl, '_blank');
                showToast('已在新标签页打开标记图片，请长按保存');
            });
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', async () => {
    // 等待所有脚本加载完成
    await new Promise(resolve => setTimeout(resolve, 100));

    // 创建应用实例
    window.app = new NeonARApp();

    console.log('香港霓虹灯AR 2.0 已启动');
    console.log('移动端检测:', {
        isMobile: Device.isMobile,
        isIOS: Device.isIOS,
        isAndroid: Device.isAndroid,
        isLowEnd: Device.isLowEnd
    });
});
