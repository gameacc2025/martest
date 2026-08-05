import { createRouter, createWebHistory } from "vue-router";
import { setAuthRouter } from "@telecom/auth";

import AdminLayout from "../layouts/AdminLayout.vue";

// Auth / gate
import Landing from "../pages/Landing.vue";
import ForgotPassword from "../pages/auth/ForgotPassword.vue";

// Admin Dashboard
import AdminDashboard from "../pages/admin/Dashboard.vue";

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
  // The admin app is NOT the public marketplace. "/" decides, based on auth,
  // whether to show the admin dashboard or send the user to login. No
  // PublicLayout.
  { path: "/", name: "root", component: Landing, meta: { title: "پنل مدیریت" } },

  // ── Auth routes (redirect to the centralized website pages) ─
  { path: "/login", name: "login", beforeEnter: redirectToWebsite('login'), component: { render: () => null } },
  { path: "/register", name: "register", beforeEnter: redirectToWebsite('register'), component: { render: () => null } },
  { path: "/forgot-password", name: "forgot-password", component: ForgotPassword, meta: { title: "فراموشی رمز عبور", guestOnly: true } },

  // ── Admin routes ───────────────────────────────────────────
  {
    path: "/admin",
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: "", name: "admin-dashboard", component: AdminDashboard, meta: { title: "داشبورد" } },
      { path: "users", name: "admin-users", component: () => import("../pages/admin/users/UserList.vue"), meta: { title: "مدیریت کاربران" } },
      { path: "roles", name: "admin-roles", component: () => import("../pages/admin/roles/RoleList.vue"), meta: { title: "مدیریت نقش ها" } },
      { path: "permissions", name: "admin-permissions", component: () => import("../pages/admin/permissions/PermissionList.vue"), meta: { title: "مدیریت مجوزها" } },
      { path: "products", name: "admin-products", component: () => import("../pages/admin/products/ProductList.vue"), meta: { title: "مدیریت محصولات" } },
      { path: "products/create", name: "admin-product-create", component: () => import("../pages/admin/products/ProductForm.vue"), meta: { title: "ایجاد محصول جدید" } },
      { path: "products/:id/edit", name: "admin-product-edit", component: () => import("../pages/admin/products/ProductForm.vue"), meta: { title: "ویرایش محصول" } },
      { path: "categories", name: "admin-categories", component: () => import("../pages/admin/categories/CategoryList.vue"), meta: { title: "مدیریت دسته‌بندی‌ها" } },
      { path: "orders", name: "admin-orders", component: () => import("../pages/admin/orders/OrderList.vue"), meta: { title: "مدیریت سفارشات" } },
      { path: "companies", name: "admin-companies", component: () => import("../pages/admin/companies/CompanyList.vue"), meta: { title: "مدیریت شرکت‌ها" } },
      { path: "inquiries", name: "admin-inquiries", component: () => import("../pages/admin/inquiries/InquiryList.vue"), meta: { title: "درخواست‌های استعلام" } },
      { path: "inquiries/create", name: "admin-inquiry-create", component: () => import("../pages/admin/inquiries/InquiryCreate.vue"), meta: { title: "ایجاد درخواست استعلام" } },
      { path: "inquiries/:id", name: "admin-inquiry-detail", component: () => import("../pages/admin/inquiries/InquiryDetail.vue"), meta: { title: "جزئیات درخواست استعلام" } },

      // ── Account (shared dashboard menu links here for every user) ──
      { path: "profile", name: "profile", component: () => import("../pages/user/UserProfile.vue"), meta: { title: "پروفایل من" } },
      { path: "notifications", name: "notifications", component: () => import("../pages/user/Notifications.vue"), meta: { title: "اعلان‌ها" } },
      { path: "change-password", name: "change-password", component: () => import("../pages/user/ChangePassword.vue"), meta: { title: "تغییر رمز عبور" } },
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
    return next({ name: "admin-dashboard" });
  }

  // 4. App selection is driven SOLELY by accessProfile.type.
  //   STAFF → Admin App (this app)  |  COMPANY → Company App  |  CUSTOMER → Website
  //
  // Roles no longer decide which app a user belongs to; they only grant
  // permissions INSIDE the selected app. An authenticated user whose
  // accessProfile.type is not STAFF does NOT belong here.
  //
  // We must NOT bounce them to /login (it is guestOnly and would immediately
  // send an authenticated user back to /admin → infinite redirect loop).
  // Instead, send them to the app their access type actually maps to.
  if (to.meta.requiresAuth && isAuthed && !authStore.isStaff) {
    const companyUrl = import.meta.env.VITE_COMPANY_APP_URL || '';
    const websiteUrl = import.meta.env.VITE_WEBSITE_APP_URL || '/';
    const target = authStore.isCompany && companyUrl
      ? `${companyUrl}/company-dashboard`
      : websiteUrl;
    await authStore.logout({ redirectTo: null });
    window.location.href = target;
    return; // abort this navigation; browser is leaving to the correct app
  }

  next();
});


export default router;