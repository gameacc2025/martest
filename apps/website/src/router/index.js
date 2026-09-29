import { createRouter, createWebHistory } from "vue-router";
import { setAuthRouter } from "@telecom/auth";

import PublicLayout from "../layouts/PublicLayout.vue";

// Public Pages
import Home from "../pages/public/Home.vue";
import Categories from "../pages/public/Categories.vue";
import ProductListing from "../pages/public/ProductListing.vue";
import ProductDetails from "../pages/public/ProductDetails.vue";
import SearchResults from "../pages/public/SearchResults.vue";
import ShoppingCart from "../pages/public/ShoppingCart.vue";
import Checkout from "../pages/public/Checkout.vue";
import Login from "../pages/public/Login.vue";
import Register from "../pages/public/Register.vue";
import ForgotPassword from "../pages/public/ForgotPassword.vue";
import Orders from "../pages/public/Orders.vue";
import Wishlist from "../pages/public/Wishlist.vue";
import CompanyProfile from "../pages/public/CompanyProfile.vue";
import ContactUs from "../pages/public/ContactUs.vue";
import AboutUs from "../pages/public/AboutUs.vue";
import Faq from "../pages/public/Faq.vue";
import Terms from "../pages/public/Terms.vue";
import NotFound from "../pages/public/NotFound.vue";

const routes = [
  // Public routes
  {
    path: "/",
    component: PublicLayout,
    children: [
      { path: "", name: "home", component: Home, meta: { title: "صفحه اصلی" } },
      {
        path: "categories",
        name: "categories",
        component: Categories,
        meta: { title: "دسته بندی ها" },
      },
      {
        path: "products",
        name: "products",
        component: ProductListing,
        meta: { title: "محصولات" },
      },
      {
        path: "products/:id",
        name: "product-details",
        component: ProductDetails,
        meta: { title: "جزئیات محصول" },
      },
      {
        path: "search",
        name: "search",
        component: SearchResults,
        meta: { title: "نتایج جستجو" },
      },
      {
        path: "cart",
        name: "cart",
        component: ShoppingCart,
        meta: { title: "سبد خرید", requiresAuth: true },
      },
      {
        path: "checkout",
        name: "checkout",
        component: Checkout,
        meta: { title: "تسویه حساب", requiresAuth: true },
      },
      {
        path: "forgot-password",
        name: "forgot-password",
        component: ForgotPassword,
        meta: { title: "فراموشی رمز عبور", guestOnly: true },
      },
      {
        path: "orders",
        name: "orders",
        component: Orders,
        meta: { title: "سفارشات", requiresAuth: true },
      },
      {
        path: "wishlist",
        name: "wishlist",
        component: Wishlist,
        meta: { title: "لیست علاقه مندی ها", requiresAuth: true },
      },
      {
        path: "company/:id",
        name: "company-profile",
        component: CompanyProfile,
        meta: { title: "پروفایل شرکت" },
      },
      {
        path: "contact",
        name: "contact",
        component: ContactUs,
        meta: { title: "تماس با ما" },
      },
      {
        path: "about",
        name: "about",
        component: AboutUs,
        meta: { title: "درباره ما" },
      },
      {
        path: "faq",
        name: "faq",
        component: Faq,
        meta: { title: "سوالات متداول" },
      },
      {
        path: "terms",
        name: "terms",
        component: Terms,
        meta: { title: "قوانین و حریم خصوصی" },
      },
      {
        path: "/:pathMatch(.*)*",
        name: "not-found",
        component: NotFound,
        meta: { title: "یافت نشد" },
      },
    ],
  },

  // Standalone auth routes (no layout)
  {
    path: "/login",
    name: "login",
    component: Login,
    meta: { title: "ورود", guestOnly: true },
  },
  {
    path: "/register",
    name: "register",
    component: Register,
    meta: { title: "ثبت نام", guestOnly: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  },
});

// Inject this router into the framework-agnostic auth layer so the auth store
// can redirect on logout WITHOUT importing the router (which would create a
// circular dependency). Must run right after createRouter(), before any nav.
setAuthRouter(router);

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const { useAuthStore } = await import("../stores/auth");
  const authStore = useAuthStore();

  // Set page title
  if (to.meta.title) {
    document.title = `${to.meta.title} | Telecom Marketplace`;
  }

  // Protected routes
  if (to.meta.requiresAuth) {
    const ok = await authStore.ensureAuthenticated(to.fullPath);
    if (!ok) {
      return;
    }
  }

  const isAuthed = authStore.isAuthenticated;

  // Guest-only routes (login/register)
  //
  // Exception: a PKCE handoff in flight (?app&challenge on /login) must keep
  // the login page mounted even for an authenticated user — it is precisely
  // the step that mints the panel's one-time code (see Login.vue).
  const handoffMinting = to.name === "login" && !!to.query.app && !!to.query.challenge;
  if (to.meta.guestOnly && isAuthed && !handoffMinting) {
    return next({ name: "home" });
  }

  next();
});

export default router;
