import { describe, it, expect } from 'vitest';
import { distanceOf, cocoToHazard, laneOf } from '@/ml/hazardMap';

describe('distanceOf', () => {
  it('should return "near" for large area ratios', () => {
    // Default near = 0.12
    expect(distanceOf(120, 1000)).toBe('near');
    expect(distanceOf(200, 1000)).toBe('near');
  });

  it('should return "mid" for medium area ratios', () => {
    // Default mid = 0.04, near = 0.12
    expect(distanceOf(40, 1000)).toBe('mid');
    expect(distanceOf(119, 1000)).toBe('mid');
  });

  it('should return "far" for small area ratios', () => {
    // Default mid = 0.04
    expect(distanceOf(39, 1000)).toBe('far');
    expect(distanceOf(10, 1000)).toBe('far');
  });

  it('should handle custom thresholds', () => {
    // area / frameArea = 0.1
    expect(distanceOf(10, 100, 0.2, 0.05)).toBe('mid');
    expect(distanceOf(10, 100, 0.05, 0.02)).toBe('near');
    expect(distanceOf(10, 100, 0.3, 0.2)).toBe('far');
  });

  it('should handle edge cases exactly at threshold', () => {
    expect(distanceOf(12, 100)).toBe('near'); // exactly near threshold
    expect(distanceOf(4, 100)).toBe('mid');   // exactly mid threshold
  });
});

describe('cocoToHazard', () => {
  it('should map vehicle classes correctly', () => {
    expect(cocoToHazard('car')).toBe('vehicle');
    expect(cocoToHazard('bus')).toBe('vehicle');
    expect(cocoToHazard('truck')).toBe('vehicle');
    expect(cocoToHazard('train')).toBe('vehicle');
  });

  it('should map bike classes correctly', () => {
    expect(cocoToHazard('bicycle')).toBe('bike');
    expect(cocoToHazard('motorcycle')).toBe('bike');
  });

  it('should map person class correctly', () => {
    expect(cocoToHazard('person')).toBe('person');
  });

  it('should map dog class correctly', () => {
    expect(cocoToHazard('dog')).toBe('dog');
  });

  it('should map pole-like classes correctly', () => {
    expect(cocoToHazard('traffic light')).toBe('pole');
    expect(cocoToHazard('stop sign')).toBe('pole');
    expect(cocoToHazard('potted plant')).toBe('pole');
  });

  it('should map bench/chair classes correctly', () => {
    expect(cocoToHazard('bench')).toBe('bench');
    expect(cocoToHazard('chair')).toBe('bench');
  });

  it('should map trip hazard proxies correctly', () => {
    expect(cocoToHazard('backpack')).toBe('dropoff_like');
    expect(cocoToHazard('suitcase')).toBe('dropoff_like');
  });

  it('should return "unknown" for unrecognized or low-priority classes', () => {
    expect(cocoToHazard('tv')).toBe('unknown');
    expect(cocoToHazard('bear')).toBe('unknown');
    expect(cocoToHazard('apple')).toBe('unknown');
  });

  it('should be case-insensitive', () => {
    expect(cocoToHazard('CAR')).toBe('vehicle');
    expect(cocoToHazard('Person')).toBe('person');
  });
});

describe('laneOf', () => {
  // Default band = 0.34
  // leftEdge = 0.5 - 0.17 = 0.33
  // rightEdge = 0.5 + 0.17 = 0.67

  it('should return "left" when xCenter is on the left side', () => {
    expect(laneOf(32, 100)).toBe('left');
    expect(laneOf(0, 100)).toBe('left');
  });

  it('should return "right" when xCenter is on the right side', () => {
    expect(laneOf(68, 100)).toBe('right');
    expect(laneOf(100, 100)).toBe('right');
  });

  it('should return "center" when xCenter is in the middle band', () => {
    expect(laneOf(50, 100)).toBe('center');
    expect(laneOf(34, 100)).toBe('center');
    expect(laneOf(66, 100)).toBe('center');
  });

  it('should handle custom band widths', () => {
    // band = 0.5
    // leftEdge = 0.5 - 0.25 = 0.25
    // rightEdge = 0.5 + 0.25 = 0.75
    expect(laneOf(26, 100, 0.5)).toBe('center');
    expect(laneOf(24, 100, 0.5)).toBe('left');
    expect(laneOf(74, 100, 0.5)).toBe('center');
    expect(laneOf(76, 100, 0.5)).toBe('right');
  });

  it('should handle edge cases exactly at boundary', () => {
    // nx = 0.33, leftEdge = 0.33
    expect(laneOf(33, 100)).toBe('center'); // nx is not < leftEdge
    // nx = 0.67, rightEdge = 0.67
    expect(laneOf(67, 100)).toBe('center'); // nx is not > rightEdge
  });
});
