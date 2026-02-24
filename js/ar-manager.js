/**
 * AR管理器 - 基于AR.js
 * 移动端友好的AR场景管理
 */

class ARManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.arToolkitSource = null;
        this.arToolkitContext = null;
        this.markerRoot = null;
        this.isRunning = false;
        this.currentContent = null;
        this.placementMode = false;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // 配置
        this.config = {
            markerSize: APP_CONFIG.ar.markerSize,
            detectionMode: APP_CONFIG.ar.detectionMode,
            matrixCodeType: APP_CONFIG.ar.matrixCodeType
        };
    }

    /**
     * 初始化AR场景
     */
    async init() {
        const container = document.getElementById('ar-container');

        // 创建场景
        this.scene = new THREE.Scene();

        // 创建相机
        this.camera = new THREE.Camera();
        this.scene.add(this.camera);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            antialias: APP_CONFIG.display.antialias,
            alpha: true
        });
        this.renderer.setPixelRatio(APP_CONFIG.display.pixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild(this.renderer.domElement);

        // 创建AR光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        // 初始化AR Toolkit
        await this.initARToolkit(container);

        // 创建标记根节点
        this.markerRoot = new THREE.Group();
        this.scene.add(this.markerRoot);

        // 设置事件监听
        this.setupEventListeners();

        console.log('AR管理器初始化完成');
    }

    /**
     * 初始化AR Toolkit
     */
    async initARToolkit(container) {
        // 检查 THREEx 是否已加载，如果未加载则等待
        if (typeof THREEx === 'undefined') {
            console.warn('AR.js 库尚未加载，等待加载...');
            // 等待最多 5 秒
            let waited = 0;
            while (typeof THREEx === 'undefined' && waited < 5000) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waited += 100;
            }
            if (typeof THREEx === 'undefined') {
                throw new Error('AR.js 库加载失败。请检查网络连接或刷新页面重试。');
            }
        }

        // 设置 AR.js 数据文件的基础 URL
        // 使用 GitHub Pages CDN 匹配新的 AR.js 源
        const arBaseURL = 'https://raw.githack.com/AR-js-org/AR.js/master/three.js/data/';

        // 创建视频源
        this.arToolkitSource = new THREEx.ArToolkitSource({
            sourceType: 'webcam',
            sourceWidth: 640,
            sourceHeight: 480,
            displayWidth: window.innerWidth,
            displayHeight: window.innerHeight
        });

        // 初始化视频源
        await new Promise((resolve, reject) => {
            this.arToolkitSource.init(() => {
                this.arToolkitSource.onResize();
                this.arToolkitSource.copySizeTo(this.renderer.domElement);
                resolve();
            }, (error) => {
                console.error('AR视频源初始化失败:', error);
                reject(error);
            });
        });

        // 创建AR上下文
        this.arToolkitContext = new THREEx.ArToolkitContext({
            cameraParametersUrl: arBaseURL + 'camera_para.dat',
            detectionMode: this.config.detectionMode,
            matrixCodeType: this.config.matrixCodeType
        });

        // 初始化AR上下文
        await new Promise((resolve, reject) => {
            this.arToolkitContext.init(() => {
                // 复制投影矩阵
                this.camera.projectionMatrix.copy(this.arToolkitContext.getProjectionMatrix());
                resolve();
            }, (error) => {
                console.error('AR上下文初始化失败:', error);
                reject(error);
            });
        });

        // 创建标记控件（使用Hiro标记作为默认）
        const markerControls = new THREEx.ArMarkerControls(
            this.arToolkitContext,
            this.markerRoot,
            {
                type: 'pattern',
                patternUrl: arBaseURL + 'hiro.patt',
                barcodeValue: null
            }
        );

        console.log('AR Toolkit初始化完成');
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 窗口大小变化
        window.addEventListener('resize', () => {
            this.onResize();
        });

        // 触摸/点击事件（用于放置内容）
        const arScreen = document.getElementById('ar-screen');
        arScreen.addEventListener('click', (event) => {
            if (this.placementMode) {
                this.onScreenClick(event);
            }
        });

        // 触摸事件支持
        arScreen.addEventListener('touchstart', (event) => {
            if (this.placementMode && event.touches.length === 1) {
                this.onScreenClick(event.touches[0]);
            }
        }, { passive: false });
    }

    /**
     * 窗口大小变化处理
     */
    onResize() {
        this.arToolkitSource.onResize();
        this.arToolkitSource.copySizeTo(this.renderer.domElement);

        if (this.arToolkitContext) {
            this.arToolkitContext.arController.resize(
                this.arToolkitSource.domElement
            );
        }

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * 屏幕点击处理（用于放置内容）
     */
    onScreenClick(event) {
        // 计算鼠标位置
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // 如果有检测到标记，放置在标记位置
        if (this.markerRoot.visible) {
            this.placeContent(this.markerRoot);
        } else {
            showToast('请先将AR标记对准摄像头');
        }
    }

    /**
     * 启动AR渲染循环
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.animate();

        console.log('AR渲染已启动');
    }

    /**
     * 停止AR渲染
     */
    stop() {
        this.isRunning = false;

        if (this.arToolkitSource) {
            this.arToolkitSource.domElement.pause();
        }

        console.log('AR渲染已停止');
    }

    /**
     * 渲染循环
     */
    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.animate());

        // 更新AR上下文
        if (this.arToolkitContext) {
            this.arToolkitContext.update(this.arToolkitSource.domElement);
        }

        // 渲染场景
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 放置内容到AR场景
     * @param {THREE.Object3D} content - 要放置的内容
     * @param {THREE.Object3D} target - 目标父节点（默认为markerRoot）
     */
    placeContent(content, target = null) {
        // 清除之前的内容
        this.clearContent();

        const parent = target || this.markerRoot;
        parent.add(content);
        this.currentContent = content;

        // 退出放置模式
        this.placementMode = false;

        showToast('内容已放置');
    }

    /**
     * 放置AI涂鸦图片
     * @param {string} imageUrl - 图片URL
     */
    placeGraffiti(imageUrl) {
        this.placementMode = true;

        // 加载图片纹理
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(imageUrl, (texture) => {
            // 创建图片平面
            const geometry = new THREE.PlaneGeometry(1, 1);
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry, material);

            // 添加发光边框
            const borderGeometry = new THREE.EdgesGeometry(geometry);
            const borderMaterial = new THREE.LineBasicMaterial({
                color: 0xff00ff,
                linewidth: 2
            });
            const border = new THREE.LineSegments(borderGeometry, borderMaterial);
            mesh.add(border);

            // 设置为待放置状态
            this.pendingContent = mesh;
            this.currentImageUrl = imageUrl;

            showToast('点击屏幕放置涂鸦');
        }, undefined, (error) => {
            console.error('加载图片失败:', error);
            showToast('加载图片失败');
        });
    }

    /**
     * 放置霓虹灯文字
     * @param {THREE.Group} neonMesh - 霓虹灯文字网格
     */
    placeNeon(neonMesh) {
        this.placementMode = true;
        this.pendingContent = neonMesh;

        showToast('点击屏幕放置霓虹灯');
    }

    /**
     * 清除场景中的内容
     */
    clearContent() {
        if (this.currentContent) {
            this.markerRoot.remove(this.currentContent);
            this.currentContent = null;
        }
    }

    /**
     * 重置场景
     */
    reset() {
        this.clearContent();
        this.pendingContent = null;
        this.placementMode = false;
        showToast('场景已重置');
    }

    /**
     * 截图
     * @returns {string} dataURL
     */
    capture() {
        // 渲染一帧
        this.renderer.render(this.scene, this.camera);

        // 获取canvas
        const canvas = this.renderer.domElement;

        // 创建合成canvas（包含摄像头画面和AR内容）
        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = canvas.width;
        compositeCanvas.height = canvas.height;
        const ctx = compositeCanvas.getContext('2d');

        // 绘制摄像头画面
        if (this.arToolkitSource && this.arToolkitSource.domElement) {
            const video = this.arToolkitSource.domElement;
            ctx.drawImage(video, 0, 0, compositeCanvas.width, compositeCanvas.height);
        }

        // 绘制AR内容
        ctx.drawImage(canvas, 0, 0);

        return compositeCanvas.toDataURL('image/png');
    }

    /**
     * 下载截图
     */
    downloadCapture() {
        const dataUrl = this.capture();
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `neon-ar-${Date.now()}.png`;
        link.click();

        showToast('截图已保存');
    }

    /**
     * 获取当前内容
     */
    getContent() {
        return this.currentContent;
    }

    /**
     * 检查标记是否可见
     */
    isMarkerVisible() {
        return this.markerRoot && this.markerRoot.visible;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ARManager;
}
