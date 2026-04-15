import * as THREE from 'https://esm.sh/three';
import gsap from 'https://esm.sh/gsap';

// ==========================================
// 1. Three.js 动态水波纹背景设置
// ==========================================
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const textureLoader = new THREE.TextureLoader();
const bgTexture = textureLoader.load('/bg-layer.png'); 

const uniforms = {
    u_time: { value: 0.0 },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    u_texture: { value: bgTexture },
    u_distortion_speed: { value: 0.3 } // 初始水波速度很柔和
};

const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
    `,
    fragmentShader: `
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform sampler2D u_texture;
        uniform float u_distortion_speed;
        varying vec2 vUv;

        void main() {
            vec2 uv = vUv;
            float waveX = sin(uv.y * 15.0 + u_time * u_distortion_speed) * 0.002;
            float waveY = cos(uv.x * 15.0 + u_time * u_distortion_speed) * 0.002;
            
            float dist = distance(uv, u_mouse);
            float mouseWave = sin(dist * 20.0 - u_time * 2.0) * 0.008 * exp(-dist * 5.0);
            
            uv.x += waveX + mouseWave;
            uv.y += waveY + mouseWave;

            gl_FragColor = texture2D(u_texture, uv);
        }
    `
});

const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// 视差互动：鼠标移动不仅影响水波，还让标题微微浮动
const titleWrapper = document.querySelector('.title-wrapper');
window.addEventListener('mousemove', (e) => {
    // 水波纹鼠标跟随
    gsap.to(uniforms.u_mouse.value, {
        x: e.clientX / window.innerWidth,
        y: 1.0 - (e.clientY / window.innerHeight),
        duration: 0.8, ease: "power2.out"
    });
    
    // 标题的 3D 视差移动
    if(titleWrapper) {
        const xPos = (e.clientX / window.innerWidth - 0.5) * 20; // 偏移量
        const yPos = (e.clientY / window.innerHeight - 0.5) * 20;
        gsap.to(titleWrapper, {
            x: xPos, y: yPos, duration: 1, ease: "power2.out"
        });
    }
});

window.addEventListener('resize', () => { renderer.setSize(window.innerWidth, window.innerHeight); });
const clock = new THREE.Clock();
function animate() {
    uniforms.u_time.value = clock.getElapsedTime();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

// ==========================================
// 2. UI 交互：平滑进入系统与 Tabs 切换
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const enterBtn = document.querySelector('.enter-button');
    const heroSection = document.querySelector('.hero-section');
    const loginPanel = document.querySelector('.login-container');
    const bgOverlay = document.querySelector('.bg-overlay');

    // 1. 点击进入系统
    if (enterBtn) {
        enterBtn.addEventListener('click', () => {
            // 首页文字平滑消失
            gsap.to(heroSection, { opacity: 0, y: -30, duration: 1, ease: "power2.inOut", onComplete: () => heroSection.style.display = 'none' });
            
            // 背景微微放大，不再剧烈扭曲
            gsap.to(mesh.scale, { x: 1.03, y: 1.03, duration: 3, ease: "power2.out" });
            
            // 渐显暗色模糊遮罩，突出登录框
            gsap.to(bgOverlay, { backgroundColor: "rgba(26, 54, 93, 0.2)", backdropFilter: "blur(4px)", duration: 2, ease: "power2.out" });

            // 丝滑弹出登录框
            if (loginPanel) {
                loginPanel.style.display = 'flex';
                const glassPanel = loginPanel.querySelector('.glass-panel');
                gsap.fromTo(glassPanel, 
                    { opacity: 0, scale: 0.9, y: 20 }, 
                    { opacity: 1, scale: 1, y: 0, duration: 1.2, delay: 0.5, ease: "expo.out" }
                );
            }
        });
    }

    // 2. 登录框 Tabs 切换逻辑
    const tabs = document.querySelectorAll('.tab');
    const tabSlider = document.querySelector('.tab-slider');
    
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // 移除所有 active
            tabs.forEach(t => t.classList.remove('active'));
            // 当前添加 active
            tab.classList.add('active');
            // 移动滑块 (每个 tab 占 33.33%)
            tabSlider.style.transform = `translateX(${index * 100}%)`;
        });
    });
// 3. 登录按钮跳转逻辑
    const loginForm = document.querySelector('.login-form');
    const submitBtn = document.querySelector('.submit-btn');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // 阻止表单默认的刷新页面行为
            
            // 制造一点高级的交互感：按钮文字变成加载中
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 登录中...';
            submitBtn.style.opacity = '0.8';
            submitBtn.style.pointerEvents = 'none'; // 防止重复点击

            // 模拟 0.8 秒的网络请求延迟，然后跳转到学生端
            setTimeout(() => {
                window.location.href = '/student.html';
            }, 800);
        });
    }
}); 
