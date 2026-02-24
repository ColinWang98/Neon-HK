/**
 * WebXR AR 管理器 - 真实墙面锚定
 * 使用 WebXR Hit Test API 检测真实平面
 */

class WebXRARManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.xrSession = null;
        this.isRunning = false;
        this.currentContent = null;
        this.neonGenerator = new NeonPipeGenerator();

        // WebXR 相关
        this.referenceSpace = null;
        this.hitTestSource = null;
        this.hitTestResults = [];

        // 内容位置
        this.placementPosition = null;
        this.placementRotation = null;

        // 降级模式
        this.fallbackMode = false;
    }

    /**
     * 初始化 AR 场景
     */
    async init() {
        // 预加载字体
        try {
            await this.neonGenerator.loadFont();
        } catch (error) {
            console.warn('字体加载失败，将使用降级方案');
        }

        // 检查 WebXR 支持
        if ('xr' in navigator) {
            const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
            if (isSupported) {
                console.log('WebXR AR 支持');
                return this.initWebXR();
            }
        }

        console.warn('WebXR 不支持，使用降级模式');
        return this.initFallback();
    }

    /**
     * 初始化 WebXR
     */
    async initWebXR() {
        const container = document.getElementById('ar-container');

        // 创建场景
        this.scene = new THREE.Scene();

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        container.appendChild(this.renderer.domElement);

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        // 设置事件监听
        this.setupEventListeners();

        // 启动 WebXR 会话
        await this.startWebXRSession();

        console.log('WebXR AR 初始化完成');
    }

    /**
     * 启动 WebXR 会话
     */
    async startWebXRSession() {
        try {
            this.xrSession = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['hit-test', 'dom-overlay', 'light-estimation'],
                domOverlay: { root: document.getElementById('ar-screen') }
            });

            // 设置会话事件
            this.xrSession.addEventListener('end', () => {
                this.xrSession = null;
                this.isRunning = false;
            });

            await this.renderer.xr.setSession(this.xrSession);

            // 获取参考空间
            this.referenceSpace = await this.xrSession.requestReferenceSpace('local-floor');

            // 初始化 Hit Test
            try {
                this.hitTestSource = await this.xrSession.requestHitTestSource({
                    space: this.referenceSpace,
                    entityTypes: ['plane']
                });
            } catch (error) {
                console.warn('Hit Test 不可用:', error);
            }

            this.isRunning = true;
            this.animate();

            console.log('WebXR 会话已启动');

        } catch (error) {
            console.error('WebXR 会话启动失败:', error);
            throw new Error('无法启动 AR 会话: ' + error.message);
        }
    }

    /**
     * 初始化降级模式（无 WebXR 支持）
     */
    async initFallback() {
        this.fallbackMode = true;

        const container = document.getElementById('ar-container');

        // 创建场景
        this.scene = new THREE.Scene();

        // 创建相机
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 5;

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        container.appendChild(this.renderer.domElement);

        // 启动摄像头
        await this.startCamera();

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        // 设置事件监听
        this.setupEventListeners();

        this.isRunning = true;
        this.animate();

        console.log('降级模式已启动');
    }

    /**
     * 启动摄像头（降级模式）
     */
    async startCamera() {
        const video = document.getElementById('ar-video');
        if (!video) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            video.srcObject = stream;
            video.play();

        } catch (error) {
            console.error('摄像头启动失败:', error);
            throw new Error('无法访问摄像头');
        }
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 窗口大小变化
        window.addEventListener('resize', () => {
            this.onResize();
        });

        // 退出按钮
        document.getElementById('ar-exit-btn').addEventListener('click', () => {
            this.stop();
        });

        // 截图按钮
        document.getElementById('ar-capture-btn').addEventListener('click', () => {
            this.downloadCapture();
        });

        // 重置按钮
        document.getElementById('ar-reset-btn').addEventListener('click', () => {
            this.reset();
        });

        // 点击放置（降级模式）
        if (this.fallbackMode) {
            document.getElementById('ar-screen').addEventListener('click', (e) => {
                this.onScreenClick(e);
            });
        }
    }

    /**
     * 窗口大小变化
     */
    onResize() {
        if (!this.renderer) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        this.renderer.setSize(width, height);

        if (this.camera) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
    }

    /**
     * 屏幕点击（降级模式）
     */
    onScreenClick(event) {
        if (!this.currentContent) return;

        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const z = -2;
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(this.camera);
        const dir = vector.sub(this.camera.position).normalize();
        const distance = (z - this.camera.position.z) / dir.z;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));

        this.currentContent.position.copy(pos);

        // 添加阴影效果增强深度感
        this.addShadowEffect(this.currentContent);

        this.hideHint();
    }

    /**
     * 添加阴影效果
     */
    addShadowEffect(content) {
        const shadowGeometry = new THREE.PlaneGeometry(3, 1.5);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3
        });
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        shadow.position.z = -0.5;
        shadow.position.y = -0.3;

        content.add(shadow);
    }

    /**
     * 隐藏提示
     */
    hideHint() {
        const hint = document.getElementById('ar-hint');
        if (hint) {
            hint.style.opacity = '0';
        }
    }

    /**
     * 渲染循环
     */
    animate() {
        if (!this.isRunning) return;

        this.renderer.setAnimationLoop(() => {
            // WebXR Hit Test 更新
            if (this.hitTestSource && this.xrSession) {
                const frame = this.xrSession.visibleFrames[this.xrSession.visibleFrames.length - 1];
                if (frame) {
                    const hitPose = frame.getHitTestResults(this.hitTestSource);
                    if (hitPose.length > 0 && this.currentContent) {
                        // 自动跟随检测到的平面
                        const hit = hitPose[0];
                        const pose = hit.getPose(this.referenceSpace);

                        this.currentContent.position.set(
                            pose.transform.position.x,
                            pose.transform.position.y,
                            pose.transform.position.z
                        );

                        this.currentContent.quaternion.set(
                            pose.transform.orientation.x,
                            pose.transform.orientation.y,
                            pose.transform.orientation.z,
                            pose.transform.orientation.w
                        );

                        this.hideHint();
                    }
                }
            }

            // 轻微动画
            if (this.currentContent && !this.hitTestSource) {
                this.currentContent.rotation.y = Math.sin(Date.now() * 0.001) * 0.05;
            }

            this.renderer.render(this.scene, this.camera || this.renderer.xr.getCamera());
        });
    }

    /**
     * 放置霓虹灯
     */
    async placeNeon(text, color) {
        try {
            // 使用 NeonPipeGenerator 生成真实的 3D 管道霓虹灯
            const neonMesh = await this.neonGenerator.generateText(text, { color });
            this.currentContent = neonMesh;

            // 设置初始位置
            this.currentContent.position.set(0, 1.6, -2); // 眼睛高度，前方2米

            this.scene.add(this.currentContent);

            // 显示提示
            this.showHint();

            return true;
        } catch (error) {
            console.error('放置霓虹灯失败:', error);
            return false;
        }
    }

    /**
     * 放置涂鸦
     */
    placeGraffiti(imageUrl) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(imageUrl, (texture) => {
            const geometry = new THREE.PlaneGeometry(1.5, 1.5);
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

            this.currentContent = new THREE.Group();
            this.currentContent.add(mesh);
            this.currentContent.position.set(0, 1.6, -2);

            this.scene.add(this.currentContent);
            this.showHint();
        });
    }

    /**
     * 显示提示
     */
    showHint() {
        const hint = document.getElementById('ar-hint');
        if (hint) {
            hint.style.opacity = '1';
            if (this.hitTestSource) {
                hint.querySelector('p').textContent = '移动设备检测平面...';
            } else if (this.fallbackMode) {
                hint.querySelector('p').textContent = '点击屏幕放置霓虹灯';
            }
        }
    }

    /**
     * 停止 AR
     */
    async stop() {
        this.isRunning = false;

        // 停止 WebXR 会话
        if (this.xrSession) {
            await this.xrSession.end();
            this.xrSession = null;
        }

        // 停止摄像头（降级模式）
        if (this.fallbackMode) {
            const video = document.getElementById('ar-video');
            if (video && video.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                video.srcObject = null;
            }
        }

        // 清除内容
        this.clearContent();

        // 返回上一个屏幕
        if (window.app && window.app.currentMode === 'neon') {
            showScreen('neon-preview-screen');
        } else if (window.app && window.app.currentMode === 'graffiti') {
            showScreen('graffiti-preview-screen');
        } else {
            showScreen('start-screen');
        }

        console.log('AR 已停止');
    }

    /**
     * 清除内容
     */
    clearContent() {
        if (this.currentContent) {
            this.scene.remove(this.currentContent);
            this.currentContent = null;
        }
    }

    /**
     * 重置场景
     */
    reset() {
        this.clearContent();
        this.showHint();
        showToast('场景已重置');
    }

    /**
     * 截图
     */
    capture() {
        return this.renderer.domElement.toDataURL('image/png');
    }

    /**
     * 下载截图
     */
    downloadCapture() {
        const dataUrl = this.capture();
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `香港霓虹灯_${Date.now()}.png`;
        link.click();

        showToast('截图已保存');
        vibrate();
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebXRARManager;
}
