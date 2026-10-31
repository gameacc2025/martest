# API route inventory

Generated from the Fastify route registrations on `main` at 2026-10-31. All paths below include the `/api/v1` prefix.

## How to read this inventory

- The method and path are the registered HTTP route, not a frontend URL.
- The guard column summarizes route-level `onRequest`/`preHandler` and inherited module hooks. `AccessProfile` app context is independent of role names and wildcard permissions.
- Resource ownership and tenant filters are also enforced in services; a route guard alone is not the complete authorization contract.
- Request/response JSON schemas, limits, and examples remain in the source route/schema files. This inventory does not invent schemas for routes that currently omit them.
- A public callback is not trusted based on query parameters: it must verify the stored provider Authority server-to-server.

## Route index

### auth — `/api/v1/auth`

Mixed public and authenticated session routes; see each row.

| Method | Full path | Route guard / scope |
|---|---|---|
| POST | `/api/v1/auth/login` | `Public` |
| POST | `/api/v1/auth/register` | `Public` |
| POST | `/api/v1/auth/register-company` | `Public` |
| POST | `/api/v1/auth/refresh` | `requireTrustedOrigin, fastify.authenticateRefresh` |
| POST | `/api/v1/auth/logout` | `requireTrustedOrigin, fastify.authenticateRefresh` |
| POST | `/api/v1/auth/handoff` | `fastify.authenticate` |
| POST | `/api/v1/auth/handoff/redeem` | `requireTrustedOrigin` |
| POST | `/api/v1/auth/logout-all` | `fastify.authenticate` |
| GET | `/api/v1/auth/me` | `fastify.authenticate` |
| PATCH | `/api/v1/auth/users/:id/password` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('users.reset_password')` |

### users — `/api/v1/users`

Bearer authentication + permission; service applies STAFF/COMPANY context and target ownership rules.

| Method | Full path | Route guard / scope |
|---|---|---|
| GET | `/api/v1/users` | `fastify.authenticate; requirePermission('users.read')` |
| POST | `/api/v1/users` | `fastify.authenticate; requirePermission('users.create')` |
| GET | `/api/v1/users/:id` | `fastify.authenticate; requirePermission('users.read')` |
| PATCH | `/api/v1/users/:id` | `fastify.authenticate; requirePermission('users.update')` |
| PATCH | `/api/v1/users/:id/access` | `fastify.authenticate; requirePermission('users.assign_roles')` |
| PATCH | `/api/v1/users/:id/access-active` | `fastify.authenticate; requireAnyPermission('users.activate', 'users.deactivate')` |
| PATCH | `/api/v1/users/:id/company` | `fastify.authenticate; requirePermission('users.update')` |
| DELETE | `/api/v1/users/:id` | `fastify.authenticate; requirePermission('users.delete')` |

### addresses — `/api/v1/addresses`

All routes inherit bearer authentication and exact CUSTOMER app context.

| Method | Full path | Route guard / scope |
|---|---|---|
| GET | `/api/v1/addresses` | `Inherited: bearer authentication + requireAccessType('CUSTOMER')` |
| POST | `/api/v1/addresses` | `Inherited: bearer authentication + requireAccessType('CUSTOMER')` |
| GET | `/api/v1/addresses/:id` | `Inherited: bearer authentication + requireAccessType('CUSTOMER')` |
| PATCH | `/api/v1/addresses/:id` | `Inherited: bearer authentication + requireAccessType('CUSTOMER')` |
| PATCH | `/api/v1/addresses/:id/default` | `Inherited: bearer authentication + requireAccessType('CUSTOMER')` |
| DELETE | `/api/v1/addresses/:id` | `Inherited: bearer authentication + requireAccessType('CUSTOMER')` |

### roles — `/api/v1/roles`

Bearer authentication; role administration is STAFF-only; /assignable also permits COMPANY context with its required user-management permission.

| Method | Full path | Route guard / scope |
|---|---|---|
| GET | `/api/v1/roles` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('roles.read')` |
| GET | `/api/v1/roles/assignable` | `fastify.authenticate; requireExactAccessType('STAFF', 'COMPANY'), requireAnyPermission('users.create', 'users.assign_roles')` |
| POST | `/api/v1/roles` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('roles.create')` |
| GET | `/api/v1/roles/:id` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('roles.read')` |
| PATCH | `/api/v1/roles/:id` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('roles.update')` |
| DELETE | `/api/v1/roles/:id` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('roles.delete')` |

### permissions — `/api/v1/permissions`

Bearer authentication + exact STAFF context + permission per operation.

| Method | Full path | Route guard / scope |
|---|---|---|
| GET | `/api/v1/permissions` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('permissions.read')` |
| GET | `/api/v1/permissions/:id` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('permissions.read')` |
| POST | `/api/v1/permissions` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('permissions.create')` |
| PATCH | `/api/v1/permissions/:id` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('permissions.update')` |
| DELETE | `/api/v1/permissions/:id` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('permissions.delete')` |

### admin — `/api/v1/admin`

Every route requires bearer authentication, exact STAFF context and its listed permission.

| Method | Full path | Route guard / scope |
|---|---|---|
| GET | `/api/v1/admin/stats` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('users.read')` |
| GET | `/api/v1/admin/settings` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('system_settings.manage')` |
| PATCH | `/api/v1/admin/settings/product-review-threshold` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('system_settings.manage')` |
| GET | `/api/v1/admin/inquiry-monetization/settings` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('system_settings.manage')` |
| PATCH | `/api/v1/admin/inquiry-monetization/settings` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('system_settings.manage')` |
| GET | `/api/v1/admin/inquiry-plans` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('system_settings.manage')` |
| POST | `/api/v1/admin/inquiry-plans` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('system_settings.manage')` |
| PATCH | `/api/v1/admin/inquiry-plans/:id` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('system_settings.manage')` |
| GET | `/api/v1/admin/inquiry-subscriptions` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('system_settings.manage')` |
| POST | `/api/v1/admin/inquiry-subscriptions/:id/activate` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('system_settings.manage')` |
| POST | `/api/v1/admin/inquiry-subscriptions/:id/reject` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('system_settings.manage')` |
| POST | `/api/v1/admin/inquiry-subscriptions/grant` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('system_settings.manage')` |
| POST | `/api/v1/admin/notifications/send` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('notifications.send')` |
| GET | `/api/v1/admin/notifications/folders` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('system_settings.manage')` |
| POST | `/api/v1/admin/notifications/folders` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('system_settings.manage')` |
| PATCH | `/api/v1/admin/notifications/folders/:id` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('system_settings.manage')` |
| GET | `/api/v1/admin/notifications/delivery-stats` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('delivery.view')` |
| GET | `/api/v1/admin/notifications/deliveries` | `fastify.authenticate; requireExactAccessType('STAFF'), requirePermission('delivery.view')` |

### settings — `/api/v1/settings`

Bearer authentication; operations are scoped to the current user profile.

| Method | Full path | Route guard / scope |
|---|---|---|
| GET | `/api/v1/settings/profile` | `Bearer authentication; current-user profile only` |
| PATCH | `/api/v1/settings/profile` | `Bearer authentication; current-user profile only` |
| POST | `/api/v1/settings/profile/avatar` | `Bearer authentication; current-user profile only` |
| DELETE | `/api/v1/settings/profile/avatar` | `Bearer authentication; current-user profile only` |
| PATCH | `/api/v1/settings/change-password` | `Bearer authentication; current-user profile only` |

### companies — `/api/v1/companies`

All routes inherit bearer authentication; companyRouteAccess enforces STAFF or own-company context, plus the listed permission.

| Method | Full path | Route guard / scope |
|---|---|---|
| GET | `/api/v1/companies` | `companyRouteAccess({ staffOnly: true }), requirePermission('companies.read')` |
| GET | `/api/v1/companies/:id` | `companyRouteAccess(), requireAnyPermission('companies.read', 'company_profile.read')` |
| GET | `/api/v1/companies/:id/products` | `companyRouteAccess(), requirePermission('companies.read')` |
| GET | `/api/v1/companies/:id/settings` | `companyRouteAccess({ staffOnly: true }), requireAnyPermission('companies.read', 'companies.manage_settings')` |
| GET | `/api/v1/companies/:id/statistics` | `companyRouteAccess(), requirePermission('companies.view_statistics')` |
| POST | `/api/v1/companies` | `companyRouteAccess({ staffOnly: true }), requirePermission('companies.create')` |
| PATCH | `/api/v1/companies/:id` | `companyRouteAccess(), requireAnyPermission('companies.update', 'company_profile.update')` |
| DELETE | `/api/v1/companies/:id` | `companyRouteAccess({ staffOnly: true }), requirePermission('companies.delete')` |
| PATCH | `/api/v1/companies/:id/restore` | `companyRouteAccess({ staffOnly: true }), requirePermission('companies.restore')` |
| PATCH | `/api/v1/companies/:id/status` | `companyRouteAccess({ staffOnly: true }), requireAnyPermission('companies.activate', 'companies.deactivate')` |
| PATCH | `/api/v1/companies/:id/verify` | `companyRouteAccess({ staffOnly: true }), requirePermission('companies.update')` |
| PATCH | `/api/v1/companies/:id/logo` | `companyRouteAccess(), requireAnyPermission('companies.update', 'company_profile.update')` |
| PATCH | `/api/v1/companies/:id/settings` | `companyRouteAccess({ staffOnly: true }), requirePermission('companies.manage_settings')` |

### categories — `/api/v1/categories`

Public GET marketplace routes; nested management routes inherit authentication and require STAFF context + categories permission.

| Method | Full path | Route guard / scope |
|---|---|---|
| GET | `/api/v1/categories` | `Public` |
| GET | `/api/v1/categories/:id` | `Public` |
| GET | `/api/v1/categories/:id/products` | `Public` |
| GET | `/api/v1/categories/:id/subcategories` | `Public` |
| GET | `/api/v1/categories/:id/subcategories/:subId` | `Public` |
| GET | `/api/v1/categories/manage` | `requireExactAccessType(...STAFF_ONLY), requirePermission('categories.read')` |
| POST | `/api/v1/categories` | `requireExactAccessType(...STAFF_ONLY), requirePermission('categories.create')` |
| PATCH | `/api/v1/categories/:id` | `requireExactAccessType(...STAFF_ONLY), requirePermission('categories.update')` |
| DELETE | `/api/v1/categories/:id` | `requireExactAccessType(...STAFF_ONLY), requirePermission('categories.delete')` |
| POST | `/api/v1/categories/:id/subcategories` | `requireExactAccessType(...STAFF_ONLY), requirePermission('categories.create')` |
| PATCH | `/api/v1/categories/:id/subcategories/:subId` | `requireExactAccessType(...STAFF_ONLY), requirePermission('categories.update')` |
| DELETE | `/api/v1/categories/:id/subcategories/:subId` | `requireExactAccessType(...STAFF_ONLY), requirePermission('categories.delete')` |

### products — `/api/v1/products`

Public marketplace GET routes; nested management routes inherit authentication and require COMPANY/STAFF context + operation permission.

| Method | Full path | Route guard / scope |
|---|---|---|
| GET | `/api/v1/products` | `Public` |
| GET | `/api/v1/products/:id/price-history` | `Public` |
| GET | `/api/v1/products/:id` | `Public` |
| GET | `/api/v1/products/my-products` | `requireAccessType(...MANAGE_TYPES), requirePermission('products.read')` |
| GET | `/api/v1/products/:id/manage` | `requireAccessType(...MANAGE_TYPES), requirePermission('products.read')` |
| GET | `/api/v1/products/:id/history` | `requireAccessType(...MANAGE_TYPES), requirePermission('products.read')` |
| GET | `/api/v1/products/:id/activity` | `requireAccessType(...MANAGE_TYPES), requirePermission('products.read')` |
| POST | `/api/v1/products` | `requireAccessType(...MANAGE_TYPES), requirePermission('products.create')` |
| PATCH | `/api/v1/products/:id` | `requireAccessType(...MANAGE_TYPES), requirePermission('products.update')` |
| DELETE | `/api/v1/products/:id` | `requireAccessType(...MANAGE_TYPES), requirePermission('products.delete')` |
| POST | `/api/v1/products/:id/submit-review` | `requireAccessType(...MANAGE_TYPES), requirePermission('products.submit_review')` |
| POST | `/api/v1/products/:id/approve` | `requireAccessType(...STAFF_ONLY), requirePermission('products.approve')` |
| POST | `/api/v1/products/:id/reject` | `requireAccessType(...STAFF_ONLY), requirePermission('products.reject')` |
| POST | `/api/v1/products/:id/publish` | `requireAccessType(...MANAGE_TYPES), requirePermission('products.publish')` |
| POST | `/api/v1/products/:id/hide` | `requireAccessType(...STAFF_ONLY), requirePermission('products.hide')` |
| POST | `/api/v1/products/:id/archive` | `requireAccessType(...STAFF_ONLY), requirePermission('products.archive')` |
| POST | `/api/v1/products/:id/restore-draft` | `requireAccessType(...STAFF_ONLY), requirePermission('products.review')` |
| POST | `/api/v1/products/:id/price-tiers` | `requireAccessType(...MANAGE_TYPES), requirePermission('products.update')` |
| PATCH | `/api/v1/products/:id/price-tiers/:tierId` | `requireAccessType(...MANAGE_TYPES), requirePermission('products.update')` |
| DELETE | `/api/v1/products/:id/price-tiers/:tierId` | `requireAccessType(...MANAGE_TYPES), requirePermission('products.update')` |
| POST | `/api/v1/products/:id/images` | `requireAccessType(...MANAGE_TYPES), requirePermission('product_images.create')` |
| DELETE | `/api/v1/products/:id/images/:imageId` | `requireAccessType(...MANAGE_TYPES), requirePermission('product_images.delete')` |
| PATCH | `/api/v1/products/:id/images/:imageId/primary` | `requireAccessType(...MANAGE_TYPES), requirePermission('product_images.update')` |
| PATCH | `/api/v1/products/:id/images/sort` | `requireAccessType(...MANAGE_TYPES), requirePermission('product_images.update')` |
| POST | `/api/v1/products/:id/documents` | `requireAccessType(...MANAGE_TYPES), requirePermission('product_documents.create')` |
| DELETE | `/api/v1/products/:id/documents/:documentId` | `requireAccessType(...MANAGE_TYPES), requirePermission('product_documents.delete')` |

### specification-library — `/api/v1/specification-library`

Public read-only lookup routes.

| Method | Full path | Route guard / scope |
|---|---|---|
| GET | `/api/v1/specification-library` | `Public` |
| GET | `/api/v1/specification-library/all` | `Public` |

### inquiries — `/api/v1/inquiries`

All routes inherit bearer authentication except the public Zarinpal callback; protected routes require AccessProfile context + permission.

| Method | Full path | Route guard / scope |
|---|---|---|
| GET | `/api/v1/inquiries` | `requireAccessType(...ALL_TYPES), requireAnyPermission('leads.read', 'inquiries.read')` |
| GET | `/api/v1/inquiries/subscription/payment/callback` | `Public Zarinpal callback; stored Authority is verified server-to-server` |
| GET | `/api/v1/inquiries/plans` | `requireAccessType(...ALL_TYPES), requireAnyPermission('leads.read', 'inquiries.read', 'inquiries.create')` |
| POST | `/api/v1/inquiries/subscription/:id/verify-payment` | `requireAccessType('COMPANY', 'CUSTOMER'), requireAnyPermission('inquiries.read', 'inquiries.create', 'inquiries.respond')` |
| GET | `/api/v1/inquiries/subscription/me` | `requireAccessType('COMPANY', 'CUSTOMER'), requireAnyPermission('inquiries.read', 'inquiries.create', 'inquiries.respond')` |
| POST | `/api/v1/inquiries/subscription` | `requireAccessType('COMPANY', 'CUSTOMER'), requireAnyPermission('inquiries.create', 'inquiries.respond')` |
| GET | `/api/v1/inquiries/quota` | `requireAccessType('COMPANY', 'CUSTOMER'), requireAnyPermission('leads.read', 'inquiries.read', 'inquiries.create')` |
| GET | `/api/v1/inquiries/stats` | `requireAccessType(...ALL_TYPES), requireAnyPermission('leads.read', 'inquiries.read')` |
| GET | `/api/v1/inquiries/:id` | `requireAccessType(...ALL_TYPES), requireAnyPermission('leads.read', 'inquiries.read')` |
| POST | `/api/v1/inquiries` | `requireAccessType(...ALL_TYPES), requireAnyPermission('leads.create', 'inquiries.create')` |
| PATCH | `/api/v1/inquiries/:id` | `requireAccessType(...MANAGE_TYPES), requireAnyPermission('leads.update', 'inquiries.update')` |
| GET | `/api/v1/inquiries/:id/items` | `requireAccessType(...ALL_TYPES), requireAnyPermission('leads.read', 'inquiries.read')` |
| PATCH | `/api/v1/inquiries/:id/status` | `requireAccessType(...ALL_TYPES), requireAnyPermission('leads.update', 'inquiries.update', 'inquiries.create')` |
| POST | `/api/v1/inquiries/:id/reveal` | `requireAccessType(...ALL_TYPES), requireAnyPermission('leads.read', 'inquiries.read', 'leads.update', 'inquiries.update')` |
| POST | `/api/v1/inquiries/:id/items` | `requireAccessType(...ALL_TYPES), requireAnyPermission('leads.update', 'inquiries.create')` |
| PATCH | `/api/v1/inquiries/:id/items/:itemId` | `requireAccessType(...ALL_TYPES), requireAnyPermission('leads.update', 'inquiries.create')` |
| DELETE | `/api/v1/inquiries/:id/items/:itemId` | `requireAccessType(...MANAGE_TYPES), requireAnyPermission('leads.delete', 'inquiries.create')` |
| GET | `/api/v1/inquiries/:id/messages` | `requireAccessType('STAFF', 'COMPANY', 'CUSTOMER'), requireAnyPermission('leads.read', 'inquiries.read')` |
| POST | `/api/v1/inquiries/:id/messages` | `requireAccessType('COMPANY', 'CUSTOMER'), requireAnyPermission('inquiries.create', 'inquiries.respond')` |
| GET | `/api/v1/inquiries/:id/responses` | `requireAccessType(...ALL_TYPES), requireAnyPermission('inquiries.read', 'inquiries.respond', 'leads.read')` |
| POST | `/api/v1/inquiries/:id/responses` | `requireAccessType(...SUPPLIER_TYPES), requireAnyPermission('inquiries.respond')` |
| PATCH | `/api/v1/inquiries/:id/responses/:responseId/decision` | `requireAccessType(...ALL_TYPES), requireAnyPermission('inquiries.create', 'inquiries.update', 'leads.update')` |
| PATCH | `/api/v1/inquiries/:id/responses/:responseId` | `requireAccessType(...SUPPLIER_TYPES), requireAnyPermission('inquiries.respond')` |
| POST | `/api/v1/inquiries/:id/responses/:responseId/withdraw` | `requireAccessType(...SUPPLIER_TYPES), requireAnyPermission('inquiries.respond')` |
| POST | `/api/v1/inquiries/:id/responses/:responseId/attachments` | `requireAccessType(...SUPPLIER_TYPES), requireAnyPermission('inquiries.respond')` |
| DELETE | `/api/v1/inquiries/:id/responses/:responseId/attachments/:attachmentId` | `requireAccessType(...SUPPLIER_TYPES), requireAnyPermission('inquiries.respond')` |

### notifications — `/api/v1/settings/notifications`

All routes inherit bearer authentication; service derives app scope from the token and enforces per-user ownership.

| Method | Full path | Route guard / scope |
|---|---|---|
| GET | `/api/v1/settings/notifications` | `Inherited: bearer authentication; token-derived app scope + user ownership` |
| GET | `/api/v1/settings/notifications/unread-count` | `Inherited: bearer authentication; token-derived app scope + user ownership` |
| POST | `/api/v1/settings/notifications/bulk-read-state` | `Inherited: bearer authentication; token-derived app scope + user ownership` |
| POST | `/api/v1/settings/notifications/bulk-delete` | `Inherited: bearer authentication; token-derived app scope + user ownership` |
| GET | `/api/v1/settings/notifications/folders` | `Inherited: bearer authentication; token-derived app scope + user ownership` |
| POST | `/api/v1/settings/notifications/:id/folders` | `Inherited: bearer authentication; token-derived app scope + user ownership` |
| PATCH | `/api/v1/settings/notifications/:id/read-state` | `Inherited: bearer authentication; token-derived app scope + user ownership` |
| PATCH | `/api/v1/settings/notifications/:id/read` | `Inherited: bearer authentication; token-derived app scope + user ownership` |
| PATCH | `/api/v1/settings/notifications/read-all` | `Inherited: bearer authentication; token-derived app scope + user ownership` |
| DELETE | `/api/v1/settings/notifications/:id` | `Inherited: bearer authentication; token-derived app scope + user ownership` |
| GET | `/api/v1/settings/notifications/preferences` | `Inherited: bearer authentication; token-derived app scope + user ownership` |
| PATCH | `/api/v1/settings/notifications/preferences` | `Inherited: bearer authentication; token-derived app scope + user ownership` |

### Health

| Method | Full path | Route guard / scope |
|---|---|---|
| GET | `/health` | Public health/readiness probe |

## Source files

- `backend/src/modules/auth/auth.routes.js`
- `backend/src/modules/users/user.routes.js`
- `backend/src/modules/addresses/address.routes.js`
- `backend/src/modules/roles/role.routes.js`
- `backend/src/modules/permissions/permission.routes.js`
- `backend/src/modules/admin/admin.routes.js`
- `backend/src/modules/settings/settings.routes.js`
- `backend/src/modules/companies/company.routes.js`
- `backend/src/modules/categories/category.routes.js`
- `backend/src/modules/products/product.routes.js`
- `backend/src/modules/specification-library/specification-library.routes.js`
- `backend/src/modules/inquiries/inquiry.routes.js`
- `backend/src/modules/notifications/notification.routes.js`
- `backend/src/app.js` — route prefixes and registration order.
- `backend/src/plugins/auth.plugin.js` — bearer/refresh authentication decorators.
- `backend/src/middlewares/rbac.js` — AccessProfile and permission guards.
