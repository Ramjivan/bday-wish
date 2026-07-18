import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, useTexture, Sky, Html } from '@react-three/drei';
import * as THREE from 'three';

// --- GAME LOGIC CONSTANTS ---
const SPEED = 25;
const LANE_WIDTH = 3.5;
const BOUNDARY = 7;
const SPAWN_Z = -100;
const DESPAWN_Z = 10;

// --- 3D COMPONENTS ---

const Ground = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
    <planeGeometry args={[150, 300]} />
    <meshStandardMaterial color="#f0f8ff" roughness={1} />
  </mesh>
);

const Tree = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 1.5, 0]} castShadow>
      <coneGeometry args={[1.2, 4, 8]} />
      <meshStandardMaterial color="#228b22" />
    </mesh>
    <mesh position={[0, 0, 0]} castShadow>
      <cylinderGeometry args={[0.3, 0.3, 1]} />
      <meshStandardMaterial color="#8b4513" />
    </mesh>
  </group>
);

const Present = ({ position, color }) => {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y += 0.02;
  });
  return (
    <group position={position}>
      <mesh ref={ref} position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

const LadaSkier = ({ positionX, faceState }) => {
  const group = useRef();
  
  // Load the 4 face textures
  const textures = useTexture({
    normal: './faces/face_normal.png',
    jump: './faces/face_jump.png',
    dodge: './faces/face_dodge.png',
    crash: './faces/face_crash.png'
  });

  // Ensure textures are loaded nicely
  Object.values(textures).forEach(tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
  });

  useFrame((state, delta) => {
    // Smoothly lerp to the target X position
    if (group.current) {
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, positionX.current, delta * 12);
      
      // Add a little skiing bounce
      group.current.position.y = Math.sin(state.clock.elapsedTime * 15) * 0.15;
      
      // Tilt based on movement
      const tilt = (positionX.current - group.current.position.x) * 0.15;
      group.current.rotation.z = -tilt;
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Skier Body (Pink Snowsuit) */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.5, 1.2, 4, 8]} />
        <meshStandardMaterial color="#ff69b4" roughness={0.6} />
      </mesh>
      
      {/* The Bobblehead Face! */}
      <Billboard position={[0, 2.5, 0]} args={[2.5, 2.5]}>
        <mesh>
          <circleGeometry args={[1.2, 32]} />
          <meshBasicMaterial map={textures[faceState]} />
        </mesh>
      </Billboard>

      {/* Skis */}
      <mesh position={[-0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.15, 0.05, 2.5]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.15, 0.05, 2.5]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
};

const Obstacles = ({ items, setItems, skierX, setFaceState, addScore }) => {
  useFrame((state, delta) => {
    let hit = false;
    let grabbed = false;
    
    setItems((prev) => {
      const newItems = [];
      for (let item of prev) {
        // Move towards camera
        item.z += SPEED * delta;
        
        // Collision Detection
        if (item.z > -1 && item.z < 1.5) {
          const dx = Math.abs(item.x - skierX.current);
          if (dx < 1.5) {
            if (item.type === 'tree') {
              hit = true;
            } else if (item.type === 'present' && !item.collected) {
              grabbed = true;
              item.collected = true;
            }
          }
        }
        
        // Keep if not despawned and not collected
        if (item.z < DESPAWN_Z && !item.collected) {
          newItems.push(item);
        }
      }
      
      // Spawn new items
      if (newItems.length === 0 || newItems[newItems.length - 1].z > SPAWN_Z + 15) {
        const type = Math.random() > 0.25 ? 'tree' : 'present';
        const lane = Math.floor(Math.random() * 5) - 2; // -2, -1, 0, 1, 2
        const x = lane * LANE_WIDTH;
        newItems.push({ 
          id: Math.random(), 
          type, 
          x, 
          z: SPAWN_Z, 
          color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'][Math.floor(Math.random() * 4)],
          collected: false
        });
      }
      
      return newItems;
    });

    if (hit) setFaceState('crash');
    else if (grabbed) {
      setFaceState('jump');
      addScore();
    }
  });

  return (
    <>
      {items.map(item => (
        item.type === 'tree' ? 
          <Tree key={item.id} position={[item.x, 0, item.z]} /> :
          <Present key={item.id} position={[item.x, 0, item.z]} color={item.color} />
      ))}
    </>
  );
};

export default function SkiGame() {
  const skierX = useRef(0);
  const [faceState, setFaceState] = useState('normal');
  const [score, setScore] = useState(0);
  const [items, setItems] = useState([{ id: 1, type: 'tree', x: LANE_WIDTH, z: -40, collected: false }]);
  
  // Face reset timer
  const faceTimer = useRef(null);
  
  const handleSetFace = (state) => {
    setFaceState(state);
    if (faceTimer.current) clearTimeout(faceTimer.current);
    if (state !== 'normal') {
      faceTimer.current = setTimeout(() => {
        setFaceState('normal');
      }, state === 'crash' ? 1500 : 800);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      skierX.current = Math.max(-BOUNDARY, skierX.current - LANE_WIDTH);
      if (faceState === 'normal') handleSetFace('dodge');
    }
    if (e.key === 'ArrowRight') {
      skierX.current = Math.min(BOUNDARY, skierX.current + LANE_WIDTH);
      if (faceState === 'normal') handleSetFace('dodge');
    }
  };

  const handleTouch = (e) => {
    const touchX = e.touches[0].clientX;
    const mid = window.innerWidth / 2;
    if (touchX < mid) {
      skierX.current = Math.max(-BOUNDARY, skierX.current - LANE_WIDTH);
      if (faceState === 'normal') handleSetFace('dodge');
    } else {
      skierX.current = Math.min(BOUNDARY, skierX.current + LANE_WIDTH);
      if (faceState === 'normal') handleSetFace('dodge');
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouch);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, [faceState]);

  return (
    <div className="fixed inset-0 z-[600] bg-sky-200 overflow-hidden select-none touch-none">
      
      {/* 2D UI OVERLAY */}
      <div className="absolute top-4 left-4 z-10 font-sans">
        <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
          PRESENTS: {score}
        </h1>
        <p className="text-white text-lg font-bold drop-shadow-md mt-2 max-w-[200px] md:max-w-md">
          Use Arrow Keys or Tap Left/Right to Ski!
        </p>
      </div>

      {/* STREAMER FACE CAM (Picture-in-Picture) */}
      <div className="absolute top-4 right-4 z-10 w-24 h-24 md:w-40 md:h-40 rounded-full border-4 border-pink-500 shadow-2xl overflow-hidden bg-zinc-800">
        <div className="absolute bottom-0 w-full text-center bg-pink-500 text-white text-xs font-bold py-1 z-20">LADA CAM</div>
        <img 
          src={`./faces/face_${faceState}.png`} 
          alt="Lada Cam"
          className="w-full h-full object-cover transition-all duration-100"
          style={{ transform: faceState === 'crash' ? 'scale(1.2) rotate(-5deg)' : 'scale(1)' }}
        />
      </div>

      {/* THE 3D GAME */}
      <Canvas shadows camera={{ position: [0, 5, 12], fov: 60 }}>
        <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
        <ambientLight intensity={0.5} />
        <directionalLight 
          castShadow 
          position={[10, 20, 10]} 
          intensity={1.5} 
          shadow-mapSize={[1024, 1024]}
        />
        
        <Ground />
        
        <React.Suspense fallback={null}>
          <LadaSkier positionX={skierX} faceState={faceState} />
        </React.Suspense>
        
        <Obstacles 
          items={items} 
          setItems={setItems} 
          skierX={skierX} 
          setFaceState={handleSetFace} 
          addScore={() => setScore(s => s + 1)} 
        />
      </Canvas>
    </div>
  );
}
