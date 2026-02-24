/**
 * 桌面预览管理器
 * 无需摄像头，直接预览霓虹灯效果
 */

class PreviewManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.isRunning = false;
        this.currentContent = null;
        this.neonGenerator = new NeonPipeGenerator();

        // 拖动控制
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.contentPosition = new THREE.Vector3(0, 0, 0);

        // 动画
        this.animationId = null;
    }

    /**
     * 初始化预览场景
     */
    async init() {
        const container = document.getElementById('preview-container');

        // 预加载字体
        try {
            await this.neonGenerator.loadFont();
        } catch (error) {
            console.warn('字体加载失败:', error);
        }

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

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        // 添加霓虹点光源
        const pointLight = new THREE.PointLight(0xff00ff, 1, 10);
        pointLight.position.set(0, 2, 3);
        this.scene.add(pointLight);

        // 设置事件监听
        this.setupEventListeners();

        console.log('预览管理器初始化完成');
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        const container = document.getElementById('preview-container');

        // 窗口大小变化
        window.addEventListener('resize', () => {
            this.onResize();
        });

        // 鼠标/触摸事件
        container.addEventListener('mousedown', (e) => this.onPointerDown(e));
        container.addEventListener('mousemove', (e) => this.onPointerMove(e));
        container.addEventListener('mouseup', () => this.onPointerUp());
        container.addEventListener('mouseleave', () => this.onPointerUp());

        // 触摸事件
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.onPointerDown(e.touches[0]);
            }
        }, { passive: false });

        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                e.preventDefault();
                this.onPointerMove(e.touches[0]);
            }
        }, { passive: false });

        container.addEventListener('touchend', () => this.onPointerUp());

        // 滚轮缩放
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY * 0.001;
            this.camera.position.z = Math.max(2, Math.min(10, this.camera.position.z + delta));
        }, { passive: false });

        // 退出按钮
        document.getElementById('preview-exit-btn').addEventListener('click', () => {
            this.stop();
        });

        // 截图按钮
        document.getElementById('preview-capture-btn').addEventListener('click', () => {
            this.downloadCapture();
        });
    }

    /**
     * 指针按下
     */
    onPointerDown(event) {
        this.isDragging = true;
        this.previousMousePosition = {
            x: event.clientX || event.pageX,
            y: event.clientY || event.pageY
        };
    }

    /**
     * 指针移动
     */
    onPointerMove(event) {
        if (!this.isDragging || !this.currentContent) return;

        const clientX = event.clientX || event.pageX;
        const clientY = event.clientY || event.pageY;

        const deltaMove = {
            x: clientX - this.previousMousePosition.x,
            y: clientY - this.previousMousePosition.y
        };

        // 移动内容
        this.contentPosition.x += deltaMove.x * 0.01;
        this.contentPosition.y -= deltaMove.y * 0.01;
        this.currentContent.position.copy(this.contentPosition);

        this.previousMousePosition = { x: clientX, y: clientY };
    }

    /**
     * 指针释放
     */
    onPointerUp() {
        this.isDragging = false;
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
     * 启动预览
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.animate();

        console.log('预览已启动');
    }

    /**
     * 停止预览
     */
    stop() {
        this.isRunning = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // 清除内容
        this.clearContent();

        // 返回启动屏幕
        showScreen('start-screen');

        console.log('预览已停止');
    }

    /**
     * 渲染循环
     */
    animate() {
        if (!this.isRunning) return;

        this.animationId = requestAnimationFrame(() => this.animate());

        // 轻微旋转动画
        if (this.currentContent && !this.isDragging) {
            this.currentContent.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
        }

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 添加内容
     */
    addContent(content) {
        // 清除之前的内容
        this.clearContent();

        // 克隆内容
        this.currentContent = content.clone();
        this.currentContent.position.copy(this.contentPosition);

        this.scene.add(this.currentContent);

        // 自动启动
        this.start();
    }

    /**
     * 添加霓虹灯文字（使用3D管道）
     */
    async addNeonText(text, color) {
        try {
            // 使用 NeonPipeGenerator 生成真实的 3D 管道霓虹灯
            const neonMesh = await this.neonGenerator.generateText(text, { color });
            this.addContent(neonMesh);
        } catch (error) {
            console.error('生成3D霓虹灯失败，使用Canvas降级:', error);

            // 降级方案：使用 Canvas
            const canvas = this.createNeonCanvas(text, color);
            const texture = new THREE.CanvasTexture(canvas);

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

            const group = new THREE.Group();
            group.add(glowMesh);
            group.add(mesh);

            this.addContent(group);
        }
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
     * 添加涂鸦图片
     */
    addGraffiti(imageUrl) {
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

            this.addContent(mesh);
        });
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
    module.exports = PreviewManager;
}
