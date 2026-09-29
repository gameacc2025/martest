import { createRouter, createWebHistory } from "vue-router";
import { setAuthRouter } from "@telecom/auth";

import AdminLayout from "../layouts/AdminLayout.vue";

// Auth / gate
import Landing from "../pages/Landing.vue";
import ForgotPassword from "../pages/auth/ForgotPassword.vue";
import HandoffStart from "@telecom/shared-ui/components/auth/HandoffStart.vue";
import HandoffCallback from "@telecom/shared-ui/components/auth/HandoffCallback.vue";

// User Pages
import UserProfile from "../pages/user/UserProfile.vue";

// Login/Register are centralized on the website app (see
// apps/website/src/pages/public/{Login,Register}.vue). This app no longer
// has its own login/register forms — hitting /login or /register here just
// bounces the browser there, carrying the current URL as `?redirect=` so
// the user lands back on the page they meant to reach. The session comes
// back through the PKCE handoff (see @telecom/auth's beginPanelHandoff /
// redeemHandoffCode): /auth/start mints the challenge, and /auth/callback
// redeems the one-time code — never a token in a URL.
const websiteAppUrl = import.meta.env.VITE_WEBSITE_APP_URL || '/';

function redirectToWebsite(page) {
  return async (to) => {
    const { useAuthStore } = await import("../stores/auth");
    const authStore = useAuthStore();
    if (authStore.isAuthenticated && authStore.isStaff) {
      const redirect = typeof to.query.redirect === "string" ? to.query.redirect : null;
      if (redirect && !/^https?:\/\//i.test(redirect)) return redirect;
      return { name: "admin-dashboard" };
    }

    const target = `${window.location.origin}${to.fullPath}`;
    window.location.href = `${websiteAppUrl}/${page}?redirect=${encodeURIComponent(target)}`;
  };
}

const routes = [
  // ── Root gate ──────────────────────────────────────────────
  // The admin app is NOT the public marketplace. "/" decides, based on auth,
  // whether to show the dashboard or send the user to login. No PublicLayout.
  { path: "/", name: "root", component: Landing, meta: { title: "پنل مدیریت" } },

  // ── Auth routes (redirect to the centralized website pages) ─
  { path: "/login", name: "login", beforeEnter: redirectToWebsite('login'), component: { render: () => null } },
  { path: "/register", name: "register", beforeEnter: redirectToWebsite('register'), component: { render: () => null } },
  { path: "/forgot-password", name: "forgot-password", component: ForgotPassword, meta: { title: "فراموشی رمز عبور", guestOnly: true } },

  // ── PKCE session handoff (website login ⇄ this panel) ──────
  // Both are PUBLIC routes on purpose: the guard must not demand a token
  // that only the callback is about to create.
  { path: "/auth/start", name: "auth-start", component: HandoffStart, props: { app: "admin" }, meta: { title: "ورود به پنل" } },
  { path: "/auth/callback", name: "auth-callback", component: HandoffCallback, props: { app: "admin", defaultRedirect: "/admin-dashboard" }, meta: { title: "ورود به پنل" } },

  // ── Admin dashboard routes ─────────────────────────────────
  {
    path: "/",
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "/admin-dashboard", name: "admin-dashboard", component: () => import("../pages/admin/Dashboard.vue"), meta: { title: "داشبورد مدیریت" } },
      { path: "/profile", name: "profile", component: UserProfile, meta: { title: "پروفایل" } },
      { path: "/change-password", name: "change-password", component: () => import("../pages/user/ChangePassword.vue"), meta: { title: "تغییر رمز عبور" } },
      { path: "/notifications", name: "notifications", component: () => import("../pages/user/Notifications.vue"), meta: { title: "اعلان‌ها" } },
      // ── Users ──────────────────────────────────────────────
      { path: "/users", name: "admin-users", component: () => import("../pages/admin/users/UserList.vue"), meta: { title: "مدیریت کاربران" } },
      // ── Companies ─────────────────────────────────────────
      { path: "/companies", name: "admin-companies", component: () => import("../pages/admin/companies/CompanyList.vue"), meta: { title: "مدیریت شرکت‌ها" } },
      // ── Products ──────────────────────────────────────────
      { path: "/products", name: "admin-products", component: () => import("../pages/admin/products/ProductList.vue"), meta: { title: "مدیریت محصولات" } },
      { path: "/products/create", name: "admin-product-create", component: () => import("../pages/admin/products/ProductForm.vue"), meta: { title: "ایجاد محصول جدید" } },
      { path: "/products/:id/edit", name: "admin-product-edit", component: () => import("../pages/admin/products/ProductForm.vue"), meta: { title: "ویرایش محصول" } },
      // ── Categories ────────────────────────────────────────
      { path: "/categories", name: "admin-categories", component: () => import("../pages/admin/categories/CategoryList.vue"), meta: { title: "مدیریت دسته‌بندی‌ها" } },
      // ── Orders ────────────────────────────────────────────
      { path: "/orders", name: "admin-orders", component: () => import("../pages/admin/orders/OrderList.vue"), meta: { title: "مدیریت سفارشات" } },
      // ── Inquiries ─────────────────────────────────────────
      { path: "/inquiries", name: "admin-inquiries", component: () => import("../pages/admin/inquiries/InquiryList.vue"), meta: { title: "مدیریت استعلام‌ها" } },
      { path: "/inquiries/create", name: "admin-inquiry-create", component: () => import("../pages/admin/inquiries/InquiryCreate.vue"), meta: { title: "ایجاد استعلام جدید" } },
      { path: "/inquiries/:id", name: "admin-inquiry-detail", component: () => import("../pages/admin/inquiries/InquiryDetail.vue"), meta: { title: "جزئیات استعلام" } },
      // ── Roles & Permissions ───────────────────────────────
      { path: "/roles", name: "admin-roles", component: () => import("../pages/admin/roles/RoleList.vue"), meta: { title: "مدیریت نقش‌ها" } },
      { path: "/permissions", name: "admin-permissions", component: () => import("../pages/admin/permissions/PermissionList.vue"), meta: { title: "مدیریت مجوزها" } },
      // ── System settings ────────────────────────────────────
      { path: "/settings", name: "admin-settings", component: () => import("../pages/admin/settings/SystemSettings.vue"), meta: { title: "تنظیمات سیستم" } },
    ],
  },

  // ── Fallback ───────────────────────────────────────────────
  { path: "/:pathMatch(.*)*", name: "not-found", redirect: { name: "root" } },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

// Inject this router into the framework-agnostic auth layer so the auth store
// can redirect on logout WITHOUT importing the router (which would create a
// circular dependency). Must run right after createRouter(), before any nav.
setAuthRouter(router);

// Navigation guards
//
// Admin app guard pattern:
//   1. Set the page title.
//   2. Enforce auth on `requiresAuth` routes.
//   3. Bounce authenticated users away from `guestOnly` routes.
//   4. App selection: send authenticated users who don't belong to THIS app
//      to the app their accessProfile.type maps to.
router.beforeEach(async (to, from, next) => {
  const { useAuthStore } = await import("../stores/auth");
  const authStore = useAuthStore();

  // 1. Set page title
  if (to.meta.title) {
    document.title = `${to.meta.title} | Telecom Marketplace`;
  }

  // 2. Protected routes
  if (to.meta.requiresAuth) {
    const ok = await authStore.ensureAuthenticated(to.fullPath);
    if (!ok) return;
  }

  const isAuthed = authStore.isAuthenticated;

  // 3. Guest-only routes (login/register)
  if (to.meta.guestOnly && isAuthed) {
    return next({ name: "admin-dashboard" });
  }

  // 4. App selection: STAFF → Admin App (this app) | COMPANY → Company App | CUSTOMER → Website
  if (to.meta.requiresAuth && isAuthed && !authStore.isStaff) {
    const companyUrl = import.meta.env.VITE_COMPANY_APP_URL || '';
    const websiteUrl = import.meta.env.VITE_WEBSITE_APP_URL || '/';
    const target = authStore.isCompany && companyUrl
      ? `${companyUrl}/company-dashboard`
      : websiteUrl;
    await authStore.logout({ redirectTo: null });
    window.location.href = target;
    return;
  }

  next();
});


export default router;
