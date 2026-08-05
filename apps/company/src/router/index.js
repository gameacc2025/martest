import { createRouter, createWebHistory } from "vue-router";
import { setAuthRouter } from "@telecom/auth";

import CompanyLayout from "../layouts/CompanyLayout.vue";

// Auth / gate
import Landing from "../pages/Landing.vue";
import ForgotPassword from "../pages/auth/ForgotPassword.vue";

// User Pages
import UserProfile from "../pages/user/UserProfile.vue";

// Login/Register are centralized on the website app (see
// apps/website/src/pages/public/{Login,Register}.vue). This app no longer
// has its own login/register forms — hitting /login or /register here just
// bounces the browser there, carrying the current URL as `?redirect=` so
// the user lands back on the page they meant to reach. On success the
// website hands the freshly-created session back to us via a URL fragment
// (see @telecom/auth's buildSessionHandoffUrl / bootstrapSessionFromUrl,
// consumed in main.js before the app mounts).
const websiteAppUrl = import.meta.env.VITE_WEBSITE_APP_URL || '/';

function redirectToWebsite(page) {
  return (to) => {
    const target = `${window.location.origin}${to.fullPath}`;
    window.location.href = `${websiteAppUrl}/${page}?redirect=${encodeURIComponent(target)}`;
  };
}

const routes = [
  // ── Root gate ──────────────────────────────────────────────
  // The company app is NOT the public marketplace. "/" decides, based on auth,
  // whether to show the dashboard or send the user to login. No PublicLayout.
  { path: "/", name: "root", component: Landing, meta: { title: "شرکت" } },

  // ── Auth routes (redirect to the centralized website pages) ─
  { path: "/login", name: "login", beforeEnter: redirectToWebsite('login'), component: { render: () => null } },
  { path: "/register", name: "register", beforeEnter: redirectToWebsite('register'), component: { render: () => null } },
  { path: "/forgot-password", name: "forgot-password", component: ForgotPassword, meta: { title: "فراموشی رمز عبور", guestOnly: true } },

  // ── Company dashboard routes ───────────────────────────────
  {
    path: "/",
    component: CompanyLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "/company-dashboard", name: "company-dashboard", component: () => import("../pages/user/dashboard/CompanyDashboard.vue"), meta: { title: "داشبورد شرکت" } },
      { path: "/profile", name: "profile", component: UserProfile, meta: { title: "پروفایل" } },
      { path: "/company-settings", name: "company-settings", component: () => import("../pages/user/company/CompanySettings.vue"), meta: { title: "تنظیمات شرکت" } },
      { path: "/company-products", name: "company-products", component: () => import("../pages/user/company/CompanyProducts.vue"), meta: { title: "محصولات شرکت" } },
      { path: "/my-products", name: "my-products", component: () => import("../pages/user/MyProducts.vue"), meta: { title: "محصولات من" } },
      { path: "/change-password", name: "change-password", component: () => import("../pages/user/ChangePassword.vue"), meta: { title: "تغییر رمز عبور" } },
      { path: "/notifications", name: "notifications", component: () => import("../pages/user/Notifications.vue"), meta: { title: "اعلان‌ها" } },
      // Company product management (company users access via products permission)
      { path: "/products", name: "manage-products", component: () => import("../pages/company/products/ProductList.vue"), meta: { title: "مدیریت محصولات" } },
      { path: "/products/create", name: "manage-product-create", component: () => import("../pages/company/products/ProductForm.vue"), meta: { title: "ایجاد محصول جدید" } },
      { path: "/products/:id/edit", name: "manage-product-edit", component: () => import("../pages/company/products/ProductForm.vue"), meta: { title: "ویرایش محصول" } },
      // ── Inquiries ────────────────────────────────────────
      { path: "/inquiries", name: "company-inquiries", component: () => import("../pages/company/inquiries/InquiryList.vue"), meta: { title: "استعلام‌ها" } },
      { path: "/inquiries/create", name: "company-inquiry-create", component: () => import("../pages/company/inquiries/InquiryCreate.vue"), meta: { title: "ایجاد استعلام" } },
      { path: "/inquiries/:id", name: "company-inquiry-detail", component: () => import("../pages/company/inquiries/InquiryDetail.vue"), meta: { title: "جزئیات استعلام" } },
      // ── Users (company members) ──────────────────────────
      { path: "/users", name: "company-users", component: () => import("../pages/company/users/UserList.vue"), meta: { title: "کاربران شرکت" } },
      // ── Reports ──────────────────────────────────────────
      { path: "/reports", name: "company-reports", component: () => import("../pages/company/reports/Reports.vue"), meta: { title: "گزارش‌ها" } },
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
// Shared guard pattern across dashboard apps (admin + company):
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
    return next({ name: "company-dashboard" });
  }

  // 4. App selection is driven SOLELY by accessProfile.type.
  //   COMPANY → Company App (this app)  |  STAFF → Admin App  |  CUSTOMER → Website
  //
  // Roles no longer decide which app a user belongs to; they only grant
  // permissions INSIDE the selected app. An authenticated user whose
  // accessProfile.type is not COMPANY does NOT belong here.
  //
  // We must NOT bounce them to /login (it is guestOnly and would immediately
  // send an authenticated user back to /company-dashboard → infinite redirect
  // loop). Instead, send them to the app their access type actually maps to.
  if (to.meta.requiresAuth && isAuthed && !authStore.isCompany) {
    const adminUrl = import.meta.env.VITE_ADMIN_APP_URL || '';
    const websiteUrl = import.meta.env.VITE_WEBSITE_APP_URL || '/';
    const target = authStore.isStaff && adminUrl
      ? `${adminUrl}/admin`
      : websiteUrl;
    await authStore.logout({ redirectTo: null });
    window.location.href = target;
    return; // abort this navigation; browser is leaving to the correct app
  }

  next();
});


export default router;