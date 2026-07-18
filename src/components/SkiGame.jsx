import React, { useState, useRef, useEffect, useMemo, forwardRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, useTexture, Sky, Environment, Sparkles, Text } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- CONSTANTS ---
const SPAWN_Z = -120;
const DESPAWN_Z = 15;
const BOUNDARY = 10;
const BASE_SPEED = 15;
const TREE_COUNT = 30;
const PRESENT_COUNT = 10;
const TRAIL_COUNT = 60;
const FRIEND_COUNT = 12;

// --- 3D ENVIRONMENT ---

const Ground = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
    <planeGeometry args={[100, 300]} />
    <meshStandardMaterial color="#cde3f5" roughness={0.9} metalness={0.1} />
    {/* Simple grid lines for speed illusion */}
    <gridHelper args={[100, 20, 0xd0e0f0, 0xe0f0ff]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]} />
  </mesh>
);

const ProceduralTree = forwardRef(({ scale = 1, variation = 0 }, ref) => (
  <group ref={ref} scale={scale}>
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
          <meshStandardMaterial color="#e0e8f0" roughness={0.5} />
        </mesh>
      </>
    )}
    <mesh position={[0, 0.5, 0]} castShadow>
      <cylinderGeometry args={[0.3, 0.4, 1]} />
      <meshStandardMaterial color="#5c4033" roughness={1.0} />
    </mesh>
  </group>
));

const PremiumPresent = forwardRef(({ color, rotationY }, ref) => {
  return (
    <group ref={ref} rotation={[0, rotationY, 0]}>
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
});

// A floating score object that we manually manage via refs instead of React State
const FloatingScore = forwardRef((props, ref) => {
  return (
    <Text 
      ref={ref} 
      position={[0, -100, 0]} // hidden by default
      fontSize={2} 
      color="#ff1493" 
      outlineWidth={0.1} 
      outlineColor="#ffffff"
      fontWeight="bold"
    >
      +100
    </Text>
  );
});

// A cheering friend on the side of the track
const CheeringFriend = forwardRef(({ textureId }, ref) => {
  const textures = useTexture({
    friend1: './faces/friend_1.png',
    friend2: './faces/friend_2.png',
    friend3: './faces/friend_3.png',
    friend4: './faces/friend_4.png',
    friend5: './faces/friend_5.png',
    friend6: './faces/friend_6.png',
    friend7: './faces/friend_7.png',
    friend8: './faces/friend_8.png'
  });
  Object.values(textures).forEach(tex => {
    if (tex) tex.colorSpace = THREE.SRGBColorSpace;
  });

  const texArray = [textures.friend1, textures.friend2, textures.friend3, textures.friend4, textures.friend5, textures.friend6, textures.friend7, textures.friend8];
  const map = texArray[textureId] || textures.friend1;
  const colors = ['#ff5555', '#55ff55', '#5555ff', '#ffaa00', '#aa00ff', '#00aaff', '#ff00aa', '#00ffaa'];

  return (
    <group ref={ref}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.4, 1.2, 4, 16]} />
        <meshStandardMaterial color={colors[textureId] || '#ffffff'} roughness={0.7} />
      </mesh>
      <Billboard position={[0, 3.2, 0.2]} args={[2.5, 2.5]}>
        <mesh>
          <circleGeometry args={[1.2, 32]} />
          <meshBasicMaterial map={map} transparent />
        </mesh>
      </Billboard>
    </group>
  );
});

// --- SINGLE CENTRAL GAME ENGINE ---
const GameManager = ({ 
  skierXRef, 
  skierVXRef, 
  speedRef, 
  keysRef, 
  touchStateRef, 
  isGameOverRef, 
  setIsGameOver, 
  addScore, 
  setFaceState 
}) => {
  
  // -- Game Feel Refs --
  const trauma = useRef(0);
  const hitStopTime = useRef(0);
  const worldDistance = useRef(0);
  const faceTimer = useRef(null);

  const handleSetFace = (state) => {
    setFaceState(state);
    if (faceTimer.current) clearTimeout(faceTimer.current);
    if (state !== 'normal' && state !== 'crash') {
      faceTimer.current = setTimeout(() => setFaceState('normal'), 800);
    }
  };

  // -- Skier Rig --
  const skierGroup = useRef();
  const leftArm = useRef();
  const rightArm = useRef();

  // -- World Rig --
  const worldGroup = useRef();

  // -- Object Pooling (LOGIC) --
  // We initialize the logic data once. 
  const treeData = useRef(Array.from({ length: TREE_COUNT }).map(() => ({
    x: (Math.random() * BOUNDARY * 2) - BOUNDARY,
    z: -(Math.random() * 100) - 20, // Spread out initially
  })));

  const presentData = useRef(Array.from({ length: PRESENT_COUNT }).map(() => ({
    x: (Math.random() * BOUNDARY * 2) - BOUNDARY,
    z: -(Math.random() * 100) - 30,
    collected: false,
    scale: 1, // for pop animation
  })));

  const trailData = useRef(new Array(TRAIL_COUNT).fill({ active: false, x: 0, z: 0 }));
  const trailIndex = useRef(0);

  const popData = useRef(new Array(5).fill({ active: false, x: 0, y: 0, z: 0, age: 0 }));
  const popIndex = useRef(0);

  // -- Object Pooling (MESH REFS) --
  const treeRefs = useRef([]);
  const presentRefs = useRef([]);
  const trailMeshRef = useRef();
  const popRefs = useRef([]);

  const friendData = useRef(Array.from({ length: FRIEND_COUNT }).map(() => ({
    x: (Math.random() > 0.5 ? 1 : -1) * (12 + Math.random() * 8), // Sides
    z: -(Math.random() * 200) - 50,
    textureId: Math.floor(Math.random() * 8),
    yOffset: Math.random() * Math.PI * 2
  })));
  const friendRefs = useRef([]);
  const friendsStatic = useMemo(() => Array.from({ length: FRIEND_COUNT }).map((_, i) => friendData.current[i].textureId), []);

  // Generate static props for rendering (never changes)
  const treesStatic = useMemo(() => Array.from({ length: TREE_COUNT }).map(() => ({
    scale: 0.8 + Math.random() * 0.7,
    variation: Math.random() > 0.5 ? 0 : 1,
  })), []);
  
  const presentsStatic = useMemo(() => Array.from({ length: PRESENT_COUNT }).map(() => ({
    color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'][Math.floor(Math.random() * 4)],
    rotY: Math.random() * Math.PI,
  })), []);

  const textures = useTexture({
    normal: './faces/face_normal.png',
    jump: './faces/face_jump.png',
    dodge: './faces/face_dodge.png',
    crash: './faces/face_crash.png'
  });
  Object.values(textures).forEach(tex => tex.colorSpace = THREE.SRGBColorSpace);
  const faceStateRef = useRef('normal'); // For instantaneous useFrame reads
  useEffect(() => { faceStateRef.current = 'normal'; }, []); 

  // --- THE MASTER LOOP ---
  useFrame((state, delta) => {
    // 1. Cap delta to prevent massive jumps when tab is inactive
    const dt = Math.min(delta, 0.1);
    const time = state.clock.elapsedTime;

    // 2. HIT STOP CHECK
    if (time < hitStopTime.current) {
      return; // Freeze literally everything (physics, camera, world)
    }

    // 3. SKIER PHYSICS & INPUT
    if (!isGameOverRef.current) {
      let ax = 0;
      if (keysRef.current.left || touchStateRef.current === -1) ax -= 60;
      if (keysRef.current.right || touchStateRef.current === 1) ax += 60;
      
      skierVXRef.current += ax * dt;
      skierVXRef.current *= 0.85; // Friction
      
      skierXRef.current += skierVXRef.current * dt;
      skierXRef.current = Math.max(-BOUNDARY + 1, Math.min(BOUNDARY - 1, skierXRef.current));
      
      if (Math.abs(skierVXRef.current) > 5 && faceStateRef.current === 'normal') {
        faceStateRef.current = 'dodge';
        handleSetFace('dodge');
      }
    }

    // 4. WORLD PHYSICS (HILLS & SPEED)
    if (!isGameOverRef.current) {
      worldDistance.current += speedRef.current * dt;
    }
    const slopeAngle = Math.sin(worldDistance.current * 0.02) * 0.15;
    
    if (worldGroup.current) {
      worldGroup.current.rotation.x = THREE.MathUtils.lerp(worldGroup.current.rotation.x, slopeAngle, dt * 2);
    }
    const targetSpeed = Math.max(8, BASE_SPEED + (slopeAngle * 60));
    if (!isGameOverRef.current) {
      speedRef.current = THREE.MathUtils.lerp(speedRef.current, targetSpeed, dt);
    } else {
      speedRef.current = THREE.MathUtils.lerp(speedRef.current, 0, dt * 5); // Stop smoothly on crash
    }

    // 5. SKIER ANIMATION
    if (skierGroup.current) {
      skierGroup.current.position.x = skierXRef.current;
      
      const tilt = (skierXRef.current - skierGroup.current.position.x) * 2;
      skierGroup.current.rotation.z = -tilt * 0.1;
      skierGroup.current.rotation.y = -tilt * 0.15;

      if (isGameOverRef.current) {
        skierGroup.current.rotation.x = THREE.MathUtils.lerp(skierGroup.current.rotation.x, -Math.PI / 2, dt * 5);
        skierGroup.current.position.y = THREE.MathUtils.lerp(skierGroup.current.position.y, -0.2, dt * 5);
      } else {
        skierGroup.current.rotation.x = 0;
        skierGroup.current.position.y = Math.sin(time * speedRef.current * 0.5) * 0.1;
        
        const pump = Math.sin(time * speedRef.current * 0.4);
        if (leftArm.current && rightArm.current) {
          leftArm.current.rotation.x = Math.PI / 4 + pump * 0.5;
          rightArm.current.rotation.x = Math.PI / 4 - pump * 0.5;
        }
      }
    }

    // 6. CAMERA & SHAKE
    if (trauma.current > 0) {
      trauma.current = Math.max(0, trauma.current - dt * 1.2);
    }
    const shake = trauma.current * trauma.current;
    
    const targetCamX = skierXRef.current * 0.4;
    const baseCamX = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, dt * 3);
    const baseCamY = THREE.MathUtils.lerp(state.camera.position.y, isGameOverRef.current ? 8 : 4.5, dt * 2);
    const baseCamZ = THREE.MathUtils.lerp(state.camera.position.z, isGameOverRef.current ? 20 : 12, dt * 2);
    
    if (shake > 0) {
      const shakeTime = time * 30.0;
      state.camera.position.set(
        baseCamX + (0.8 * shake * Math.sin(shakeTime * 1.7)),
        baseCamY + (0.8 * shake * Math.sin(shakeTime * 2.3)),
        baseCamZ
      );
    } else {
      state.camera.position.set(baseCamX, baseCamY, baseCamZ);
    }
    state.camera.lookAt(skierXRef.current * 0.2, 0, -5);

    // 7. COLLISION & OBJECT POOLING
    let hitTree = false;
    let grabbedId = null;

    // A. Update Trees
    for (let i = 0; i < TREE_COUNT; i++) {
      let t = treeData.current[i];
      t.z += speedRef.current * dt;
      
      // Collision
      if (!isGameOverRef.current && t.z > -1 && t.z < 1.5) {
        if (Math.abs(t.x - skierXRef.current) < 1.8) hitTree = true;
      }
      
      // Respawn
      if (t.z > DESPAWN_Z) {
        t.z = SPAWN_Z - Math.random() * 20;
        t.x = (Math.random() * BOUNDARY * 2) - BOUNDARY;
      }
      
      // Apply to mesh
      if (treeRefs.current[i]) {
        treeRefs.current[i].position.set(t.x, 0, t.z);
      }
    }

    // B. Update Presents
    for (let i = 0; i < PRESENT_COUNT; i++) {
      let p = presentData.current[i];
      p.z += speedRef.current * dt;
      
      // Collision
      if (!isGameOverRef.current && !p.collected && p.z > -1 && p.z < 1.5) {
        if (Math.abs(p.x - skierXRef.current) < 1.6) {
          grabbedId = i;
          p.collected = true;
          p.scale = 1.5; // Trigger squash
        }
      }
      
      // Respawn
      if (p.z > DESPAWN_Z) {
        p.z = SPAWN_Z - Math.random() * 50;
        p.x = (Math.random() * BOUNDARY * 2) - BOUNDARY;
        p.collected = false;
        p.scale = 1;
      }

      // Squash/Stretch Animation
      if (p.collected) {
        p.scale = THREE.MathUtils.lerp(p.scale, 0, dt * 15);
      } else {
        p.scale = THREE.MathUtils.lerp(p.scale, 1, dt * 8);
      }
      
      // Apply to mesh
      if (presentRefs.current[i]) {
        presentRefs.current[i].position.set(p.x, 0, p.z);
        presentRefs.current[i].scale.setScalar(p.scale);
      }
    }

    // B2. Update Friends
    for (let i = 0; i < FRIEND_COUNT; i++) {
      let f = friendData.current[i];
      f.z += speedRef.current * dt;
      
      if (f.z > DESPAWN_Z) {
        f.z = SPAWN_Z - Math.random() * 100;
        f.x = (Math.random() > 0.5 ? 1 : -1) * (12 + Math.random() * 8);
      }

      if (friendRefs.current[i]) {
        const jumpY = Math.abs(Math.sin(time * 8 + f.yOffset)) * 1.5;
        friendRefs.current[i].position.set(f.x, jumpY, f.z);
      }
    }

    // C. Process Hits/Grabs
    if (hitTree && !isGameOverRef.current) {
      isGameOverRef.current = true;
      setIsGameOver(true);
      faceStateRef.current = 'crash';
      handleSetFace('crash');
      trauma.current = 1.0; // TRIGGER SHAKE
      hitStopTime.current = time + 0.12; // TRIGGER FREEZE
    } else if (grabbedId !== null && !isGameOverRef.current) {
      faceStateRef.current = 'jump';
      handleSetFace('jump');
      addScore();
      
      // Spawn floating text
      const idx = popIndex.current;
      popData.current[idx] = { 
        active: true, 
        x: presentData.current[grabbedId].x, 
        y: 2, 
        z: presentData.current[grabbedId].z, 
        age: 0 
      };
      popIndex.current = (idx + 1) % 5;
    }

    // 8. UPDATE PARTICLES (TRAILS)
    if (!isGameOverRef.current) {
      const tIdx = trailIndex.current;
      trailData.current[tIdx] = { active: true, x: skierXRef.current, z: 0 };
      trailIndex.current = (tIdx + 1) % TRAIL_COUNT;
    }

    if (trailMeshRef.current) {
      let dummy = new THREE.Object3D();
      for (let i = 0; i < TRAIL_COUNT; i++) {
        let t = trailData.current[i];
        if (t.active) {
          t.z += speedRef.current * dt;
          dummy.position.set(t.x, 0.02, t.z);
          let progress = t.z / DESPAWN_Z;
          let s = Math.max(0, 1 - Math.pow(progress, 2));
          dummy.scale.set(s, s, s);
          dummy.updateMatrix();
          trailMeshRef.current.setMatrixAt(i, dummy.matrix);
        }
      }
      trailMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 9. UPDATE FLOATING SCORES
    for (let i = 0; i < 5; i++) {
      let pop = popData.current[i];
      if (pop.active) {
        pop.y += dt * 3.0;
        pop.z += speedRef.current * dt;
        pop.age += dt;
        if (pop.age > 1.0) pop.active = false; // Hide after 1 sec
        
        if (popRefs.current[i]) {
          popRefs.current[i].position.set(pop.x, pop.y, pop.z);
          popRefs.current[i].fillOpacity = Math.max(0, 1.0 - pop.age);
        }
      } else {
        if (popRefs.current[i]) popRefs.current[i].position.set(0, -100, 0); // Hide
      }
    }
  });

  return (
    <group ref={worldGroup}>
      <Ground />
      
      {/* ICE TRAILS */}
      <instancedMesh ref={trailMeshRef} args={[null, null, TRAIL_COUNT]}>
        <boxGeometry args={[0.8, 0.05, 3]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={0.8} />
      </instancedMesh>
      
      {/* POOLED TREES */}
      {treesStatic.map((props, i) => (
        <ProceduralTree key={`tree-${i}`} ref={el => treeRefs.current[i] = el} {...props} />
      ))}

      {/* POOLED PRESENTS */}
      {presentsStatic.map((props, i) => (
        <PremiumPresent key={`present-${i}`} ref={el => presentRefs.current[i] = el} {...props} />
      ))}

      {/* POOLED FRIENDS */}
      {friendsStatic.map((textureId, i) => (
        <CheeringFriend key={`friend-${i}`} textureId={textureId} ref={el => friendRefs.current[i] = el} />
      ))}

      {/* POOLED FLOATING SCORES */}
      {Array.from({length: 5}).map((_, i) => (
        <FloatingScore key={`pop-${i}`} ref={el => popRefs.current[i] = el} />
      ))}

      {/* SKIER MODEL */}
      <group ref={skierGroup} position={[0, 0, 0]}>
        {/* Powder Snow Particles attached to skis */}
        <Sparkles count={30} scale={[2, 0.5, 2]} size={3} speed={0.4} opacity={isGameOverRef.current ? 0 : 0.8} color="#ffffff" position={[0, 0.2, 0.5]} />
        
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
            <meshBasicMaterial map={textures[faceStateRef.current]} />
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
    </group>
  );
};

export default function SkiGame() {
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [faceState, setFaceState] = useState('normal');
  
  // Game State Refs
  const skierXRef = useRef(0);
  const skierVXRef = useRef(0);
  const speedRef = useRef(BASE_SPEED);
  const isGameOverRef = useRef(false);

  // Controls
  const keysRef = useRef({ left: false, right: false });
  const touchStateRef = useRef(0); // -1 left, 1 right, 0 none

  useEffect(() => {
    const handleKD = (e) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = true;
      if (e.key === 'ArrowRight') keysRef.current.right = true;
    };
    const handleKU = (e) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = false;
      if (e.key === 'ArrowRight') keysRef.current.right = false;
    };
    window.addEventListener('keydown', handleKD);
    window.addEventListener('keyup', handleKU);
    return () => {
      window.removeEventListener('keydown', handleKD);
      window.removeEventListener('keyup', handleKU);
    };
  }, []);

  const restartGame = () => {
    setIsGameOver(false);
    isGameOverRef.current = false;
    setScore(0);
    setFaceState('normal');
    skierXRef.current = 0;
    skierVXRef.current = 0;
    speedRef.current = BASE_SPEED;
    // Note: World objects are smoothly scrolled away natively by the engine 
    // or they will just continue from where they were, which is seamless.
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
          onPointerDown={() => touchStateRef.current = -1}
          onPointerUp={() => touchStateRef.current = 0}
          onPointerLeave={() => touchStateRef.current = 0}
          className="w-24 h-24 bg-white/20 border-2 border-white/50 rounded-full flex items-center justify-center backdrop-blur-md active:bg-white/40 pointer-events-auto shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          <span className="text-4xl text-white font-black">←</span>
        </button>
        <button 
          onPointerDown={() => touchStateRef.current = 1}
          onPointerUp={() => touchStateRef.current = 0}
          onPointerLeave={() => touchStateRef.current = 0}
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
          intensity={1.2} 
          shadow-mapSize={[2048, 2048]}
        >
          <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20, 1, 100]} />
        </directionalLight>
        
        <Environment preset="sunset" />
        <fog attach="fog" args={['#87CEEB', 20, 100]} />
        
        <React.Suspense fallback={null}>
          <GameManager 
            skierXRef={skierXRef}
            skierVXRef={skierVXRef}
            speedRef={speedRef}
            keysRef={keysRef}
            touchStateRef={touchStateRef}
            isGameOverRef={isGameOverRef}
            setIsGameOver={setIsGameOver}
            addScore={() => setScore(s => s + 100)}
            setFaceState={setFaceState}
          />
          
          {/* Post-Processing Pipeline */}
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.95} luminanceSmoothing={0.1} intensity={0.6} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </React.Suspense>
      </Canvas>
    </div>
  );
}
