import React, { useState, useRef, useEffect, useMemo, forwardRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, useTexture, Sky, Sparkles, Text } from '@react-three/drei';
// Post-processing and Environment removed for performance
import * as THREE from 'three';

// --- CONSTANTS ---
const DESPAWN_Z = 15;
const BOUNDARY = 10;
const BASE_SPEED = 28;
const TRAIL_COUNT = 60;
const FRIEND_COUNT = 12;

// --- TRACK DESIGN ENGINE ---
const TRACK_MAP = [
  ".......", ".......", ".......",
  "..T....", ".....T.", ".......", 
  "...R...", ".......", "T......",
  ".......", ".S...S.", ".......",
  "..T.B..", ".......", "....R..",
  ".......", "T.....T", ".......",
  "...P...", ".......", "S.....S",
  "..B....", "....B..", ".......",
  ".T...T.", ".......", "..R....",
  ".......", "T.T.T.T", ".......",
  ".......", "..B....", "...S...",
  "T......", "......T", ".......",
  "...R...", ".......", ".T...T.",
  ".......", "S..P..S", ".......",
  "..T.T..", ".......", "....B..",
  ".......", ".R.....", ".......",
  "B.....B", ".......", "..S.S..",
  ".......", "T..T..T", ".......",
  "...R...", ".......", ".......",
  "T.....T", ".......", "..B....",
  ".......", "....S..", ".......",
  "..T....", ".......", ".R.....",
  ".......", "T.....T", ".......",
  "...B...", ".......", "S.....S",
  ".......", "T..T..T", ".......",
  "..R.R..", ".......", ".......",
  "B.....B", ".......", ".......",
  ".......", ".......", ".......",
];

const ALL_PINES = [];
const ALL_BUSHES = [];
const ALL_BOULDERS = [];
const ALL_RAMPS = [];
const ALL_PRESENTS = [];

TRACK_MAP.forEach((row, i) => {
  const worldZ = -40 - (i * 20);
  for (let c = 0; c < row.length; c++) {
    const x = -9 + c * 3;
    const char = row[c];
    if (char === 'T') ALL_PINES.push({ x, worldZ });
    if (char === 'S') ALL_BUSHES.push({ x, worldZ });
    if (char === 'B') ALL_BOULDERS.push({ x, worldZ });
    if (char === 'R') ALL_RAMPS.push({ x, worldZ });
    if (char === 'P') ALL_PRESENTS.push({ x, worldZ, collected: false, scale: 1 });
  }
});
const FINISH_LINE_WORLD_Z = -40 - (TRACK_MAP.length * 20);

const PINE_POOL_SIZE = Math.min(20, ALL_PINES.length);
const BUSH_POOL_SIZE = Math.min(15, ALL_BUSHES.length);
const BOULDER_POOL_SIZE = Math.min(15, ALL_BOULDERS.length);
const RAMP_POOL_SIZE = Math.min(5, ALL_RAMPS.length);

// --- 3D ENVIRONMENT ---

const Ground = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
    <planeGeometry args={[100, 300]} />
    <meshStandardMaterial color="#cde3f5" roughness={0.9} metalness={0.1} />
    {/* Grid removed for pure snow aesthetics */}
  </mesh>
);

const ProceduralObstacle = forwardRef(({ scale = 1, type = 0 }, ref) => (
  <group ref={ref} scale={scale}>
    {type === 0 && ( // Tall Pine
      <>
        <mesh position={[0, 2, 0]} castShadow>
          <coneGeometry args={[1, 4, 8]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.9} />
        </mesh>
        <mesh position={[0, 4, 0]} castShadow>
          <coneGeometry args={[0.8, 3, 8]} />
          <meshStandardMaterial color="#3a7033" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.4, 1]} />
          <meshStandardMaterial color="#5c4033" roughness={1.0} />
        </mesh>
      </>
    )}
    {type === 1 && ( // Snowy Bush
      <>
        <mesh position={[0, 1.5, 0]} castShadow>
          <coneGeometry args={[1.5, 3, 7]} />
          <meshStandardMaterial color="#228b22" roughness={1} />
        </mesh>
        <mesh position={[0, 2.5, 0]} castShadow>
          <coneGeometry args={[1.2, 2, 7]} />
          <meshStandardMaterial color="#e0e8f0" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.4, 1]} />
          <meshStandardMaterial color="#5c4033" roughness={1.0} />
        </mesh>
      </>
    )}
    {type === 2 && ( // Dead Tree
      <>
        <mesh position={[0, 2, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.2, 4]} />
          <meshStandardMaterial color="#4a3b32" roughness={1.0} />
        </mesh>
        <mesh position={[0.5, 2.5, 0]} rotation={[0, 0, Math.PI/4]} castShadow>
          <cylinderGeometry args={[0.05, 0.1, 2]} />
          <meshStandardMaterial color="#4a3b32" roughness={1.0} />
        </mesh>
        <mesh position={[-0.4, 3, 0]} rotation={[0, 0, -Math.PI/3]} castShadow>
          <cylinderGeometry args={[0.05, 0.1, 1.5]} />
          <meshStandardMaterial color="#4a3b32" roughness={1.0} />
        </mesh>
      </>
    )}
    {type === 3 && ( // Large Boulder
      <mesh position={[0, 0.8, 0]} castShadow>
        <dodecahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color="#7a8a99" roughness={0.8} />
      </mesh>
    )}
    {type === 4 && ( // Small Rocks
      <group position={[0, 0.3, 0]}>
        <mesh position={[0.5, 0, 0.2]} castShadow>
          <dodecahedronGeometry args={[0.4, 0]} />
          <meshStandardMaterial color="#6a7a88" roughness={0.9} />
        </mesh>
        <mesh position={[-0.4, 0, -0.3]} castShadow>
          <dodecahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color="#6a7a88" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <dodecahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#e0e8f0" roughness={0.9} />
        </mesh>
      </group>
    )}
  </group>
));

const SkiRamp = forwardRef((props, ref) => (
  <group ref={ref} {...props}>
    <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 8, 0, 0]} castShadow>
      <boxGeometry args={[3, 0.2, 4]} />
      <meshStandardMaterial color="#ffffff" roughness={0.8} />
    </mesh>
    <mesh position={[0, 0.25, 0]} castShadow>
      <boxGeometry args={[3, 0.5, 3.8]} />
      <meshStandardMaterial color="#cde3f5" roughness={1} />
    </mesh>
  </group>
));

const FinishLine = forwardRef((props, ref) => (
  <group ref={ref} {...props}>
    {/* Poles */}
    <mesh position={[-5, 4, 0]} castShadow>
      <cylinderGeometry args={[0.2, 0.2, 8]} />
      <meshStandardMaterial color="#ff1493" roughness={0.3} metalness={0.8} />
    </mesh>
    <mesh position={[5, 4, 0]} castShadow>
      <cylinderGeometry args={[0.2, 0.2, 8]} />
      <meshStandardMaterial color="#ff1493" roughness={0.3} metalness={0.8} />
    </mesh>
    {/* Banner */}
    <mesh position={[0, 6, 0]} castShadow>
      <planeGeometry args={[10, 2]} />
      <meshStandardMaterial color="#ffffff" roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
    <Text position={[0, 6, 0.1]} fontSize={1.2} color="#ff1493" fontWeight="bold">
      FINISH!
    </Text>
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
    <Text ref={ref} position={[0, -100, 0]} fontSize={2} color="#ff1493" outlineWidth={0.1} outlineColor="#ffffff" fontWeight="bold">
      +100
    </Text>
  );
});

const CheeringFriend = forwardRef(({ textureId }, ref) => {
  const textures = useTexture({
    friend1: './faces/friend_1.png', friend2: './faces/friend_2.png', friend3: './faces/friend_3.png', friend4: './faces/friend_4.png',
    friend5: './faces/friend_5.png', friend6: './faces/friend_6.png', friend7: './faces/friend_7.png', friend8: './faces/friend_8.png'
  });
  Object.values(textures).forEach(tex => { if (tex) tex.colorSpace = THREE.SRGBColorSpace; });

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
  skierXRef, skierVXRef, speedRef, keysRef, touchStateRef, 
  isGameOverRef, setIsGameOver, isGameWonRef, setIsGameWon, addScore, setFaceState 
}) => {
  
  const trauma = useRef(0);
  const hitStopTime = useRef(0);
  const worldDistance = useRef(0);
  const faceTimer = useRef(null);
  const flipState = useRef({ active: false, time: 0 });

  const handleSetFace = (state) => {
    setFaceState(state);
    if (faceTimer.current) clearTimeout(faceTimer.current);
    if (state !== 'normal' && state !== 'crash') {
      faceTimer.current = setTimeout(() => setFaceState('normal'), 800);
    }
  };

  const skierGroup = useRef();
  const leftArm = useRef();
  const rightArm = useRef();
  const worldGroup = useRef();
  const finishLineRef = useRef();
  const trailMeshRef = useRef();

  // POOLS
  const initPool = (ALL_ITEMS, size) => ({
    nextIdx: size,
    data: Array.from({ length: size }).map((_, i) => (i < ALL_ITEMS.length ? { ...ALL_ITEMS[i], active: true } : { active: false, worldZ: 1000 })),
    refs: Array.from({ length: size }).map(() => null)
  });

  const pines = useRef(initPool(ALL_PINES, PINE_POOL_SIZE));
  const bushes = useRef(initPool(ALL_BUSHES, BUSH_POOL_SIZE));
  const boulders = useRef(initPool(ALL_BOULDERS, BOULDER_POOL_SIZE));
  const ramps = useRef(initPool(ALL_RAMPS, RAMP_POOL_SIZE));

  const presentsData = useRef(ALL_PRESENTS.map(p => ({ ...p, active: true })));
  const presentRefs = useRef([]);

  const trailData = useRef(new Array(TRAIL_COUNT).fill({ active: false, x: 0, z: 0 }));
  const trailIndex = useRef(0);

  const popData = useRef(new Array(5).fill({ active: false, x: 0, y: 0, z: 0, age: 0 }));
  const popIndex = useRef(0);
  const popRefs = useRef([]);

  // Setup friends at the finish line
  const friendsStatic = useMemo(() => Array.from({ length: FRIEND_COUNT }).map(() => Math.floor(Math.random() * 8)), []);
  const friendRefs = useRef([]);

  const textures = useTexture({ normal: './faces/face_normal.png', jump: './faces/face_jump.png', dodge: './faces/face_dodge.png', crash: './faces/face_crash.png' });
  Object.values(textures).forEach(tex => tex.colorSpace = THREE.SRGBColorSpace);
  const faceStateRef = useRef('normal');
  useEffect(() => { faceStateRef.current = 'normal'; }, []); 

  // --- THE MASTER LOOP ---
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const time = state.clock.elapsedTime;

    if (time < hitStopTime.current) return;

    // 3. SKIER PHYSICS & INPUT
    if (!isGameOverRef.current && !isGameWonRef.current && !flipState.current.active) {
      let ax = 0;
      if (keysRef.current.left || touchStateRef.current === -1) ax -= 60;
      if (keysRef.current.right || touchStateRef.current === 1) ax += 60;
      
      skierVXRef.current += ax * dt;
      skierVXRef.current *= 0.85;
      skierXRef.current += skierVXRef.current * dt;
      skierXRef.current = Math.max(-BOUNDARY + 1, Math.min(BOUNDARY - 1, skierXRef.current));
    }

    // 4. WORLD PHYSICS
    if (!isGameOverRef.current && !isGameWonRef.current) {
      worldDistance.current += speedRef.current * dt;
    }
    const slopeAngle = Math.sin(worldDistance.current * 0.02) * 0.15;
    
    if (worldGroup.current) {
      worldGroup.current.rotation.x = THREE.MathUtils.lerp(worldGroup.current.rotation.x, slopeAngle, dt * 2);
    }
    
    let targetSpeed = Math.max(8, BASE_SPEED + (slopeAngle * 60));
    if (isGameOverRef.current || isGameWonRef.current) {
      speedRef.current = THREE.MathUtils.lerp(speedRef.current, 0, dt * 5);
    } else {
      speedRef.current = THREE.MathUtils.lerp(speedRef.current, targetSpeed, dt);
    }

    // 5. SKIER ANIMATION & FLIPS
    if (skierGroup.current) {
      skierGroup.current.position.x = skierXRef.current;
      
      const tilt = (skierXRef.current - skierGroup.current.position.x) * 2;
      skierGroup.current.rotation.z = -tilt * 0.1;
      skierGroup.current.rotation.y = -tilt * 0.15;

      if (isGameOverRef.current) {
        skierGroup.current.rotation.x = THREE.MathUtils.lerp(skierGroup.current.rotation.x, -Math.PI / 2, dt * 5);
        skierGroup.current.position.y = THREE.MathUtils.lerp(skierGroup.current.position.y, -0.2, dt * 5);
      } else if (isGameWonRef.current) {
        skierGroup.current.rotation.x = 0;
        skierGroup.current.position.y = 0;
        skierGroup.current.rotation.y = THREE.MathUtils.lerp(skierGroup.current.rotation.y, Math.PI, dt * 2); // Turn around to face camera
      } else if (flipState.current.active) {
        flipState.current.time += dt;
        const flipProgress = flipState.current.time / 1.5; 
        
        if (flipProgress >= 1.0) {
          flipState.current.active = false;
          skierGroup.current.rotation.x = 0;
          skierGroup.current.position.y = 0;
        } else {
          skierGroup.current.position.y = 4 * 6 * flipProgress * (1 - flipProgress);
          skierGroup.current.rotation.x = -flipProgress * Math.PI * 2;
        }
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

    // 6. CAMERA
    if (trauma.current > 0) trauma.current = Math.max(0, trauma.current - dt * 1.2);
    const shake = trauma.current * trauma.current;
    
    const targetCamX = skierXRef.current * 0.4;
    let baseCamX = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, dt * 3);
    let baseCamY = THREE.MathUtils.lerp(state.camera.position.y, isGameOverRef.current ? 8 : (flipState.current.active ? 10 : 4.5), dt * 2);
    let baseCamZ = THREE.MathUtils.lerp(state.camera.position.z, isGameOverRef.current ? 20 : 12, dt * 2);
    
    if (isGameWonRef.current) {
      baseCamX = THREE.MathUtils.lerp(state.camera.position.x, skierXRef.current + Math.sin(time) * 15, dt * 2);
      baseCamY = THREE.MathUtils.lerp(state.camera.position.y, 10, dt * 2);
      baseCamZ = THREE.MathUtils.lerp(state.camera.position.z, 20 + Math.cos(time) * 15, dt * 2);
    }

    if (shake > 0) {
      const shakeTime = time * 30.0;
      state.camera.position.set(baseCamX + (0.8 * shake * Math.sin(shakeTime * 1.7)), baseCamY + (0.8 * shake * Math.sin(shakeTime * 2.3)), baseCamZ);
    } else {
      state.camera.position.set(baseCamX, baseCamY, baseCamZ);
    }
    state.camera.lookAt(skierXRef.current * (isGameWonRef.current ? 1 : 0.2), isGameWonRef.current ? 2 : 0, isGameWonRef.current ? 0 : -5);

    // 7. POOL RENDER & COLLISION
    let hitObstacle = false;
    let grabbedId = null;

    const processObstaclePool = (pool, ALL_ITEMS, hitRadius) => {
      for (let i = 0; i < pool.data.length; i++) {
        let item = pool.data[i];
        if (!item.active) continue;
        
        let localZ = item.worldZ + worldDistance.current;
        
        if (!isGameOverRef.current && !isGameWonRef.current && !flipState.current.active && localZ > -1 && localZ < 1.5) {
          if (Math.abs(item.x - skierXRef.current) < hitRadius) hitObstacle = true;
        }
        
        if (localZ > DESPAWN_Z) {
          if (pool.nextIdx < ALL_ITEMS.length) {
            const nextItem = ALL_ITEMS[pool.nextIdx];
            item.x = nextItem.x;
            item.worldZ = nextItem.worldZ;
            pool.nextIdx++;
            localZ = item.worldZ + worldDistance.current;
          } else {
            item.active = false;
            localZ = 1000;
          }
        }
        if (pool.refs[i]) pool.refs[i].position.set(item.x, 0, localZ);
      }
    };

    processObstaclePool(pines.current, ALL_PINES, 1.8);
    processObstaclePool(bushes.current, ALL_BUSHES, 1.5);
    processObstaclePool(boulders.current, ALL_BOULDERS, 1.8);

    // Update Ramps
    const rPool = ramps.current;
    for (let i = 0; i < rPool.data.length; i++) {
      let item = rPool.data[i];
      if (!item.active) continue;
      let localZ = item.worldZ + worldDistance.current;
      
      if (!isGameOverRef.current && !isGameWonRef.current && !flipState.current.active && localZ > -1 && localZ < 1.5) {
        if (Math.abs(item.x - skierXRef.current) < 2.0) {
          flipState.current.active = true;
          flipState.current.time = 0;
          faceStateRef.current = 'jump';
          handleSetFace('jump');
        }
      }
      
      if (localZ > DESPAWN_Z) {
        if (rPool.nextIdx < ALL_RAMPS.length) {
          const nextItem = ALL_RAMPS[rPool.nextIdx];
          item.x = nextItem.x;
          item.worldZ = nextItem.worldZ;
          rPool.nextIdx++;
          localZ = item.worldZ + worldDistance.current;
        } else {
          item.active = false;
          localZ = 1000;
        }
      }
      if (rPool.refs[i]) rPool.refs[i].position.set(item.x, 0, localZ);
    }

    // Update Presents
    for (let i = 0; i < presentsData.current.length; i++) {
      let p = presentsData.current[i];
      if (!p.active) continue;
      
      let localZ = p.worldZ + worldDistance.current;
      
      if (!isGameOverRef.current && !isGameWonRef.current && !p.collected && localZ > -1 && localZ < 1.5) {
        if (Math.abs(p.x - skierXRef.current) < 1.6 && !flipState.current.active) { 
          grabbedId = i;
          p.collected = true;
          p.scale = 1.5;
        }
      }
      
      if (p.collected) p.scale = THREE.MathUtils.lerp(p.scale, 0, dt * 15);
      
      if (presentRefs.current[i]) {
        presentRefs.current[i].position.set(p.x, 0, localZ);
        presentRefs.current[i].scale.setScalar(p.scale);
      }
    }

    // Finish Line & Friends
    let finishZ = FINISH_LINE_WORLD_Z + worldDistance.current;
    if (finishLineRef.current) finishLineRef.current.position.set(0, 0, finishZ);
    
    for (let i = 0; i < FRIEND_COUNT; i++) {
      if (friendRefs.current[i]) {
        const jumpY = Math.abs(Math.sin(time * 8 + (i * Math.PI/4))) * 1.5;
        if (finishZ > -100) {
          friendRefs.current[i].position.set((i - FRIEND_COUNT/2) * 2, jumpY, finishZ - 5 + (i % 2)*2);
        } else {
          let localZ = ((worldDistance.current + i * 50) % 300) - 200;
          let xPos = (i % 2 === 0 ? -11 : 11) + (i % 3); // Sides
          friendRefs.current[i].position.set(xPos, jumpY, localZ);
        }
      }
    }

    if (!isGameWonRef.current && finishZ > 0) {
      isGameWonRef.current = true;
      setIsGameWon(true);
      faceStateRef.current = 'jump';
      handleSetFace('jump');
    }

    // F. Process Hits/Grabs
    if (hitObstacle && !isGameOverRef.current) {
      isGameOverRef.current = true;
      setIsGameOver(true);
      faceStateRef.current = 'crash';
      handleSetFace('crash');
      trauma.current = 1.0;
      hitStopTime.current = time + 0.12;
    } else if (grabbedId !== null && !isGameOverRef.current) {
      faceStateRef.current = 'jump';
      handleSetFace('jump');
      addScore();
      
      const idx = popIndex.current;
      popData.current[idx] = { active: true, x: presentsData.current[grabbedId].x, y: 2, z: presentsData.current[grabbedId].worldZ + worldDistance.current, age: 0 };
      popIndex.current = (idx + 1) % 5;
    }

    // 8. UPDATE PARTICLES
    if (!isGameOverRef.current && !isGameWonRef.current && !flipState.current.active) {
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
        if (pop.age > 1.0) pop.active = false;
        
        if (popRefs.current[i]) {
          popRefs.current[i].position.set(pop.x, pop.y, pop.z);
          popRefs.current[i].fillOpacity = Math.max(0, 1.0 - pop.age);
        }
      } else {
        if (popRefs.current[i]) popRefs.current[i].position.set(0, -100, 0);
      }
    }
  });

  return (
    <group ref={worldGroup}>
      <Ground />
      
      <instancedMesh ref={trailMeshRef} args={[null, null, TRAIL_COUNT]}>
        <boxGeometry args={[0.8, 0.05, 3]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={0.8} />
      </instancedMesh>
      
      {Array.from({ length: PINE_POOL_SIZE }).map((_, i) => (
        <ProceduralObstacle key={`pine-${i}`} type={0} ref={el => pines.current.refs[i] = el} />
      ))}
      {Array.from({ length: BUSH_POOL_SIZE }).map((_, i) => (
        <ProceduralObstacle key={`bush-${i}`} type={1} ref={el => bushes.current.refs[i] = el} />
      ))}
      {Array.from({ length: BOULDER_POOL_SIZE }).map((_, i) => (
        <ProceduralObstacle key={`boulder-${i}`} type={3} ref={el => boulders.current.refs[i] = el} />
      ))}

      {Array.from({ length: RAMP_POOL_SIZE }).map((_, i) => (
        <SkiRamp key={`ramp-${i}`} ref={el => ramps.current.refs[i] = el} />
      ))}
      
      <FinishLine ref={finishLineRef} />

      {ALL_PRESENTS.map((p, i) => (
        <PremiumPresent key={`present-${i}`} color={['#ff0000', '#00ff00', '#0000ff'][i%3]} rotationY={Math.PI/4} ref={el => presentRefs.current[i] = el} />
      ))}

      {friendsStatic.map((textureId, i) => (
        <CheeringFriend key={`friend-${i}`} textureId={textureId} ref={el => friendRefs.current[i] = el} />
      ))}

      {Array.from({length: 5}).map((_, i) => (
        <FloatingScore key={`pop-${i}`} ref={el => popRefs.current[i] = el} />
      ))}

      <group ref={skierGroup} position={[0, 0, 0]}>
        <Sparkles count={30} scale={[2, 0.5, 2]} size={3} speed={0.4} opacity={isGameOverRef.current || isGameWonRef.current ? 0 : 0.8} color="#ffffff" position={[0, 0.2, 0.5]} />
        
        <mesh position={[0, 1, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.3, 0.8, 4, 16]} />
          <meshStandardMaterial color="#ff1493" roughness={0.6} metalness={0.1} />
        </mesh>
        
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
        
        <Billboard position={[0, 2.3, 0.1]} args={[2.5, 2.5]}>
          <mesh>
            <circleGeometry args={[1.2, 32]} />
            <meshBasicMaterial map={textures[faceStateRef.current]} />
          </mesh>
        </Billboard>

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
  const [isGameWon, setIsGameWon] = useState(false);
  const [faceState, setFaceState] = useState('normal');
  
  const skierXRef = useRef(0);
  const skierVXRef = useRef(0);
  const speedRef = useRef(BASE_SPEED);
  const isGameOverRef = useRef(false);
  const isGameWonRef = useRef(false);

  const keysRef = useRef({ left: false, right: false });
  const touchStateRef = useRef(0);

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
    window.location.reload(); 
  };

  return (
    <div className="fixed inset-0 z-[600] bg-sky-300 overflow-hidden select-none touch-none">
      
      <div className="absolute top-4 left-4 z-10 font-sans">
        <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] flex items-center gap-2">
          🎁 <span style={{ textShadow: '0 0 20px #ff1493' }}>{score} / 200</span>
        </h1>
      </div>

      <div className="absolute top-4 right-4 z-10 w-28 h-28 md:w-48 md:h-48 rounded-full border-4 border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.5)] overflow-hidden bg-zinc-800">
        <div className="absolute bottom-0 w-full text-center bg-pink-500 text-white text-xs font-bold py-1 z-20 shadow-lg">LADA CAM</div>
        <img 
          src={`./faces/face_${faceState}.png`} 
          alt="Lada Cam"
          className="w-full h-full object-cover transition-all duration-150"
          style={{ transform: faceState === 'crash' ? 'scale(1.4) rotate(-15deg)' : 'scale(1.1)' }}
        />
      </div>

      {isGameOver && !isGameWon && (
        <div className="absolute inset-0 z-50 bg-black/40 flex flex-col items-center justify-center backdrop-blur-md">
          <div className="bg-white/10 p-12 rounded-3xl border border-white/20 shadow-[0_0_100px_rgba(236,72,153,0.3)] flex flex-col items-center text-center">
            <h2 className="text-6xl md:text-8xl font-black text-white mb-6 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] rotate-[-4deg]">WIPEOUT!</h2>
            <img src={`./faces/face_crash.png`} className="w-48 h-48 rounded-full border-8 border-pink-500 shadow-2xl mb-8 object-cover" alt="Crash Face" />
            <button onClick={restartGame} className="px-12 py-6 bg-pink-500 hover:bg-pink-400 text-white text-3xl font-black rounded-full shadow-[0_0_40px_rgba(236,72,153,1)] border-4 border-white transition hover:scale-110 active:scale-95">
              Try Again ⛷️
            </button>
          </div>
        </div>
      )}

      {isGameWon && (
        <div className="absolute inset-0 z-50 bg-black/10 flex flex-col items-center justify-center animate-in fade-in duration-1000">
          <div className="bg-white/20 p-12 rounded-3xl border border-white/40 shadow-[0_0_100px_rgba(255,255,255,0.8)] flex flex-col items-center text-center backdrop-blur-lg mt-20">
            <h2 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 mb-6 drop-shadow-[0_5px_5px_rgba(0,0,0,0.3)]">HAPPY BIRTHDAY!</h2>
            <img src={`./faces/face_jump.png`} className="w-48 h-48 rounded-full border-8 border-white shadow-2xl mb-8 object-cover animate-bounce" alt="Win Face" />
            <p className="text-4xl text-white font-bold mb-10 drop-shadow-md">You collected {score/100} / 2 Gifts!</p>
            <button onClick={restartGame} className="px-12 py-6 bg-cyan-500 hover:bg-cyan-400 text-white text-3xl font-black rounded-full shadow-[0_0_40px_rgba(6,182,212,1)] border-4 border-white transition hover:scale-110 active:scale-95">
              Play Again ⛷️
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-10 left-0 right-0 px-8 flex justify-between z-40 md:hidden pointer-events-none">
        <button onPointerDown={() => touchStateRef.current = -1} onPointerUp={() => touchStateRef.current = 0} onPointerLeave={() => touchStateRef.current = 0} className="w-24 h-24 bg-white/20 border-2 border-white/50 rounded-full flex items-center justify-center backdrop-blur-md active:bg-white/40 pointer-events-auto shadow-[0_0_20px_rgba(255,255,255,0.3)]"><span className="text-4xl text-white font-black">←</span></button>
        <button onPointerDown={() => touchStateRef.current = 1} onPointerUp={() => touchStateRef.current = 0} onPointerLeave={() => touchStateRef.current = 0} className="w-24 h-24 bg-white/20 border-2 border-white/50 rounded-full flex items-center justify-center backdrop-blur-md active:bg-white/40 pointer-events-auto shadow-[0_0_20px_rgba(255,255,255,0.3)]"><span className="text-4xl text-white font-black">→</span></button>
      </div>

      <Canvas shadows camera={{ position: [0, 4.5, 12], fov: 60 }}>
        <color attach="background" args={['#87CEEB']} />
        <ambientLight intensity={0.4} />
        <directionalLight castShadow position={[10, 30, 10]} intensity={1.5} shadow-mapSize={[512, 512]}>
          <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20, 1, 100]} />
        </directionalLight>
        <fog attach="fog" args={['#87CEEB', 20, 100]} />
        <React.Suspense fallback={null}>
          <GameManager 
            skierXRef={skierXRef} skierVXRef={skierVXRef} speedRef={speedRef} keysRef={keysRef} touchStateRef={touchStateRef}
            isGameOverRef={isGameOverRef} setIsGameOver={setIsGameOver} isGameWonRef={isGameWonRef} setIsGameWon={setIsGameWon}
            addScore={() => setScore(s => s + 100)} setFaceState={setFaceState}
          />
        </React.Suspense>
      </Canvas>
    </div>
  );
}
