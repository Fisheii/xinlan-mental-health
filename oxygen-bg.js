import * as THREE from 'three';

// --- 治愈系参数配置 ---
const config = {
    colors: ["#8ec5fc", "#e0c3fc", "#c2e9fb", "#fdfbfb"], // 晨曦蓝, 治愈紫, 氧气青, 珍珠白
    speed: 0.08,         // 极慢的呼吸感
    scale: 1.2,          // 舒展的波纹
    frequency: 0.8,
    warpStrength: 0.8,
    mouseInfluence: 0.5,
    parallax: 0.2,
    noise: 0.08,         // 高级磨砂感
    iterations: 2,
    intensity: 1.1,      // 柔和亮度
    bandWidth: 8,
    transparent: true
};

// --- Shader 代码 ---
const frag = `
#define MAX_COLORS 8
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer;
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
uniform int uIterations;
uniform float uIntensity;
uniform float uBandWidth;
varying vec2 vUv;

void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  vec2 toward = (uPointer - rp);
  q += toward * uMouseInfluence * 0.2;

  for (int j = 0; j < 5; j++) {
    if (j >= uIterations - 1) break;
    vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
    q += (rr - q) * 0.15;
  }

  vec3 col = vec3(0.0);
  float a = 1.0;

  if (uColorCount > 0) {
    vec2 s = q;
    vec3 sumCol = vec3(0.0);
    float cover = 0.0;
    for (int i = 0; i < MAX_COLORS; ++i) {
      if (i >= uColorCount) break;
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 disp = (r - s) * kBelow;
      vec2 warped = s + disp * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float m = mix(m0, m1, kMix);
      float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
      sumCol += uColors[i] * w;
      cover = max(cover, w);
    }
    col = clamp(sumCol, 0.0, 1.0);
    a = uTransparent > 0 ? cover : 1.0;
  }
  col *= uIntensity;

  if (uNoise > 0.0001) {
    float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
    col += (n - 0.5) * uNoise;
    col = clamp(col, 0.0, 1.0);
  }

  vec3 rgb = (uTransparent > 0) ? col * a : col;
  gl_FragColor = vec4(rgb, a);
}
`;

const vert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

// --- 初始化 Three.js ---
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('oxygen-bg');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    // 转换颜色
    const toVec3 = hex => {
        const h = hex.replace('#', '').trim();
        const v = h.length === 3
            ? [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
            : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
        return new THREE.Vector3(v[0] / 255, v[1] / 255, v[2] / 255);
    };

    const uColorsArray = Array.from({ length: 8 }, () => new THREE.Vector3(0, 0, 0));
    config.colors.slice(0, 8).forEach((color, i) => {
        uColorsArray[i].copy(toVec3(color));
    });

    const material = new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
            uCanvas: { value: new THREE.Vector2(1, 1) },
            uTime: { value: 0 },
            uSpeed: { value: config.speed },
            uRot: { value: new THREE.Vector2(Math.cos(Math.PI/4), Math.sin(Math.PI/4)) }, // 45度
            uColorCount: { value: config.colors.length },
            uColors: { value: uColorsArray },
            uTransparent: { value: 1 },
            uScale: { value: config.scale },
            uFrequency: { value: config.frequency },
            uWarpStrength: { value: config.warpStrength },
            uPointer: { value: new THREE.Vector2(0, 0) },
            uMouseInfluence: { value: config.mouseInfluence },
            uParallax: { value: config.parallax },
            uNoise: { value: config.noise },
            uIterations: { value: config.iterations },
            uIntensity: { value: config.intensity },
            uBandWidth: { value: config.bandWidth }
        },
        premultipliedAlpha: true,
        transparent: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const clock = new THREE.Clock();
    let pointerTarget = new THREE.Vector2(0, 0);
    let pointerCurrent = new THREE.Vector2(0, 0);

    const handleResize = () => {
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;
        renderer.setSize(w, h, false);
        material.uniforms.uCanvas.value.set(w, h);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    container.addEventListener('pointermove', (e) => {
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
        const y = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1);
        pointerTarget.set(x, y);
    });

    const loop = () => {
        const dt = clock.getDelta();
        material.uniforms.uTime.value = clock.elapsedTime;
        
        // 鼠标平滑跟随
        pointerCurrent.lerp(pointerTarget, Math.min(1, dt * 8));
        material.uniforms.uPointer.value.copy(pointerCurrent);

        renderer.render(scene, camera);
        requestAnimationFrame(loop);
    };
    loop();
});
