'use client';

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export interface NasaEarthModelProps {
  observationYear?: '2012' | '2023';
  isDiffMode?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  isInteracting?: boolean;
  sunPosition?: [number, number, number];
  onResetReady?: (resetFn: () => void) => void;
}

// GLSL Vertex Shader for NASA Earth Model
const earthVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    // Local normal for mathematical equirectangular projection
    vNormal = normalize(normal);
    
    // World coordinates for lighting and Fresnel calculations
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

// GLSL Fragment Shader blending NASA Model daytime surface + NASA Black Marble nighttime observations
const earthFragmentShader = /* glsl */ `
  uniform sampler2D uDayTexture;
  uniform sampler2D uNight2012;
  uniform sampler2D uNight2023;
  uniform float uBlendYear; // 0.0 = 2012, 1.0 = 2023
  uniform float uDiffMode;  // 1.0 = active, 0.0 = inactive
  uniform float uTime;
  uniform vec3 uSunPosition;
  uniform vec3 uCameraPos;

  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  #define PI 3.141592653589793
  #define HALF_PI 1.5707963267948966

  void main() {
    // 1. Sample NASA Model Authentic Day Surface (cubemap UVs)
    vec4 dayTex = texture2D(uDayTexture, vUv);
    vec3 dayColor = dayTex.rgb;

    // 2. Compute Equirectangular UV for NASA Black Marble
    // Local mesh coordinate frame: North=+Y, South=-Y, Greenwich 0° Lon=-Z, East 90° Lon=+X
    float lat = asin(clamp(vNormal.y, -1.0, 1.0));
    float lon = atan(vNormal.x, -vNormal.z);
    
    vec2 bmUv = vec2(
      (lon + PI) / (2.0 * PI),
      (HALF_PI - lat) / PI
    );

    // 3. Sample NASA Black Marble 2012 & 2023 Nightlights
    vec3 night2012 = texture2D(uNight2012, bmUv).rgb;
    vec3 night2023 = texture2D(uNight2023, bmUv).rgb;
    
    // Crossfade between 2012 and 2023 observations
    vec3 baseNight = mix(night2012, night2023, uBlendYear);
    
    // Decadal Delta Enhancement in diff mode
    vec3 nightFinalColor = baseNight;
    if (uDiffMode > 0.5) {
      // Radiance difference: 2023 - 2012
      float delta = length(night2023) - length(night2012);
      float pulse = 0.5 + 0.5 * sin(uTime * 2.5);
      
      if (delta > 0.04) {
        // Brightened regions (urbanization/industrial expansion): Amber/Gold pulse
        vec3 expansionColor = vec3(1.0, 0.72, 0.18) * (1.2 + 0.4 * pulse);
        nightFinalColor = mix(baseNight, expansionColor, clamp(delta * 4.0, 0.0, 0.85));
      } else if (delta < -0.04) {
        // Dimmed regions (outages/conflict/re-greening): Cyan/Ice shift
        vec3 reductionColor = vec3(0.2, 0.8, 1.0);
        nightFinalColor = mix(baseNight, reductionColor, clamp(abs(delta) * 3.5, 0.0, 0.75));
      }
    }

    // Boost nightlights intensity for crisp space readability
    nightFinalColor = pow(nightFinalColor, vec3(0.88)) * 1.75;

    // 4. Directional Solar Illumination & Day/Night Terminator
    vec3 sunDir = normalize(uSunPosition);
    float NdotL = dot(vWorldNormal, sunDir);

    // Smooth physical terminator transition
    float dayMask = smoothstep(-0.12, 0.18, NdotL);
    float nightMask = 1.0 - smoothstep(-0.15, 0.08, NdotL);

    // Atmospheric Sunset / Twilight tint along the terminator
    float twilight = (1.0 - smoothstep(0.0, 0.16, abs(NdotL))) * max(0.0, NdotL + 0.12);
    vec3 sunsetColor = vec3(0.92, 0.42, 0.12) * twilight * 0.75;

    // 5. Combine Day & Night Hemispheres
    vec3 dayIlluminated = dayColor * (max(0.0, NdotL) * 1.15 + 0.04);
    vec3 nightIlluminated = nightFinalColor * nightMask;
    vec3 planetColor = dayIlluminated * dayMask + nightIlluminated + sunsetColor;

    // 6. Atmospheric Fresnel Rim Glow (Rayleigh scattering in deep space)
    vec3 viewDir = normalize(uCameraPos - vWorldPosition);
    float fresnel = 1.0 - max(0.0, dot(vWorldNormal, viewDir));
    fresnel = pow(fresnel, 3.8);
    
    // PRANA cyan/azure atmospheric rim, enhanced toward the sunlit crescent
    vec3 atmosRim = vec3(0.22, 0.62, 1.0) * fresnel * (0.35 + 0.65 * max(0.0, NdotL));
    planetColor += atmosRim;

    // Output final cinematic HDR tone
    gl_FragColor = vec4(planetColor, 1.0);
  }
`;

/**
 * NASA Earth Model Component
 *
 * Integrates the official NASA 3D Earth model (EarthClouds_1_12756)
 * from NASA Visualization Technology Applications and Development (VTAD).
 *
 * Preserves the authentic NASA mesh geometry, oblate spheroid profile,
 * daytime surface, and clouds, while projecting NASA Black Marble
 * 2012/2023 nighttime observations onto the night hemisphere.
 */
export function NasaEarthModel({
  observationYear = '2012',
  isDiffMode = false,
  autoRotate = true,
  autoRotateSpeed = 0.25,
  isInteracting = false,
  sunPosition = [4.5, 1.8, 2.5],
  onResetReady,
}: NasaEarthModelProps) {
  const earthGroupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const prefersReducedMotion = useReducedMotion();

  // Load official NASA 3D model (optimized 2.5MB GLB with identical geometry & 4K textures)
  const gltf = useGLTF('/models/EarthClouds_1_12756_optimized.glb');

  // Load NASA Black Marble equirectangular textures (4K with automatic mobile resolution adaptation)
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const resTag = isMobile ? '2k' : '4k';
  
  const [nightTexture2012, nightTexture2023] = useTexture([
    `/textures/earth/nightlights-2012-${resTag}.webp`,
    `/textures/earth/nightlights-2023-${resTag}.webp`,
  ]);

  // Configure nightlight textures
  useEffect(() => {
    [nightTexture2012, nightTexture2023].forEach((tex) => {
      if (tex) {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.anisotropy = 8;
        tex.generateMipmaps = true;
        tex.needsUpdate = true;
      }
    });
  }, [nightTexture2012, nightTexture2023]);

  // Extract the original NASA mesh geometry and diffuse texture from the loaded GLB
  const { nasaGeometry, nasaDayTexture } = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    let dayTex: THREE.Texture | null = null;

    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !geo) {
        const m = child as THREE.Mesh;
        geo = m.geometry.clone();
        
        // Extract native NASA diffuse texture
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat && mat.map) {
          dayTex = mat.map;
          dayTex.colorSpace = THREE.SRGBColorSpace;
          dayTex.needsUpdate = true;
        }
      }
    });

    return {
      nasaGeometry: geo || new THREE.SphereGeometry(500, 64, 64),
      nasaDayTexture: dayTex || nightTexture2012,
    };
  }, [gltf, nightTexture2012]);

  // Create strongly-typed uniforms object
  const uniforms = useMemo(() => ({
    uDayTexture: { value: nasaDayTexture },
    uNight2012: { value: nightTexture2012 },
    uNight2023: { value: nightTexture2023 },
    uBlendYear: { value: observationYear === '2023' ? 1.0 : 0.0 },
    uDiffMode: { value: isDiffMode ? 1.0 : 0.0 },
    uTime: { value: 0.0 },
    uSunPosition: { value: new THREE.Vector3(...sunPosition) },
    uCameraPos: { value: new THREE.Vector3(0, 0, 2.5) },
  }), [nasaDayTexture, nightTexture2012, nightTexture2023, observationYear, isDiffMode, sunPosition]);

  // Create Custom Planetary Shader Material
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
      uniforms,
    });
  }, [uniforms]);

  // Update uniforms when observationYear or isDiffMode changes
  useEffect(() => {
    uniforms.uDiffMode.value = isDiffMode ? 1.0 : 0.0;
  }, [uniforms, isDiffMode]);

  // Target blend value for smooth transition between 2012 and 2023
  const targetBlend = observationYear === '2023' ? 1.0 : 0.0;

  // Frame update: auto-rotation and shader animation
  useFrame(({ clock, camera }, delta) => {
    // 1. Update shader time and camera pos
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uCameraPos.value.copy(camera.position);

    // Smoothly interpolate blend value between 2012 and 2023
    const currentBlend = uniforms.uBlendYear.value;
    if (Math.abs(currentBlend - targetBlend) > 0.005) {
      uniforms.uBlendYear.value = THREE.MathUtils.lerp(
        currentBlend,
        targetBlend,
        delta * 4.0
      );
    } else {
      uniforms.uBlendYear.value = targetBlend;
    }

    // 2. Majestic planetary rotation around polar axis
    // Pauses during user drag or when reduced-motion is requested
    if (
      earthGroupRef.current &&
      autoRotate &&
      !isInteracting &&
      !prefersReducedMotion
    ) {
      earthGroupRef.current.rotation.y += delta * (autoRotateSpeed * 0.1);
    }
  });

  // Provide camera and rotation reset callback
  useEffect(() => {
    if (onResetReady && earthGroupRef.current) {
      const resetEarth = () => {
        if (earthGroupRef.current) {
          // Orient initial view toward the Atlantic/Europe/Africa (Prime Meridian)
          earthGroupRef.current.rotation.set(0, -Math.PI * 0.4, 0);
        }
      };
      onResetReady(resetEarth);
    }
  }, [onResetReady]);

  // Clean up geometry & material on unmount
  useEffect(() => {
    return () => {
      shaderMaterial.dispose();
      nasaGeometry.dispose();
    };
  }, [shaderMaterial, nasaGeometry]);

  // The NASA model has radius ~500 units.
  // Scale by 1/500 = 0.002 to normalize to unit radius R = 1.0
  const NASA_MODEL_SCALE = 0.002;

  // Earth's physical axial tilt (obliquity): 23.44 degrees = 0.4091 radians
  const EARTH_AXIAL_TILT = 0.4091;

  return (
    // Outer group applying Earth's axial tilt
    <group rotation={[0, 0, EARTH_AXIAL_TILT]}>
      {/* Inner rotating group around the tilted polar axis */}
      <group
        ref={earthGroupRef}
        rotation={[0, -Math.PI * 0.4, 0]}
      >
        <mesh
          ref={meshRef}
          geometry={nasaGeometry}
          material={shaderMaterial}
          scale={[NASA_MODEL_SCALE, NASA_MODEL_SCALE, NASA_MODEL_SCALE]}
          name="nasa-earth-mesh"
        />
      </group>
    </group>
  );
}

// Preload the official NASA model for instant rendering
useGLTF.preload('/models/EarthClouds_1_12756_optimized.glb');

export default NasaEarthModel;
