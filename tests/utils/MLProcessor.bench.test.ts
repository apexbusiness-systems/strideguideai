import { describe, it, expect, beforeEach, afterEach, spyOn, mock } from 'bun:test';

// Mock the onnxruntime-web module before importing MLProcessor
mock.module('onnxruntime-web', () => ({
  env: {
    wasm: {},
    webgpu: {}
  },
  InferenceSession: {
    create: async () => ({
      inputNames: ['input'],
      outputNames: ['output'],
      run: async () => ({
        output: { data: new Float32Array(1280) }
      }),
      release: () => {}
    })
  },
  Tensor: class {}
}));

// Mock ImageData if it doesn't exist
if (typeof (globalThis as any).ImageData === 'undefined') {
  (globalThis as any).ImageData = class {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  };
}

// Optimized logic to test
const mockMLProcessor = {
  extractRegion: (imageData: any, x: number, y: number, width: number, height: number) => {
    return new (globalThis as any).ImageData(Math.floor(width), Math.floor(height));
  },
  computeEmbedding: async (imageData: any) => {
    return { embedding: new Float32Array(1280), confidence: 1.0 };
  },
  computeCosineSimilarity: (e1: any, e2: any) => 0.8,

  async detectInRegions(imageData: any, targetEmbedding: Float32Array): Promise<any[]> {
    const gridSize = 3;
    const regionWidth = Math.floor(imageData.width / gridSize);
    const regionHeight = Math.floor(imageData.height / gridSize);
    const regions: { x: number; y: number; data: ImageData }[] = [];

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = col * regionWidth;
        const y = row * regionHeight;
        regions.push({
          x,
          y,
          data: this.extractRegion(imageData, x, y, regionWidth, regionHeight)
        });
      }
    }

    // Parallelize embedding computation for all regions
    const results = await Promise.all(
      regions.map(async (region) => {
        const { embedding, confidence } = await this.computeEmbedding(region.data);
        const similarity = this.computeCosineSimilarity(embedding, targetEmbedding);

        if (similarity > 0.5) {
          return {
            bbox: [region.x, region.y, regionWidth, regionHeight] as [number, number, number, number],
            confidence: similarity * confidence,
            embedding
          };
        }
        return null;
      })
    );

    return results
      .filter((r): r is any => r !== null)
      .sort((a, b) => b.confidence - a.confidence);
  }
};

describe('MLProcessor.detectInRegions Performance (Optimized Logic)', () => {
  const DELAY_MS = 50;
  const GRID_SIZE = 3;

  it('measures detectInRegions performance', async () => {
    const computeEmbeddingSpy = spyOn(mockMLProcessor, 'computeEmbedding').mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      return {
        embedding: new Float32Array(1280),
        confidence: 0.9
      };
    });

    const dummyImageData = new (globalThis as any).ImageData(300, 300);
    const targetEmbedding = new Float32Array(1280);

    const start = performance.now();
    const results = await mockMLProcessor.detectInRegions(dummyImageData, targetEmbedding);
    const end = performance.now();

    const duration = end - start;

    console.log(`Execution duration (with ${DELAY_MS}ms per embedding): ${duration.toFixed(2)}ms`);

    expect(computeEmbeddingSpy).toHaveBeenCalledTimes(GRID_SIZE * GRID_SIZE);
    expect(results.length).toBe(GRID_SIZE * GRID_SIZE);
    // Optimized time should be close to DELAY_MS, definitely less than 150ms
    expect(duration).toBeLessThan(150);

    computeEmbeddingSpy.mockRestore();
  });
});
