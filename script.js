document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const startScreen = document.getElementById('start-screen');
    const previewScreen = document.getElementById('preview-screen');
    const arScreen = document.getElementById('ar-screen');
    const neonTextInput = document.getElementById('neon-text');
    const fontSelect = document.getElementById('fontSelect');
    const generateBtn = document.getElementById('generate-btn');
    const neonPreview = document.getElementById('neon-preview');
    const backBtn = document.getElementById('back-btn');
    const arBtn = document.getElementById('ar-btn');
    const exitArBtn = document.getElementById('exit-ar-btn');
    const takePhotoBtn = document.getElementById('take-photo-btn');
    const neonModel = document.getElementById('neon-model');
    
    // 检查必要的DOM元素是否存在
    if (!startScreen || !previewScreen || !arScreen || !neonTextInput || 
        !fontSelect || !generateBtn || !neonPreview || !backBtn || 
        !arBtn || !exitArBtn || !takePhotoBtn || !neonModel) {
        console.error('某些必要的DOM元素未找到');
        return;
    }
    
    // 当前生成的霓虹灯图片URL
    let currentNeonImageUrl = '';
    
    // 切换屏幕函数
    function showScreen(screen) {
        startScreen.classList.remove('active');
        previewScreen.classList.remove('active');
        arScreen.classList.remove('active');
        
        screen.classList.add('active');

        // 在AR屏幕时让页面背景透明，便于显示摄像头视频
        if (screen === arScreen) {
            document.body.classList.add('ar-mode');
            // 调整AR.js注入的视频样式
            setTimeout(() => {
                const arVideo = document.querySelector('#arjs-video') || document.querySelector('body > video');
                if (arVideo) {
                    arVideo.style.position = 'fixed';
                    arVideo.style.top = '0';
                    arVideo.style.left = '0';
                    arVideo.style.width = '100vw';
                    arVideo.style.height = '100vh';
                    arVideo.style.objectFit = 'cover';
                    arVideo.style.zIndex = '0';
                }
            }, 300);
        } else {
            document.body.classList.remove('ar-mode');
        }
    }
    
    // 生成霓虹灯图片
    generateBtn.addEventListener('click', () => {
        const text = neonTextInput.value ? neonTextInput.value.trim() : '';
        const selectedFont = fontSelect ? fontSelect.value : 'Arial';
        
        if (!text) {
            alert('请输入文字');
            return;
        }
        
        // 生成霓虹灯图片
        generateNeonImage(text, selectedFont).then(imageUrl => {
            if (imageUrl) {
                currentNeonImageUrl = imageUrl;
                
                // 显示预览
                if (neonPreview) {
                    neonPreview.innerHTML = `<img src="${imageUrl}" alt="霓虹灯预览" style="max-width: 100%; max-height: 100%;">`;
                }
                
                // 切换到预览屏幕
                showScreen(previewScreen);
            } else {
                alert('生成霓虹灯图片失败，请重试');
            }
        }).catch(error => {
            console.error('生成霓虹灯图片时出错:', error);
            alert('生成霓虹灯图片失败，请重试');
        });
    });
    
    // 返回按钮
    backBtn.addEventListener('click', () => {
        showScreen(startScreen);
    });
    
    // 安全环境与相机权限检查
    function isSecureForAR() {
        const isSecure = window.isSecureContext || location.protocol === 'https:';
        const isLocalhost = ['localhost', '127.0.0.1'].includes(location.hostname);
        const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        return (isSecure || isLocalhost) && hasMedia;
    }

    async function ensureCameraAccess() {
        if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
            console.error('设备不支持摄像头访问');
            return false;
        }
        try {
            // 预请求后置摄像头权限，避免进入AR后黑屏
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            // 立即停止预览流，后续由AR库接管摄像头
            stream.getTracks().forEach(t => t.stop());
            return true;
        } catch (err) {
            console.error('获取摄像头权限失败:', err);
            return false;
        }
    }

    // 进入AR按钮
    arBtn.addEventListener('click', async () => {
        const text = neonTextInput.value ? neonTextInput.value.trim() : '';

        if (!text) {
            alert('请先输入文字');
            return;
        }

        // 检查安全环境（HTTPS或本机localhost）与摄像头能力
        if (!isSecureForAR()) {
            alert('移动端AR需要在HTTPS或localhost环境下运行，并支持摄像头访问。请通过GitHub Pages或使用HTTPS方式打开该页面。');
            return;
        }

        // 主动请求摄像头权限，降低黑屏概率
        const cameraOk = await ensureCameraAccess();
        if (!cameraOk) {
            alert('无法访问摄像头，请在浏览器设置中允许相机权限后重试。');
            return;
        }

        // 准备AR场景
        prepareARScene(text);

        // 切换到AR屏幕
        showScreen(arScreen);
    });
    
    // 退出AR按钮
    exitArBtn.addEventListener('click', () => {
        showScreen(previewScreen);
    });
    
    // 拍照按钮
    takePhotoBtn.addEventListener('click', () => {
        takePhoto();
    });
    
    // 生成霓虹灯图片函数
    async function generateNeonImage(text, fontFamily = 'Arial') {
        // 检查text参数
        if (!text || typeof text !== 'string') {
            console.error('generateNeonImage: text参数无效');
            return null;
        }
        
        // 创建一个Canvas来生成霓虹灯效果
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置Canvas大小
        canvas.width = 800;
        canvas.height = 400;
        
        // 绘制背景
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 设置文本样式
        const fontSize = text && text.length > 0 ? Math.min(80, 1000 / text.length) : 80;
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 绘制霓虹灯发光效果
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // 外发光
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff00ff';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, centerX, centerY);
        
        // 增加更多发光效果
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff00ff';
        ctx.fillText(text, centerX, centerY);
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.fillText(text, centerX, centerY);
        
        // 返回生成的图片URL
        return canvas.toDataURL('image/png');
    }
    
    // 准备AR场景
    function prepareARScene(text) {
        // 检查text参数
        if (!text || typeof text !== 'string') {
            console.error('prepareARScene: text参数无效');
            return;
        }
        
        console.log('准备AR场景，文字:', text);
        
        // 移除现有模型
        if (neonModel && neonModel.firstChild) {
            neonModel.removeChild(neonModel.firstChild);
        }
        
        // 创建一个实体
        const neonEntity = document.createElement('a-entity');
        neonEntity.setAttribute('position', '0 0 -1');
        neonEntity.setAttribute('scale', '2 2 2'); // 增大模型尺寸
        
        // 添加调试用的几何体，确保有可见内容
        const debugBox = document.createElement('a-box');
        debugBox.setAttribute('position', '0 0.5 0');
        debugBox.setAttribute('color', '#ff00ff');
        debugBox.setAttribute('width', '0.5');
        debugBox.setAttribute('height', '0.2');
        debugBox.setAttribute('depth', '0.1');
        debugBox.setAttribute('id', 'debug-box');
        neonEntity.appendChild(debugBox);
        
        // 先将实体添加到场景，确保其初始化完成，避免组件内部读取el报错
        if (neonModel) {
            neonModel.appendChild(neonEntity);
        }

        // 创建3D文字（在实体已挂载的前提下进行）
        const selectedFont = fontSelect ? fontSelect.value : 'Arial';
        create3DNeonText(text, neonEntity, selectedFont);
        
        console.log('AR场景准备完成');
    }
    
    // 创建3D霓虹灯文字
    function create3DNeonText(text, parentEntity, fontFamily = 'Arial') {
        // 检查text参数
        if (!text || typeof text !== 'string') {
            console.error('create3DNeonText: text参数无效');
            return;
        }
        
        // 检查parentEntity参数 - A-Frame实体在创建时可能还没有.el属性
        if (!parentEntity) {
            console.error('create3DNeonText: parentEntity参数无效');
            return;
        }
        
        console.log('创建3D文字:', text, '字体:', fontFamily);

        // 若包含中文字符，改用OpenType基于OTF的三维挤出方案
        const hasChinese = /[\u4e00-\u9fff]/.test(text);
        if (hasChinese) {
            console.log('检测到中文字符，使用OpenType挤出方案');
            return createExtrudedChineseText(text, parentEntity, fontFamily);
        }
        
        // 字体加载器
        const loader = new THREE.FontLoader();
        
        // 根据选择的字体加载不同的字体文件
        // 使用本地备用字体URL，避免网络问题
        let fontUrl = './fonts/helvetiker_bold.typeface.json'; // 本地默认字体
        
        // 备用字体映射 - 如果本地字体不存在，使用在线字体
        const fontMapping = {
            'KaiTi': './fonts/helvetiker_bold.typeface.json',
            'STKaiti': './fonts/helvetiker_bold.typeface.json', 
            'LiSu': './fonts/helvetiker_bold.typeface.json',
            'SimSun': './fonts/helvetiker_bold.typeface.json'
        };
        
        // 在线备用字体
        const onlineFontUrl = 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json';
        
        fontUrl = fontMapping[fontFamily] || fontUrl;
        
        console.log('加载字体:', fontUrl);
        
        // 使用Three.js字体
        loader.load(fontUrl, function(font) {
            console.log('字体加载成功');
            // 文字大小根据长度调整
            const fontSize = text && text.length > 0 ? Math.max(0.05, 0.2 - (text.length * 0.01)) : 0.2;
            
            // 创建3D文字几何体
            const textGeometry = new THREE.TextGeometry(text, {
                font: font,
                size: fontSize,
                height: 0.03, // 文字厚度
                curveSegments: 12, // 曲线分段数，越高越平滑
                bevelEnabled: true, // 启用斜角
                bevelThickness: 0.01, // 斜角厚度
                bevelSize: 0.005, // 斜角大小
                bevelSegments: 5 // 斜角分段数
            });
            
            // 居中文字（若几何体无顶点，说明字符不被字体支持，走画布后备方案）
            const hasPosition = textGeometry && textGeometry.attributes && textGeometry.attributes.position && textGeometry.attributes.position.count > 0;
            textGeometry.computeBoundingBox();
            const textWidth = textGeometry.boundingBox && isFinite(textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x)
              ? (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x)
              : 0;
            if (!hasPosition || textWidth <= 0) {
                console.warn('字体不支持该字符，使用画布后备文字');
                createCanvasText(text, parentEntity, fontFamily);
                return;
            }
            textGeometry.translate(-textWidth / 2, 0, 0);
            
            // 创建发光材质
            const textMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xff00ff,
                emissiveIntensity: 0.8,
                metalness: 0.3,
                roughness: 0.2
            });
            
            // 创建文字网格（外部THREE实例）
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            
            // 添加发光效果
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xff00ff,
                transparent: true,
                opacity: 0.5
            });
            
            // 创建略大的几何体用于发光效果
            const glowGeometry = new THREE.TextGeometry(text, {
                font: font,
                size: fontSize * 1.05,
                height: 0.03,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.01,
                bevelSize: 0.005,
                bevelSegments: 5
            });
            
            // 居中发光几何体
            glowGeometry.computeBoundingBox();
            const glowWidth = glowGeometry.boundingBox && isFinite(glowGeometry.boundingBox.max.x - glowGeometry.boundingBox.min.x)
              ? (glowGeometry.boundingBox.max.x - glowGeometry.boundingBox.min.x)
              : textWidth;
            glowGeometry.translate(-(glowWidth / 2), 0, 0);
            
            // 创建发光网格（外部THREE实例）
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);

            // 将外部THREE创建的几何体/材质转换为A-Frame的THREE实例，避免setObject3D类型不匹配
            const toAFrameBufferGeometry = (srcGeo) => {
                const THREEA = AFRAME.THREE;
                try {
                    const dst = new THREEA.BufferGeometry();
                    dst.copy(srcGeo);
                    return dst;
                } catch (e) {
                    const dst = new THREEA.BufferGeometry();
                    if (srcGeo && srcGeo.attributes) {
                        if (srcGeo.attributes.position) {
                            const p = srcGeo.attributes.position;
                            dst.setAttribute('position', new THREEA.BufferAttribute(p.array, p.itemSize, p.normalized));
                        }
                        if (srcGeo.attributes.normal) {
                            const n = srcGeo.attributes.normal;
                            dst.setAttribute('normal', new THREEA.BufferAttribute(n.array, n.itemSize, n.normalized));
                        }
                        if (srcGeo.attributes.uv) {
                            const u = srcGeo.attributes.uv;
                            dst.setAttribute('uv', new THREEA.BufferAttribute(u.array, u.itemSize, u.normalized));
                        }
                    }
                    if (srcGeo && srcGeo.index) {
                        const idx = srcGeo.index;
                        dst.setIndex(new THREEA.BufferAttribute(idx.array, 1));
                    }
                    dst.computeBoundingBox();
                    dst.computeBoundingSphere();
                    return dst;
                }
            };

            const THREEA = AFRAME.THREE;
            const textGeoAF = toAFrameBufferGeometry(textGeometry);
            const glowGeoAF = toAFrameBufferGeometry(glowGeometry);

            const textMatAF = new THREEA.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xff00ff,
                emissiveIntensity: 0.8,
                metalness: 0.3,
                roughness: 0.2
            });

            const glowMatAF = new THREEA.MeshBasicMaterial({
                color: 0xff00ff,
                transparent: true,
                opacity: 0.5
            });

            const textMeshAF = new THREEA.Mesh(textGeoAF, textMatAF);
            const glowMeshAF = new THREEA.Mesh(glowGeoAF, glowMatAF);

            const textGroup = new THREEA.Group();
            textGroup.add(textMeshAF);
            textGroup.add(glowMeshAF);
            
        // 等待A-Frame实体完全初始化后再添加3D对象
        const attachTextGroup = () => {
            try {
                if (typeof parentEntity.setObject3D === 'function') {
                    parentEntity.setObject3D('mesh', textGroup);
                    const db = parentEntity.querySelector('#debug-box');
                    if (db) db.remove();
                    console.log('3D文字已添加到实体');
                } else {
                    console.warn('parentEntity.setObject3D 不可用，尝试延迟加载');
                    parentEntity.addEventListener('loaded', function onLoaded() {
                        parentEntity.removeEventListener('loaded', onLoaded);
                        parentEntity.setObject3D('mesh', textGroup);
                        const db = parentEntity.querySelector('#debug-box');
                        if (db) db.remove();
                        console.log('3D文字已添加到实体（延迟加载）');
                    });
                }
            } catch (e) {
                console.error('添加3D文字到实体时出错：', e);
                createFallbackText(text, parentEntity);
            }
        };

        if (parentEntity.hasLoaded) {
            attachTextGroup();
        } else {
            parentEntity.addEventListener('loaded', attachTextGroup);
        }
        }, undefined, function(error) {
            console.error('本地字体加载失败，尝试在线字体:', error);
            console.error('本地字体URL:', fontUrl);
            
            // 尝试加载在线字体
            loader.load(onlineFontUrl, function(font) {
                console.log('在线字体加载成功');
                // 重复上面的字体创建逻辑
                const fontSize = text && text.length > 0 ? Math.max(0.05, 0.2 - (text.length * 0.01)) : 0.2;
                
                const textGeometry = new THREE.TextGeometry(text, {
                    font: font,
                    size: fontSize,
                    height: 0.03,
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 0.01,
                    bevelSize: 0.005,
                    bevelSegments: 5
                });
                
                const hasPosition = textGeometry && textGeometry.attributes && textGeometry.attributes.position && textGeometry.attributes.position.count > 0;
                textGeometry.computeBoundingBox();
                const textWidth = textGeometry.boundingBox && isFinite(textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x)
                  ? (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x)
                  : 0;
                if (!hasPosition || textWidth <= 0) {
                    console.warn('在线字体不支持该字符，使用画布后备文字');
                    createCanvasText(text, parentEntity, fontFamily);
                    return;
                }
                textGeometry.translate(-textWidth / 2, 0, 0);
                
                const textMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0xff00ff,
                    emissiveIntensity: 0.8,
                    metalness: 0.3,
                    roughness: 0.2
                });
                
                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff00ff,
                    transparent: true,
                    opacity: 0.5
                });
                
                const glowGeometry = new THREE.TextGeometry(text, {
                    font: font,
                    size: fontSize * 1.05,
                    height: 0.03,
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 0.01,
                    bevelSize: 0.005,
                    bevelSegments: 5
                });
                
                glowGeometry.computeBoundingBox();
                const glowWidth = glowGeometry.boundingBox && isFinite(glowGeometry.boundingBox.max.x - glowGeometry.boundingBox.min.x)
                  ? (glowGeometry.boundingBox.max.x - glowGeometry.boundingBox.min.x)
                  : textWidth;
                glowGeometry.translate(-(glowWidth / 2), 0, 0);
                
                const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);

                // 转换为A-Frame的THREE实例对象
                const THREEA = AFRAME.THREE;
                const toAFrameBufferGeometry = (srcGeo) => {
                    try {
                        const dst = new THREEA.BufferGeometry();
                        dst.copy(srcGeo);
                        return dst;
                    } catch (e) {
                        const dst = new THREEA.BufferGeometry();
                        if (srcGeo && srcGeo.attributes) {
                            if (srcGeo.attributes.position) {
                                const p = srcGeo.attributes.position;
                                dst.setAttribute('position', new THREEA.BufferAttribute(p.array, p.itemSize, p.normalized));
                            }
                            if (srcGeo.attributes.normal) {
                                const n = srcGeo.attributes.normal;
                                dst.setAttribute('normal', new THREEA.BufferAttribute(n.array, n.itemSize, n.normalized));
                            }
                            if (srcGeo.attributes.uv) {
                                const u = srcGeo.attributes.uv;
                                dst.setAttribute('uv', new THREEA.BufferAttribute(u.array, u.itemSize, u.normalized));
                            }
                        }
                        if (srcGeo && srcGeo.index) {
                            const idx = srcGeo.index;
                            dst.setIndex(new THREEA.BufferAttribute(idx.array, 1));
                        }
                        dst.computeBoundingBox();
                        dst.computeBoundingSphere();
                        return dst;
                    }
                };

                const textGeoAF = toAFrameBufferGeometry(textGeometry);
                const glowGeoAF = toAFrameBufferGeometry(glowGeometry);

                const textMatAF = new THREEA.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0xff00ff,
                    emissiveIntensity: 0.8,
                    metalness: 0.3,
                    roughness: 0.2
                });
                const glowMatAF = new THREEA.MeshBasicMaterial({
                    color: 0xff00ff,
                    transparent: true,
                    opacity: 0.5
                });

                const textMeshAF = new THREEA.Mesh(textGeoAF, textMatAF);
                const glowMeshAF = new THREEA.Mesh(glowGeoAF, glowMatAF);
                const textGroup = new THREEA.Group();
                textGroup.add(textMeshAF);
                textGroup.add(glowMeshAF);

                if (parentEntity.hasLoaded) {
                    parentEntity.setObject3D('mesh', textGroup);
                    const db = parentEntity.querySelector('#debug-box');
                    if (db) db.remove();
                    console.log('3D文字已添加到实体');
                } else {
                    parentEntity.addEventListener('loaded', function() {
                        parentEntity.setObject3D('mesh', textGroup);
                        const db = parentEntity.querySelector('#debug-box');
                        if (db) db.remove();
                        console.log('3D文字已添加到实体（延迟加载）');
                    });
                }
                
            }, undefined, function(onlineError) {
                console.error('在线字体也加载失败:', onlineError);
                console.error('在线字体URL:', onlineFontUrl);
                console.error('字体类型:', fontFamily);
                // 如果所有字体都加载失败，创建一个简单的文字实体作为备用
                createFallbackText(text, parentEntity);
            });
        });
    }

    // 使用OpenType.js将中文字体挤出为三维几何
    function createExtrudedChineseText(text, parentEntity, fontFamily) {
        try {
            const fontPath = './fonts/NotoSansSC-Regular.otf';
            if (typeof opentype === 'undefined') {
                console.warn('OpenType.js 未加载，降级到 Canvas 文本');
                createCanvasText(text, parentEntity, fontFamily);
                return;
            }
            opentype.load(fontPath, function(err, font) {
                if (err || !font) {
                    console.error('加载中文OTF字体失败，使用画布后备：', err);
                    createCanvasText(text, parentEntity, fontFamily);
                    return;
                }

                // 生成路径并构建ShapePath
                const fontSize = 120;
                const path = font.getPath(text, 0, 0, fontSize);
                const cmds = path.commands || [];
                const THREEA = AFRAME.THREE;
                const shapePath = new THREEA.ShapePath();
                for (const c of cmds) {
                    switch (c.type) {
                        case 'M': shapePath.moveTo(c.x, -c.y); break;
                        case 'L': shapePath.lineTo(c.x, -c.y); break;
                        case 'C': shapePath.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y); break;
                        case 'Q': shapePath.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y); break;
                        case 'Z': shapePath.currentPath.autoClose = true; break;
                        default: break;
                    }
                }

                const shapes = shapePath.toShapes(true);
                const extrudeSettings = {
                    depth: 0.03,
                    bevelEnabled: true,
                    bevelThickness: 0.005,
                    bevelSize: 0.003,
                    bevelSegments: 3
                };
                const geo = new THREEA.ExtrudeGeometry(shapes, extrudeSettings);

                // 缩放与居中
                geo.computeBoundingBox();
                const bb = geo.boundingBox;
                const width = (bb.max.x - bb.min.x);
                const targetWidth = 1.2; // 目标世界宽度
                const scale = width > 0 ? (targetWidth / width) : 0.01;
                geo.scale(scale, scale, scale);
                geo.computeBoundingBox();
                const bb2 = geo.boundingBox;
                const centerX = (bb2.max.x + bb2.min.x) / 2;
                geo.translate(-centerX, 0, 0);

                // 发光材质与略大一层的光晕
                const textMatAF = new THREEA.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0xff00ff,
                    emissiveIntensity: 0.8,
                    metalness: 0.3,
                    roughness: 0.2
                });
                const textMeshAF = new THREEA.Mesh(geo, textMatAF);

                const glowGeoAF = geo.clone();
                glowGeoAF.scale(1.03, 1.03, 1);
                const glowMatAF = new THREEA.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.5 });
                const glowMeshAF = new THREEA.Mesh(glowGeoAF, glowMatAF);

                const group = new THREEA.Group();
                group.add(textMeshAF);
                group.add(glowMeshAF);

                const attach = () => {
                    try {
                        parentEntity.setObject3D('mesh', group);
                        const db = parentEntity.querySelector('#debug-box');
                        if (db) db.remove();
                        console.log('中文三维挤出文字已添加到实体');
                    } catch (e) {
                        console.error('中文挤出文字挂载失败：', e);
                        createCanvasText(text, parentEntity, fontFamily);
                    }
                };
                if (parentEntity.hasLoaded) attach(); else parentEntity.addEventListener('loaded', attach);
            });
        } catch (e) {
            console.error('createExtrudedChineseText 失败，降级到 Canvas：', e);
            createCanvasText(text, parentEntity, fontFamily);
        }
    }
    
    // 创建备用文字（当字体加载失败时使用）
    function createFallbackText(text, parentEntity) {
        // 检查参数有效性
        if (!text || typeof text !== 'string' || !parentEntity) {
            console.error('createFallbackText: 参数无效', { text, parentEntity });
            return;
        }
        
        console.log('使用备用文字方案');
        
        // 创建简单的A-Frame文字实体
        const textEntity = document.createElement('a-text');
        textEntity.setAttribute('value', text);
        textEntity.setAttribute('color', '#ff00ff');
        textEntity.setAttribute('position', '0 0 0');
        textEntity.setAttribute('align', 'center');
        textEntity.setAttribute('width', '6');
        
        parentEntity.appendChild(textEntity);
    }

    // 使用Canvas绘制文字并作为贴图（支持中文字符的后备方案）
    function createCanvasText(text, parentEntity, fontFamily = 'Noto Sans SC') {
        if (!text || typeof text !== 'string' || !parentEntity) {
            console.error('createCanvasText: 参数无效', { text, parentEntity });
            return;
        }
        try {
            const THREEA = AFRAME.THREE;
            const canvas = document.createElement('canvas');
            const width = 1024;
            const height = 512;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, width, height);
            
            // 背景透明
            ctx.fillStyle = 'rgba(0,0,0,0)';
            ctx.fillRect(0, 0, width, height);
            
            // 字体设置（优先使用用户选择字体，其次 Noto Sans SC）
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `bold 160px ${fontFamily}, Noto Sans SC, sans-serif`;

            const x = width / 2;
            const y = height / 2 + 20;

            // 霓虹发光效果：多层次阴影与填充
            ctx.shadowColor = 'rgba(255, 0, 255, 1)';
            ctx.shadowBlur = 60;
            ctx.fillStyle = 'rgba(255, 0, 255, 0.6)';
            ctx.fillText(text, x, y);

            ctx.shadowBlur = 30;
            ctx.fillStyle = 'rgba(255, 0, 255, 0.85)';
            ctx.fillText(text, x, y);

            // 中心高亮
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, x, y);

            // 生成纹理并创建平面网格
            const texture = new THREEA.CanvasTexture(canvas);
            texture.needsUpdate = true;
            texture.minFilter = THREEA.LinearFilter;
            texture.magFilter = THREEA.LinearFilter;
            texture.encoding = THREEA.sRGBEncoding;

            const material = new THREEA.MeshBasicMaterial({ map: texture, transparent: true });
            const planeW = 1.6;
            const planeH = 0.6;
            const geometry = new THREEA.PlaneGeometry(planeW, planeH);
            const mesh = new THREEA.Mesh(geometry, material);

            // 将文字放置在与之前相同的位置
            const attach = () => {
                if (typeof parentEntity.setObject3D === 'function') {
                    parentEntity.setObject3D('mesh', mesh);
                    const db = parentEntity.querySelector('#debug-box');
                    if (db) db.remove();
                    console.log('Canvas文字已添加到实体');
                } else {
                    parentEntity.addEventListener('loaded', function onLoaded() {
                        parentEntity.removeEventListener('loaded', onLoaded);
                        parentEntity.setObject3D('mesh', mesh);
                        const db = parentEntity.querySelector('#debug-box');
                        if (db) db.remove();
                        console.log('Canvas文字已添加到实体（延迟加载）');
                    });
                }
            };

            if (parentEntity.hasLoaded) attach(); else parentEntity.addEventListener('loaded', attach);
        } catch (e) {
            console.error('createCanvasText 失败，降级到 a-text：', e);
            createFallbackText(text, parentEntity);
        }
    }
    
    // 拍照功能
    function takePhoto() {
        const scene = document.querySelector('a-scene');
        
        // 捕获当前画面
        const dataUrl = scene.components.screenshot.getCanvas('perspective').toDataURL('image/png');
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = '香港霓虹灯_' + new Date().getTime() + '.png';
        link.click();
    }
});