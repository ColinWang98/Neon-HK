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
        if (!currentNeonImageUrl) {
            alert('请先生成霓虹灯图片');
            return;
        }
        
        // 准备AR场景
        prepareARScene(currentNeonImageUrl);
        
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
    function prepareARScene(imageUrl) {
        // 创建一个平面作为霓虹灯招牌
        if (neonModel.firstChild) {
            neonModel.removeChild(neonModel.firstChild);
        }
        
        // 创建一个平面实体
        const neonEntity = document.createElement('a-entity');
        neonEntity.setAttribute('position', '0 0 -1');
        
        // 创建材质
        const material = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load(imageUrl),
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // 创建平面几何体
        const geometry = new THREE.PlaneGeometry(1, 0.5);
        
        // 创建网格
        const mesh = new THREE.Mesh(geometry, material);
        
        // 将网格添加到实体
        neonEntity.setObject3D('mesh', mesh);
        
        // 添加到场景
        neonModel.appendChild(neonEntity);
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