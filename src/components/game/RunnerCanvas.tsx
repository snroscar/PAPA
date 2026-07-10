import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Sparkles, Stars, Float } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useGame } from "@/store/gameStore";
import type { Chapter } from "@/data/chapters";
import { nextDynamicRescueLine, nextEncouragement, primeAiLines, chapterFourCagedTestimony } from "@/lib/dialogue";
import { generateTestimonies } from "@/lib/ai.functions";
import { startMusic, stopMusic, getSongDuration, onSongReady } from "@/lib/music";

const LANES = [-2.2, 0, 2.2];
const PLAYER_Z = 4;

type EntityKind = "low" | "high" | "full" | "soul" | "gem" | "chest" | "demon" | "spike" | "fire" | "lava" | "caged_soul";
interface Entity {
  id: number;
  kind: EntityKind;
  lane: number;
  z: number;
  taken?: boolean;
  freed?: boolean;
}

interface Controls {
  moveLeft: () => void;
  moveRight: () => void;
  jump: () => void;
  slide: () => void;
}

/* ---------------- Player ---------------- */
function Player({
  chapter,
  controlsRef,
  angelicMode,
}: {
  chapter: Chapter;
  controlsRef: React.MutableRefObject<Controls | null>;
  angelicMode: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const lane = useRef(1);
  const y = useRef(0);
  const vy = useRef(0);
  const sliding = useRef(false);
  const slideTimer = useRef(0);
  const invuln = useRef(0);

  const companion = useGame((s) => s.companionActive);
  const loseLife = useGame((s) => s.loseLife);
  const rescueSoul = useGame((s) => s.rescueSoul);
  const collect = useGame((s) => s.collect);
  const activateCompanion = useGame((s) => s.activateCompanion);

  useEffect(() => {
    controlsRef.current = {
      moveLeft: () => (lane.current = Math.max(0, lane.current - 1)),
      moveRight: () => (lane.current = Math.min(2, lane.current + 1)),
      jump: () => {
        if (y.current <= 0.01) vy.current = 12;
      },
      slide: () => {
        sliding.current = true;
        slideTimer.current = 0.6;
      },
    };
  }, [controlsRef]);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    // horizontal lerp
    const targetX = LANES[lane.current];
    if (group.current) {
      group.current.position.x += (targetX - group.current.position.x) * Math.min(1, d * 12);
      // jump physics
      vy.current -= 34 * d;
      y.current = Math.max(0, y.current + vy.current * d);
      group.current.position.y = y.current;
      // slide
      if (sliding.current) {
        slideTimer.current -= d;
        if (slideTimer.current <= 0) sliding.current = false;
      }
      // run bob + lean
      const t = performance.now() / 1000;
      if (body.current) {
        const bob = Math.abs(Math.sin(t * 12)) * 0.08;
        body.current.position.y = sliding.current ? -0.35 : bob;
        body.current.scale.y = sliding.current ? 0.55 : 1;
        body.current.rotation.z = (targetX - group.current.position.x) * 0.12;
      }
      // limb running animation
      const swing = Math.sin(t * 12) * (y.current > 0.1 ? 0.4 : 1);
      if (armL.current) armL.current.rotation.x = swing * 1.1;
      if (armR.current) armR.current.rotation.x = -swing * 1.1;
      if (legL.current) legL.current.rotation.x = -swing * 0.9;
      if (legR.current) legR.current.rotation.x = swing * 0.9;
    }
    if (invuln.current > 0) invuln.current -= d;
  });

  useEffect(() => {
    // publish collision resolver
    hitApi.resolve = (e: Entity, chapterId?: number) => {
      const pLane = lane.current;
      if (e.lane !== pLane) return "miss";
      const isObstacle = ["low", "high", "full", "demon", "spike", "fire", "lava"].includes(e.kind);
      if (angelicMode && isObstacle) return "miss";
      if (e.kind === "soul") {
        rescueSoul();
        return "hit";
      }
      if (e.kind === "caged_soul") {
        // Free the caged soul without collecting yet
        e.freed = true;
        rescueSoul();
        return "hit";
      }
      if (e.kind === "gem") {
        collect();
        return "hit";
      }
      if (e.kind === "chest") {
        activateCompanion();
        collect();
        if (chapterId === 4) {
          window.dispatchEvent(
            new CustomEvent("gj-toast", {
              detail: "Heaven blessed me with a rib PROPHETESS BEATRICE APPAU BEDIAKO",
            }),
          );
        }
        return "hit";
      }
      // obstacles
      // Chapter 1 (His Birth): ANY obstacle hits end the level immediately
      if (chapterId === 1) {
        if (invuln.current > 0) return "miss";
        invuln.current = 1.1;
        loseLife();
        return "damage";
      }
      // Other chapters: dodgeable obstacles
      if (e.kind === "low" && y.current > 1.2) return "miss"; // jumped over
      if (e.kind === "high" && sliding.current) return "miss"; // slid under
      if (e.kind === "spike" && y.current > 1.2) return "miss"; // jumped over spikes
      if (e.kind === "fire" && sliding.current) return "miss"; // slid under fire
      // demon, lava, and others cannot be dodged - must change lanes
      if (invuln.current > 0) return "miss";
      invuln.current = 1.1;
      loseLife();
      return "damage";
    };
  }, [loseLife, rescueSoul, collect, activateCompanion]);

  const robeColor = chapter.id === 3 ? "#7a2f22" : "#8a2b22";

  return (
    <group ref={group} position={[LANES[1], 0, PLAYER_Z]}>
      <group ref={body}>
        <CartoonHero
          robeColor={robeColor}
          accent={chapter.accent}
          armL={armL}
          armR={armR}
          legL={legL}
          legR={legR}
        />
        <pointLight position={[0, 1.7, 0]} intensity={1.6} distance={4} color={chapter.accent} />
      </group>
      {companion && (
        <group position={[-1.05, 0, 0.25]}>
          <CartoonCompanion />
          <Sparkles count={14} scale={1.5} size={3} color="#ffd8ec" speed={0.4} />
        </group>
      )}
      {angelicMode && (
        <group>
          <Sparkles count={24} scale={2.2} size={4} color="#fff6c2" speed={0.5} />
          <pointLight position={[0, 1.8, 0]} intensity={2.4} distance={5} color="#ffe8a6" />
        </group>
      )}
    </group>
  );
}

/* ---------------- Character models ---------------- */
const SKIN = "#8a5a3c";

function CartoonHero({
  robeColor,
  accent,
  armL,
  armR,
  legL,
  legR,
}: {
  robeColor: string;
  accent: string;
  armL: React.RefObject<THREE.Group | null>;
  armR: React.RefObject<THREE.Group | null>;
  legL: React.RefObject<THREE.Group | null>;
  legR: React.RefObject<THREE.Group | null>;
}) {
  return (
    <group>
      {/* LEGS - more proportional and detailed */}
      <group ref={legL} position={[-0.15, 0.55, 0]}>
        {/* thigh in robe */}
        <mesh castShadow position={[0, -0.18, 0]}>
          <capsuleGeometry args={[0.12, 0.35, 6, 12]} />
          <meshStandardMaterial color={robeColor} roughness={0.6} />
        </mesh>
        {/* shin/calf visible below robe */}
        <mesh castShadow position={[0, -0.45, 0]}>
          <capsuleGeometry args={[0.11, 0.32, 6, 12]} />
          <meshStandardMaterial color="#3a2b4a" roughness={0.7} />
        </mesh>
        {/* foot */}
        <mesh castShadow position={[0, -0.63, 0.08]}>
          <boxGeometry args={[0.16, 0.11, 0.3]} />
          <meshStandardMaterial color="#241820" roughness={0.8} />
        </mesh>
      </group>
      <group ref={legR} position={[0.15, 0.55, 0]}>
        {/* thigh in robe */}
        <mesh castShadow position={[0, -0.18, 0]}>
          <capsuleGeometry args={[0.12, 0.35, 6, 12]} />
          <meshStandardMaterial color={robeColor} roughness={0.6} />
        </mesh>
        {/* shin/calf visible below robe */}
        <mesh castShadow position={[0, -0.45, 0]}>
          <capsuleGeometry args={[0.11, 0.32, 6, 12]} />
          <meshStandardMaterial color="#3a2b4a" roughness={0.7} />
        </mesh>
        {/* foot */}
        <mesh castShadow position={[0, -0.63, 0.08]}>
          <boxGeometry args={[0.16, 0.11, 0.3]} />
          <meshStandardMaterial color="#241820" roughness={0.8} />
        </mesh>
      </group>

      {/* TORSO - more detailed robe with layering */}
      {/* outer robe - flowing shape */}
      <mesh castShadow position={[0, 0.72, 0]}>
        <capsuleGeometry args={[0.32, 0.62, 8, 16]} />
        <meshStandardMaterial color={robeColor} roughness={0.65} metalness={0.05} />
      </mesh>
      {/* robe shoulder pads */}
      <mesh castShadow position={[-0.38, 1.08, 0]}>
        <capsuleGeometry args={[0.12, 0.22, 6, 12]} rotation-z={Math.PI / 2} />
        <meshStandardMaterial color={robeColor} roughness={0.65} metalness={0.05} />
      </mesh>
      <mesh castShadow position={[0.38, 1.08, 0]}>
        <capsuleGeometry args={[0.12, 0.22, 6, 12]} rotation-z={Math.PI / 2} />
        <meshStandardMaterial color={robeColor} roughness={0.65} metalness={0.05} />
      </mesh>
      {/* decorative sash/belt - more prominent */}
      <mesh position={[0, 0.65, 0.02]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.68, 0.16, 0.44]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.4} roughness={0.45} metalness={0.1} />
      </mesh>
      {/* inner tunic detail */}
      <mesh position={[0, 0.75, 0.03]}>
        <capsuleGeometry args={[0.25, 0.48, 8, 14]} />
        <meshStandardMaterial color="#6a1b1a" roughness={0.7} />
      </mesh>

      {/* ARMS - more realistic proportions and hands */}
      <group ref={armL} position={[-0.36, 1.08, 0]}>
        {/* upper arm in robe */}
        <mesh castShadow position={[0, -0.15, 0]}>
          <capsuleGeometry args={[0.1, 0.28, 6, 12]} />
          <meshStandardMaterial color={robeColor} roughness={0.6} />
        </mesh>
        {/* forearm */}
        <mesh castShadow position={[0, -0.42, 0]}>
          <capsuleGeometry args={[0.09, 0.32, 6, 12]} />
          <meshStandardMaterial color={robeColor} roughness={0.6} />
        </mesh>
        {/* hand - more detailed */}
        <mesh position={[0, -0.62, 0]}>
          <boxGeometry args={[0.12, 0.14, 0.14]} />
          <meshStandardMaterial color={SKIN} roughness={0.5} />
        </mesh>
        {/* fingers suggestion */}
        <mesh position={[-0.04, -0.68, 0.03]}>
          <boxGeometry args={[0.03, 0.08, 0.06]} />
          <meshStandardMaterial color={SKIN} roughness={0.5} />
        </mesh>
        <mesh position={[0.04, -0.68, 0.03]}>
          <boxGeometry args={[0.03, 0.08, 0.06]} />
          <meshStandardMaterial color={SKIN} roughness={0.5} />
        </mesh>
      </group>
      <group ref={armR} position={[0.36, 1.08, 0]}>
        {/* upper arm in robe */}
        <mesh castShadow position={[0, -0.15, 0]}>
          <capsuleGeometry args={[0.1, 0.28, 6, 12]} />
          <meshStandardMaterial color={robeColor} roughness={0.6} />
        </mesh>
        {/* forearm */}
        <mesh castShadow position={[0, -0.42, 0]}>
          <capsuleGeometry args={[0.09, 0.32, 6, 12]} />
          <meshStandardMaterial color={robeColor} roughness={0.6} />
        </mesh>
        {/* hand - more detailed */}
        <mesh position={[0, -0.62, 0]}>
          <boxGeometry args={[0.12, 0.14, 0.14]} />
          <meshStandardMaterial color={SKIN} roughness={0.5} />
        </mesh>
        {/* fingers suggestion */}
        <mesh position={[-0.04, -0.68, 0.03]}>
          <boxGeometry args={[0.03, 0.08, 0.06]} />
          <meshStandardMaterial color={SKIN} roughness={0.5} />
        </mesh>
        <mesh position={[0.04, -0.68, 0.03]}>
          <boxGeometry args={[0.03, 0.08, 0.06]} />
          <meshStandardMaterial color={SKIN} roughness={0.5} />
        </mesh>
      </group>

      {/* NECK */}
      <mesh castShadow position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.16, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.48} />
      </mesh>

      {/* HEAD - more realistic proportions and features */}
      {/* face base - more elongated and realistic */}
      <mesh castShadow position={[0, 1.52, 0]}>
        <sphereGeometry args={[0.26, 28, 28]} />
        <meshStandardMaterial color={SKIN} roughness={0.42} />
      </mesh>

      {/* EARS */}
      <mesh castShadow position={[-0.27, 1.48, 0.05]}>
        <sphereGeometry args={[0.08, 14, 14]} />
        <meshStandardMaterial color={SKIN} roughness={0.48} />
      </mesh>
      <mesh position={[-0.27, 1.48, 0.08]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshStandardMaterial color="#9a6a4a" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0.27, 1.48, 0.05]}>
        <sphereGeometry args={[0.08, 14, 14]} />
        <meshStandardMaterial color={SKIN} roughness={0.48} />
      </mesh>
      <mesh position={[0.27, 1.48, 0.08]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshStandardMaterial color="#9a6a4a" roughness={0.6} />
      </mesh>

      {/* HAIR - more detailed and realistic */}
      {/* top hair */}
      <mesh castShadow position={[0, 1.68, -0.02]}>
        <sphereGeometry args={[0.27, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
        <meshStandardMaterial color="#1b1410" roughness={0.8} />
      </mesh>
      {/* back hair */}
      <mesh castShadow position={[0, 1.4, -0.22]}>
        <sphereGeometry args={[0.2, 20, 20, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
        <meshStandardMaterial color="#1b1410" roughness={0.85} />
      </mesh>
      {/* side hair tufts */}
      <mesh castShadow position={[-0.22, 1.55, 0.1]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#1b1410" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.22, 1.55, 0.1]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#1b1410" roughness={0.8} />
      </mesh>

      {/* BEARD & FACIAL HAIR - more defined */}
      <mesh position={[0, 1.35, 0.16]}>
        <sphereGeometry args={[0.18, 18, 18]} />
        <meshStandardMaterial color="#241a12" roughness={0.87} />
      </mesh>
      {/* beard texture variation */}
      <mesh position={[-0.1, 1.32, 0.15]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#1b1410" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 1.32, 0.15]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#1b1410" roughness={0.9} />
      </mesh>

      {/* NOSE */}
      <mesh position={[0, 1.48, 0.22]}>
        <boxGeometry args={[0.055, 0.11, 0.08]} />
        <meshStandardMaterial color="#9a6a4a" roughness={0.5} />
      </mesh>

      {/* MOUTH/SMILE INDICATION */}
      <mesh position={[0, 1.32, 0.23]}>
        <boxGeometry args={[0.12, 0.04, 0.02]} />
        <meshStandardMaterial color="#5a3a2a" roughness={0.6} />
      </mesh>

      {/* EYEBROWS - more expressive */}
      <mesh position={[-0.12, 1.58, 0.22]}>
        <boxGeometry args={[0.12, 0.03, 0.02]} />
        <meshStandardMaterial color="#241a12" roughness={0.8} />
      </mesh>
      <mesh position={[0.12, 1.58, 0.22]}>
        <boxGeometry args={[0.12, 0.03, 0.02]} />
        <meshStandardMaterial color="#241a12" roughness={0.8} />
      </mesh>

      {/* EYES - white of eyes */}
      <mesh position={[-0.1, 1.52, 0.23]}>
        <sphereGeometry args={[0.038, 12, 12]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.3} />
      </mesh>
      <mesh position={[0.1, 1.52, 0.23]}>
        <sphereGeometry args={[0.038, 12, 12]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.3} />
      </mesh>

      {/* IRIS/PUPILS */}
      <mesh position={[-0.1, 1.52, 0.265]}>
        <sphereGeometry args={[0.022, 10, 10]} />
        <meshStandardMaterial color="#8b6f4e" roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0.1, 1.52, 0.265]}>
        <sphereGeometry args={[0.022, 10, 10]} />
        <meshStandardMaterial color="#8b6f4e" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* PUPILS with shine */}
      <mesh position={[-0.1, 1.525, 0.275]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#160d08" />
      </mesh>
      <mesh position={[0.1, 1.525, 0.275]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#160d08" />
      </mesh>

      {/* eye shine highlight */}
      <mesh position={[-0.095, 1.535, 0.28]}>
        <sphereGeometry args={[0.0045, 6, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.105, 1.535, 0.28]}>
        <sphereGeometry args={[0.0045, 6, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
      </mesh>

      {/* HALO */}
      <mesh position={[0, 1.92, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.31, 0.035, 14, 48]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.2} metalness={0.5} />
      </mesh>
    </group>
  );
}

function CartoonCompanion() {
  const dress = "#b5486a";
  return (
    <group>
      {/* DRESS - more detailed and flowing */}
      {/* lower skirt - cone shape */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <coneGeometry args={[0.35, 0.8, 18]} />
        <meshStandardMaterial color={dress} roughness={0.65} metalness={0.05} />
      </mesh>
      {/* dress bodice - upper part */}
      <mesh castShadow position={[0, 0.8, 0]}>
        <capsuleGeometry args={[0.22, 0.38, 8, 14]} />
        <meshStandardMaterial color="#9a3a5a" roughness={0.6} />
      </mesh>
      {/* dress shoulder pads/sleeve tops */}
      <mesh castShadow position={[-0.24, 0.95, 0]}>
        <capsuleGeometry args={[0.09, 0.18, 6, 12]} rotation-z={Math.PI / 2} />
        <meshStandardMaterial color={"#9a3a5a"} roughness={0.65} />
      </mesh>
      <mesh castShadow position={[0.24, 0.95, 0]}>
        <capsuleGeometry args={[0.09, 0.18, 6, 12]} rotation-z={Math.PI / 2} />
        <meshStandardMaterial color={"#9a3a5a"} roughness={0.65} />
      </mesh>
      {/* decorative waist band */}
      <mesh position={[0, 0.72, 0]}>
        <torusGeometry args={[0.22, 0.06, 8, 24]} />
        <meshStandardMaterial color="#e0a34a" emissive="#d4933a" emissiveIntensity={0.5} metalness={0.3} />
      </mesh>
      {/* dress skirt folds texture */}
      <mesh position={[0.22, 0.5, 0.02]}>
        <boxGeometry args={[0.08, 0.4, 0.06]} />
        <meshStandardMaterial color="#a54f7a" roughness={0.7} />
      </mesh>
      <mesh position={[-0.22, 0.5, 0.02]}>
        <boxGeometry args={[0.08, 0.4, 0.06]} />
        <meshStandardMaterial color="#a54f7a" roughness={0.7} />
      </mesh>

      {/* NECK */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.12, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.48} />
      </mesh>

      {/* HEAD - more realistic and expressive */}
      {/* face */}
      <mesh castShadow position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color={SKIN} roughness={0.44} />
      </mesh>

      {/* EARS */}
      <mesh castShadow position={[-0.23, 1.38, 0.04]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.48} />
      </mesh>
      <mesh position={[-0.23, 1.38, 0.065]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#9a6a4a" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0.23, 1.38, 0.04]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.48} />
      </mesh>
      <mesh position={[0.23, 1.38, 0.065]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#9a6a4a" roughness={0.6} />
      </mesh>

      {/* HAIR WRAP/HEAD COVERING - more realistic */}
      {/* base wrap around head */}
      <mesh castShadow position={[0, 1.55, -0.02]}>
        <sphereGeometry args={[0.24, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#e0a34a" roughness={0.65} />
      </mesh>
      {/* wrap back volume */}
      <mesh castShadow position={[0, 1.35, -0.24]}>
        <sphereGeometry args={[0.16, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.4]} />
        <meshStandardMaterial color="#d4933a" roughness={0.7} />
      </mesh>
      {/* wrap front detail */}
      <mesh position={[0, 1.48, 0.05]}>
        <boxGeometry args={[0.38, 0.08, 0.04]} />
        <meshStandardMaterial color="#ffc950" emissive="#f0b030" emissiveIntensity={0.4} roughness={0.5} />
      </mesh>
      {/* wrap pattern line */}
      <mesh position={[0, 1.32, -0.01]}>
        <boxGeometry args={[0.42, 0.06, 0.02]} />
        <meshStandardMaterial color="#c9853c" roughness={0.7} />
      </mesh>

      {/* EYEBROWS */}
      <mesh position={[-0.1, 1.48, 0.2]}>
        <boxGeometry args={[0.1, 0.025, 0.015]} />
        <meshStandardMaterial color="#8a5a3c" roughness={0.7} />
      </mesh>
      <mesh position={[0.1, 1.48, 0.2]}>
        <boxGeometry args={[0.1, 0.025, 0.015]} />
        <meshStandardMaterial color="#8a5a3c" roughness={0.7} />
      </mesh>

      {/* NOSE */}
      <mesh position={[0, 1.38, 0.2]}>
        <boxGeometry args={[0.045, 0.09, 0.068]} />
        <meshStandardMaterial color="#9a6a4a" roughness={0.5} />
      </mesh>

      {/* SMILE - warm expression */}
      <mesh position={[0, 1.28, 0.21]}>
        <boxGeometry args={[0.1, 0.035, 0.015]} />
        <meshStandardMaterial color="#5a3a2a" roughness={0.6} />
      </mesh>

      {/* EYES - white */}
      <mesh position={[-0.08, 1.42, 0.21]}>
        <sphereGeometry args={[0.032, 10, 10]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.3} />
      </mesh>
      <mesh position={[0.08, 1.42, 0.21]}>
        <sphereGeometry args={[0.032, 10, 10]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.3} />
      </mesh>

      {/* IRIS - brown eyes */}
      <mesh position={[-0.08, 1.42, 0.24]}>
        <sphereGeometry args={[0.019, 8, 8]} />
        <meshStandardMaterial color="#8b6f4e" roughness={0.4} metalness={0.05} />
      </mesh>
      <mesh position={[0.08, 1.42, 0.24]}>
        <sphereGeometry args={[0.019, 8, 8]} />
        <meshStandardMaterial color="#8b6f4e" roughness={0.4} metalness={0.05} />
      </mesh>

      {/* PUPILS */}
      <mesh position={[-0.08, 1.425, 0.25]}>
        <sphereGeometry args={[0.009, 8, 8]} />
        <meshStandardMaterial color="#160d08" />
      </mesh>
      <mesh position={[0.08, 1.425, 0.25]}>
        <sphereGeometry args={[0.009, 8, 8]} />
        <meshStandardMaterial color="#160d08" />
      </mesh>

      {/* EYE SHINE */}
      <mesh position={[-0.075, 1.435, 0.255]}>
        <sphereGeometry args={[0.004, 6, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0.085, 1.435, 0.255]}>
        <sphereGeometry args={[0.004, 6, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

// module-level bridge for collision resolution (single active run)
const hitApi: { resolve: (e: Entity, chapterId?: number) => "hit" | "miss" | "damage" } = {
  resolve: () => "miss",
};

/* ---------------- Entity meshes ---------------- */
function EntityMesh({ e, accent, chapterId }: { e: Entity; accent: string; chapterId: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.position.z = e.z;
  });
  const x = LANES[e.lane];

  if (e.kind === "soul") {
    // Chapter 1 (His Birth): render as open books instead of souls
    if (chapterId === 1) {
      return (
        <group ref={ref} position={[x, 0, e.z]}>
          <Float speed={2.5} floatIntensity={0.5} rotationIntensity={0.3}>
            {/* open book - two pages */}
            <mesh position={[0, 0.85, 0]} rotation={[0.1, 0, 0]}>
              <boxGeometry args={[0.6, 0.05, 0.5]} />
              <meshStandardMaterial color="#d4a574" emissive="#c49a5c" emissiveIntensity={0.8} roughness={0.4} metalness={0.1} />
            </mesh>
            {/* left page */}
            <mesh position={[-0.32, 0.88, 0.05]} rotation={[0.15, 0.15, -0.1]}>
              <boxGeometry args={[0.28, 0.45, 0.02]} />
              <meshStandardMaterial color="#f5f1eb" emissive="#fff4e0" emissiveIntensity={0.6} />
            </mesh>
            {/* right page */}
            <mesh position={[0.32, 0.88, 0.05]} rotation={[0.15, -0.15, 0.1]}>
              <boxGeometry args={[0.28, 0.45, 0.02]} />
              <meshStandardMaterial color="#f5f1eb" emissive="#fff4e0" emissiveIntensity={0.6} />
            </mesh>
            {/* book spine */}
            <mesh position={[0, 0.85, -0.01]}>
              <boxGeometry args={[0.08, 0.48, 0.02]} />
              <meshStandardMaterial color="#8b6f47" />
            </mesh>
            {/* decorative gold accent */}
            <mesh position={[0, 1.1, -0.02]}>
              <boxGeometry args={[0.5, 0.04, 0.02]} />
              <meshStandardMaterial color="#ffd700" emissive="#ffed4e" emissiveIntensity={1.2} metalness={0.8} />
            </mesh>
          </Float>
          <pointLight position={[0, 0.95, 0]} intensity={2.2} distance={3.8} color="#fff4e0" />
          <Sparkles count={12} scale={1.3} size={3} color="#fff8dc" speed={0.5} />
        </group>
      );
    }
    // Other chapters: render souls normally
    return (
      <group ref={ref} position={[x, 0, e.z]}>
        <Float speed={3} floatIntensity={0.8} rotationIntensity={0.6}>
          {/* main soul body - enhanced 3D geometry */}
          <mesh position={[0, 0.8, 0]}>
            <capsuleGeometry args={[0.24, 0.55, 6, 16]} />
            <meshStandardMaterial color="#fff8d4" emissive="#ffde6f" emissiveIntensity={1.8} metalness={0.3} roughness={0.2} />
          </mesh>
          {/* soul head */}
          <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[0.21, 20, 20]} />
            <meshStandardMaterial color="#fffadb" emissive="#ffe684" emissiveIntensity={1.6} metalness={0.2} roughness={0.3} />
          </mesh>
          {/* ethereal wisps - layered spheres for dimension */}
          <mesh position={[0.25, 0.9, 0]} scale={[0.7, 0.8, 0.7]}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color="#fff2c0" emissive="#ffdb45" emissiveIntensity={1.2} transparent opacity={0.6} />
          </mesh>
          <mesh position={[-0.25, 0.9, 0]} scale={[0.7, 0.8, 0.7]}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color="#fff2c0" emissive="#ffdb45" emissiveIntensity={1.2} transparent opacity={0.6} />
          </mesh>
          <mesh position={[0, 1.2, 0.22]} scale={[0.8, 0.7, 0.8]}>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshStandardMaterial color="#fff2c0" emissive="#ffdb45" emissiveIntensity={1.1} transparent opacity={0.5} />
          </mesh>
          {/* arms wisps */}
          <mesh position={[0.3, 1.1, -0.15]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshStandardMaterial color="#ffe9a8" emissive="#ffc94d" emissiveIntensity={1} transparent opacity={0.55} />
          </mesh>
          <mesh position={[-0.3, 1.1, -0.15]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshStandardMaterial color="#ffe9a8" emissive="#ffc94d" emissiveIntensity={1} transparent opacity={0.55} />
          </mesh>
        </Float>
        <pointLight position={[0, 1.1, 0]} intensity={2.4} distance={4} color="#ffde6f" />
        <Sparkles count={14} scale={1.4} size={3.5} color="#ffead9" speed={0.6} />
      </group>
    );
  }
  if (e.kind === "caged_soul") {
    return (
      <group ref={ref} position={[x, 0, e.z]}>
        <Float speed={2} floatIntensity={0.3} rotationIntensity={0.2}>
          {/* soul core inside cage */}
          <group position={[0, 0.85, 0]}>
            <mesh>
              <sphereGeometry args={[0.15, 14, 14]} />
              <meshStandardMaterial color="#fff2c0" emissive={e.freed ? "#ffde6f" : "#ff9944"} emissiveIntensity={e.freed ? 1.8 : 1.2} />
            </mesh>
          </group>
          {/* cage bars - vertical */}
          {e.freed ? null : (
            <>
              <mesh position={[-0.22, 0.75, 0]} castShadow>
                <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
                <meshStandardMaterial color="#3a3a3a" emissive={e.freed ? "#555555" : "#555555"} />
              </mesh>
              <mesh position={[0.22, 0.75, 0]} castShadow>
                <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
                <meshStandardMaterial color="#3a3a3a" emissive={e.freed ? "#555555" : "#555555"} />
              </mesh>
              <mesh position={[0, 0.75, 0.22]} castShadow>
                <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} rotation-z={Math.PI / 2} />
                <meshStandardMaterial color="#3a3a3a" />
              </mesh>
              <mesh position={[0, 0.75, -0.22]} castShadow>
                <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} rotation-z={Math.PI / 2} />
                <meshStandardMaterial color="#3a3a3a" />
              </mesh>
              {/* chains wrapping the cage */}
              <mesh position={[-0.1, 1.1, 0]} rotation={[0, 0, 0.4]} castShadow>
                <boxGeometry args={[0.35, 0.12, 0.08]} />
                <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.5} />
              </mesh>
              <mesh position={[0.1, 1.1, 0]} rotation={[0, 0, -0.4]} castShadow>
                <boxGeometry args={[0.35, 0.12, 0.08]} />
                <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.5} />
              </mesh>
              <mesh position={[0, 1.25, 0.15]} rotation={[0.3, 0, 0]} castShadow>
                <boxGeometry args={[0.4, 0.12, 0.08]} />
                <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.5} />
              </mesh>
            </>
          )}
        </Float>
        {/* light changes when freed */}
        <pointLight position={[0, 0.9, 0]} intensity={e.freed ? 2.8 : 1.5} distance={e.freed ? 4 : 3} color={e.freed ? "#ffde6f" : "#ff9944"} />
        {e.freed && <Sparkles count={20} scale={1.6} size={4} color="#ffead9" speed={0.8} />}
      </group>
    );
  }
  if (e.kind === "gem") {
    return (
      <group ref={ref} position={[x, 0, e.z]}>
        <Float speed={4} rotationIntensity={1.2}>
          <mesh position={[0, 0.9, 0]}>
            <octahedronGeometry args={[0.32, 0]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} metalness={0.4} roughness={0.2} />
          </mesh>
        </Float>
        <pointLight position={[0, 0.9, 0]} intensity={1.2} distance={3} color={accent} />
      </group>
    );
  }
  if (e.kind === "chest") {
    return (
      <group ref={ref} position={[x, 0, e.z]}>
        <Float speed={2} floatIntensity={0.5}>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[0.9, 0.7, 0.7]} />
            <meshStandardMaterial color="#c99a3a" emissive="#ffcf6a" emissiveIntensity={0.6} metalness={0.6} roughness={0.3} />
          </mesh>
        </Float>
        <pointLight position={[0, 1, 0]} intensity={3} distance={5} color="#ffcf6a" />
        <Sparkles count={20} scale={2} size={4} color="#fff0b0" speed={0.6} />
      </group>
    );
  }
  // obstacles
  if (e.kind === "low") {
    return (
      <group ref={ref} position={[x, 0, e.z]}>
        <mesh castShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[1.4, 0.8, 0.7]} />
          <meshStandardMaterial color="#241612" roughness={0.9} />
        </mesh>
      </group>
    );
  }
  if (e.kind === "high") {
    return (
      <group ref={ref} position={[x, 0, e.z]}>
        <mesh castShadow position={[0, 1.7, 0]}>
          <boxGeometry args={[1.6, 0.35, 0.5]} />
          <meshStandardMaterial color="#241612" roughness={0.9} />
        </mesh>
        <mesh position={[-0.7, 1, 0]}>
          <boxGeometry args={[0.12, 2, 0.12]} />
          <meshStandardMaterial color="#241612" />
        </mesh>
        <mesh position={[0.7, 1, 0]}>
          <boxGeometry args={[0.12, 2, 0.12]} />
          <meshStandardMaterial color="#241612" />
        </mesh>
      </group>
    );
  }
  // Demon - evil spirit, cannot be jumped or slid
  if (e.kind === "demon") {
    return (
      <group ref={ref} position={[x, 0, e.z]}>
        {/* demon body */}
        <mesh castShadow position={[0, 1, 0]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial color="#4a2a4a" emissive="#6a1a1a" emissiveIntensity={0.8} />
        </mesh>
        {/* demon eyes - red and angry */}
        <mesh position={[-0.12, 1.15, 0.28]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#ff3333" emissive="#ff1111" emissiveIntensity={1.2} />
        </mesh>
        <mesh position={[0.12, 1.15, 0.28]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#ff3333" emissive="#ff1111" emissiveIntensity={1.2} />
        </mesh>
        {/* demon horns */}
        <mesh castShadow position={[-0.18, 1.5, 0]}>
          <coneGeometry args={[0.08, 0.4, 8]} />
          <meshStandardMaterial color="#2a1a2a" />
        </mesh>
        <mesh castShadow position={[0.18, 1.5, 0]}>
          <coneGeometry args={[0.08, 0.4, 8]} />
          <meshStandardMaterial color="#2a1a2a" />
        </mesh>
        <pointLight position={[0, 1, 0]} intensity={2} distance={4} color="#ff3333" />
      </group>
    );
  }
  // Spike obstacle - ground spikes, can be jumped over
  if (e.kind === "spike") {
    return (
      <group ref={ref} position={[x, 0, e.z]}>
        {/* three spikes */}
        <mesh castShadow position={[-0.35, 0.3, 0]}>
          <coneGeometry args={[0.15, 0.8, 12]} />
          <meshStandardMaterial color="#3a3a3a" emissive="#555555" emissiveIntensity={0.5} />
        </mesh>
        <mesh castShadow position={[0, 0.3, 0]}>
          <coneGeometry args={[0.15, 0.8, 12]} />
          <meshStandardMaterial color="#3a3a3a" emissive="#555555" emissiveIntensity={0.5} />
        </mesh>
        <mesh castShadow position={[0.35, 0.3, 0]}>
          <coneGeometry args={[0.15, 0.8, 12]} />
          <meshStandardMaterial color="#3a3a3a" emissive="#555555" emissiveIntensity={0.5} />
        </mesh>
        {/* base */}
        <mesh castShadow position={[0, 0.05, 0]}>
          <boxGeometry args={[1.2, 0.1, 0.6]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
    );
  }
  // Fire obstacle - tall flames, can be slid under
  if (e.kind === "fire") {
    return (
      <group ref={ref} position={[x, 0, e.z]}>
        {/* flame 1 */}
        <mesh castShadow position={[-0.35, 0.8, 0]}>
          <coneGeometry args={[0.25, 1.4, 16]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff3300" emissiveIntensity={1} />
        </mesh>
        {/* flame 2 */}
        <mesh castShadow position={[0, 1, 0]}>
          <coneGeometry args={[0.3, 1.8, 16]} />
          <meshStandardMaterial color="#ff8800" emissive="#ff4400" emissiveIntensity={1.1} />
        </mesh>
        {/* flame 3 */}
        <mesh castShadow position={[0.35, 0.8, 0]}>
          <coneGeometry args={[0.25, 1.4, 16]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff3300" emissiveIntensity={1} />
        </mesh>
        <pointLight position={[0, 1, 0]} intensity={3} distance={5} color="#ff6600" />
      </group>
    );
  }
  // Lava pool - deadly, cannot be dodged, must change lanes
  if (e.kind === "lava") {
    return (
      <group ref={ref} position={[x, 0, e.z]}>
        <mesh castShadow position={[0, 0.15, 0]}>
          <boxGeometry args={[1.8, 0.3, 0.8]} />
          <meshStandardMaterial color="#cc3300" emissive="#ff5500" emissiveIntensity={1.2} />
        </mesh>
        {/* lava bubbles */}
        <mesh position={[-0.4, 0.3, -0.1]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#ff4422" emissive="#ff6644" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.3, 0.3, 0.2]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#ff4422" emissive="#ff6644" emissiveIntensity={0.8} />
        </mesh>
        <pointLight position={[0, 0.5, 0]} intensity={2.5} distance={4} color="#ff5500" />
      </group>
    );
  }
  // full wall
  return (
    <group ref={ref} position={[x, 0, e.z]}>
      <mesh castShadow position={[0, 1.1, 0]}>
        <boxGeometry args={[1.7, 2.2, 0.5]} />
        <meshStandardMaterial color="#1c110e" roughness={0.95} />
      </mesh>
    </group>
  );
}

/* ---------------- Scrolling scenery ---------------- */
function Scenery({ chapter }: { chapter: Chapter }) {
  const items = useMemo(() => {
    const arr: { x: number; z: number; h: number; s: number }[] = [];
    for (let i = 0; i < 40; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      arr.push({
        x: side * (4.5 + Math.random() * 4),
        z: -i * 6 - Math.random() * 4,
        h: 2 + Math.random() * 5,
        s: 0.6 + Math.random() * 1.4,
      });
    }
    return arr;
  }, [chapter.id]);
  const group = useRef<THREE.Group>(null);
  const spd = chapter.speed;
  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.children.forEach((c) => {
      c.position.z += spd * Math.min(dt, 0.05);
      if (c.position.z > 12) c.position.z -= 240;
    });
  });
  return (
    <group ref={group}>
      {items.map((it, i) => (
        <mesh key={i} position={[it.x, it.h / 2, it.z]} castShadow>
          <boxGeometry args={[it.s, it.h, it.s]} />
          <meshStandardMaterial color={chapter.ground} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- Ground ---------------- */
function Ground({ chapter }: { chapter: Chapter }) {
  const stripes = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!stripes.current) return;
    stripes.current.children.forEach((c) => {
      c.position.z += chapter.speed * Math.min(dt, 0.05);
      if (c.position.z > 12) c.position.z -= 120;
    });
  });
  const groundLength = chapter.id === 2 ? 300 : 260;
  const stripeCount = chapter.id === 2 ? 50 : 40;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -50]} receiveShadow>
        <planeGeometry args={[16, groundLength]} />
        <meshStandardMaterial color={chapter.ground} roughness={1} />
      </mesh>
      {/* lane path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -50]} receiveShadow>
        <planeGeometry args={[7.6, groundLength]} />
        <meshStandardMaterial color={chapter.ground} roughness={0.8} metalness={0.05} />
      </mesh>
      <group ref={stripes}>
        {Array.from({ length: stripeCount }).map((_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -i * 3]}>
            <planeGeometry args={[6.8, 0.12]} />
            <meshStandardMaterial color={chapter.accent} transparent opacity={0.25} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function FlagPole({ color, position, swayOffset }: { color: string; position: [number, number, number]; swayOffset: number }) {
  const cloth = useRef<THREE.Mesh | null>(null);

  useFrame(() => {
    if (!cloth.current) return;
    const t = performance.now() / 400;
    cloth.current.rotation.z = Math.sin(t + swayOffset) * 0.22;
    cloth.current.position.x = 0.18 + Math.sin(t * 1.7 + swayOffset) * 0.06;
  });

  return (
    <group position={position}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 3, 10]} />
        <meshStandardMaterial color="#f8f5f2" roughness={0.35} metalness={0.3} emissive="#4d4d4d" emissiveIntensity={0.08} />
      </mesh>
      <mesh ref={cloth} position={[0.28, 2.0, 0]} rotation={[0, 0, 0]}> 
        <planeGeometry args={[1.2, 0.7, 6, 1]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.25} metalness={0.1} />
      </mesh>
    </group>
  );
}

function LapCelebration({ visible, chapter }: { visible: boolean; chapter: Chapter }) {
  const group = useRef<THREE.Group | null>(null);

  useFrame(() => {
    if (!visible || !group.current) return;
    group.current.rotation.y = Math.sin(performance.now() / 900) * 0.08;
  });

  if (!visible) return null;

  return (
    <group ref={group}>
      <pointLight position={[0, 4, 7.2]} intensity={1.3} color={chapter.accent} />
      <group position={[0, 0, 7.5]}>
        {[-2.4, -0.8, 0.8, 2.4].map((x, i) => (
          <FlagPole key={i} position={[x, 0, 0]} swayOffset={i * 0.7} color={i % 2 === 0 ? chapter.accent : "#ffffff"} />
        ))}
      </group>
      <Sparkles count={28} scale={[10, 4, 10]} position={[0, 2.9, 7.5]} size={3.6} color={chapter.accent} speed={0.62} opacity={0.55} />
      <group position={[0, 1.2, 7.6]}>
        <mesh>
          <torusGeometry args={[1.5, 0.12, 12, 80]} />
          <meshStandardMaterial color={chapter.accent} emissive={chapter.accent} emissiveIntensity={0.2} roughness={0.25} metalness={0.45} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------------- World / game loop ---------------- */
function World({ chapter }: { chapter: Chapter }) {
  const controlsRef = useRef<Controls | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [showFinalLap, setShowFinalLap] = useState(false);
  const [angelicMode, setAngelicMode] = useState(false);
  const [songDuration, setSongDuration] = useState(0);
  const finalLapToastShown = useRef(false);
  const finalLapTriggered = useRef(false);
  const angelicModeTimer = useRef(0);
  const angelicModeActive = useRef(false);
  const idRef = useRef(1);
  const spawnTimer = useRef(1.2);
  const distance = useRef(0);
  const chestSpawned = useRef(false);
  const chapterCompleteQueued = useRef(false);
  const completionTimer = useRef<number | null>(null);
  const { camera } = useThree();

  const setRunProgress = useGame((s) => s.setRunProgress);
  const completeChapter = useGame((s) => s.completeChapter);
  const setFinalCard = useGame((s) => s.setFinalCard);
  const phase = useGame((s) => s.phase);
  const runProgress = useGame((s) => s.runProgress);

  // Register listener for song duration when chapter starts
  useEffect(() => {
    setSongDuration(0); // Reset
    onSongReady((duration) => {
      setSongDuration(duration);
    });
  }, [chapter.id]);

  const goal = useMemo(() => {
    if (songDuration > 0) {
      return songDuration * chapter.speed * 0.7;
    }
    // fallback to original values if song duration not available
    return chapter.id === 2 ? 700 : chapter.id === 4 ? 750 : 600 + (chapter.id - 1) * 100;
  }, [songDuration, chapter.id, chapter.speed]);
  const finalLapThreshold = 0.75;

  // keyboard + touch controls
  useEffect(() => {
    const key = (ev: KeyboardEvent) => {
      const c = controlsRef.current;
      if (!c) return;
      if (["ArrowLeft", "a", "A"].includes(ev.key)) c.moveLeft();
      else if (["ArrowRight", "d", "D"].includes(ev.key)) c.moveRight();
      else if (["ArrowUp", "w", "W", " "].includes(ev.key)) c.jump();
      else if (["ArrowDown", "s", "S"].includes(ev.key)) c.slide();
    };
    let sx = 0, sy = 0;
    const ts = (e: TouchEvent) => {
      sx = e.changedTouches[0].clientX;
      sy = e.changedTouches[0].clientY;
    };
    const te = (e: TouchEvent) => {
      const c = controlsRef.current;
      if (!c) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) c.moveRight();
        else if (dx < -30) c.moveLeft();
      } else {
        if (dy < -30) c.jump();
        else if (dy > 30) c.slide();
      }
    };
    window.addEventListener("keydown", key);
    window.addEventListener("touchstart", ts, { passive: true });
    window.addEventListener("touchend", te, { passive: true });
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("touchstart", ts);
      window.removeEventListener("touchend", te);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (completionTimer.current) {
        window.clearTimeout(completionTimer.current);
      }
    };
  }, []);

  const spawnRow = useCallback(() => {
    const roll = Math.random();
    const lane = Math.floor(Math.random() * 3);
    const list: Entity[] = [];
    if (roll < 0.38) {
      // obstacle/demon (reduced from 0.42 to make room for more souls)
      const kinds: EntityKind[] = ["low", "high", "full", "demon", "spike", "fire", "lava"];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      list.push({ id: idRef.current++, kind, lane, z: -70 });
      // side collectible in another lane most of the time (souls favored)
      // but no collectible if it's a deadly demon
      if (Math.random() < 0.75 && !["demon", "lava"].includes(kind)) {
        const other = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
        const soulRoll = Math.random();
        list.push({
          id: idRef.current++,
          kind: soulRoll < 0.7 ? (Math.random() < 0.25 ? "caged_soul" : "soul") : "gem",
          lane: other,
          z: -70,
          freed: false,
        });
      }
    } else {
      // collectible row — INCREASED souls on every stage (most spawns are souls now)
      const soulRoll = Math.random();
      const kind: EntityKind = soulRoll < 0.78 ? (Math.random() < 0.22 ? "caged_soul" : "soul") : "gem";
      list.push({ id: idRef.current++, kind, lane, z: -70, freed: false });
      // often add a soul cluster in an adjacent lane (increased frequency)
      if (Math.random() < 0.65) {
        const other = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
        const clusterRoll = Math.random();
        list.push({
          id: idRef.current++,
          kind: clusterRoll < 0.75 ? (Math.random() < 0.2 ? "caged_soul" : "soul") : "gem",
          lane: other,
          z: -74,
          freed: false,
        });
      }
    }
    setEntities((prev) => [...prev.slice(-40), ...list]);
  }, []);

  useFrame((_, dt) => {
    if (phase !== "playing") return;
    const d = Math.min(dt, 0.05);
    distance.current += chapter.speed * d;
    const prog = Math.min(1, distance.current / goal);
    setRunProgress(prog);

    // camera subtle sway
    camera.position.x += (Math.sin(performance.now() / 900) * 0.12 - camera.position.x) * 0.02;
    camera.position.y += (3.6 - camera.position.y) * 0.05;
    camera.lookAt(0, 1.1, -6);

    if (prog >= finalLapThreshold && !finalLapTriggered.current) {
      finalLapTriggered.current = true;
      setShowFinalLap(true);
      window.dispatchEvent(new CustomEvent("gj-toast", { detail: "Final Lap! Flags are waving!" }));
    }

    if (prog >= finalLapThreshold && !angelicModeActive.current) {
      angelicModeActive.current = true;
      angelicModeTimer.current = 4;
      setAngelicMode(true);
      window.dispatchEvent(new CustomEvent("gj-toast", { detail: "Angelic Mode activated!" }));
    }

    if (angelicModeActive.current) {
      angelicModeTimer.current -= d;
      if (angelicModeTimer.current <= 0) {
        angelicModeActive.current = false;
        setAngelicMode(false);
      }
    }

    // companion chest for chapter 4
    if (chapter.hasCompanion && !chestSpawned.current && prog > 0.5) {
      chestSpawned.current = true;
      setEntities((prev) => [...prev, { id: idRef.current++, kind: "chest", lane: 1, z: -70 }]);
    }

    // spawn cadence
    spawnTimer.current -= d;
    if (spawnTimer.current <= 0) {
      spawnTimer.current = Math.max(0.55, 1.25 - chapter.id * 0.08);
      spawnRow();
    }

    // move + collide
    let changed = false;
    for (const e of entities) {
      if (e.taken) continue;
      e.z += chapter.speed * d;
      if (Math.abs(e.z - PLAYER_Z) < 0.9) {
        const res = hitApi.resolve(e, chapter.id);
        if (res === "hit") {
          e.taken = true;
          changed = true;
          if (e.kind === "soul") {
            window.dispatchEvent(
              new CustomEvent("gj-toast", { detail: nextDynamicRescueLine(chapter.id) }),
            );
          } else if (e.kind === "caged_soul") {
            // caged soul redemption uses a fixed triumphant line
            window.dispatchEvent(new CustomEvent("gj-toast", { detail: chapterFourCagedTestimony() }));
          }
        }
        if (res === "damage") {
          // obstacle contact — end run immediately
          e.taken = true;
          changed = true;
          // ensure the game stops now
          // using the store's phase setter to transition to gameover
          const setPhase = useGame.getState().setPhase;
          setPhase("gameover");
          window.dispatchEvent(new CustomEvent("gj-toast", { detail: "You were struck!" }));
          break;
        }
      }
      if (e.z > 14) {
        e.taken = true;
        changed = true;
      }
    }
    if (changed) setEntities((prev) => prev.filter((e) => !e.taken));

    if (prog >= 1) {
      if (!chapterCompleteQueued.current) {
        chapterCompleteQueued.current = true;
        setShowFinalLap(true);

        if (chapter.id === 5) {
          const title = "THE TESTIMONIES OF YOUR GLOBAL IMPACT GENERAL (REV. PRINCE APPAU BEDIAKO)";
          const footer = "THANK YOU FOR ANSWERING TO THE LORD";
          setFinalCard({ title, lines: [], footer });
          completionTimer.current = window.setTimeout(() => {
            completeChapter(chapter.crown);
          }, 2600);
        } else {
          window.dispatchEvent(new CustomEvent("gj-toast", { detail: nextEncouragement() }));
          completionTimer.current = window.setTimeout(() => {
            completeChapter(chapter.crown);
          }, 1800);
        }
      }
    }
  });

  return (
    <>
      <Player chapter={chapter} controlsRef={controlsRef} angelicMode={angelicMode} />
      {entities.map((e) => (
        <EntityMesh key={e.id} e={e} accent={chapter.accent} chapterId={chapter.id} />
      ))}
      <Ground chapter={chapter} />
      <Scenery chapter={chapter} />
      <LapCelebration visible={showFinalLap || runProgress >= finalLapThreshold} chapter={chapter} />
    </>
  );
}

/* ---------------- Canvas wrapper ---------------- */
export default function RunnerCanvas({ chapter }: { chapter: Chapter }) {
  // Start the generative background score for this stage and prime live
  // OpenAI-generated rescue testimonies for the run.
  useEffect(() => {
    startMusic(chapter.id);
    let cancelled = false;
    generateTestimonies({
      data: {
        chapterTitle: chapter.title,
        chapterSubtitle: chapter.subtitle,
        mission: chapter.mission,
      },
    })
      .then((res) => {
        if (!cancelled && res?.lines?.length) primeAiLines(res.lines);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      // Don't stop music after chapter 5 so it continues on the completion screen
      if (chapter.id !== 5) {
        stopMusic();
      }
    };
  }, [chapter.id, chapter.title, chapter.subtitle, chapter.mission]);

  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0, 3.6, 9], fov: 62 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[chapter.skyBottom]} />
      <fog attach="fog" args={[chapter.fog, chapter.fogNear, chapter.fogFar]} />

      <hemisphereLight args={[chapter.skyTop, chapter.ground, 0.7]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        position={[6, 12, 4]}
        intensity={2.2}
        color={chapter.accent}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={60}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />

      {chapter.isFinal ? (
        <Stars radius={80} depth={40} count={2500} factor={4} fade speed={1} />
      ) : (
        <Sky sunPosition={[0, 0.18, -1]} turbidity={8} rayleigh={chapter.id === 3 ? 3 : 1.2} mieCoefficient={0.02} />
      )}

      <Sparkles count={60} scale={[20, 8, 40]} position={[0, 4, -18]} size={4} color={chapter.accent} speed={0.3} opacity={0.5} />

      <World chapter={chapter} />
    </Canvas>
  );
}
