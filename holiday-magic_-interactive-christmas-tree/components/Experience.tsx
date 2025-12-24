
import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ParticleSystem } from './ParticleSystem';
import { AppMode, AppState } from '../types';
import { COLORS } from '../constants';

interface ExperienceProps {
  state: AppState;
  onLoaded: () => void;
  particleSystemRef: React.MutableRefObject<ParticleSystem | null>;
}

const Experience: React.FC<ExperienceProps> = ({ state, onLoaded, particleSystemRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const mainGroupRef = useRef<THREE.Group | null>(null);
  
  // Use a ref to store the latest state to avoid stale closures in the animate loop
  const stateRef = useRef<AppState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const init = useCallback(() => {
    if (!containerRef.current) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    // Reduced exposure from 2.2 to 1.4 for a more comfortable brightness level
    renderer.toneMappingExposure = 1.4;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 50);
    cameraRef.current = camera;

    // Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.4); // Reduced from 0.6
    scene.add(ambient);

    const point = new THREE.PointLight(COLORS.ORANGE, 1.5); // Reduced from 2.0
    point.position.set(0, 5, 0);
    scene.add(point);

    const spotGold = new THREE.SpotLight(COLORS.GOLD, 800); // Reduced from 1200
    spotGold.position.set(30, 40, 40);
    spotGold.angle = Math.PI / 6;
    spotGold.penumbra = 0.5;
    scene.add(spotGold);

    const spotBlue = new THREE.SpotLight(COLORS.BLUE, 400); // Reduced from 600
    spotBlue.position.set(-30, 20, -30);
    spotBlue.angle = Math.PI / 6;
    spotBlue.penumbra = 0.5;
    scene.add(spotBlue);

    // Particles
    const ps = new ParticleSystem();
    const mainGroup = new THREE.Group();
    mainGroup.add(ps.group);
    scene.add(mainGroup);
    mainGroupRef.current = mainGroup;
    particleSystemRef.current = ps;

    // Post Processing
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.4,  // slightly reduced strength from 0.45
      0.4,  // radius
      0.85  // increased threshold from 0.7 to reduce glowing of darker areas
    );
    
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    onLoaded();

    // Animation Loop
    let lastTime = 0;
    const animate = (time: number) => {
      lastTime = time;
      const t = time * 0.001;
      
      const currentState = stateRef.current;
      
      if (ps) {
        ps.update(currentState.mode, t);
      }

      if (mainGroupRef.current) {
        // Map mouse position to rotation
        const targetRotX = (currentState.handPosition.y - 0.5) * 0.5;
        const targetRotY = (currentState.handPosition.x - 0.5) * -0.5;
        mainGroupRef.current.rotation.x = THREE.MathUtils.lerp(mainGroupRef.current.rotation.x, targetRotX, 0.05);
        mainGroupRef.current.rotation.y = THREE.MathUtils.lerp(mainGroupRef.current.rotation.y, targetRotY, 0.05);
      }

      composer.render();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [onLoaded, particleSystemRef]);

  useEffect(() => {
    init();
  }, []);

  return <div ref={containerRef} className="fixed inset-0" />;
};

export default Experience;
