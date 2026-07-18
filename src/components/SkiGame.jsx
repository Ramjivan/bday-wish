import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, useTexture, Sky, Environment, Sparkles, Text } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- CONSTANTS ---
const SPAWN_Z = -120;
const DESPAWN_Z = 15;
const BOUNDARY = 10;
const BASE_SPEED = 15;

// --- 3D ENVIRONMENT ---

const Ground = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
    <planeGeometry args={[100, 300]} />
    <meshStandardMaterial color="#f8fbfd" roughness={0.9} metalness={0.1} />
    {/* Simple grid lines for speed illusion */}
    <gridHelper args={[100, 20, 0xd0e0f0, 0xe0f0ff]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]} />
  </mesh>
);

const ProceduralTree = ({ position, scale = 1, variation = 0 }) => (
  <group position={position} scale={scale}>
    {variation === 0 ? (
      // Tall Pine
      <>
        <mesh position={[0, 2, 0]} castShadow receiveShadow>
          <coneGeometry args={[1, 4, 8]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.9} />
        </mesh>
        <mesh position={[0, 4, 0]} castShadow receiveShadow>
          <coneGeometry args={[0.8, 3, 8]} />
          <meshStandardMaterial color="#3a7033" roughness={0.9} />
        </mesh>
      </>
    ) : (
      // Bushy Snowy Tree
      <>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <coneGeometry args={[1.5, 3, 7]} />
          <meshStandardMaterial color="#228b22" roughness={1} />
        </mesh>
        <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
          <coneGeometry args={[1.2, 2, 7]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
      </>
    )}
    <mesh position={[0, 0.5, 0]} castShadow>
      <cylinderGeometry args={[0.3, 0.4, 1]} />
      <meshStandardMaterial color="#5c4033" roughness={1.0} />
    </mesh>
  </group>
);

const PremiumPresent = ({ position, color, rotationY, collected }) => {
  const group = useRef();
  const scale = useRef(0);
  const isPopping = useRef(false);

  useFrame((state, delta) => {
    if (!group.current) return;
    
    if (collected && !isPopping.current) {
      isPopping.current = true;
      scale.current = 1.5; // Instant pop/squash
    }

    if (isPopping.current) {
      scale.current = THREE.MathUtils.lerp(scale.current, 0, delta * 15);
    } else {
      scale.current = THREE.MathUtils.lerp(scale.current, 1, delta * 8);
    }
    
    group.current.scale.setScalar(scale.current);
  });

  return (
    <group ref={group} position={position} rotation={[0, rotationY, 0]}>
      {/* Main Box - PBR Shiny Foil */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshPhysicalMaterial color={color} roughness={0.1} metalness={0.2} clearcoat={1.0} clearcoatRoughness={0.1} />
      </mesh>
      {/* Ribbons */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.25, 1.25, 0.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.2, 1.25, 1.25]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      {/* Bow */}
      <mesh position={[0, 1.3, 0]} castShadow rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[0.2, 0.05, 16, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
    </group>
  );
};

const FloatingScore = ({ position }) => {
  const textRef = useRef();
  useFrame((state, delta) => {
    if (textRef.current) {
      textRef.current.position.y += delta * 3.0;
      textRef.current.fillOpacity -= delta * 1.2;
    }
  });
  return (
    <Text 
      ref={textRef} 
      position={[position[0], position[1] + 2, position[2]]} 
      fontSize={2} 
      color="#ff1493" 
      outlineWidth={0.1} 
      outlineColor="#ffffff"
      fontWeight="bold"
    >
      +100
    </Text>
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
    
    // Tilt (roll) and Yaw based on horizontal velocity
    const tilt = (positionX.current - group.current.position.x) * 2;
    group.current.rotation.z = -tilt * 0.1; // Lean into turn
    group.current.rotation.y = -tilt * 0.15; // Turn body into turn

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
      {/* Powder Snow Particles attached to skis */}
      {!isGameOver && <Sparkles count={30} scale={[2, 0.5, 2]} size={3} speed={0.4} opacity={0.8} color="#ffffff" position={[0, 0.2, 0.5]} />}
      
      {/* Torso */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.3, 0.8, 4, 16]} />
        <meshStandardMaterial color="#ff1493" roughness={0.6} metalness={0.1} />
      </mesh>
      
      {/* Arms & Poles */}
      <group position={[-0.4, 1.4, 0]} ref={leftArm}>
        <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.1, 0.6]} />
          <meshStandardMaterial color="#ff69b4" roughness={0.6} />
        </mesh>
        <mesh position={[0, -1, 0.2]} rotation={[-Math.PI/4, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.5]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>

      <group position={[0.4, 1.4, 0]} ref={rightArm}>
        <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.1, 0.6]} />
          <meshStandardMaterial color="#ff69b4" roughness={0.6} />
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
      <mesh position={[-0.2, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, 0.05, 2.5]} />
        <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0.2, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, 0.05, 2.5]} />
        <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
};

// --- DYNAMIC 3D CAMERA & SHAKE ---
const CameraManager = ({ skierX, isGameOver, trauma }) => {
  useFrame((state, delta) => {
    // 1. Decay trauma
    if (trauma.current > 0) {
      trauma.current = Math.max(0, trauma.current - delta * 1.2);
    }
    const shake = trauma.current * trauma.current; // Quadratic falloff for smooth shake

    // 2. Base Camera Follow
    const targetX = skierX.current * 0.4; // Camera moves 40% as much as player
    const baseCamX = THREE.MathUtils.lerp(state.camera.position.x, targetX, delta * 3);
    const baseCamY = THREE.MathUtils.lerp(state.camera.position.y, isGameOver ? 8 : 4.5, delta * 2);
    const baseCamZ = THREE.MathUtils.lerp(state.camera.position.z, isGameOver ? 20 : 12, delta * 2);
    
    // 3. Apply Shake Offset
    if (shake > 0) {
      const time = state.clock.elapsedTime * 30.0;
      state.camera.position.set(
        baseCamX + (0.8 * shake * Math.sin(time * 1.7)),
        baseCamY + (0.8 * shake * Math.sin(time * 2.3)),
        baseCamZ
      );
    } else {
      state.camera.position.set(baseCamX, baseCamY, baseCamZ);
    }
    
    // Look ahead of player
    const lookTarget = new THREE.Vector3(skierX.current * 0.2, 0, -5);
    state.camera.lookAt(lookTarget);
  });
  return null;
};

const WorldManager = ({ skierX, setFaceState, addScore, isGameOver, setIsGameOver, currentSpeed, trauma, triggerHitStop }) => {
  const [items, setItems] = useState([]);
  const [pops, setPops] = useState([]); // Floating +100 text triggers
  const worldGroup = useRef();
  const worldDistance = useRef(0);
  
  // Track snow trails
  const trailCount = 60;
  const trailMeshRef = useRef();
  const trailData = useRef(new Array(trailCount).fill({ active: false, x: 0, z: 0 }));
  const trailIndex = useRef(0);

  // Initialize environment
  useEffect(() => {
    const initialItems = [];
    for (let i = 0; i < 10; i++) {
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
    let grabbedId = null;
    let grabbedPos = null;
    
    // Physics-based hills
    worldDistance.current += currentSpeed.current * delta;
    const slopeAngle = Math.sin(worldDistance.current * 0.02) * 0.15;
    
    if (worldGroup.current) {
      // Rotate world to simulate hills
      worldGroup.current.rotation.x = THREE.MathUtils.lerp(worldGroup.current.rotation.x, slopeAngle, delta * 2);
    }
    
    // Adjust speed based on slope (downhill = faster, uphill = slower)
    const targetSpeed = Math.max(8, BASE_SPEED + (slopeAngle * 60));
    currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, targetSpeed, delta);

    // Trail marks logic: spawn new trail pieces continuously
    const idx = trailIndex.current;
    trailData.current[idx] = { active: true, x: skierX.current, z: 0 };
    trailIndex.current = (idx + 1) % trailCount;

    if (trailMeshRef.current) {
      let dummy = new THREE.Object3D();
      for (let i = 0; i < trailCount; i++) {
        let t = trailData.current[i];
        if (t.active) {
          t.z += currentSpeed.current * delta; // move towards camera
          dummy.position.set(t.x, 0.02, t.z);
          // fade and scale based on age
          let progress = t.z / DESPAWN_Z;
          let scale = Math.max(0, 1 - Math.pow(progress, 2)); // Ease out trail
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();
          trailMeshRef.current.setMatrixAt(i, dummy.matrix);
        }
      }
      trailMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    setItems((prev) => {
      const newItems = [];
      for (let item of prev) {
        item.z += currentSpeed.current * delta;
        
        // Collision Detection (Made hitboxes much wider and accurate)
        if (item.z > -1 && item.z < 1.5) {
          const dx = Math.abs(item.x - skierX.current);
          if (item.type === 'tree' && dx < 2.0) {
            hit = true;
          } else if (item.type === 'present' && !item.collected && dx < 1.8) {
            grabbedId = item.id;
            grabbedPos = [item.x, 0, item.z];
            item.collected = true;
          }
        }
        
        if (item.z < DESPAWN_Z) {
          newItems.push(item);
        }
      }
      
      // Spawn logic: lower density for better gameplay
      if (newItems.length < 15) {
        // 75% trees, 25% presents
        const type = Math.random() > 0.25 ? 'tree' : 'present';
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
      trauma.current = 1.0; // TRIGGER MASSIVE SCREEN SHAKE
      triggerHitStop(0.12); // FREEZE TIME FOR 120ms
      setIsGameOver(true);
      setFaceState('crash');
    } else if (grabbedId) {
      setFaceState('jump');
      addScore();
      setPops(p => [...p, { id: Math.random(), pos: grabbedPos }]);
    }
  });

  return (
    <group ref={worldGroup}>
      <Ground />
      {/* ICE TRAILS INSTANCED MESH */}
      <instancedMesh ref={trailMeshRef} args={[null, null, trailCount]}>
        <boxGeometry args={[0.8, 0.05, 3]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={0.8} />
      </instancedMesh>
      
      {items.map(item => (
        item.type === 'tree' ? 
          <ProceduralTree key={item.id} position={[item.x, 0, item.z]} scale={item.scale} variation={item.variation} /> :
          <PremiumPresent key={item.id} position={[item.x, 0, item.z]} color={item.color} rotationY={item.rotY} collected={item.collected} />
      ))}

      {pops.map(pop => (
        <FloatingScore key={pop.id} position={pop.pos} />
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
  
  // Game Feel Hooks
  const trauma = useRef(0);
  const hitStopTime = useRef(0);
  
  const triggerHitStop = (seconds) => {
    hitStopTime.current = performance.now() + (seconds * 1000);
  };

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
    let lastTime = performance.now();
    
    const updatePhysics = (time) => {
      if (time < hitStopTime.current) {
        // We are currently in Hit-Stop freeze frames!
        lastTime = time; // prevent massive dt jump when unfreezing
        animationFrame = requestAnimationFrame(updatePhysics);
        return;
      }

      const dt = Math.min((time - lastTime) / 1000, 0.1); // max 100ms delta to prevent huge jumps
      lastTime = time;

      if (!isGameOver) {
        let ax = 0;
        // Acceleration in units per second squared
        if (keys.current.left || touchState.current === -1) ax -= 60;
        if (keys.current.right || touchState.current === 1) ax += 60;
        
        skierVX.current += ax * dt;
        skierVX.current *= 0.85; // Damping/Friction
        
        skierX.current += skierVX.current * dt;
        skierX.current = Math.max(-BOUNDARY + 1, Math.min(BOUNDARY - 1, skierX.current));
        
        if (Math.abs(skierVX.current) > 5 && faceState === 'normal') {
          handleSetFace('dodge');
        }
      }
      animationFrame = requestAnimationFrame(updatePhysics);
    };
    animationFrame = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrame);
  }, [isGameOver, faceState]);

  const restartGame = () => {
    setIsGameOver(false);
    setScore(0);
    setFaceState('normal');
    skierX.current = 0;
    skierVX.current = 0;
    currentSpeed.current = BASE_SPEED;
    trauma.current = 0;
  };

  return (
    <div className="fixed inset-0 z-[600] bg-sky-300 overflow-hidden select-none touch-none">
      
      {/* HUD UI */}
      <div className="absolute top-4 left-4 z-10 font-sans">
        <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] flex items-center gap-2">
          🎁 <span style={{ textShadow: '0 0 20px #ff1493' }}>{score}</span>
        </h1>
      </div>

      {/* Lada Cam */}
      <div className="absolute top-4 right-4 z-10 w-28 h-28 md:w-48 md:h-48 rounded-full border-4 border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.5)] overflow-hidden bg-zinc-800">
        <div className="absolute bottom-0 w-full text-center bg-pink-500 text-white text-xs font-bold py-1 z-20 shadow-lg">LADA CAM</div>
        <img 
          src={`./faces/face_${faceState}.png`} 
          alt="Lada Cam"
          className="w-full h-full object-cover transition-all duration-150"
          style={{ transform: faceState === 'crash' ? 'scale(1.4) rotate(-15deg)' : 'scale(1.1)' }}
        />
      </div>

      {/* Wipeout Screen (Frosted Glass Match) */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 bg-black/40 flex flex-col items-center justify-center backdrop-blur-md">
          <div className="bg-white/10 p-12 rounded-3xl border border-white/20 shadow-[0_0_100px_rgba(236,72,153,0.3)] flex flex-col items-center text-center">
            <h2 className="text-6xl md:text-8xl font-black text-white mb-6 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] rotate-[-4deg]">WIPEOUT!</h2>
            <img 
              src={`./faces/face_crash.png`} 
              className="w-48 h-48 rounded-full border-8 border-pink-500 shadow-2xl mb-8 object-cover"
              alt="Crash Face"
            />
            <p className="text-3xl text-pink-300 font-bold mb-10 drop-shadow-md">Score: {score}</p>
            <button 
              onClick={restartGame}
              className="px-12 py-6 bg-pink-500 hover:bg-pink-400 text-white text-3xl font-black rounded-full shadow-[0_0_40px_rgba(236,72,153,1)] border-4 border-white transition hover:scale-110 active:scale-95"
            >
              Play Again ⛷️
            </button>
          </div>
        </div>
      )}

      {/* Mobile Controls Overlay */}
      <div className="absolute bottom-10 left-0 right-0 px-8 flex justify-between z-40 md:hidden pointer-events-none">
        <button 
          onPointerDown={() => touchState.current = -1}
          onPointerUp={() => touchState.current = 0}
          onPointerLeave={() => touchState.current = 0}
          className="w-24 h-24 bg-white/20 border-2 border-white/50 rounded-full flex items-center justify-center backdrop-blur-md active:bg-white/40 pointer-events-auto shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          <span className="text-4xl text-white font-black">←</span>
        </button>
        <button 
          onPointerDown={() => touchState.current = 1}
          onPointerUp={() => touchState.current = 0}
          onPointerLeave={() => touchState.current = 0}
          className="w-24 h-24 bg-white/20 border-2 border-white/50 rounded-full flex items-center justify-center backdrop-blur-md active:bg-white/40 pointer-events-auto shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          <span className="text-4xl text-white font-black">→</span>
        </button>
      </div>

      {/* 3D Scene */}
      <Canvas shadows camera={{ position: [0, 4.5, 12], fov: 60 }}>
        <color attach="background" args={['#87CEEB']} />
        
        {/* Advanced PBR Lighting Rig */}
        <ambientLight intensity={0.2} />
        <directionalLight 
          castShadow 
          position={[10, 30, 10]} 
          intensity={2.5} 
          shadow-mapSize={[2048, 2048]}
        >
          <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20, 1, 100]} />
        </directionalLight>
        
        <Environment preset="sunset" />
        <fog attach="fog" args={['#87CEEB', 20, 100]} />
        
        <CameraManager skierX={skierX} isGameOver={isGameOver} trauma={trauma} />
        
        <React.Suspense fallback={null}>
          <AnimatedSkier positionX={skierX} faceState={faceState} speed={currentSpeed.current} isGameOver={isGameOver} />
          <WorldManager 
            skierX={skierX} 
            setFaceState={handleSetFace} 
            addScore={() => setScore(s => s + 100)} 
            isGameOver={isGameOver} 
            setIsGameOver={setIsGameOver}
            currentSpeed={currentSpeed}
            trauma={trauma}
            triggerHitStop={triggerHitStop}
          />
          
          {/* Post-Processing Pipeline */}
          <EffectComposer>
            <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} intensity={1.5} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </React.Suspense>
      </Canvas>
    </div>
  );
}
