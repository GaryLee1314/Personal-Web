import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Download, RefreshCw } from 'lucide-react';

interface ResultProps {
  mbti: Record<string, number>;
  onRestart: () => void;
}

const Result: React.FC<ResultProps> = ({ mbti, onRestart }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 简易计算最终 MBTI 字母
  const type = [
    mbti.E >= mbti.I ? 'E' : 'I',
    mbti.N >= mbti.S ? 'N' : 'S',
    mbti.T >= mbti.F ? 'T' : 'F',
    mbti.J >= mbti.P ? 'J' : 'P'
  ].join('');

  const typeDesc: Record<string, string> = {
    'INTJ': '战略家',
    'INTP': '逻辑学家',
    'ENTJ': '指挥官',
    'ENTP': '辩论家',
    'INFJ': '提倡者',
    'INFP': '调停者',
    'ENFJ': '主人公',
    'ENFP': '竞选者',
    'ISTJ': '物流师',
    'ISFJ': '守卫者',
    'ESTJ': '总经理',
    'ESFJ': '执政官',
    'ISTP': '鉴赏家',
    'ISFP': '探险家',
    'ESTP': '企业家',
    'ESFP': '表演者',
  };

  const name = typeDesc[type] || '探索者 (Explorer)';

  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    
    // 给一点延迟让UI更新
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: '#0a0a0e',
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `Soul-Prism-Identity-${type}.png`;
      link.href = dataUrl;
      
      // 必须将链接加入 DOM 中再模拟点击，否则部分浏览器会拦截下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to generate image', e);
      alert('图谱生成失败，请稍后重试');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="z-10 w-full max-w-lg px-6 flex flex-col items-center py-10 max-h-screen overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className="w-full relative"
      >
        {/* 这里是被截图的卡片主体 */}
        <div 
          ref={cardRef} 
          className="bg-gradient-to-br from-[#121020] to-[#08080f] border border-white/10 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(126,90,220,0.2)] relative overflow-hidden"
        >
          {/* 装饰元素 */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-500/20 blur-[80px] rounded-full"></div>
          
          <div className="flex justify-between items-start mb-12 relative z-10">
            <div>
              <div className="font-mono text-xs text-brand-400 tracking-widest uppercase mb-2">[ 灵魂标识 ]</div>
              <div className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-400">
                {type}
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-brand-500 flex items-center justify-center font-mono font-bold text-brand-400 shadow-[0_0_15px_rgba(126,90,220,0.5)]">
              {type[0]}
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-8 relative z-10">{name}</h2>
          
          {/* 雷达图/属性条的简易替代 */}
          <div className="space-y-4 mb-8 relative z-10 font-mono text-sm">
            <div className="flex justify-between bg-black/40 p-3 rounded-lg border border-white/5">
              <span className="text-gray-400">外向 (E) / 内向 (I)</span>
              <span className="text-brand-300 font-bold">{mbti.E} : {mbti.I}</span>
            </div>
            <div className="flex justify-between bg-black/40 p-3 rounded-lg border border-white/5">
              <span className="text-gray-400">实感 (S) / 直觉 (N)</span>
              <span className="text-brand-300 font-bold">{mbti.S} : {mbti.N}</span>
            </div>
            <div className="flex justify-between bg-black/40 p-3 rounded-lg border border-white/5">
              <span className="text-gray-400">思考 (T) / 情感 (F)</span>
              <span className="text-brand-300 font-bold">{mbti.T} : {mbti.F}</span>
            </div>
            <div className="flex justify-between bg-black/40 p-3 rounded-lg border border-white/5">
              <span className="text-gray-400">判断 (J) / 感知 (P)</span>
              <span className="text-brand-300 font-bold">{mbti.J} : {mbti.P}</span>
            </div>
          </div>
          
          <div className="pt-6 border-t border-white/10 flex justify-between items-center text-xs text-gray-500 font-mono relative z-10">
            <span>灵魂棱镜协议编号</span>
            <span>NO. {Math.floor(Math.random()*899999 + 100000)}</span>
          </div>
        </div>
      </motion.div>
      
      {/* 操作按钮区 (不在截图中) */}
      <div className="flex gap-4 mt-8">
        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          className={`flex items-center gap-2 px-6 py-3 transition-colors text-white rounded-full font-medium ${isDownloading ? 'bg-brand-500/50 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-400'}`}
        >
          {isDownloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
              <span>生成中...</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>保存我的图谱</span>
            </>
          )}
        </button>
        <button 
          onClick={onRestart}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 transition-colors text-white rounded-full font-medium"
        >
          <RefreshCw size={18} />
          <span>重新检测</span>
        </button>
      </div>
    </div>
  );
}

export default Result;
