import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, useTexture, Sky } from '@react-three/drei';
import * as THREE from 'three';

// --- CONSTANTS ---
const SPAWN_Z = -120;
const DESPAWN_Z = 15;
const BOUNDARY = 10;
const BASE_SPEED = 25;

// --- 3D ENVIRONMENT ---

const Ground = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
    <planeGeometry args={[100, 300]} />
    <meshStandardMaterial color="#f8fbfd" roughness={0.8} />
    {/* Simple grid lines for speed illusion */}
    <gridHelper args={[100, 20, 0xe0e0e0, 0xf0f0f0]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]} />
  </mesh>
);

const ProceduralTree = ({ position, scale = 1, variation = 0 }) => (
  <group position={position} scale={scale}>
    {variation === 0 ? (
      // Tall Pine
      <>
        <mesh position={[0, 2, 0]} castShadow>
          <coneGeometry args={[1, 4, 8]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.9} />
        </mesh>
        <mesh position={[0, 4, 0]} castShadow>
          <coneGeometry args={[0.8, 3, 8]} />
          <meshStandardMaterial color="#3a7033" roughness={0.9} />
        </mesh>
      </>
    ) : (
      // Bushy Snowy Tree
      <>
        <mesh position={[0, 1.5, 0]} castShadow>
          <coneGeometry args={[1.5, 3, 7]} />
          <meshStandardMaterial color="#228b22" roughness={1} />
        </mesh>
        <mesh position={[0, 2.5, 0]} castShadow>
          <coneGeometry args={[1.2, 2, 7]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
      </>
    )}
    <mesh position={[0, 0.5, 0]} castShadow>
      <cylinderGeometry args={[0.3, 0.4, 1]} />
      <meshStandardMaterial color="#5c4033" />
    </mesh>
  </group>
);

const PremiumPresent = ({ position, color, rotationY }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Main Box */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {/* Ribbons */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.25, 1.25, 0.2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.2, 1.25, 1.25]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Bow */}
      <mesh position={[0, 1.3, 0]} castShadow rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[0.2, 0.05, 16, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

const AnimatedSkier = ({ positionX, faceState, speed, isGameOver }) => {
  const group = useRef();
  const leftArm = useRef();
  const rightArm = useRef();
  
  const textures = useTexture({
    normal: './faces/face_normal.png',
    jump: './faces/face_jump.png',
    dodge: './faces/face_dodge.png',
    crash: './faces/face_crash.png'
  });

  Object.values(textures).forEach(tex => tex.colorSpace = THREE.SRGBColorSpace);

  useFrame((state, delta) => {
    if (!group.current) return;
    
    // Smooth physics X movement interpolation
    group.current.position.x = positionX.current;
    
    // Tilt based on horizontal velocity (calculated by checking change in X)
    const tilt = (positionX.current - group.current.position.x) * 2;
    group.current.rotation.z = -tilt * 0.1;

    if (isGameOver) {
      // Crash wipeout animation
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -Math.PI / 2, delta * 5);
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -0.2, delta * 5);
    } else {
      group.current.rotation.x = 0;
      // Bounce
      group.current.position.y = Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.1;
      
      // Arm pumping animation based on speed
      const pump = Math.sin(state.clock.elapsedTime * speed * 0.4);
      if (leftArm.current && rightArm.current) {
        leftArm.current.rotation.x = Math.PI / 4 + pump * 0.5;
        rightArm.current.rotation.x = Math.PI / 4 - pump * 0.5;
      }
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Torso */}
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.8, 4, 16]} />
        <meshStandardMaterial color="#ff1493" roughness={0.6} />
      </mesh>
      
      {/* Arms & Poles */}
      <group position={[-0.4, 1.4, 0]} ref={leftArm}>
        <mesh position={[0, -0.4, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.6]} />
          <meshStandardMaterial color="#ff69b4" />
        </mesh>
        <mesh position={[0, -1, 0.2]} rotation={[-Math.PI/4, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.5]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>

      <group position={[0.4, 1.4, 0]} ref={rightArm}>
        <mesh position={[0, -0.4, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.6]} />
          <meshStandardMaterial color="#ff69b4" />
        </mesh>
        <mesh position={[0, -1, 0.2]} rotation={[-Math.PI/4, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.5]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
      
      {/* Bobblehead Face */}
      <Billboard position={[0, 2.3, 0.1]} args={[2.5, 2.5]}>
        <mesh>
          <circleGeometry args={[1.2, 32]} />
          <meshBasicMaterial map={textures[faceState]} />
        </mesh>
      </Billboard>

      {/* Skis */}
      <mesh position={[-0.2, 0.05, 0]} castShadow>
        <boxGeometry args={[0.12, 0.05, 2.5]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.2, 0.05, 0]} castShadow>
        <boxGeometry args={[0.12, 0.05, 2.5]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
};

const WorldManager = ({ skierX, setFaceState, addScore, isGameOver, setIsGameOver, currentSpeed }) => {
  const [items, setItems] = useState([]);
  const worldGroup = useRef();
  const worldDistance = useRef(0);
  
  // Track snow trails
  const trailMarks = useRef([]);

  // Initialize environment
  useEffect(() => {
    const initialItems = [];
    for (let i = 0; i < 20; i++) {
      initialItems.push({
        id: Math.random(),
        type: 'tree',
        x: (Math.random() * BOUNDARY * 2) - BOUNDARY,
        z: -(Math.random() * 100),
        scale: 0.8 + Math.random() * 0.7,
        variation: Math.random() > 0.5 ? 0 : 1,
        collected: false
      });
    }
    setItems(initialItems);
  }, []);

  useFrame((state, delta) => {
    if (isGameOver) return;
    
    let hit = false;
    let grabbed = false;
    
    // Physics-based hills
    worldDistance.current += currentSpeed.current * delta;
    const slopeAngle = Math.sin(worldDistance.current * 0.02) * 0.15;
    
    if (worldGroup.current) {
      // Rotate world to simulate hills
      worldGroup.current.rotation.x = THREE.MathUtils.lerp(worldGroup.current.rotation.x, slopeAngle, delta * 2);
    }
    
    // Adjust speed based on slope (downhill = faster)
    const targetSpeed = BASE_SPEED + (slopeAngle * 100);
    currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, targetSpeed, delta);

    // Trail marks logic (leave a mark every few frames based on movement)
    if (Math.random() > 0.5) {
      trailMarks.current.push({ x: skierX.current, z: 0, life: 1 });
    }

    setItems((prev) => {
      const newItems = [];
      for (let item of prev) {
        item.z += currentSpeed.current * delta;
        
        // Collision Detection
        if (item.z > -0.5 && item.z < 0.5) {
          const dx = Math.abs(item.x - skierX.current);
          if (item.type === 'tree' && dx < 1.2) {
            hit = true;
          } else if (item.type === 'present' && !item.collected && dx < 1.5) {
            grabbed = true;
            item.collected = true;
          }
        }
        
        if (item.z < DESPAWN_Z && !item.collected) {
          newItems.push(item);
        }
      }
      
      // Spawn logic
      if (newItems.length < 25) {
        const type = Math.random() > 0.15 ? 'tree' : 'present';
        newItems.push({ 
          id: Math.random(), 
          type, 
          x: (Math.random() * BOUNDARY * 2) - BOUNDARY, 
          z: SPAWN_Z, 
          scale: 0.8 + Math.random() * 0.7,
          variation: Math.random() > 0.5 ? 0 : 1,
          color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'][Math.floor(Math.random() * 4)],
          rotY: Math.random() * Math.PI,
          collected: false
        });
      }
      return newItems;
    });

    if (hit) {
      setIsGameOver(true);
      setFaceState('crash');
    } else if (grabbed) {
      setFaceState('jump');
      addScore();
    }
  });

  return (
    <group ref={worldGroup}>
      <Ground />
      {items.map(item => (
        item.type === 'tree' ? 
          <ProceduralTree key={item.id} position={[item.x, 0, item.z]} scale={item.scale} variation={item.variation} /> :
          <PremiumPresent key={item.id} position={[item.x, 0, item.z]} color={item.color} rotationY={item.rotY} />
      ))}
    </group>
  );
};

export default function SkiGame() {
  const skierX = useRef(0);
  const skierVX = useRef(0);
  const currentSpeed = useRef(BASE_SPEED);
  
  const [faceState, setFaceState] = useState('normal');
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  
  // Controls
  const keys = useRef({ left: false, right: false });
  const touchState = useRef(0); // -1 left, 1 right, 0 none
  
  const faceTimer = useRef(null);
  const handleSetFace = (state) => {
    setFaceState(state);
    if (faceTimer.current) clearTimeout(faceTimer.current);
    if (state !== 'normal' && state !== 'crash') {
      faceTimer.current = setTimeout(() => setFaceState('normal'), 800);
    }
  };

  useEffect(() => {
    const handleKD = (e) => {
      if (e.key === 'ArrowLeft') keys.current.left = true;
      if (e.key === 'ArrowRight') keys.current.right = true;
    };
    const handleKU = (e) => {
      if (e.key === 'ArrowLeft') keys.current.left = false;
      if (e.key === 'ArrowRight') keys.current.right = false;
    };
    window.addEventListener('keydown', handleKD);
    window.addEventListener('keyup', handleKU);
    return () => {
      window.removeEventListener('keydown', handleKD);
      window.removeEventListener('keyup', handleKU);
    };
  }, []);

  // Physics Loop
  useEffect(() => {
    let animationFrame;
    const updatePhysics = () => {
      if (!isGameOver) {
        let ax = 0;
        if (keys.current.left || touchState.current === -1) ax -= 0.8;
        if (keys.current.right || touchState.current === 1) ax += 0.8;
        
        skierVX.current += ax;
        skierVX.current *= 0.85; // Friction
        
        skierX.current += skierVX.current;
        skierX.current = Math.max(-BOUNDARY + 1, Math.min(BOUNDARY - 1, skierX.current));
        
        if (Math.abs(skierVX.current) > 1.5 && faceState === 'normal') {
          handleSetFace('dodge');
        }
      }
      animationFrame = requestAnimationFrame(updatePhysics);
    };
    updatePhysics();
    return () => cancelAnimationFrame(animationFrame);
  }, [isGameOver, faceState]);

  const restartGame = () => {
    setIsGameOver(false);
    setScore(0);
    setFaceState('normal');
    skierX.current = 0;
    skierVX.current = 0;
    currentSpeed.current = BASE_SPEED;
    // World is reset within the loop naturally by moving forward
  };

  return (
    <div className="fixed inset-0 z-[600] bg-sky-300 overflow-hidden select-none touch-none">
      
      {/* HUD UI */}
      <div className="absolute top-4 left-4 z-10 font-sans">
        <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
          🎁 {score}
        </h1>
        <p className="text-white text-lg font-bold drop-shadow-md mt-2">
          Use Arrow Keys or Buttons to Steer!
        </p>
      </div>

      {/* Lada Cam */}
      <div className="absolute top-4 right-4 z-10 w-28 h-28 md:w-48 md:h-48 rounded-full border-4 border-pink-500 shadow-2xl overflow-hidden bg-zinc-800">
        <div className="absolute bottom-0 w-full text-center bg-pink-500 text-white text-xs font-bold py-1 z-20">LADA CAM</div>
        <img 
          src={`./faces/face_${faceState}.png`} 
          alt="Lada Cam"
          className="w-full h-full object-cover transition-all duration-100"
          style={{ transform: faceState === 'crash' ? 'scale(1.3) rotate(-10deg)' : 'scale(1)' }}
        />
      </div>

      {/* Wipeout Screen */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
          <h2 className="text-6xl font-black text-white mb-8 drop-shadow-lg rotate-[-5deg]">💥 WIPEOUT! 💥</h2>
          <p className="text-2xl text-pink-300 font-bold mb-8">You collected {score} presents!</p>
          <button 
            onClick={restartGame}
            className="px-10 py-5 bg-pink-500 hover:bg-pink-400 text-white text-2xl font-black rounded-full shadow-[0_0_30px_rgba(236,72,153,0.8)] border-4 border-white transition hover:scale-110 active:scale-95"
          >
            Play Again ⛷️
          </button>
        </div>
      )}

      {/* Mobile Controls Overlay */}
      <div className="absolute bottom-10 left-0 right-0 px-8 flex justify-between z-40 md:hidden pointer-events-none">
        <button 
          onPointerDown={() => touchState.current = -1}
          onPointerUp={() => touchState.current = 0}
          onPointerLeave={() => touchState.current = 0}
          className="w-24 h-24 bg-white/20 border-2 border-white/50 rounded-full flex items-center justify-center backdrop-blur-md active:bg-white/40 pointer-events-auto"
        >
          <span className="text-4xl text-white font-black">←</span>
        </button>
        <button 
          onPointerDown={() => touchState.current = 1}
          onPointerUp={() => touchState.current = 0}
          onPointerLeave={() => touchState.current = 0}
          className="w-24 h-24 bg-white/20 border-2 border-white/50 rounded-full flex items-center justify-center backdrop-blur-md active:bg-white/40 pointer-events-auto"
        >
          <span className="text-4xl text-white font-black">→</span>
        </button>
      </div>

      {/* 3D Scene */}
      <Canvas shadows camera={{ position: [0, 6, 15], fov: 60 }}>
        <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
        <ambientLight intensity={0.6} />
        <directionalLight 
          castShadow 
          position={[10, 30, 10]} 
          intensity={1.2} 
          shadow-mapSize={[2048, 2048]}
        />
        <fog attach="fog" args={['#87CEEB', 20, 100]} />
        
        <React.Suspense fallback={null}>
          <AnimatedSkier positionX={skierX} faceState={faceState} speed={currentSpeed.current} isGameOver={isGameOver} />
          <WorldManager 
            skierX={skierX} 
            setFaceState={handleSetFace} 
            addScore={() => setScore(s => s + 1)} 
            isGameOver={isGameOver} 
            setIsGameOver={setIsGameOver}
            currentSpeed={currentSpeed}
          />
        </React.Suspense>
      </Canvas>
    </div>
  );
}
