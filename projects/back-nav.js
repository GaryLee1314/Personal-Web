/**
 * BM-Tools 子项目通用返回挂件
 * 该脚本被注入到独立部署的子项目页面中，在左上角提供返回主站的统一入口
 */
document.addEventListener('DOMContentLoaded', () => {
    // 注入 Google Fonts 和 Material Icons (如果项目中没有的话, 这里就不强行注入以防影响原样式, 直接注入样式即可)
    const style = document.createElement('style');
    style.innerHTML = `
        .bm-back-widget {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(30, 30, 40, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 9999px;
            color: #fff;
            text-decoration: none;
            font-family: 'Space Grotesk', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            font-size: 14px;
            font-weight: 700;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            cursor: pointer;
        }

        .bm-back-widget:hover {
            background: #7e5adc;
            border-color: #6d28d9;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(126, 90, 220, 0.4);
        }

        .bm-back-widget svg {
            width: 16px;
            height: 16px;
            transition: transform 0.3s;
        }

        .bm-back-widget:hover svg {
            transform: translateX(-4px);
        }
    `;
    document.head.appendChild(style);

    const backBtn = document.createElement('a');
    // 跳转回上一级或根目录 (假设子项目在 /projects/some-project/)
    backBtn.href = '/'; 
    backBtn.className = 'bm-back-widget';
    backBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        BM-Tools
    `;
    document.body.appendChild(backBtn);
});
