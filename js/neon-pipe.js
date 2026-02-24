/**
 * 霓虹灯管道文字生成器
 * 使用OpenType.js获取文字路径，生成双层管道结构
 */

class NeonPipeGenerator {
    constructor() {
        this.font = null;
        this.useCanvasFallback = false;
        this.config = APP_CONFIG.neon;
    }

    /**
     * 加载字体
     * @param {string} fontPath - 字体文件路径
     */
    async loadFont(fontPath = null) {
        // 只尝试本地字体路径，不使用在线CDN（避免CORS问题）
        const path = fontPath || APP_CONFIG.fonts.chineseFontPath;

        return new Promise((resolve, reject) => {
            if (typeof opentype === 'undefined') {
                console.warn('OpenType.js未加载，使用Canvas降级方案');
                this.useCanvasFallback = true;
                resolve(null);
                return;
            }

            // 先检查文件是否存在
            fetch(path)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('字体文件不存在');
                    }
                    // 文件存在，加载字体
                    return new Promise((res, rej) => {
                        opentype.load(path, (err, font) => {
                            if (err) {
                                rej(err);
                            } else {
                                res(font);
                            }
                        });
                    });
                })
                .then(font => {
                    if (font) {
                        this.font = font;
                        console.log('字体加载成功:', font.names.fontFamily);
                        resolve(font);
                    }
                })
                .catch(err => {
                    console.warn('字体加载失败，使用Canvas降级方案:', err.message);
                    this.useCanvasFallback = true;
                    resolve(null); // 不reject，而是使用降级方案
                });
        });
    }

    /**
     * 生成霓虹灯管道文字
     * @param {string} text - 要生成的文字
     * @param {object} options - 选项
     * @returns {THREE.Group} 霓虹灯文字组
     */
    async generateText(text, options = {}) {
        const {
            color = this.config.defaultColor,
            pipeRadius = this.config.pipeRadius,
            glassRadius = this.config.glassRadius,
            emissiveIntensity = this.config.emissiveIntensity
        } = options;

        // 确保字体已加载
        if (!this.font) {
            await this.loadFont();
        }

        // 如果字体不可用，直接使用Canvas降级方案
        if (this.useCanvasFallback || !this.font) {
            console.log('使用Canvas降级方案生成文字');
            return this.createCanvasFallback(text, color);
        }

        // 创建组
        const group = new THREE.Group();

        try {
            // 获取文字路径
            const fontSize = 100;
            const path = this.font.getPath(text, 0, 0, fontSize);

            // 转换路径为曲线
            const curves = this.pathToCurves(path);

            // 为每个曲线创建管道
            for (const curve of curves) {
                const pipeGroup = this.createPipe(curve, pipeRadius, glassRadius, color, emissiveIntensity);
                group.add(pipeGroup);
            }

            // 居中并缩放
            this.centerAndScale(group);

            console.log(`霓虹灯文字 "${text}" 生成完成`);

        } catch (error) {
            console.error('生成霓虹灯文字失败:', error);
            // 降级：使用Canvas创建简单文字
            return this.createCanvasFallback(text, color);
        }

        return group;
    }

    /**
     * 将OpenType路径转换为Three.js曲线数组
     * @param {object} path - OpenType路径
     * @returns {THREE.CatmullRomCurve3[]} 曲线数组
     */
    pathToCurves(path) {
        const curves = [];
        const commands = path.commands || [];

        let currentPoints = [];
        let lastPoint = null;

        for (const cmd of commands) {
            const point = new THREE.Vector3(cmd.x, -cmd.y, 0);

            switch (cmd.type) {
                case 'M': // 移动到新起点
                    if (currentPoints.length > 1) {
                        curves.push(new THREE.CatmullRomCurve3(currentPoints));
                    }
                    currentPoints = [point];
                    lastPoint = point;
                    break;

                case 'L': // 直线
                    currentPoints.push(point);
                    lastPoint = point;
                    break;

                case 'C': // 三次贝塞尔曲线
                    const cubicSamples = this.sampleCubicBezier(
                        lastPoint,
                        new THREE.Vector3(cmd.x1, -cmd.y1, 0),
                        new THREE.Vector3(cmd.x2, -cmd.y2, 0),
                        point,
                        this.config.curveSamples
                    );
                    currentPoints.push(...cubicSamples);
                    lastPoint = point;
                    break;

                case 'Q': // 二次贝塞尔曲线
                    const quadSamples = this.sampleQuadBezier(
                        lastPoint,
                        new THREE.Vector3(cmd.x1, -cmd.y1, 0),
                        point,
                        Math.floor(this.config.curveSamples * 0.6)
                    );
                    currentPoints.push(...quadSamples);
                    lastPoint = point;
                    break;

                case 'Z': // 闭合路径
                    if (currentPoints.length > 1) {
                        curves.push(new THREE.CatmullRomCurve3(currentPoints, true));
                    }
                    currentPoints = [];
                    lastPoint = null;
                    break;
            }
        }

        // 处理未闭合的路径
        if (currentPoints.length > 1) {
            curves.push(new THREE.CatmullRomCurve3(currentPoints));
        }

        return curves;
    }

    /**
     * 采样三次贝塞尔曲线
     */
    sampleCubicBezier(p0, p1, p2, p3, samples) {
        const points = [];
        for (let i = 1; i <= samples; i++) {
            const t = i / samples;
            const mt = 1 - t;
            const mt2 = mt * mt;
            const t2 = t * t;

            const x = mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x;
            const y = mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y;
            const z = mt2 * mt * p0.z + 3 * mt2 * t * p1.z + 3 * mt * t2 * p2.z + t2 * t * p3.z;

            points.push(new THREE.Vector3(x, y, z));
        }
        return points;
    }

    /**
     * 采样二次贝塞尔曲线
     */
    sampleQuadBezier(p0, p1, p2, samples) {
        const points = [];
        for (let i = 1; i <= samples; i++) {
            const t = i / samples;
            const mt = 1 - t;

            const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
            const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
            const z = mt * mt * p0.z + 2 * mt * t * p1.z + t * t * p2.z;

            points.push(new THREE.Vector3(x, y, z));
        }
        return points;
    }

    /**
     * 创建单个管道（内层发光管 + 外层玻璃管）
     */
    createPipe(curve, pipeRadius, glassRadius, color, emissiveIntensity) {
        const group = new THREE.Group();

        // 内层：发光核心
        const coreGeometry = new THREE.TubeGeometry(
            curve,
            this.config.pipeSegments,
            pipeRadius,
            this.config.radialSegments,
            false
        );

        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: color,
            emissiveIntensity: emissiveIntensity,
            roughness: 0.4,
            metalness: 0.1
        });

        const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
        group.add(coreMesh);

        // 外层：玻璃管
        const glassGeometry = new THREE.TubeGeometry(
            curve,
            this.config.pipeSegments,
            glassRadius,
            this.config.radialSegments,
            false
        );

        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: color,
            metalness: 0,
            roughness: 0.1,
            transmission: 0.95,
            // thickness 属性在 Three.js r128 中不支持，已移除
            ior: 1.5,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });

        const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
        group.add(glassMesh);

        return group;
    }

    /**
     * 居中并缩放组
     */
    centerAndScale(group) {
        // 计算边界框
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // 居中
        group.position.x = -center.x;
        group.position.y = -center.y;
        group.position.z = -center.z;

        // 缩放到合适大小
        const maxDim = Math.max(size.x, size.y);
        const targetSize = 1.5;
        const scale = maxDim > 0 ? targetSize / maxDim : 1;

        group.scale.set(scale, scale, scale);
    }

    /**
     * 生成Canvas预览（2D预览用）
     * @param {string} text - 文字
     * @param {number} color - 颜色
     * @returns {HTMLCanvasElement}
     */
    generatePreview(text, color) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 设置画布大小
        canvas.width = 800;
        canvas.height = 400;

        // 绘制背景
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 设置文字样式
        const fontSize = Math.min(80, 600 / text.length);
        ctx.font = `bold ${fontSize}px "Microsoft YaHei", "Noto Sans SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // 绘制发光效果
        const colorHex = '#' + color.toString(16).padStart(6, '0');

        // 外层光晕
        ctx.shadowColor = colorHex;
        ctx.shadowBlur = 40;
        ctx.fillStyle = colorHex;
        ctx.globalAlpha = 0.3;
        ctx.fillText(text, centerX, centerY);

        // 中层
        ctx.shadowBlur = 20;
        ctx.globalAlpha = 0.6;
        ctx.fillText(text, centerX, centerY);

        // 内层高亮
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, centerX, centerY);

        return canvas;
    }

    /**
     * Canvas降级方案（当3D生成失败时使用）
     */
    createCanvasFallback(text, color) {
        const canvas = this.generatePreview(text, color);
        const texture = new THREE.CanvasTexture(canvas);

        const geometry = new THREE.PlaneGeometry(1.5, 0.75);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        const group = new THREE.Group();
        group.add(mesh);

        return group;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NeonPipeGenerator;
}
