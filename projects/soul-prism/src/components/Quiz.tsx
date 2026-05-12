import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MBTIDimension } from '../engine';

export interface Option {
  id: string;
  text: string;
  mbtiWeight: Partial<Record<MBTIDimension, number>>;
}

export interface Question {
  id: string;
  scene: string;
  description: string;
  options: Option[];
}

interface QuizProps {
  onComplete: (mbti: any) => void;
  onAnswer: (intensity: number, hueShift: number) => void;
}

const Quiz: React.FC<QuizProps> = ({ onComplete, onAnswer }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accumulatedMBTI, setAccumulatedMBTI] = useState({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    // 模拟外网权限拉取题库数据
    fetch('/projects/soul-prism/api/jungian-16-dataset.json')
      .then(res => res.json())
      .then(data => {
        setQuestions(data);
        // 为了营造“黑客接入”体验，故意延迟几百毫秒
        setTimeout(() => setLoading(false), 800);
      })
      .catch(err => {
        console.error('Failed to load dataset API', err);
        setLoading(false);
      });
  }, []);

  const handleOptionSelect = (option: Option) => {
    if (isAnswering) return;
    setIsAnswering(true);

    const EVS = (option.mbtiWeight.E || 0) + (option.mbtiWeight.N || 0);
    const IVS = (option.mbtiWeight.I || 0) + (option.mbtiWeight.S || 0);
    
    // intensity 影响旋转速度和扩散，hueShift 改变粒子颜色氛围
    onAnswer(EVS > IVS ? 0.8 : 0.2, (currentIndex * 30) % 360);
    
    const newMbti = { ...accumulatedMBTI };
    for (const [key, val] of Object.entries(option.mbtiWeight)) {
        if(val) newMbti[key as keyof typeof newMbti] += val;
    }
    setAccumulatedMBTI(newMbti);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(curr => curr + 1);
        setIsAnswering(false);
      } else {
        onComplete(newMbti); 
      }
    }, 600);
  };

  if (loading) {
    return (
      <div className="z-10 flex flex-col items-center justify-center min-h-[60vh] text-brand-400 font-mono">
        <div className="w-16 h-16 border-4 border-brand-500/30 border-t-brand-400 rounded-full animate-spin mb-6"></div>
        <div className="animate-pulse tracking-widest text-sm">[ 正在同步矩阵档案 ... ]</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="z-10 text-red-400">Error: API Dataset Matrix Failed.</div>;
  }

  const question = questions[currentIndex];
  // 进度指示器
  const progressPercent = ((currentIndex) / questions.length) * 100;

  return (
    <div className="z-10 w-full max-w-3xl px-6 flex flex-col justify-center min-h-[60vh]">
      
      {/* 霓虹进度条 */}
      <div className="mb-8 w-full max-w-sm mx-auto h-1.5 bg-white/5 rounded-full overflow-hidden shadow-[0_0_10px_rgba(126,90,220,0.1)]">
        <motion.div 
          className="h-full bg-brand-500 rounded-full shadow-[0_0_10px_rgba(126,90,220,0.8)]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="mb-4 text-center text-brand-400 font-mono text-xs tracking-widest uppercase opacity-80">
        数据节点: {currentIndex + 1} / {questions.length} <br/> 
        <span className="text-gray-500 opacity-50 mt-1 inline-block">[ {question.scene} ]</span>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4 }}
          className="bg-black/30 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden"
        >
          {/* 微光特效 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-brand-500/50 blur-md"></div>

          <h2 className="text-xl md:text-2xl font-sans leading-relaxed mb-10 text-white/90 font-light text-center">
            {question.description}
          </h2>
          
          <div className="flex flex-col gap-4">
            {question.options.map((opt, i) => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.01, backgroundColor: 'rgba(126,90,220,0.1)' }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleOptionSelect(opt)}
                className="text-left p-5 rounded-2xl border border-white/5 bg-white/5 hover:border-brand-500/40 text-gray-300 transition-colors shadow-sm"
              >
                <div className="flex items-start">
                  <span className="text-brand-500 font-mono mr-4 opacity-50 mt-0.5 text-sm">0{i+1}</span>
                  <span className="text-base leading-relaxed font-light">{opt.text}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Quiz;
