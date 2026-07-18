import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { playASMRClick } from '../utils/audio';

const NUM_ROWS = 30;
const NUM_COLS = 50;
const SPACING = 1.0;

const PALETTE = {
  GOLD: new THREE.Color('#fbbf24'),
  PINK: new THREE.Color('#ec4899'),
  PURPLE: new THREE.Color('#a855f7'),
  BG: new THREE.Color('#0a0a1a'),
  EMPTY: new THREE.Color('#1e293b'),
};

const DiamondGrid = ({ sceneIndex, onGameComplete }) => {
  const meshRef = useRef();
  const [selectedColor, setSelectedColor] = useState(PALETTE.PINK);
  const [paintedCount, setPaintedCount] = useState(0);

  const gridData = useMemo(() => {
    const data = [];
    for (let r = 0; r < NUM_ROWS; r++) {
      for (let c = 0; c < NUM_COLS; c++) {
        const x = (c - NUM_COLS / 2) * SPACING;
        const y = -(r - NUM_ROWS / 2) * SPACING;
        
        // Mathematical Heart
        const nx = x * 0.18;
        const ny = y * 0.18;
        const isHeart = Math.pow(nx*nx + ny*ny - 1, 3) - nx*nx * ny*ny*ny <= 0;
        
        let color = PALETTE.BG;
        let targetColor = PALETTE.BG;

        if (isHeart) {
          color = PALETTE.EMPTY; // Unpainted initially
          // Assign a random target color for the heart (for auto-complete)
          const rand = Math.random();
          targetColor = rand > 0.6 ? PALETTE.PINK : (rand > 0.3 ? PALETTE.GOLD : PALETTE.PURPLE);
        } else {
          if (Math.random() > 0.96) {
            color = new THREE.Color('#ffffff'); // star
          } else {
            color = new THREE.Color().setHSL(0.65, 0.4, 0.05 + Math.random() * 0.05); // varied bg
          }
        }

        data.push({ x, y, z: 0, color, targetColor, isHeart, painted: false });
      }
    }
    return data;
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    const matrix = new THREE.Matrix4();
    gridData.forEach((d, i) => {
      matrix.setPosition(d.x, d.y, d.z);
      meshRef.current.setMatrixAt(i, matrix);
      meshRef.current.setColorAt(i, d.color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
  }, [gridData]);

  // Handle scene 4 auto-complete
  useEffect(() => {
    if (!meshRef.current) return;
    if (sceneIndex === 4) {
      gridData.forEach((d, i) => {
        if (d.isHeart && !d.painted) {
          meshRef.current.setColorAt(i, d.targetColor);
        }
      });
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [sceneIndex, gridData]);

  const handleClick = (e) => {
    if (sceneIndex !== 3) return;
    e.stopPropagation();
    
    const id = e.instanceId;
    if (id === undefined) return;
    
    const d = gridData[id];
    if (d.isHeart && !d.painted) {
      d.painted = true;
      meshRef.current.setColorAt(id, selectedColor);
      meshRef.current.instanceColor.needsUpdate = true;
      playASMRClick();
      
      const count = paintedCount + 1;
      setPaintedCount(count);
      
      // Complete game after 12 clicks to keep the flow moving
      if (count >= 12) {
        onGameComplete();
      }
    }
  };

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Gentle bobbing
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
    
    // In scene 4, recede the canvas to make room for the letter
    if (sceneIndex === 4) {
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, -15, 0.03);
    } else if (sceneIndex === 3) {
      // Zoom in slightly for the game
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, 8, 0.05);
    }
  });

  return (
    <group>
      <instancedMesh 
        ref={meshRef} 
        args={[null, null, NUM_ROWS * NUM_COLS]} 
        onPointerDown={handleClick}
        onPointerMove={(e) => {
          // Optional: change cursor if hovering over paintable area
          if (sceneIndex === 3) {
            const id = e.instanceId;
            if (id !== undefined && gridData[id].isHeart && !gridData[id].painted) {
              document.body.style.cursor = 'crosshair';
            } else {
              document.body.style.cursor = 'default';
            }
          }
        }}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <octahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial roughness={0.1} metalness={0.8} />
      </instancedMesh>

      {sceneIndex === 3 && (
        <Html position={[0, -12, 5]} center>
          <div className="flex gap-4 p-4 bg-black/60 rounded-full backdrop-blur-xl border border-white/20 pointer-events-auto shadow-2xl">
            {Object.entries({ Pink: PALETTE.PINK, Gold: PALETTE.GOLD, Purple: PALETTE.PURPLE }).map(([name, colorObj]) => (
              <button
                key={name}
                onClick={() => setSelectedColor(colorObj)}
                className={`w-12 h-12 rounded-full transition-transform hover:scale-110 shadow-lg ${selectedColor === colorObj ? 'scale-125 border-4 border-white' : ''}`}
                style={{ backgroundColor: '#' + colorObj.getHexString() }}
              />
            ))}
          </div>
        </Html>
      )}
    </group>
  );
};

const DiamondScene = ({ sceneIndex, onGameComplete }) => {
  return (
    <Canvas camera={{ position: [0, 0, 25], fov: 45 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 10]} intensity={1.5} />
      <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />
      <Environment preset="city" />
      
      <Sparkles count={200} scale={40} size={2} speed={0.4} opacity={0.5} color="#fbbf24" />
      
      <DiamondGrid sceneIndex={sceneIndex} onGameComplete={onGameComplete} />
    </Canvas>
  );
};

export default DiamondScene;
