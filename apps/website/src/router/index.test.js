import { describe, expect, it } from 'vitest';
import router from './index';

describe('Website B2C routes — cart and server-authoritative preview', () => {
  it.each(['/cart', '/checkout', '/orders', '/orders/:id', '/sandbox-payment/:authority', '/wishlist'])('%s is registered as an active route', (path) => {
    const activePaths = router.getRoutes().map((route) => route.path);
    expect(activePaths).toContain(path);
  });

  it('protects checkout, order history and sandbox payment with CUSTOMER context while keeping cart and wishlist public', () => {
    const routes = router.getRoutes();
    const checkout = routes.find((route) => route.path === '/checkout');
    const cart = routes.find((route) => route.path === '/cart');
    const wishlist = routes.find((route) => route.path === '/wishlist');
    const orders = routes.find((route) => route.path === '/orders');
    const orderDetails = routes.find((route) => route.path === '/orders/:id');
    const sandboxPayment = routes.find((route) => route.path === '/sandbox-payment/:authority');

    expect(checkout.meta.requiresAuth).toBe(true);
    expect(checkout.meta.customerOnly).toBe(true);
    for (const route of [orders, orderDetails, sandboxPayment]) {
      expect(route.meta.requiresAuth).toBe(true);
      expect(route.meta.customerOnly).toBe(true);
    }
    expect(cart.meta.requiresAuth).not.toBe(true);
    expect(wishlist.meta.requiresAuth).not.toBe(true);
  });

  it('keeps B2B inquiry routes registered alongside the B2C order routes', () => {
    const activePaths = router.getRoutes().map((route) => route.path);
    expect(activePaths).toContain('/my-inquiries/:id?');
    expect(activePaths).toContain('/products/:id');
  });
});
