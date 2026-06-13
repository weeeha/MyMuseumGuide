import { computeTargetSize } from './resize';

describe('computeTargetSize', () => {
  it('keeps images already within the limit', () => {
    expect(computeTargetSize(800, 600, 1280)).toEqual({ width: 800, height: 600 });
  });

  it('scales the long edge down to the limit, preserving aspect', () => {
    expect(computeTargetSize(4032, 3024, 1280)).toEqual({ width: 1280, height: 960 });
  });

  it('handles portrait orientation', () => {
    expect(computeTargetSize(3024, 4032, 1280)).toEqual({ width: 960, height: 1280 });
  });

  it('keeps an image whose long edge equals the limit', () => {
    expect(computeTargetSize(1280, 720, 1280)).toEqual({ width: 1280, height: 720 });
  });
});
