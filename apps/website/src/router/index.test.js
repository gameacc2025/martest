import { describe, expect, it } from 'vitest';
import router from './index';

describe('Website routes — AD-4 future B2C commerce remains disabled', () => {
  it.each(['/cart', '/checkout', '/orders', '/wishlist'])('%s is not registered as an active route', (path) => {
    const activePaths = router.getRoutes().map((route) => route.path);
    expect(activePaths).not.toContain(path);
  });
});
