.journal-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    perspective: 1000px; /* 增加 3D 透视感 */
}

.paper {
    width: 300px;
    height: 400px;
    background: #fdfdfd;
    padding: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    border-radius: 4px;
    /* 引入 SVG 扭曲滤镜 */
    filter: url(#crumple-filter);
    transform-origin: center center;
    cursor: grab;
    /* 动画过渡，让松手时的回弹更自然 */
    transition: transform 0.1s ease-out, opacity 0.3s ease;
}

.paper:active {
    cursor: grabbing;
}

/* 揉纸完成后的消失动画 */
.paper.crumpled {
    transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
    transform: scale(0) rotate(720deg) translateZ(-500px) !important;
    opacity: 0;
}
