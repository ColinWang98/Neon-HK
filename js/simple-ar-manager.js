/**
 * 简化 AR 管理器 - 移动端点击放置模式
 * 无需标记追踪，直接在摄像头画面上点击放置
 */

class SimpleARManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.video = null;
        this.isRunning = false;
        this.currentContent = null;

        // 内容位置
        this.contentPosition = new THREE.Vector3(0, 0, -2);

        // 拖动控制
        this.isDragging = false;
        this.previousTouchPosition = { x: 0, y: 0 };
    }

    /**
     * 初始化 AR 场景
     */
    async init() {
        const container = document.getElementById('ar-container');
        const video = document.getElementById('ar-video');

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
            preserveDrawingBuffer: true // 用于截图
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        container.appendChild(this.renderer.domElement);

        // 启动摄像头
        await this.startCamera(video);

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        // 添加霓虹点光源
        const pointLight = new THREE.PointLight(0xff00ff, 0.8, 10);
        pointLight.position.set(0, 2, 2);
        this.scene.add(pointLight);

        // 设置事件监听
        this.setupEventListeners();

        console.log('简化AR管理器初始化完成');
    }

    /**
     * 启动摄像头
     */
    async startCamera(videoElement) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // 使用后置摄像头
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            videoElement.srcObject = stream;
            videoElement.play();

            this.video = videoElement;
            console.log('摄像头启动成功');

        } catch (error) {
            console.error('摄像头启动失败:', error);
            throw new Error('无法访问摄像头。请确保在HTTPS环境下运行并允许摄像头权限。');
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

        // 触摸/点击事件
        const arScreen = document.getElementById('ar-screen');

        arScreen.addEventListener('click', (event) => {
            this.onScreenClick(event);
        });

        arScreen.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                this.onTouchStart(event.touches[0]);
            }
        }, { passive: false });

        arScreen.addEventListener('touchmove', (event) => {
            if (this.isDragging && event.touches.length === 1) {
                event.preventDefault();
                this.onTouchMove(event.touches[0]);
            }
        }, { passive: false });

        arScreen.addEventListener('touchend', () => {
            this.onTouchEnd();
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
    }

    /**
     * 窗口大小变化
     */
    onResize() {
        if (!this.camera || !this.renderer) return;

        const aspect = window.innerWidth / window.innerHeight;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * 屏幕点击 - 放置内容
     */
    onScreenClick(event) {
        // 计算点击位置对应的 3D 坐标
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // 使用简单的深度值 z = -2
        const z = -2;
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(this.camera);
        const dir = vector.sub(this.camera.position).normalize();
        const distance = (z - this.camera.position.z) / dir.z;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));

        // 移动内容到新位置
        if (this.currentContent) {
            this.currentContent.position.copy(pos);
            this.hideHint();
        }
    }

    /**
     * 触摸开始
     */
    onTouchStart(touch) {
        this.isDragging = true;
        this.previousTouchPosition = {
            x: touch.clientX || touch.pageX,
            y: touch.clientY || touch.pageY
        };
    }

    /**
     * 触摸移动 - 拖动内容
     */
    onTouchMove(touch) {
        if (!this.isDragging || !this.currentContent) return;

        const clientX = touch.clientX || touch.pageX;
        const clientY = touch.clientY || touch.pageY;

        const deltaMove = {
            x: clientX - this.previousTouchPosition.x,
            y: clientY - this.previousTouchPosition.y
        };

        // 移动内容
        this.currentContent.position.x += deltaMove.x * 0.005;
        this.currentContent.position.y -= deltaMove.y * 0.005;

        this.previousTouchPosition = { x: clientX, y: clientY };
        this.hideHint();
    }

    /**
     * 触摸结束
     */
    onTouchEnd() {
        this.isDragging = false;
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
     * 显示提示
     */
    showHint() {
        const hint = document.getElementById('ar-hint');
        if (hint) {
            hint.style.opacity = '1';
        }
    }

    /**
     * 启动 AR
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.showHint();
        this.animate();

        console.log('简化AR已启动');
    }

    /**
     * 停止 AR
     */
    stop() {
        this.isRunning = false;

        // 停止摄像头
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
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

        console.log('简化AR已停止');
    }

    /**
     * 渲染循环
     */
    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.animate());

        // 轻微动画效果
        if (this.currentContent && !this.isDragging) {
            this.currentContent.rotation.y = Math.sin(Date.now() * 0.001) * 0.05;
        }

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 放置霓虹灯文字
     */
    placeNeon(text, color) {
        this.clearContent();

        // 创建 Canvas 纹理
        const canvas = this.createNeonCanvas(text, color);
        const texture = new THREE.CanvasTexture(canvas);

        // 创建平面
        const geometry = new THREE.PlaneGeometry(3, 1.5);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);

        // 添加发光效果
        const glowGeometry = new THREE.PlaneGeometry(3.1, 1.6);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.position.z = -0.01;

        this.currentContent = new THREE.Group();
        this.currentContent.add(glowMesh);
        this.currentContent.add(mesh);
        this.currentContent.position.copy(this.contentPosition);

        this.scene.add(this.currentContent);

        // 自动启动
        this.start();
    }

    /**
     * 放置涂鸦图片
     */
    placeGraffiti(imageUrl) {
        this.clearContent();

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(imageUrl, (texture) => {
            const geometry = new THREE.PlaneGeometry(2, 2);
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
            this.currentContent.position.copy(this.contentPosition);

            this.scene.add(this.currentContent);

            // 自动启动
            this.start();
        });
    }

    /**
     * 创建霓虹灯 Canvas
     */
    createNeonCanvas(text, color) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 1024;
        canvas.height = 512;

        // 背景透明
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 设置文字样式
        const fontSize = Math.min(120, 800 / text.length);
        ctx.font = `bold ${fontSize}px "Microsoft YaHei", "Noto Sans SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // 绘制发光效果
        const colorHex = '#' + color.toString(16).padStart(6, '0');

        // 外层光晕
        ctx.shadowColor = colorHex;
        ctx.shadowBlur = 60;
        ctx.fillStyle = colorHex;
        ctx.globalAlpha = 0.4;
        ctx.fillText(text, centerX, centerY);

        // 中层
        ctx.shadowBlur = 30;
        ctx.globalAlpha = 0.7;
        ctx.fillText(text, centerX, centerY);

        // 内层高亮
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, centerX, centerY);

        return canvas;
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
        this.contentPosition = new THREE.Vector3(0, 0, -2);
        this.showHint();
        showToast('场景已重置');
    }

    /**
     * 截图
     */
    capture() {
        // 创建合成 canvas
        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = this.renderer.domElement.width;
        compositeCanvas.height = this.renderer.domElement.height;
        const ctx = compositeCanvas.getContext('2d');

        // 绘制摄像头画面
        if (this.video) {
            // 计算视频缩放和位置，保持比例居中
            const videoRatio = this.video.videoWidth / this.video.videoHeight;
            const canvasRatio = compositeCanvas.width / compositeCanvas.height;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (videoRatio > canvasRatio) {
                // 视频更宽，高度匹配
                drawHeight = compositeCanvas.height;
                drawWidth = drawHeight * videoRatio;
                offsetX = (compositeCanvas.width - drawWidth) / 2;
                offsetY = 0;
            } else {
                // 视频更高，宽度匹配
                drawWidth = compositeCanvas.width;
                drawHeight = drawWidth / videoRatio;
                offsetX = 0;
                offsetY = (compositeCanvas.height - drawHeight) / 2;
            }

            ctx.drawImage(this.video, offsetX, offsetY, drawWidth, drawHeight);
        }

        // 绘制 AR 内容
        ctx.drawImage(this.renderer.domElement, 0, 0);

        return compositeCanvas.toDataURL('image/png');
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
    module.exports = SimpleARManager;
}
