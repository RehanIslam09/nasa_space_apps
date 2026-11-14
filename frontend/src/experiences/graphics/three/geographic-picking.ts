/**
 * Geographic Picking & Coordinate Projection Utilities
 *
 * Implements geodesic coordinate calculations, raycasting against the
 * official NASA 3D Earth model, and pointer gesture discrimination
 * (preventing camera orbit drags from registering as clicks).
 */

import * as THREE from 'three';

export interface GeodesicCoordinates {
  /** Latitude in decimal degrees: [-90, +90] */
  lat: number;
  /** Longitude in decimal degrees: [-180, +180] */
  lon: number;
}

export interface GeographicPickResult {
  coordinates: GeodesicCoordinates;
  worldPoint: THREE.Vector3;
  localPoint: THREE.Vector3;
  distance: number;
}

/**
 * Converts a 3D unit normal vector in the NASA model's coordinate frame
 * into geodesic latitude and longitude (decimal degrees).
 *
 * NASA Model Coordinate System:
 * - North Pole (+90° Lat): +Y
 * - South Pole (-90° Lat): -Y
 * - Prime Meridian (0° Lon, Greenwich): -Z
 * - 90° East Longitude: +X
 * - Antimeridian (180° Lon): +Z
 * - 90° West Longitude: -X
 */
export function localVectorToGeodesic(vector: THREE.Vector3): GeodesicCoordinates {
  const norm = vector.clone().normalize();
  const clampedY = Math.max(-1.0, Math.min(1.0, norm.y));
  const latRad = Math.asin(clampedY);
  const lonRad = Math.atan2(norm.x, -norm.z);

  const lat = (latRad * 180.0) / Math.PI;
  const lon = (lonRad * 180.0) / Math.PI;

  return {
    lat: Number(lat.toFixed(4)),
    lon: Number(lon.toFixed(4)),
  };
}

/**
 * Converts geodesic latitude and longitude (decimal degrees) into
 * a 3D position vector in the NASA model's local coordinate frame.
 *
 * @param lat Latitude in decimal degrees [-90, +90]
 * @param lon Longitude in decimal degrees [-180, +180]
 * @param radius Radius of the sphere (default 1.008 for placing markers slightly above surface)
 */
export function geodesicToLocalVector(
  lat: number,
  lon: number,
  radius = 1.008
): THREE.Vector3 {
  const phi = (lat * Math.PI) / 180.0;
  const lam = (lon * Math.PI) / 180.0;

  const y = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const x = cosPhi * Math.sin(lam);
  const z = -cosPhi * Math.cos(lam);

  return new THREE.Vector3(x * radius, y * radius, z * radius);
}

/**
 * Formats geodesic coordinates into a military/scientific string:
 * e.g. "3.4653° S, 62.2159° W" or "28.6139° N, 77.2090° E"
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latAbs = Math.abs(lat).toFixed(4);
  const lonAbs = Math.abs(lon).toFixed(4);
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${latAbs}° ${latDir}, ${lonAbs}° ${lonDir}`;
}

/**
 * Formats coordinates into standard Degrees Minutes Seconds (DMS) string
 * for high-tech HUD / tactical display: e.g. 03°27'55"S 062°12'57"W
 */
export function formatCoordinatesDMS(lat: number, lon: number): string {
  const toDms = (val: number, isLat: boolean) => {
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : val >= 0 ? 'E' : 'W';
    const abs = Math.abs(val);
    const deg = Math.floor(abs);
    const minFloat = (abs - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = Math.floor((minFloat - min) * 60);
    const degStr = String(deg).padStart(isLat ? 2 : 3, '0');
    const minStr = String(min).padStart(2, '0');
    const secStr = String(sec).padStart(2, '0');
    return `${degStr}°${minStr}'${secStr}"${dir}`;
  };
  return `${toDms(lat, true)} ${toDms(lon, false)}`;
}

/**
 * Gesture discriminator to distinguish between an interactive click on the globe
 * and a camera orbit drag gesture.
 */
export class DragVsClickDetector {
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private isPointerDown = false;
  private maxDistancePx: number;
  private maxDurationMs: number;

  constructor(maxDistancePx = 6, maxDurationMs = 350) {
    this.maxDistancePx = maxDistancePx;
    this.maxDurationMs = maxDurationMs;
  }

  public onPointerDown(clientX: number, clientY: number): void {
    this.startX = clientX;
    this.startY = clientY;
    this.startTime = performance.now();
    this.isPointerDown = true;
  }

  public onPointerUp(clientX: number, clientY: number): boolean {
    if (!this.isPointerDown) return false;
    this.isPointerDown = false;

    const dx = clientX - this.startX;
    const dy = clientY - this.startY;
    const distSq = dx * dx + dy * dy;
    const duration = performance.now() - this.startTime;

    // It is an intentional click if movement is below pixel threshold
    // and was performed in a reasonable click duration
    return distSq <= this.maxDistancePx * this.maxDistancePx && duration <= this.maxDurationMs;
  }

  public cancel(): void {
    this.isPointerDown = false;
  }
}
