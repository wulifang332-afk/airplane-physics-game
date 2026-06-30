import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

/* ─────────────── CONSTANTS & DATA ─────────────── */
const PHASES = [
  { id: "intro", label: "任务简报", icon: "📋" },
  { id: "gravity", label: "重力", icon: "⬇️" },
  { id: "lift", label: "升力", icon: "⬆️" },
  { id: "drag", label: "阻力", icon: "💨" },
  { id: "thrust", label: "推力", icon: "🔥" },
  { id: "pressure", label: "气压与流体", icon: "🌊" },
  { id: "assembly", label: "组装飞机", icon: "🔧" },
  { id: "flight", label: "试飞测试", icon: "✈️" },
];

const KNOWLEDGE = {
  gravity: {
    title: "重力 Gravity",
    formula: "F = mg",
    desc: "重力是地球对飞机的吸引力，方向始终竖直向下。飞机质量越大，重力越大。飞机要飞起来，就必须产生大于重力的升力。",
    key: "飞机质量 m × 重力加速度 g(≈9.8 m/s²)",
    color: "#ef4444",
    quiz: "一架质量为5000kg的飞机，它受到的重力大约是多少？",
    options: ["5000N", "9800N", "49000N", "500N"],
    answer: 2,
  },
  lift: {
    title: "升力 Lift",
    formula: "L = ½ρv²SCₗ",
    desc: "升力来源于机翼上下表面的气压差。机翼上表面弯曲、下表面平坦，空气流过上表面速度更快，根据伯努利原理，流速快的地方气压低，从而产生向上的升力。",
    key: "空气密度ρ、飞行速度v、机翼面积S、升力系数Cₗ",
    color: "#22c55e",
    quiz: "根据伯努利原理，机翼上表面气流速度更快，那么上表面的气压相比下表面是？",
    options: ["更高", "相同", "无法判断", "更低"],
    answer: 3,
  },
  drag: {
    title: "阻力 Drag",
    formula: "D = ½ρv²SCd",
    desc: "阻力是空气对飞机运动的阻碍。飞机的形状越流线型，阻力系数越小。飞行速度越快，阻力越大（与速度的平方成正比）。",
    key: "空气密度ρ、飞行速度v、迎风面积S、阻力系数Cd",
    color: "#f97316",
    quiz: "如果飞行速度翻倍，阻力会变为原来的几倍？",
    options: ["2倍", "不变", "4倍", "8倍"],
    answer: 2,
  },
  thrust: {
    title: "推力 Thrust",
    formula: "F = ma（牛顿第二定律）",
    desc: "推力由发动机产生，是飞机前进的动力。喷气发动机通过高速喷出气体，根据牛顿第三定律（作用力与反作用力），产生向前的推力。当推力>阻力时飞机加速。",
    key: "发动机类型、燃料燃烧效率、喷气速度",
    color: "#3b82f6",
    quiz: "飞机匀速直线飞行时，推力和阻力的关系是？",
    options: ["推力大于阻力", "没有关系", "推力小于阻力", "推力等于阻力"],
    answer: 3,
  },
  pressure: {
    title: "气压与流体基础",
    formula: "P₁ + ½ρv₁² = P₂ + ½ρv₂²",
    desc: "这是伯努利方程的简化形式。它告诉我们：在流体中，流速快的地方压强低，流速慢的地方压强高。这就是飞机升力的根本原理。高空气压低、空气稀薄，也会影响飞行性能。",
    key: "压强P、流速v、流体密度ρ 三者互相关联",
    color: "#8b5cf6",
    quiz: "伯努利原理说明：流速越大的地方，压强越？",
    options: ["大", "先大后小", "小", "不变"],
    answer: 2,
  },
};

const PARTS = [
  { id: "fuselage", name: "机身", desc: "飞机的主体结构，需要流线型减小阻力", unlockPhase: "drag" },
  { id: "wings", name: "机翼", desc: "产生升力的关键部件，上凸下平的翼型", unlockPhase: "lift" },
  { id: "engine", name: "发动机", desc: "提供推力，克服阻力推动飞机前进", unlockPhase: "thrust" },
  { id: "tail", name: "尾翼", desc: "控制飞机稳定性和方向", unlockPhase: "gravity" },
  { id: "propeller", name: "螺旋桨", desc: "将发动机动力转化为推力", unlockPhase: "pressure" },
];

/* ─────────────── THREE.JS HELPERS ─────────────── */
function createAirplane(showParts = { fuselage: true, wings: true, engine: true, tail: true, propeller: true }) {
  const group = new THREE.Group();
  const white = new THREE.MeshPhongMaterial({ color: 0xf0f0f0, shininess: 80 });
  const blue = new THREE.MeshPhongMaterial({ color: 0x2563eb, shininess: 60 });
  const red = new THREE.MeshPhongMaterial({ color: 0xef4444, shininess: 60 });
  const dark = new THREE.MeshPhongMaterial({ color: 0x374151, shininess: 40 });

  if (showParts.fuselage) {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 4, 16), white);
    body.rotation.z = Math.PI / 2;
    body.name = "fuselage";
    group.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 16), white);
    nose.rotation.z = -Math.PI / 2;
    nose.position.x = 2.4;
    group.add(nose);
    const tailCone = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 16), white);
    tailCone.rotation.z = Math.PI / 2;
    tailCone.position.x = -2.3;
    group.add(tailCone);
  }

  if (showParts.wings) {
    const wingShape = new THREE.BoxGeometry(1.2, 0.06, 5);
    const wingL = new THREE.Mesh(wingShape, blue);
    wingL.position.set(0.2, 0, 0);
    wingL.name = "wings";
    group.add(wingL);
    // Wing tips
    const tipGeo = new THREE.BoxGeometry(0.15, 0.3, 0.06);
    const tipL = new THREE.Mesh(tipGeo, blue);
    tipL.position.set(0.2, 0.12, 2.5);
    group.add(tipL);
    const tipR = new THREE.Mesh(tipGeo, blue);
    tipR.position.set(0.2, 0.12, -2.5);
    group.add(tipR);
  }

  if (showParts.tail) {
    const vTail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.06), red);
    vTail.position.set(-1.8, 0.6, 0);
    vTail.name = "tail";
    group.add(vTail);
    const hTail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 1.8), blue);
    hTail.position.set(-1.8, 0.15, 0);
    group.add(hTail);
  }

  if (showParts.engine) {
    [-1.2, 1.2].forEach((z) => {
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.7, 12), dark);
      nacelle.rotation.z = Math.PI / 2;
      nacelle.position.set(0.5, -0.25, z);
      nacelle.name = "engine";
      group.add(nacelle);
    });
  }

  if (showParts.propeller) {
    [-1.2, 1.2].forEach((z) => {
      const prop = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.6, 0.08), dark);
      prop.position.set(0.87, -0.25, z);
      prop.name = "propeller";
      group.add(prop);
      const prop2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.6), dark);
      prop2.position.set(0.87, -0.25, z);
      group.add(prop2);
    });
  }

  return group;
}

function createForceArrow(color, length, direction) {
  const group = new THREE.Group();
  const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.3 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, length, 8), mat);
  shaft.position.y = length / 2;
  group.add(shaft);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), mat);
  head.position.y = length + 0.15;
  group.add(head);
  if (direction === "down") group.rotation.z = Math.PI;
  else if (direction === "right") group.rotation.z = -Math.PI / 2;
  else if (direction === "left") group.rotation.z = Math.PI / 2;
  return group;
}

function createFlowLines(count, spread, length, airfoil = false) {
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const y = (i / (count - 1) - 0.5) * spread;
    const points = [];
    for (let j = 0; j <= 30; j++) {
      const t = j / 30;
      const x = (t - 0.5) * length;
      let yOff = 0;

      if (airfoil) {
        // Airfoil: lines above deflect upward (camber), lines below stay flatter
        const proximity = Math.max(0, 1 - Math.abs(y) / (spread * 0.35));
        const envelope = Math.sin(t * Math.PI);  // peaks at midpoint of chord
        if (y >= 0) {
          // Upper flow: deflect up more (follows camber), squeeze together = faster
          yOff = envelope * 0.4 * proximity;
        } else {
          // Lower flow: slight downward deflection then back
          yOff = -envelope * 0.08 * proximity;
        }
      } else {
        // Generic flow (drag / exhaust scenes)
        if (Math.abs(y) < spread * 0.3) {
          yOff = Math.sin(t * Math.PI) * 0.3 * (1 - Math.abs(y) / (spread * 0.3));
        }
      }

      points.push(new THREE.Vector3(x, y + yOff, 0));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, 30, 0.015, 4, false);

    // Color: for airfoil mode, upper lines = red/warm (fast), lower = blue (slow)
    // For generic mode, inner lines = red, outer = blue
    let hue;
    if (airfoil) {
      hue = y >= 0 && Math.abs(y) < spread * 0.35 ? 0.0 : 0.6;
    } else {
      hue = (Math.abs(y) < spread * 0.3) ? 0.0 : 0.6;
    }
    const mat = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(hue, 0.8, 0.5),
      transparent: true,
      opacity: 0.7,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { speed: 1, baseY: y };
    group.add(mesh);
  }
  return group;
}

function createWingCrossSection() {
  // Airfoil shape drawn in XY plane — leading edge at -X so it faces
  // the incoming flow (which travels from -X → +X), trailing edge at +X.
  const shape = new THREE.Shape();
  shape.moveTo(-1.2, 0);                                         // leading edge
  shape.bezierCurveTo(-0.8, 0.35, 0.3, 0.3, 1.2, 0.02);        // upper surface (cambered)
  shape.bezierCurveTo(0.3, -0.08, -0.8, -0.05, -1.2, 0);       // lower surface (flatter)
  const extrudeSettings = { depth: 0.3, bevelEnabled: false };    // span along Z
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.translate(0, 0, -0.15);  // center the extrusion on Z=0 before any transforms
  const mat = new THREE.MeshPhongMaterial({ color: 0x94a3b8, shininess: 60 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.y = Math.PI;  // flip so leading edge faces +X (incoming flow direction)
  return mesh;
}

/* ─────────────── MAIN COMPONENT ─────────────── */
export default function AirplanePhysicsGame() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const objectsRef = useRef({});

  const [phase, setPhase] = useState("intro");
  const [quizAnswers, setQuizAnswers] = useState({});
  const [assembledParts, setAssembledParts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isFlying, setIsFlying] = useState(false);
  const isFlyingRef = useRef(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches
  );
  const chatEndRef = useRef(null);

  const phaseIndex = PHASES.findIndex((p) => p.id === phase);
  const isLearningPhase = ["gravity", "lift", "drag", "thrust", "pressure"].includes(phase);
  const currentKnowledge = isLearningPhase ? KNOWLEDGE[phase] : null;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const handleChange = () => setIsMobile(media.matches);
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  /* ── Three.js Init ── */
  useEffect(() => {
    if (!canvasRef.current) return;
    const w = canvasRef.current.clientWidth;
    const h = canvasRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1e);
    scene.fog = new THREE.Fog(0x0a0f1e, 15, 40);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(5, 3, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    canvasRef.current.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0x4488cc, 0.4);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 8, 5);
    dir.castShadow = true;
    scene.add(dir);
    const point = new THREE.PointLight(0x3b82f6, 0.5, 20);
    point.position.set(-3, 4, -3);
    scene.add(point);

    // Ground grid
    const grid = new THREE.GridHelper(30, 30, 0x1e3a5f, 0x0d1b2a);
    grid.position.y = -2;
    scene.add(grid);

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 500; i++) {
      starPos.push((Math.random() - 0.5) * 60, Math.random() * 20 + 5, (Math.random() - 0.5) * 60);
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08 });
    scene.add(new THREE.Points(starGeo, starMat));

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    const handleResize = () => {
      const nw = canvasRef.current?.clientWidth || w;
      const nh = canvasRef.current?.clientHeight || h;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", handleResize);

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const t = clockRef.current.getElapsedTime();
      const objs = objectsRef.current;

      if (objs.airplane) {
        objs.airplane.rotation.y = Math.sin(t * 0.3) * 0.05;
        objs.airplane.position.y = Math.sin(t * 0.5) * 0.05;
      }
      if (objs.forceArrows) {
        objs.forceArrows.forEach((a) => {
          if (a.userData.pulse) {
            const s = 1 + Math.sin(t * 3) * 0.15;
            a.scale.set(s, s, s);
          }
        });
      }
      if (objs.flowGroup) {
        objs.flowGroup.position.x = -((t * 0.8) % 4) + 2;
      }
      if (objs.propellers) {
        objs.propellers.forEach((p) => (p.rotation.x += 0.15));
      }
      if (objs.flyingPlane && isFlyingRef.current) {
        const ft = t * 0.4;
        objs.flyingPlane.position.x = Math.cos(ft) * 3;
        objs.flyingPlane.position.z = Math.sin(ft) * 3;
        objs.flyingPlane.position.y = 1.5 + Math.sin(t * 1.2) * 0.6;
        objs.flyingPlane.rotation.y = -ft - Math.PI / 2;
        objs.flyingPlane.rotation.z = Math.sin(t * 0.8) * 0.1;
        objs.flyingPlane.rotation.x = Math.sin(t * 1.2) * 0.08;
      }

      // Auto-rotate camera slowly
      const camAngle = t * 0.15;
      const camRadius = 7;
      camera.position.x = Math.cos(camAngle) * camRadius;
      camera.position.z = Math.sin(camAngle) * camRadius;
      camera.position.y = 3 + Math.sin(t * 0.2) * 0.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animRef.current);
      renderer.dispose();
      if (canvasRef.current && renderer.domElement.parentNode === canvasRef.current) {
        canvasRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  /* ── Keep flying ref in sync ── */
  useEffect(() => {
    isFlyingRef.current = isFlying;
  }, [isFlying]);

  /* ── Scene updater per phase ── */
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clear old objects
    const toRemove = [];
    scene.traverse((obj) => {
      if (obj.userData?.removable) toRemove.push(obj);
    });
    toRemove.forEach((obj) => {
      obj.parent?.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    objectsRef.current = {};

    const addRemovable = (obj) => {
      obj.userData.removable = true;
      obj.traverse((c) => (c.userData.removable = true));
      scene.add(obj);
      return obj;
    };

    if (phase === "intro") {
      const airplane = createAirplane();
      airplane.position.y = 0.5;
      objectsRef.current.airplane = addRemovable(airplane);
    }

    if (phase === "gravity") {
      const airplane = createAirplane();
      airplane.position.y = 0.5;
      objectsRef.current.airplane = addRemovable(airplane);
      const gravArrow = createForceArrow(0xef4444, 1.5 + sliderValue / 50, "down");
      gravArrow.position.set(0, -0.2, 0);
      gravArrow.userData.pulse = true;
      objectsRef.current.forceArrows = [addRemovable(gravArrow)];
      // Weight label
      const liftArrow = createForceArrow(0x22c55e, 0.8, "up");
      liftArrow.position.set(0, 0.8, 0);
      objectsRef.current.forceArrows.push(addRemovable(liftArrow));
    }

    if (phase === "lift") {
      const wing = createWingCrossSection();
      wing.scale.set(1.5, 1.5, 3);
      wing.position.set(0, 0, 0);
      addRemovable(wing);
      const flow = createFlowLines(12, 2.5, 6, true);
      objectsRef.current.flowGroup = addRemovable(flow);
      const liftArrow = createForceArrow(0x22c55e, 1.8, "up");
      liftArrow.position.set(0, 0.5, 0);
      liftArrow.userData.pulse = true;
      objectsRef.current.forceArrows = [addRemovable(liftArrow)];
    }

    if (phase === "drag") {
      const airplane = createAirplane();
      airplane.position.y = 0.5;
      airplane.scale.set(0.8, 0.8, 0.8);
      objectsRef.current.airplane = addRemovable(airplane);
      const dragArrow = createForceArrow(0xf97316, 1.5, "left");
      dragArrow.position.set(2, 0.5, 0);
      dragArrow.userData.pulse = true;
      objectsRef.current.forceArrows = [addRemovable(dragArrow)];
      const thrustArrow = createForceArrow(0x3b82f6, 2, "right");
      thrustArrow.position.set(-2.5, 0.5, 0);
      objectsRef.current.forceArrows.push(addRemovable(thrustArrow));
      // Drag particles
      const flow = createFlowLines(8, 2, 8);
      objectsRef.current.flowGroup = addRemovable(flow);
    }

    if (phase === "thrust") {
      const airplane = createAirplane();
      airplane.position.y = 0.5;
      objectsRef.current.airplane = addRemovable(airplane);
      const thrustArrow = createForceArrow(0x3b82f6, 2.0, "right");
      thrustArrow.position.set(2.5, 0.5, 0);
      thrustArrow.userData.pulse = true;
      objectsRef.current.forceArrows = [addRemovable(thrustArrow)];
      // collect propellers
      const props = [];
      airplane.traverse((c) => {
        if (c.name === "propeller") props.push(c);
      });
      objectsRef.current.propellers = props;
      // exhaust particles
      const exhaust = createFlowLines(6, 0.5, 3);
      exhaust.position.set(-3.5, 0.5, 0);
      exhaust.rotation.y = Math.PI;
      objectsRef.current.flowGroup = addRemovable(exhaust);
    }

    if (phase === "pressure") {
      const wing = createWingCrossSection();
      wing.scale.set(1.8, 1.8, 4);
      wing.position.set(0, 0, 0);
      addRemovable(wing);
      const flow = createFlowLines(15, 3, 7, true);
      objectsRef.current.flowGroup = addRemovable(flow);
      // Pressure zones - top (low) and bottom (high)
      const lowP = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 16, 16),
        new THREE.MeshPhongMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.2 })
      );
      lowP.position.set(0, 1.2, 0);
      addRemovable(lowP);
      const highP = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 16, 16),
        new THREE.MeshPhongMaterial({ color: 0xef4444, transparent: true, opacity: 0.2 })
      );
      highP.position.set(0, -0.8, 0);
      addRemovable(highP);
      const liftArrow = createForceArrow(0x22c55e, 2, "up");
      liftArrow.position.set(0, 0.5, 0);
      liftArrow.userData.pulse = true;
      objectsRef.current.forceArrows = [addRemovable(liftArrow)];
    }

    if (phase === "assembly") {
      const showParts = {};
      PARTS.forEach((p) => (showParts[p.id] = assembledParts.includes(p.id)));
      const airplane = createAirplane(showParts);
      airplane.position.y = 0.5;
      objectsRef.current.airplane = addRemovable(airplane);
      // Ghost outline for missing parts
      const ghost = createAirplane();
      ghost.traverse((c) => {
        if (c.isMesh) {
          c.material = new THREE.MeshPhongMaterial({
            color: 0x3b82f6,
            transparent: true,
            opacity: 0.1,
            wireframe: true,
          });
        }
      });
      ghost.position.y = 0.5;
      addRemovable(ghost);
    }

    if (phase === "flight") {
      const airplane = createAirplane();
      airplane.position.set(-3, 1, 0);
      objectsRef.current.flyingPlane = addRemovable(airplane);
      objectsRef.current.airplane = airplane;
      // All four forces
      const arrows = [];
      const grav = createForceArrow(0xef4444, 1.2, "down");
      grav.position.set(0, -0.5, 0);
      airplane.add(grav);
      arrows.push(grav);
      const lift = createForceArrow(0x22c55e, 1.5, "up");
      lift.position.set(0, 0.8, 0);
      lift.userData.pulse = true;
      airplane.add(lift);
      arrows.push(lift);
      const thrust = createForceArrow(0x3b82f6, 1.2, "right");
      thrust.position.set(2.5, 0, 0);
      airplane.add(thrust);
      arrows.push(thrust);
      const drag = createForceArrow(0xf97316, 0.8, "left");
      drag.position.set(-2.5, 0, 0);
      airplane.add(drag);
      arrows.push(drag);
      objectsRef.current.forceArrows = arrows;
      const props = [];
      airplane.traverse((c) => {
        if (c.name === "propeller") props.push(c);
      });
      objectsRef.current.propellers = props;
    }
  }, [phase, assembledParts, sliderValue]);

  /* ── Update gravity arrow with slider ── */
  useEffect(() => {
    if (phase !== "gravity" || !objectsRef.current.forceArrows) return;
    const scene = sceneRef.current;
    const oldArrows = objectsRef.current.forceArrows;
    oldArrows.forEach(a => { if (a.parent) a.parent.remove(a); });
    
    const gravLen = 0.5 + (sliderValue / 100) * 2.5;
    const gravArrow = createForceArrow(0xef4444, gravLen, "down");
    gravArrow.position.set(0, -0.2, 0);
    gravArrow.userData.pulse = true;
    gravArrow.userData.removable = true;
    gravArrow.traverse(c => c.userData.removable = true);
    scene.add(gravArrow);
    
    const liftArrow = createForceArrow(0x22c55e, 0.8, "up");
    liftArrow.position.set(0, 0.8, 0);
    liftArrow.userData.removable = true;
    liftArrow.traverse(c => c.userData.removable = true);
    scene.add(liftArrow);
    
    objectsRef.current.forceArrows = [gravArrow, liftArrow];
  }, [sliderValue, phase]);

  /* ── AI Chat ── */
  const sendToAI = useCallback(async (userMsg, systemContext) => {
    setIsLoading(true);
    try {
      const sysPrompt = `你是一个高中物理AI老师，名叫"飞行教授"。你正在一个3D飞机建造教育游戏中指导学生学习飞行物理学。
你的性格：热情、耐心、善于用生活化的比喻解释物理概念。
当前教学阶段：${phase}
${systemContext || ""}
规则：
- 回答要简洁（3-5句话），适合高中生理解水平
- 多用生活化的例子和比喻
- 鼓励学生思考
- 适当使用emoji让氛围轻松
- 用中文回答`;

      const apiUrl = import.meta.env.VITE_API_URL || "/api/messages";
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

      const headers = { "Content-Type": "application/json" };
      if (apiKey) {
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
        headers["anthropic-dangerous-direct-browser-access"] = "true";
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: sysPrompt,
          messages: [{ role: "user", content: userMsg }],
        }),
      });
      const data = await response.json();
      const reply = data.content?.map((c) => c.text || "").join("") || "抱歉，我暂时无法回答。请再试一次！";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ AI 连接失败，但没关系！继续探索物理世界吧~ 你可以阅读知识卡片上的内容。" }]);
    }
    setIsLoading(false);
  }, [phase]);

  /* ── Phase entry messages ── */
  useEffect(() => {
    const phaseMessages = {
      intro: "欢迎来到飞行物理实验室！🛩️ 你的任务是学习空气动力学的五大核心概念，然后亲手组装一架飞机并让它飞上天空！准备好了吗？点击「开始学习」进入第一个知识站。",
      gravity: "第一站：重力！⬇️ 重力是飞机要克服的第一个挑战。拖动下方滑块改变飞机质量，观察重力箭头（红色）的变化。思考一下：为什么飞机要尽量减轻自重？",
      lift: "第二站：升力！⬆️ 看看3D场景中的机翼截面和气流线。注意机翼上表面的气流（红色线）流速更快——这就是伯努利原理的可视化！流速快→气压低→产生升力。",
      drag: "第三站：阻力！💨 观察飞机周围的气流。橙色箭头代表阻力，蓝色箭头代表推力。飞机的流线型设计就是为了减小阻力系数。想想：为什么赛车也是流线型的？",
      thrust: "第四站：推力！🔥 看发动机和螺旋桨在旋转！推力来自牛顿第三定律——发动机向后喷出高速气体，飞机就获得向前的力。蓝色箭头显示推力方向。",
      pressure: "第五站：气压与流体！🌊 这是把前面所有知识串起来的关键。蓝色区域=低压（机翼上方），红色区域=高压（机翼下方）。压力差产生升力！这就是伯努利方程的核心。",
      assembly: "知识学习完毕！🔧 现在开始组装飞机。点击下方的零件卡片来安装各个部件。每个部件都对应你学过的一个物理概念！",
      flight: "飞机组装完成！✈️ 点击「起飞」按钮，观察四种力如何共同作用让飞机飞行。红色=重力，绿色=升力，蓝色=推力，橙色=阻力。当升力>重力，推力>阻力，飞机就能稳定飞行！",
    };
    if (phaseMessages[phase]) {
      setMessages((prev) => [...prev, { role: "assistant", content: phaseMessages[phase] }]);
    }
    setShowQuiz(false);
    setSelectedAnswer(null);
  }, [phase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: inputText }]);
    sendToAI(inputText, currentKnowledge ? `当前正在教授：${currentKnowledge.title}。公式：${currentKnowledge.formula}。核心知识：${currentKnowledge.desc}` : "");
    setInputText("");
  };

  const handleNextPhase = () => {
    if (phaseIndex < PHASES.length - 1) {
      setPhase(PHASES[phaseIndex + 1].id);
    }
  };

  const handleQuizAnswer = (idx) => {
    setSelectedAnswer(idx);
    const correct = idx === currentKnowledge.answer;
    setQuizAnswers((prev) => ({ ...prev, [phase]: correct }));
    if (correct) {
      setMessages((prev) => [...prev, { role: "assistant", content: "🎉 回答正确！你已经掌握了这个概念。点击「下一步」继续探索吧！" }]);
    } else {
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ 不太对哦。正确答案是「${currentKnowledge.options[currentKnowledge.answer]}」。再想想为什么？如果有疑问可以问我！` }]);
    }
  };

  const handleAssemblePart = (partId) => {
    if (!assembledParts.includes(partId)) {
      const newParts = [...assembledParts, partId];
      setAssembledParts(newParts);
      const part = PARTS.find((p) => p.id === partId);
      setMessages((prev) => [...prev, { role: "assistant", content: `✅ ${part.name}已安装！${part.desc}。${newParts.length === PARTS.length ? "\n\n🎊 所有部件安装完毕！点击「下一步」进入试飞！" : `还需要安装 ${PARTS.length - newParts.length} 个部件。`}` }]);
    }
  };

  const completedLearning = Object.keys(quizAnswers).length;
  const allPartsAssembled = assembledParts.length === PARTS.length;

  return (
    <div style={{
      width: "100%", height: "100vh", display: "flex", flexDirection: isMobile ? "column" : "row",
      fontFamily: "'Noto Sans SC', 'Segoe UI', sans-serif",
      background: "linear-gradient(135deg, #020617 0%, #0a0f1e 50%, #0c1222 100%)", color: "#e2e8f0", overflow: "hidden"
    }}>
      {/* ── 3D Viewport ── */}
      <div style={{
        flex: isMobile ? "0 0 58vh" : 1,
        width: "100%",
        minWidth: 0,
        minHeight: isMobile ? 360 : 0,
        position: "relative"
      }}>
        <div ref={canvasRef} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />

        {/* Top HUD */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, padding: isMobile ? "10px 12px" : "16px 20px",
          background: "linear-gradient(180deg, rgba(2,6,23,0.9) 0%, transparent 100%)",
          display: "flex", alignItems: "center", gap: 8, zIndex: 10
        }}>
          <div style={{
            fontSize: isMobile ? 11 : 13, fontWeight: 700, letterSpacing: isMobile ? 1 : 3, color: "#38bdf8",
            textTransform: "uppercase", fontFamily: "'Courier New', monospace", whiteSpace: "nowrap"
          }}>
            ✈ 飞行物理实验室
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            display: "flex", gap: isMobile ? 2 : 4, background: "rgba(15,23,42,0.8)", borderRadius: 8,
            padding: isMobile ? "4px 6px" : "4px 8px", border: "1px solid rgba(56,189,248,0.15)"
          }}>
            {PHASES.map((p, i) => (
              <div key={p.id} style={{
                width: isMobile ? 24 : 28, height: isMobile ? 24 : 28, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isMobile ? 12 : 13, cursor: "pointer", transition: "all 0.3s",
                background: phase === p.id ? "rgba(56,189,248,0.3)" : i < phaseIndex ? "rgba(34,197,94,0.2)" : "transparent",
                border: phase === p.id ? "1px solid #38bdf8" : i < phaseIndex ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.05)",
                opacity: i <= phaseIndex ? 1 : 0.4
              }} title={p.label} onClick={() => i <= phaseIndex && setPhase(p.id)}>
                {p.icon}
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge Card Overlay */}
        {isLearningPhase && currentKnowledge && (
          <div style={{
            position: "absolute", bottom: isMobile ? 12 : 20, left: isMobile ? 12 : 20,
            width: isMobile ? "min(360px, calc(100% - 24px))" : 320,
            maxHeight: isMobile ? "54%" : "none",
            overflowY: isMobile ? "auto" : "visible",
            background: "rgba(15,23,42,0.92)", backdropFilter: "blur(12px)",
            borderRadius: isMobile ? 12 : 16, border: `1px solid ${currentKnowledge.color}33`,
            padding: isMobile ? 14 : 20, zIndex: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: currentKnowledge.color, boxShadow: `0 0 12px ${currentKnowledge.color}`
              }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: currentKnowledge.color }}>
                {currentKnowledge.title}
              </span>
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace", fontSize: 18, color: "#f0f9ff",
              background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "8px 12px",
              marginBottom: 12, textAlign: "center", letterSpacing: 1
            }}>
              {currentKnowledge.formula}
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "#94a3b8", margin: "0 0 8px 0" }}>
              {currentKnowledge.desc}
            </p>
            <div style={{ fontSize: 12, color: "#64748b", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>
              💡 关键因素：{currentKnowledge.key}
            </div>

            {phase === "gravity" && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                  调整飞机质量：{(sliderValue * 100).toFixed(0)} kg
                </div>
                <input type="range" min={10} max={100} value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  style={{ width: "100%", accentColor: currentKnowledge.color }} />
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  重力 F = {(sliderValue * 100 * 9.8).toFixed(0)} N
                </div>
              </div>
            )}

            {!showQuiz ? (
              <button onClick={() => setShowQuiz(true)} style={{
                marginTop: 12, width: "100%", padding: "10px", borderRadius: 8,
                background: `${currentKnowledge.color}22`, border: `1px solid ${currentKnowledge.color}55`,
                color: currentKnowledge.color, cursor: "pointer", fontSize: 13, fontWeight: 600
              }}>
                📝 知识检验
              </button>
            ) : (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 8 }}>{currentKnowledge.quiz}</div>
                {currentKnowledge.options.map((opt, i) => (
                  <button key={i} onClick={() => selectedAnswer === null && handleQuizAnswer(i)} style={{
                    display: "block", width: "100%", padding: "8px 12px", marginBottom: 4,
                    borderRadius: 6, cursor: selectedAnswer === null ? "pointer" : "default", fontSize: 13, textAlign: "left",
                    background: selectedAnswer === null ? "rgba(255,255,255,0.05)"
                      : i === currentKnowledge.answer ? "rgba(34,197,94,0.2)"
                      : i === selectedAnswer ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.03)",
                    border: selectedAnswer === null ? "1px solid rgba(255,255,255,0.1)"
                      : i === currentKnowledge.answer ? "1px solid rgba(34,197,94,0.4)"
                      : i === selectedAnswer ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.05)",
                    color: "#e2e8f0", transition: "all 0.2s"
                  }}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assembly Panel */}
        {phase === "assembly" && (
          <div style={{
            position: "absolute", bottom: isMobile ? 12 : 20, left: isMobile ? 12 : 20,
            right: isMobile ? 12 : "calc(360px + 40px)",
            display: "flex", gap: 10, zIndex: 10, flexWrap: "wrap"
          }}>
            {PARTS.map((part) => {
              const installed = assembledParts.includes(part.id);
              return (
                <button key={part.id} onClick={() => !installed && handleAssemblePart(part.id)} style={{
                  flex: "1 1 140px", padding: "14px 16px", borderRadius: 12,
                  background: installed ? "rgba(34,197,94,0.15)" : "rgba(15,23,42,0.9)",
                  border: installed ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(56,189,248,0.2)",
                  color: installed ? "#86efac" : "#e2e8f0", cursor: installed ? "default" : "pointer",
                  backdropFilter: "blur(8px)", textAlign: "left", transition: "all 0.3s"
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                    {installed ? "✅" : "🔩"} {part.name}
                  </div>
                  <div style={{ fontSize: 11, color: installed ? "#6ee7b7" : "#64748b" }}>
                    {part.desc}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Flight Controls */}
        {phase === "flight" && (
          <div style={{ position: "absolute", bottom: isMobile ? 12 : 20, left: isMobile ? 12 : 20, zIndex: 10 }}>
            <button onClick={() => setIsFlying(!isFlying)} style={{
              padding: "14px 32px", borderRadius: 12, fontSize: 16, fontWeight: 700,
              background: isFlying ? "rgba(239,68,68,0.3)" : "linear-gradient(135deg, rgba(34,197,94,0.4), rgba(56,189,248,0.4))",
              border: isFlying ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(56,189,248,0.4)",
              color: "#fff", cursor: "pointer", letterSpacing: 2, transition: "all 0.3s",
              boxShadow: isFlying ? "0 0 20px rgba(239,68,68,0.2)" : "0 0 20px rgba(56,189,248,0.2)"
            }}>
              {isFlying ? "⏸ 暂停" : "🚀 起飞！"}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div style={{
          position: "absolute", bottom: isMobile ? 12 : 20, right: isMobile ? 12 : 380,
          display: "flex", gap: 8, zIndex: 10,
        }}>
          {phase === "intro" && (
            <button onClick={handleNextPhase} style={{
              padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)", border: "none",
              color: "#fff", cursor: "pointer", boxShadow: "0 4px 15px rgba(37,99,235,0.4)"
            }}>
              🎯 开始学习
            </button>
          )}
          {isLearningPhase && selectedAnswer !== null && (
            <button onClick={handleNextPhase} style={{
              padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)", border: "none",
              color: "#fff", cursor: "pointer", boxShadow: "0 4px 15px rgba(37,99,235,0.4)"
            }}>
              下一步 →
            </button>
          )}
          {phase === "assembly" && allPartsAssembled && (
            <button onClick={handleNextPhase} style={{
              padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: "linear-gradient(135deg, #16a34a, #2563eb)", border: "none",
              color: "#fff", cursor: "pointer", boxShadow: "0 4px 15px rgba(22,163,74,0.4)"
            }}>
              🛫 进入试飞
            </button>
          )}
        </div>
      </div>

      {/* ── AI Teacher Chat Panel ── */}
      <div style={{
        width: isMobile ? "100%" : 350,
        flex: isMobile ? "1 1 42vh" : "0 0 350px",
        minHeight: 0,
        borderLeft: isMobile ? "none" : "1px solid rgba(56,189,248,0.1)",
        borderTop: isMobile ? "1px solid rgba(56,189,248,0.1)" : "none",
        display: "flex", flexDirection: "column",
        background: "rgba(8,12,28,0.95)", flexShrink: 0
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? "10px 14px" : "16px 20px", borderBottom: "1px solid rgba(56,189,248,0.1)",
          display: "flex", alignItems: "center", gap: 10
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #2563eb, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
          }}>
            🧑‍🏫
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f9ff" }}>飞行教授</div>
            <div style={{ fontSize: 11, color: "#38bdf8" }}>AI 物理老师 · 在线</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            fontSize: 11, color: "#64748b", background: "rgba(56,189,248,0.1)",
            padding: "4px 8px", borderRadius: 6
          }}>
            进度 {phaseIndex + 1}/{PHASES.length}
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, minHeight: 0, overflowY: "auto", padding: isMobile ? "10px 14px" : "12px 16px",
          display: "flex", flexDirection: "column", gap: 10
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "92%",
            }}>
              <div style={{
                padding: "10px 14px", borderRadius: 14, fontSize: 13, lineHeight: 1.65,
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #2563eb, #3b82f6)"
                  : "rgba(30,41,59,0.8)",
                color: msg.role === "user" ? "#fff" : "#cbd5e1",
                borderBottomRightRadius: msg.role === "user" ? 4 : 14,
                borderBottomLeftRadius: msg.role === "user" ? 14 : 4,
                border: msg.role === "user" ? "none" : "1px solid rgba(56,189,248,0.08)",
                whiteSpace: "pre-wrap"
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{
              alignSelf: "flex-start", padding: "10px 14px", borderRadius: 14,
              background: "rgba(30,41,59,0.8)", border: "1px solid rgba(56,189,248,0.08)",
              color: "#64748b", fontSize: 13
            }}>
              飞行教授正在思考...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: isMobile ? "10px 14px" : "12px 16px", borderTop: "1px solid rgba(56,189,248,0.1)",
          display: "flex", gap: 8
        }}>
          <input value={inputText} onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="问飞行教授物理问题..."
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(56,189,248,0.15)",
              background: "rgba(15,23,42,0.8)", color: "#e2e8f0", fontSize: 13, outline: "none",
            }} />
          <button onClick={handleSendMessage} style={{
            padding: "10px 16px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600
          }}>
            发送
          </button>
        </div>

        {/* Phase Info Footer */}
        <div style={{
          padding: "10px 16px", borderTop: "1px solid rgba(56,189,248,0.06)",
          fontSize: 11, color: "#475569", textAlign: "center"
        }}>
          {isLearningPhase ? `📖 学习站 ${phaseIndex}/5 · 完成知识检验后可进入下一站` :
           phase === "assembly" ? `🔧 已安装 ${assembledParts.length}/${PARTS.length} 个部件` :
           phase === "flight" ? "✈️ 观察四种力的平衡关系" :
           "点击「开始学习」开启你的飞行之旅"}
        </div>
      </div>
    </div>
  );
}
