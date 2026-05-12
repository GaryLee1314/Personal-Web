import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface VisualizerProps {
  intensity: number;
  hueShift: number;
}

const ParticleCloud: React.FC<{ intensity: number; hueShift: number }> = ({ intensity, hueShift }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 2000;
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array(particleCount * 3);
    const c = new Float32Array(particleCount * 3);
    const color = new THREE.Color();
    
    for (let i = 0; i < particleCount; i++) {
      const r = 2 + Math.random() * 2;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      p[i * 3 + 2] = r * Math.cos(phi);
      
      color.setHSL(0.7 - Math.random() * 0.2, 0.8, 0.5);
      c[i * 3] = color.r;
      c[i * 3 + 1] = color.g;
      c[i * 3 + 2] = color.b;
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return geo;
  }, [particleCount]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * (0.05 + intensity * 0.1);
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.02;
    }
    
    if (pointsRef.current && pointsRef.current.material) {
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      const baseColor = new THREE.Color().setHSL((250 + hueShift) / 360, 0.8, 0.6);
      mat.color.lerp(baseColor, 0.05);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const Visualizer: React.FC<VisualizerProps> = ({ intensity, hueShift }) => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <color attach="background" args={['#050508']} />
        <ambientLight intensity={0.5} />
        <ParticleCloud intensity={intensity} hueShift={hueShift} />
      </Canvas>
    </div>
  );
};

export default Visualizer;
