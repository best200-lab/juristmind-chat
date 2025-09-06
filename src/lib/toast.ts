export const showToast = (msg: string, duration = 3000) => {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #fff;
    padding: 12px 24px;
    border-radius: 6px;
    opacity: 0;
    transition: opacity .3s;
    z-index: 9999;
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => (toast.style.opacity = '1'));
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};