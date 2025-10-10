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
    
    // 进入AR按钮
    arBtn.addEventListener('click', () => {
        const text = neonTextInput.value ? neonTextInput.value.trim() : '';
        
        if (!text) {
            alert('请先输入文字');
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
        neonEntity.appendChild(debugBox);
        
        // 创建3D文字
        const selectedFont = fontSelect ? fontSelect.value : 'Arial';
        create3DNeonText(text, neonEntity, selectedFont);
        
        // 添加到场景
        if (neonModel) {
            neonModel.appendChild(neonEntity);
        }
        
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
            
            // 居中文字
            textGeometry.computeBoundingBox();
            const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
            textGeometry.translate(-textWidth / 2, 0, 0);
            
            // 创建发光材质
            const textMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xff00ff,
                emissiveIntensity: 0.8,
                metalness: 0.3,
                roughness: 0.2
            });
            
            // 创建文字网格
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
            const glowWidth = glowGeometry.boundingBox.max.x - glowGeometry.boundingBox.min.x;
            glowGeometry.translate(-glowWidth / 2, 0, 0);
            
            // 创建发光网格
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            
            // 创建组合对象
            const textGroup = new THREE.Group();
            textGroup.add(textMesh);
            textGroup.add(glowMesh);
            
            // 等待A-Frame实体完全初始化后再添加3D对象
            if (parentEntity.hasLoaded) {
                parentEntity.setObject3D('mesh', textGroup);
                console.log('3D文字已添加到实体');
            } else {
                parentEntity.addEventListener('loaded', function() {
                    parentEntity.setObject3D('mesh', textGroup);
                    console.log('3D文字已添加到实体（延迟加载）');
                });
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
                
                textGeometry.computeBoundingBox();
                const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
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
                const glowWidth = glowGeometry.boundingBox.max.x - glowGeometry.boundingBox.min.x;
                glowGeometry.translate(-glowWidth / 2, 0, 0);
                
                const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
                
                const textGroup = new THREE.Group();
                textGroup.add(textMesh);
                textGroup.add(glowMesh);
                
                if (parentEntity.hasLoaded) {
                    parentEntity.setObject3D('mesh', textGroup);
                    console.log('3D文字已添加到实体');
                } else {
                    parentEntity.addEventListener('loaded', function() {
                        parentEntity.setObject3D('mesh', textGroup);
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