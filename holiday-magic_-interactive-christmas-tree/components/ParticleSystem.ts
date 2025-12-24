
import * as THREE from 'three';
import { AppMode, ParticleData } from '../types';
import { COLORS, PARTICLE_CONFIG } from '../constants';

export class ParticleSystem {
  particles: ParticleData[] = [];
  group: THREE.Group;
  photoFocusIndex: number = -1;
  private lastMode: AppMode | null = null;
  private treeVariation: number = Math.random() * 10;
  private scatterPositions: THREE.Vector3[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.init();
  }

  private init() {
    const goldMat = new THREE.MeshStandardMaterial({ color: COLORS.GOLD, metalness: 0.9, roughness: 0.1 });
    const greenMat = new THREE.MeshStandardMaterial({ color: COLORS.DEEP_GREEN, roughness: 0.8 });
    const redMat = new THREE.MeshPhysicalMaterial({ 
      color: COLORS.RED, 
      clearcoat: 1, 
      clearcoatRoughness: 0,
      metalness: 0.5,
      roughness: 0.2
    });

    // Main Particles
    for (let i = 0; i < PARTICLE_CONFIG.MAIN_COUNT; i++) {
      const geo = Math.random() > 0.5 ? new THREE.BoxGeometry(0.4, 0.4, 0.4) : new THREE.SphereGeometry(0.2, 8, 8);
      const mat = Math.random() > 0.3 ? (Math.random() > 0.5 ? goldMat : greenMat) : redMat;
      const mesh = new THREE.Mesh(geo, mat);
      this.addParticle(mesh, 'MAIN');
    }

    // Dust Particles
    const dustMat = new THREE.MeshBasicMaterial({ color: COLORS.CHAMPAGNE, transparent: true, opacity: 0.6 });
    const dustGeo = new THREE.SphereGeometry(0.05, 4, 4);
    for (let i = 0; i < PARTICLE_CONFIG.DUST_COUNT; i++) {
      const mesh = new THREE.Mesh(dustGeo, dustMat);
      this.addParticle(mesh, 'DUST');
    }

    // Candy Canes
    for (let i = 0; i < 20; i++) {
      this.addCandyCane();
    }

    // Load custom image from URL
    this.loadDefaultPhoto();
  }

  private addParticle(mesh: THREE.Mesh | THREE.Group, type: 'MAIN' | 'DUST' | 'PHOTO') {
    mesh.position.set(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40
    );
    
    const data: ParticleData = {
      mesh,
      basePosition: mesh.position.clone(),
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1),
      rotationSpeed: new THREE.Euler(Math.random() * 0.04, Math.random() * 0.04, Math.random() * 0.04),
      type,
      initialScale: mesh.scale.clone()
    };
    
    this.particles.push(data);
    this.group.add(mesh);
  }

  private addCandyCane() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(0.5, 2, 0),
      new THREE.Vector3(1, 1.5, 0),
    ]);
    const geo = new THREE.TubeGeometry(curve, 20, 0.1, 8, false);
    
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#9e1b1b';
    ctx.lineWidth = 10;
    for(let i=0; i<10; i++){
      ctx.beginPath();
      ctx.moveTo(0, i * 20);
      ctx.lineTo(128, i * 20 + 40);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    
    const mat = new THREE.MeshStandardMaterial({ map: tex });
    const mesh = new THREE.Mesh(geo, mat);
    this.addParticle(mesh, 'MAIN');
  }

  private loadDefaultPhoto() {
    const loader = new THREE.TextureLoader();
    const url = 'https://raw.githubusercontent.com/mmjjhh007/-111/main/7f9c888f001cbbf3172157f6ff12b3b.jpg';
    
    loader.load(
      url, 
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        this.addPhotoToScene(texture);
      },
      undefined,
      () => {
        console.error("Failed to load default photo, using fallback.");
        this.createFallbackPhoto();
      }
    );
  }

  private createFallbackPhoto() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 40px Cinzel';
    ctx.textAlign = 'center';
    ctx.fillText('JOYEUX NOËL', 256, 256);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.addPhotoToScene(tex);
  }

  public addPhotoToScene(texture: THREE.Texture) {
    const group = new THREE.Group();
    const frameGeo = new THREE.BoxGeometry(4.2, 4.2, 0.2);
    const frameMat = new THREE.MeshStandardMaterial({ color: COLORS.GOLD, metalness: 0.8, roughness: 0.2 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    
    const photoGeo = new THREE.PlaneGeometry(4, 4);
    const photoMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const photo = new THREE.Mesh(photoGeo, photoMat);
    photo.position.z = 0.11;
    
    group.add(frame);
    group.add(photo);
    
    this.addParticle(group, 'PHOTO');
    this.photoFocusIndex = this.particles.length - 1;
  }

  private onModeChange(newMode: AppMode) {
    if (newMode === AppMode.TREE) {
      this.treeVariation = Math.random() * 10;
    } else if (newMode === AppMode.SCATTER) {
      this.particles.forEach(p => {
        p.basePosition.set(
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50
        );
      });
    }
  }

  update(mode: AppMode, time: number) {
    if (this.lastMode !== mode) {
      this.onModeChange(mode);
      this.lastMode = mode;
    }

    const targetPos = new THREE.Vector3();
    const photoIndex = this.photoFocusIndex;

    this.particles.forEach((p, i) => {
      if (mode === AppMode.TREE) {
        if (p.type === 'PHOTO') {
           // Photos inside the tree structure, acting like large ornaments
           // Calculate a normalized 'height' factor based on index to distribute them vertically
           const hFactor = (i % 10) / 10; 
           const radius = (PARTICLE_CONFIG.TREE_MAX_RADIUS * 0.8) * (1 - hFactor);
           const angle = hFactor * 30 * Math.PI + time * 0.2 + (i * 0.5);
           
           targetPos.set(
             Math.cos(angle) * radius,
             hFactor * PARTICLE_CONFIG.TREE_HEIGHT - 10,
             Math.sin(angle) * radius
           );
           
           // Rotate photo to face outward from the tree center
           p.mesh.rotation.y = angle + Math.PI / 2;
           p.mesh.rotation.x = Math.sin(time * 0.5 + i) * 0.1;
           
           // Scale them down slightly when inside the tree so they don't overpower everything
           p.mesh.scale.lerp(p.initialScale.clone().multiplyScalar(0.35), 0.1);
        } else {
          // Standard tree foliage (Radius 0-12)
          const t = i / this.particles.length;
          const radius = PARTICLE_CONFIG.TREE_MAX_RADIUS * (1 - t);
          const angle = t * 50 * Math.PI + time * 0.1 + this.treeVariation;
          targetPos.set(
            Math.cos(angle) * radius,
            t * PARTICLE_CONFIG.TREE_HEIGHT - 10,
            Math.sin(angle) * radius
          );
          p.mesh.scale.lerp(p.initialScale, 0.1);
          p.mesh.rotation.y += 0.01;
        }
      } else if (mode === AppMode.SCATTER) {
        const noise = Math.sin(time * 0.5 + i) * 2;
        targetPos.copy(p.basePosition).add(new THREE.Vector3(noise, noise, noise));
        p.mesh.rotation.x += p.rotationSpeed.x;
        p.mesh.rotation.y += p.rotationSpeed.y;
        p.mesh.rotation.z += p.rotationSpeed.z;
        p.mesh.scale.lerp(p.initialScale, 0.1);
      } else if (mode === AppMode.FOCUS) {
        if (i === photoIndex) {
          targetPos.set(0, 2, 35);
          p.mesh.scale.lerp(new THREE.Vector3(4.5, 4.5, 4.5), 0.05);
          p.mesh.rotation.set(Math.cos(time * 0.3) * 0.05, Math.sin(time * 0.5) * 0.2, 0);
        } else {
          const dir = p.mesh.position.clone().normalize();
          targetPos.copy(dir.multiplyScalar(45 + Math.sin(time + i) * 5));
          p.mesh.scale.lerp(p.initialScale.clone().multiplyScalar(0.4), 0.1);
        }
      }

      p.mesh.position.lerp(targetPos, 0.05);
    });
  }
}
