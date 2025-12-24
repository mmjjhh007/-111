
import * as THREE from 'three';

export enum AppMode {
  TREE = 'TREE',
  SCATTER = 'SCATTER',
  FOCUS = 'FOCUS'
}

export interface AppState {
  mode: AppMode;
  isLoaded: boolean;
  uiHidden: boolean;
  handDetected: boolean;
  handPosition: { x: number; y: number };
}

export interface ParticleData {
  mesh: THREE.Mesh | THREE.Group;
  basePosition: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Euler;
  type: 'MAIN' | 'DUST' | 'PHOTO';
  initialScale: THREE.Vector3;
}
