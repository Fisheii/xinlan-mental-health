document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('diaryEditor');
    const fontSelect = document.getElementById('fontSelect');
    const sceneBtn = document.getElementById('sceneToggleBtn');
    const interactBtn = document.getElementById('interactBtn');

    // 1. 字体切换逻辑
    fontSelect.addEventListener('change', (e) => {
        editor.style.fontFamily = e.target.value;
    });

    // 2. 场景切换逻辑
    const scenes = [
        { name: '初雪', bg: 'url("你的初雪图片路径.jpg")' }, // 请替换为实际图片路径
        { name: '雨夜', bg: 'url("你的雨夜图片路径.jpg")' },
        { name: '篝火', bg: 'url("你的篝火图片路径.jpg")' }
    ];
    let currentSceneIndex = 0;

    sceneBtn.addEventListener('click', () => {
        currentSceneIndex = (currentSceneIndex + 1) % scenes.length;
        document.body.style.backgroundImage = scenes[currentSceneIndex].bg;
        // 可选：更改按钮的 title 提示
        // sceneBtn.title = `当前：${scenes[currentSceneIndex].name}`;
    });

    // 3. 打字机/手写沉浸感音效 (可选)
    // 每次按键播放极短的沙沙声
    editor.addEventListener('input', () => {
        // 如果你有铅笔写字的极短音效(如 0.1秒)，可以在这里触发
        // const audio = new Audio('pencil-scratch.mp3');
        // audio.volume = 0.2;
        // audio.play();
    });

    // 4. 折纸飞走效果
    interactBtn.addEventListener('click', () => {
        if (editor.innerText.trim() === '') {
            alert('写点什么再折叠吧~');
            return;
        }
        
        // 给编辑器添加折纸动画类
        editor.classList.add('fold-animation');

        // 动画结束后清空内容并恢复原状
        setTimeout(() => {
            editor.innerHTML = ''; // 清空日记
            editor.classList.remove('fold-animation'); // 移除动画类，恢复原状
            // 这里可以加一个提示：日记已化作纸飞机飞走~
        }, 2500); // 2.5秒对应 CSS 动画的时间
    });
});
interactBtn.addEventListener('click', () => {
    const editor = document.getElementById('diaryEditor'); // 确保这里的 ID 和你 HTML 中的输入框 ID 完全一致！
    
    // 【关键修改】兼容获取内容：如果是 textarea 就取 .value，如果是 div 就取 .innerText
    const content = editor.value || editor.innerText || editor.textContent || '';

    // 1. 检查是否写了内容
    if (content.trim() === '') {
        alert('写点什么再折叠吧~');
        return;
    }

    // 2. 触发 CSS 动画
    editor.classList.add('fly-away-animation');

    // 3. 动画结束后的清理工作
    setTimeout(() => {
        // 【关键修改】同时清空 value 和 innerHTML，确保不管是什么标签都能被清空
        if (editor.tagName.toLowerCase() === 'textarea') {
            editor.value = '';
        } else {
            editor.innerHTML = ''; 
        }
        
        // 移除动画类，恢复原状
        editor.classList.remove('fly-away-animation');

        // 4. 显示治愈提示语 (如果你加了那个提示框节点的话)
        const healToast = document.getElementById('healToast');
        if (healToast) {
            healToast.classList.add('show');
            setTimeout(() => {
                healToast.classList.remove('show');
            }, 3000);
        }
    }, 2000); 
});
