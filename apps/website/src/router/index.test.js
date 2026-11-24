import { describe, expect, it } from 'vitest';
import router from './index';

describe('Website B2C routes — cart and server-authoritative preview', () => {
  it.each(['/cart', '/checkout', '/wishlist'])('%s is registered as an active route', (path) => {
    const activePaths = router.getRoutes().map((route) => route.path);
    expect(activePaths).toContain(path);
  });

  it('protects checkout with CUSTOMER context while keeping cart and wishlist public', () => {
    const routes = router.getRoutes();
    const checkout = routes.find((route) => route.path === '/checkout');
    const cart = routes.find((route) => route.path === '/cart');
    const wishlist = routes.find((route) => route.path === '/wishlist');

    expect(checkout.meta.requiresAuth).toBe(true);
    expect(checkout.meta.customerOnly).toBe(true);
    expect(cart.meta.requiresAuth).not.toBe(true);
    expect(wishlist.meta.requiresAuth).not.toBe(true);
  });

  it('/orders remains unregistered until the server order lifecycle is implemented', () => {
    const activePaths = router.getRoutes().map((route) => route.path);
    expect(activePaths).not.toContain('/orders');
  });
});
