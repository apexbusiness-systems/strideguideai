import { describe, it, expect, spyOn } from 'bun:test';
import { batchOptimizeImages } from '../../src/utils/ImageOptimizer';

// Mocking DOM globals for the environment
if (typeof window === 'undefined') {
  (global as any).Image = class {
    onload: () => void = () => {};
    onerror: () => void = () => {};
    _src: string = '';
    width: number = 100;
    height: number = 100;

    set src(val: string) {
      this._src = val;
      // Simulate async loading
      setTimeout(() => {
        if (val === 'fail-url') {
           if (this.onerror) this.onerror();
        } else {
           if (this.onload) this.onload();
        }
      }, 10);
    }
    get src() { return this._src; }
  };

  (global as any).URL = {
    createObjectURL: (obj: any) => {
      if (obj && obj.name === 'fail.jpg') return 'fail-url';
      return 'blob:mock-url';
    },
    revokeObjectURL: () => {},
  };

  (global as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return {
          getContext: () => ({
            drawImage: () => {},
          }),
          toBlob: (cb: (b: any) => void) => {
            // Simulate async blob creation
            setTimeout(() => {
              cb({ size: 1024 } as any);
            }, 10);
          },
          width: 0,
          height: 0,
        };
      }
      return {};
    },
  };
}

describe('ImageOptimizer', () => {
  describe('batchOptimizeImages', () => {
    it('optimizes multiple files in parallel', async () => {
      const mockFiles = [
        new File([''], 'test1.jpg', { type: 'image/jpeg' }),
        new File([''], 'test2.jpg', { type: 'image/jpeg' }),
      ];

      const results = await batchOptimizeImages(mockFiles);

      expect(results.length).toBe(2);
      expect(results[0].optimizedSize).toBe(1024);
      expect(results[1].optimizedSize).toBe(1024);
    });

    it('continues if one file fails', async () => {
      const mockFiles = [
        new File([''], 'test1.jpg', { type: 'image/jpeg' }),
        new File([''], 'fail.jpg', { type: 'image/jpeg' }),
      ];

      // Mock console.error to avoid noise in test output
      const errorSpy = spyOn(console, 'error').mockImplementation(() => {});

      const results = await batchOptimizeImages(mockFiles);

      expect(results.length).toBe(1);
      expect(results[0].blob).toBeDefined();
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });
});
