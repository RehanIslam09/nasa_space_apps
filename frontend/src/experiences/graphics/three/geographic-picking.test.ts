import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  localVectorToGeodesic,
  geodesicToLocalVector,
  formatCoordinates,
  formatCoordinatesDMS,
  DragVsClickDetector,
} from './geographic-picking';

describe('Geographic Picking & Coordinate Projection', () => {
  it('correctly maps the North and South Poles', () => {
    // North Pole = +Y
    const north = localVectorToGeodesic(new THREE.Vector3(0, 1, 0));
    expect(north.lat).toBeCloseTo(90.0, 3);

    // South Pole = -Y
    const south = localVectorToGeodesic(new THREE.Vector3(0, -1, 0));
    expect(south.lat).toBeCloseTo(-90.0, 3);
  });

  it('correctly maps the Prime Meridian, East, and West longitudes', () => {
    // Greenwich Prime Meridian = -Z
    const greenwich = localVectorToGeodesic(new THREE.Vector3(0, 0, -1));
    expect(greenwich.lat).toBeCloseTo(0.0, 3);
    expect(greenwich.lon).toBeCloseTo(0.0, 3);

    // 90° East Longitude = +X
    const east90 = localVectorToGeodesic(new THREE.Vector3(1, 0, 0));
    expect(east90.lat).toBeCloseTo(0.0, 3);
    expect(east90.lon).toBeCloseTo(90.0, 3);

    // 90° West Longitude = -X
    const west90 = localVectorToGeodesic(new THREE.Vector3(-1, 0, 0));
    expect(west90.lat).toBeCloseTo(0.0, 3);
    expect(west90.lon).toBeCloseTo(-90.0, 3);

    // 180° Antimeridian = +Z
    const antimeridian = localVectorToGeodesic(new THREE.Vector3(0, 0, 1));
    expect(antimeridian.lat).toBeCloseTo(0.0, 3);
    expect(Math.abs(antimeridian.lon)).toBeCloseTo(180.0, 3);
  });

  it('performs exact round-trip conversion between geodesic coordinates and 3D vectors', () => {
    const testCases = [
      { name: 'Amazon Rainforest', lat: -3.4653, lon: -62.2159 },
      { name: 'New Delhi, India', lat: 28.6139, lon: 77.209 },
      { name: 'Arctic Svalbard', lat: 78.2232, lon: 15.6267 },
      { name: 'California Sierra', lat: 37.8651, lon: -119.5383 },
      { name: 'Sahara Desert', lat: 23.4162, lon: 12.5532 },
      { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
      { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093 },
    ];

    testCases.forEach(({ name, lat, lon }) => {
      const vec = geodesicToLocalVector(lat, lon, 1.0);
      const roundTrip = localVectorToGeodesic(vec);
      expect(roundTrip.lat, `${name} latitude mismatch`).toBeCloseTo(lat, 3);
      expect(roundTrip.lon, `${name} longitude mismatch`).toBeCloseTo(lon, 3);
    });
  });

  it('formats coordinates into clear military/scientific decimal and DMS representations', () => {
    const formatted = formatCoordinates(-3.4653, -62.2159);
    expect(formatted).toBe('3.4653° S, 62.2159° W');

    const formattedDms = formatCoordinatesDMS(28.6139, 77.209);
    expect(formattedDms).toContain('28°36\'50"N');
    expect(formattedDms).toContain('077°12\'32"E');
  });

  it('discriminates between click and drag gestures accurately', () => {
    const detector = new DragVsClickDetector(6, 350);

    // 1. Clean click (movement < 6px, time < 350ms)
    detector.onPointerDown(100, 100);
    const isClick = detector.onPointerUp(102, 101);
    expect(isClick).toBe(true);

    // 2. Drag movement (> 6px)
    detector.onPointerDown(100, 100);
    const isDrag = detector.onPointerUp(140, 110);
    expect(isDrag).toBe(false);

    // 3. Pointer up without down
    detector.cancel();
    expect(detector.onPointerUp(100, 100)).toBe(false);
  });
});
