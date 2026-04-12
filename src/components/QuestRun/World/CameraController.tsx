/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

export const CameraController: React.FC = () => {
  const { laneCount, status } = useStore();
  
  useFrame((state, delta) => {
    const camera = state.camera;
    
    // Dynamic camera positioning based on lane count
    const extraLanes = Math.max(0, laneCount - 3);
    const targetY = 6 + (extraLanes * 0.8);
    const targetZ = 12 + (extraLanes * 1.2);
    
    const targetPos = new THREE.Vector3(0, targetY, targetZ);
    
    // Smoothly transition camera
    camera.position.lerp(targetPos, delta * 3.0);
    
    // Look at a point ahead on the track, slightly higher to shift the runner up
    const lookAtPos = new THREE.Vector3(0, 1.5, -40);
    camera.lookAt(lookAtPos);
  });

  return null;
};
