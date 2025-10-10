document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const startScreen = document.getElementById('start-screen');
    const previewScreen = document.getElementById('preview-screen');
    const arScreen = document.getElementById('ar-screen');
    const neonTextInput = document.getElementById('neon-text');
    const generateBtn = document.getElementById('generate-btn');
    const neonPreview = document.getElementById('neon-preview');
    const backBtn = document.getElementById('back-btn');
    const arBtn = document.getElementById('ar-btn');
    const exitArBtn = document.getElementById('exit-ar-btn');
    const takePhotoBtn = document.getElementById('take-photo-btn');
    const neonModel = document.getElementById('neon-model');
    
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
        const text = neonTextInput.value.trim();
        
        if (!text) {
            alert('请输入文字');
            return;
        }
        
        // 生成霓虹灯图片
        generateNeonImage(text).then(imageUrl => {
            currentNeonImageUrl = imageUrl;
            
            // 显示预览
            neonPreview.innerHTML = `<img src="${imageUrl}" alt="霓虹灯预览" style="max-width: 100%; max-height: 100%;">`;
            
            // 切换到预览屏幕
            showScreen(previewScreen);
        });
    });
    
    // 返回按钮
    backBtn.addEventListener('click', () => {
        showScreen(startScreen);
    });
    
    // 进入AR按钮
    arBtn.addEventListener('click', () => {
        const text = neonTextInput.value.trim();
        
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
    async function generateNeonImage(text) {
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
        const fontSize = Math.min(80, 1000 / text.length);
        ctx.font = `bold ${fontSize}px Arial`;
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
        // 移除现有模型
        if (neonModel.firstChild) {
            neonModel.removeChild(neonModel.firstChild);
        }
        
        // 创建一个实体
        const neonEntity = document.createElement('a-entity');
        neonEntity.setAttribute('position', '0 0 -1');
        
        // 创建3D文字
        create3DNeonText(text, neonEntity);
        
        // 添加到场景
        neonModel.appendChild(neonEntity);
    }
    
    // 创建3D霓虹灯文字
    function create3DNeonText(text, parentEntity) {
        // 字体加载器
        const loader = new THREE.FontLoader();
        
        // 使用Three.js内置字体
        loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font) {
            // 文字大小根据长度调整
            const fontSize = Math.max(0.05, 0.2 - (text.length * 0.01));
            
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
            
            // 将组合对象添加到实体
            parentEntity.setObject3D('mesh', textGroup);
        });
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