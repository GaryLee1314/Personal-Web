import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Visualizer from './components/Visualizer';
import Quiz from './components/Quiz';
import Result from './components/Result';

type ViewState = 'start' | 'quiz' | 'result';

function App() {
  const [view, setView] = useState<ViewState>('start');
  const [intensity, setIntensity] = useState(0);
  const [hueShift, setHueShift] = useState(0);
  const [finalMBTI, setFinalMBTI] = useState<Record<string, number>>({});

  const handleStart = () => {
    setView('quiz');
    setIntensity(0.2);
  };

  const handleAnswer = (newIntensity: number, newHue: number) => {
    setIntensity(newIntensity);
    setHueShift(newHue);
  };

  const handleComplete = (mbti: any) => {
    setFinalMBTI(mbti);
    setView('result');
    setIntensity(0);
    setHueShift(200); // 结果页的特殊色彩
  };

  const handleRestart = () => {
    setView('start');
    setIntensity(0);
    setHueShift(0);
  };

  return (
    <div className="min-h-screen bg-black text-white relative font-sans overflow-hidden flex flex-col justify-center items-center">

      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#110e20] to-black"></div>
      
      {/* 3D 粒子背景 */}
      <Visualizer intensity={intensity} hueShift={hueShift} />
      
      {/* 顶层 UI */}
      <AnimatePresence mode="wait">
        {view === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
            className="z-10 text-center px-4 w-full max-w-2xl mt-12"
          >
            <div className="inline-block px-3 py-1 mb-6 rounded-full border border-brand-500/30 bg-brand-500/10 backdrop-blur-md text-brand-400 text-xs md:text-sm font-mono tracking-widest uppercase shadow-[0_0_15px_rgba(126,90,220,0.3)]">
              [ 灵魂棱镜矩阵 已激活 ]
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-black mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-200 to-brand-500 drop-shadow-lg">
              灵魂棱镜
            </h1>
            <p className="text-lg md:text-xl text-gray-400 font-light mb-12 leading-relaxed">
              灵魂棱镜协议：开始探索你的人格维度。<br />通过情景共振，我们将为您生成专属的量子化人格图谱。
            </p>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="group relative px-10 py-4 bg-brand-500 hover:bg-brand-400 text-white rounded-full font-bold text-lg overflow-hidden transition-colors shadow-[0_0_30px_rgba(126,90,220,0.4)]"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10 tracking-widest">启动协议</span>
            </motion.button>
          </motion.div>
        )}

        {view === 'quiz' && (
          <motion.div 
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 w-full flex justify-center items-center h-full"
          >
            <Quiz onComplete={handleComplete} onAnswer={handleAnswer} />
          </motion.div>
        )}

        {view === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 w-full flex justify-center items-center h-full"
          >
            <Result mbti={finalMBTI} onRestart={handleRestart} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
