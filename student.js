import * as THREE from 'https://esm.sh/three';

// ==========================================
// 1. 3D 背景动画 (保持不变)
// ==========================================
const canvas = document.querySelector('#webgl-canvas');
if(canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    const textureLoader = new THREE.TextureLoader();
    const bgTexture = textureLoader.load('/bg-layer.png'); 
    const uniforms = { u_time: { value: 0.0 }, u_texture: { value: bgTexture } };
    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
        fragmentShader: `uniform float u_time; uniform sampler2D u_texture; varying vec2 vUv; void main() { vec2 uv = vUv; float wave = sin(uv.y * 10.0 + u_time * 0.1) * 0.001; uv.x += wave; uv.y += wave; gl_FragColor = texture2D(u_texture, uv); }`
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
    const clock = new THREE.Clock();
    function animate() { uniforms.u_time.value = clock.getElapsedTime(); renderer.render(scene, camera); requestAnimationFrame(animate); }
    animate();
}

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // API 配置区 (⚠️ 请填入你的真实 API KEY)
    // ==========================================
    const API_KEY = 'sk-5c39da1e34074cf6bdb546363d8cd8be'; // <--- 在这里替换为你的千问 API KEY
    const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

    // ==========================================
    // AI 人设后台提示词库
    // ==========================================
    const personaPrompts = {
        "温柔倾听者": "你是一个专业的、温暖的校园心理陪伴助手。你的职责是耐心倾听学生的烦恼，语气要温柔、治愈，像知心姐姐。每次回复简短一些，不要长篇大论。",
        "阳光伙伴": "你是一个充满活力、积极向上的同龄伙伴。用幽默和乐观开导学生，多用网络流行语和轻松的语气，给他们带来正能量。回复尽量简短。",
        "冷静导师": "你是一个理性、成熟的心理导师。帮助学生客观分析问题，提供切实可行的建议和见解，语气平和专业。回复要有条理且简练。"
    };

    // 系统上下文记忆：数组的第0项永远是人设提示词，后面的项是聊天记录
    let messageHistory = [
        { role: "system", content: personaPrompts["温柔倾听者"] } 
    ];

    // ==========================================
    // 人设下拉菜单切换逻辑
    // ==========================================
    const toggleBtn = document.getElementById('persona-toggle');
    const dropdown = document.getElementById('persona-menu');
    const options = document.querySelectorAll('.persona-option');
    const currentName = document.getElementById('current-persona-name');
    const currentDesc = document.getElementById('current-persona-desc');
    const currentIcon = document.getElementById('current-persona-icon');

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => dropdown.classList.remove('show'));

    options.forEach(option => {
        option.addEventListener('click', () => {
            options.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            const roleName = option.getAttribute('data-role');
            currentName.innerText = roleName;
            currentDesc.innerText = option.getAttribute('data-desc');
            currentIcon.className = `fa-solid ${option.getAttribute('data-icon')}`;

            // ✨ 核心：后台偷偷更新 AI 的 System Prompt (人设)
            messageHistory[0].content = personaPrompts[roleName];
            
            // 切换人设时，给用户一个友好的提示（不加入历史记录）
            appendMessage(`已为您切换至【${roleName}】模式，有什么想和我聊聊的吗？`, false);
        });
    });

    // ==========================================
    // 聊天发送与 API 请求逻辑
    // ==========================================
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chips = document.querySelectorAll('.chip');

    // 快捷回复填入
    chips.forEach(chip => {
        chip.addEventListener('click', () => { chatInput.value = chip.innerText; chatInput.focus(); });
    });

    // 在页面上添加消息气泡
    function appendMessage(text, isUser) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        msgDiv.innerHTML = isUser 
            ? `<div class="msg-bubble">${text}</div><div class="msg-avatar">同</div>`
            : `<div class="msg-avatar"><i class="fa-solid fa-robot"></i></div><div class="msg-bubble">${text}</div>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // 自动滚动到底部
        return msgDiv;
    }

    // 核心：请求千问 API
    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        // 1. 页面显示用户消息，并清空输入框
        appendMessage(text, true);
        chatInput.value = '';

        // 2. 将用户消息加入对话历史记录，让 AI 记住
        messageHistory.push({ role: "user", content: text });

        // 3. 页面显示“正在思考”的动画气泡
        const loadingMsg = appendMessage('<i class="fa-solid fa-ellipsis fa-fade"></i> 正在思考...', false);

        try {
            // 4. 发起真实的 API 请求
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "qwen-turbo", // 使用通义千问模型
                    messages: messageHistory,
                    temperature: 0.7 // 0.7 适合日常聊天，兼顾逻辑性和创造性
                })
            });

            const data = await response.json();

            if (data.choices && data.choices.length > 0) {
                const aiReply = data.choices[0].message.content;
                
                // 5. 将 AI 的回复加入历史记录
                messageHistory.push({ role: "assistant", content: aiReply });
                
                // 6. 将“正在思考”的气泡内容替换为真实的 AI 回复
                loadingMsg.querySelector('.msg-bubble').innerHTML = aiReply;
            } else {
                throw new Error(data.error ? data.error.message : 'API 返回格式异常');
            }

        } catch (error) {
            console.error("AI 请求失败:", error);
            loadingMsg.querySelector('.msg-bubble').innerHTML = '⚠️ 抱歉，网络似乎出了点小差错，或者 API Key 未正确配置。请检查控制台报错。';
            // 如果请求失败，把刚才加入历史记录的用户消息弹出来，避免上下文错乱
            messageHistory.pop(); 
        }
    }

    // 绑定点击发送事件
    sendBtn.addEventListener('click', handleSend);
    
    // 绑定回车发送事件
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { 
            e.preventDefault(); 
            handleSend(); 
        }
    });

    // 清空对话功能
    document.getElementById('clear-chat-btn').addEventListener('click', () => {
        // 清理页面 DOM
        chatMessages.innerHTML = `
            <div class="message ai-message">
                <div class="msg-avatar"><i class="fa-solid fa-sun"></i></div>
                <div class="msg-bubble">记忆已清空。随时可以重新开始聊天~</div>
            </div>`;
        // 清理历史记忆（保留第0项的人设）
        messageHistory = [ messageHistory[0] ];
    });

    // ==========================================
    // SOS 弹窗逻辑 (保持不变)
    // ==========================================
    const sosBtn = document.getElementById('sos-btn');
    const sosModal = document.getElementById('sos-modal');
    const closeSosBtn = document.getElementById('close-sos-btn');

    sosBtn.addEventListener('click', () => { sosModal.classList.add('show'); });
    closeSosBtn.addEventListener('click', () => { sosModal.classList.remove('show'); });
    sosModal.addEventListener('click', (e) => {
        if (e.target === sosModal) sosModal.classList.remove('show');
    });
});
