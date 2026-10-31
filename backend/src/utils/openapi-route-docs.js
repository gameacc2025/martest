const idParam = (name = 'id') => ({
  type: 'object',
  required: [name],
  properties: { [name]: { type: 'integer', minimum: 1, example: 1 } },
});

const twoIdParams = (first, second) => ({
  type: 'object',
  required: [first, second],
  properties: {
    [first]: { type: 'integer', minimum: 1, example: 1 },
    [second]: { type: 'integer', minimum: 1, example: 10 },
  },
});

const messageResponse = (description = 'Operation completed successfully.') => ({
  200: { description, $ref: '#/components/schemas/MessageResponse' },
});

const resourceResponse = (description = 'Resource returned successfully.') => ({
  200: { description, type: 'object', additionalProperties: true },
});

const createdResponse = (description = 'Resource created successfully.') => ({
  201: { description, type: 'object', additionalProperties: true },
});

const paginatedResponse = (description = 'Paginated resources returned successfully.') => ({
  200: { description, $ref: '#/components/schemas/PaginatedResponse' },
});

const paginationQuery = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1, example: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, example: 20 },
    search: { type: 'string', example: 'router' },
  },
};

const multipartFileBody = (fieldName = 'file') => ({
  type: 'object',
  properties: {
    [fieldName]: { type: 'string', format: 'binary' },
  },
});

const docs = {
  'POST /api/v1/auth/register': {
    summary: 'Register customer account',
    description: 'Creates a Website customer account using phone, password and personal name fields. Authentication required: none. Permission required: none. Rate limited.',
    tags: ['Authentication'],
    authRequired: false,
    includeNotFound: false,
    responses: createdResponse('Customer account created successfully.'),
  },
  'POST /api/v1/auth/register-company': {
    summary: 'Register company and manager',
    description: 'Submits a company registration with its initial manager for staff approval. Authentication required: none. Permission required: none. Rate limited.',
    tags: ['Authentication'],
    authRequired: false,
    includeNotFound: false,
    responses: createdResponse('Company registration submitted successfully.'),
  },
  'POST /api/v1/auth/handoff': {
    summary: 'Create cross-app handoff code',
    description: 'Creates a short-lived, one-time PKCE handoff code for an authenticated panel session. Authentication required: Bearer JWT. Permission required: authenticated user.',
    tags: ['Authentication'],
    responses: resourceResponse('Handoff code created successfully.'),
  },
  'POST /api/v1/auth/handoff/redeem': {
    summary: 'Redeem cross-app handoff code',
    description: 'Redeems a one-time PKCE handoff code and verifier to establish the target panel session. Requires a trusted browser origin; no bearer token is used on this endpoint.',
    tags: ['Authentication'],
    authRequired: false,
    includeNotFound: false,
    responses: resourceResponse('Handoff session established successfully.'),
  },
  'POST /api/v1/auth/login': {
    summary: 'Login',
    description: 'Authenticates a user with phone and password. Returns an access token and sets the refresh token cookie when login succeeds. Authentication required: none. Permission required: none.',
    tags: ['Authentication'],
    authRequired: false,
    includeNotFound: false,
    responses: { ...messageResponse('Login completed successfully.'), ...resourceResponse('Authenticated user and token details.') },
  },
  'POST /api/v1/auth/refresh': {
    summary: 'Refresh access token',
    description: 'Issues a new access token using the refresh token cookie. Authentication required: refresh token cookie. Permission required: authenticated session.',
    tags: ['Authentication'],
    permission: 'Authenticated refresh token cookie + trusted origin',
    security: [{ refreshCookie: [] }],
    responses: { 200: { description: 'New access token issued.', $ref: '#/components/schemas/AuthTokens' } },
  },
  'POST /api/v1/auth/logout': {
    summary: 'Logout current device',
    description: 'Revokes the current refresh token and clears the refresh cookie. Authentication required: refresh token cookie. Permission required: authenticated session.',
    tags: ['Authentication'],
    permission: 'Authenticated refresh token cookie + trusted origin',
    security: [{ refreshCookie: [] }],
    responses: messageResponse('Logged out from the current device.'),
  },
  'POST /api/v1/auth/logout-all': {
    summary: 'Logout all devices',
    description: 'Revokes all refresh tokens for the authenticated user. Authentication required: Bearer JWT. Permission required: authenticated user.',
    tags: ['Authentication'],
    responses: messageResponse('Logged out from all devices.'),
  },
  'GET /api/v1/auth/me': {
    summary: 'Get current user',
    description: 'Returns the authenticated user profile with roles and permissions. Authentication required: Bearer JWT. Permission required: authenticated user.',
    tags: ['Authentication'],
    responses: { 200: { description: 'Current user profile.', $ref: '#/components/schemas/User' } },
  },
  'PATCH /api/v1/auth/users/:id/password': {
    summary: 'Reset user password',
    description: 'Allows an administrator to reset another user password. Authentication required: Bearer JWT. Permission required: users.reset_password.',
    tags: ['Authentication'],
    permission: 'users.reset_password',
    params: idParam(),
    responses: messageResponse('User password reset successfully.'),
  },

  'GET /api/v1/users': {
    summary: 'List users',
    description: 'Lists users with pagination and optional search filters. Authentication required: Bearer JWT. Permission required: users.read.',
    tags: ['Users'],
    permission: 'users.read',
    querystring: paginationQuery,
    responses: paginatedResponse('Users returned successfully.'),
  },
  'POST /api/v1/users': {
    summary: 'Create user',
    description: 'Creates a new user account. Authentication required: Bearer JWT. Permission required: users.create.',
    tags: ['Users'],
    permission: 'users.create',
    responses: createdResponse('User created successfully.'),
  },
  'GET /api/v1/users/:id': {
    summary: 'Get user by ID',
    description: 'Returns a single user by numeric ID. Authentication required: Bearer JWT. Permission required: users.read.',
    tags: ['Users'],
    permission: 'users.read',
    params: idParam(),
    responses: { 200: { description: 'User returned successfully.', $ref: '#/components/schemas/User' } },
  },
  'PATCH /api/v1/users/:id': {
    summary: 'Update user profile',
    description: 'Updates a user profile. Authentication required: Bearer JWT. Permission required: users.update.',
    tags: ['Users'],
    permission: 'users.update',
    params: idParam(),
    responses: resourceResponse('User updated successfully.'),
  },
  'PATCH /api/v1/users/:id/access': {
    summary: 'Set user access',
    description: 'Fully replaces a user role and direct-permission assignments. Authentication required: Bearer JWT. Permission required: users.assign_roles.',
    tags: ['Users'],
    permission: 'users.assign_roles',
    params: idParam(),
    responses: resourceResponse('User access updated successfully.'),
  },
  'DELETE /api/v1/users/:id': {
    summary: 'Delete user',
    description: 'Deletes a user by ID. Authentication required: Bearer JWT. Permission required: users.delete.',
    tags: ['Users'],
    permission: 'users.delete',
    params: idParam(),
    responses: messageResponse('User deleted successfully.'),
  },

  'GET /api/v1/roles': {
    summary: 'List roles',
    description: 'Lists all roles with their assigned permissions. Authentication required: Bearer JWT. Permission required: roles.read.',
    tags: ['Roles'],
    permission: 'roles.read',
    responses: resourceResponse('Roles returned successfully.'),
  },
  'POST /api/v1/roles': {
    summary: 'Create role',
    description: 'Creates a new role. Authentication required: Bearer JWT. Permission required: roles.create.',
    tags: ['Roles'],
    permission: 'roles.create',
    responses: createdResponse('Role created successfully.'),
  },
  'GET /api/v1/roles/:id': {
    summary: 'Get role by ID',
    description: 'Returns a role by numeric ID. Authentication required: Bearer JWT. Permission required: roles.read.',
    tags: ['Roles'],
    permission: 'roles.read',
    params: idParam(),
    responses: resourceResponse('Role returned successfully.'),
  },
  'PATCH /api/v1/roles/:id': {
    summary: 'Update role',
    description: 'Updates role details and permission assignment. Authentication required: Bearer JWT. Permission required: roles.update.',
    tags: ['Roles'],
    permission: 'roles.update',
    params: idParam(),
    responses: resourceResponse('Role updated successfully.'),
  },
  'DELETE /api/v1/roles/:id': {
    summary: 'Delete role',
    description: 'Deletes a non-system role. Authentication required: Bearer JWT. Permission required: roles.delete.',
    tags: ['Roles'],
    permission: 'roles.delete',
    params: idParam(),
    responses: messageResponse('Role deleted successfully.'),
  },

  'GET /api/v1/permissions': {
    summary: 'List permissions',
    description: 'Lists permissions with pagination, search, group filtering, and optional grouped output. Authentication required: Bearer JWT. Permission required: permissions.read.',
    tags: ['Permissions'],
    permission: 'permissions.read',
    responses: paginatedResponse('Permissions returned successfully.'),
  },
  'GET /api/v1/permissions/:id': {
    summary: 'Get permission by ID',
    description: 'Returns a permission by numeric ID. Authentication required: Bearer JWT. Permission required: permissions.read.',
    tags: ['Permissions'],
    permission: 'permissions.read',
    params: idParam(),
    responses: resourceResponse('Permission returned successfully.'),
  },
  'POST /api/v1/permissions': {
    summary: 'Create permission',
    description: 'Creates a new permission. Authentication required: Bearer JWT. Permission required: permissions.create.',
    tags: ['Permissions'],
    permission: 'permissions.create',
    responses: createdResponse('Permission created successfully.'),
  },
  'PATCH /api/v1/permissions/:id': {
    summary: 'Update permission',
    description: 'Updates an existing permission. Authentication required: Bearer JWT. Permission required: permissions.update.',
    tags: ['Permissions'],
    permission: 'permissions.update',
    params: idParam(),
    responses: resourceResponse('Permission updated successfully.'),
  },
  'DELETE /api/v1/permissions/:id': {
    summary: 'Delete permission',
    description: 'Deletes a permission by ID. Authentication required: Bearer JWT. Permission required: permissions.delete.',
    tags: ['Permissions'],
    permission: 'permissions.delete',
    params: idParam(),
    responses: messageResponse('Permission deleted successfully.'),
  },
};

Object.assign(docs, {
  'GET /api/v1/admin/stats': { summary: 'Get admin statistics', description: 'Returns dashboard statistics for administrative views. Authentication required: Bearer JWT. Permission required: users.read.', tags: ['Admin'], permission: 'users.read', responses: resourceResponse('Dashboard statistics returned successfully.') },
  'GET /api/v1/admin/settings': { summary: 'Get system settings', description: 'Returns admin-managed system settings (e.g. the product review-edit threshold). Authentication required: Bearer JWT. Permission required: system_settings.manage.', tags: ['Admin'], permission: 'system_settings.manage', responses: resourceResponse('System settings returned successfully.') },
  'PATCH /api/v1/admin/settings/product-review-threshold': { summary: 'Update product review threshold', description: 'Updates the number of post-approval product edits that trigger re-review. Authentication required: Bearer JWT. Permission required: system_settings.manage.', tags: ['Admin'], permission: 'system_settings.manage', responses: resourceResponse('Review threshold updated successfully.') },

  'GET /api/v1/settings/notifications/preferences': { summary: 'Get notification preferences', description: 'Returns the authenticated user notification channel preferences. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Notifications'], responses: resourceResponse('Notification preferences returned successfully.') },
  'PATCH /api/v1/settings/notifications/preferences': { summary: 'Update notification preferences', description: 'Updates the authenticated user notification channel preferences. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Notifications'], responses: resourceResponse('Notification preferences updated successfully.') },
  'GET /api/v1/settings/profile': { summary: 'Get current profile', description: 'Returns the authenticated user profile settings. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Settings'], responses: resourceResponse('Profile returned successfully.') },
  'PATCH /api/v1/settings/profile': { summary: 'Update current profile', description: 'Updates the authenticated user profile settings. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Settings'], responses: resourceResponse('Profile updated successfully.') },
  'POST /api/v1/settings/profile/avatar': { summary: 'Upload avatar', description: 'Uploads an avatar image for the authenticated user. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Settings'], consumes: ['multipart/form-data'], body: multipartFileBody('avatar'), responses: resourceResponse('Avatar uploaded successfully.') },
  'DELETE /api/v1/settings/profile/avatar': { summary: 'Delete avatar', description: 'Deletes the authenticated user avatar. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Settings'], responses: messageResponse('Avatar deleted successfully.') },
  'PATCH /api/v1/settings/change-password': { summary: 'Change password', description: 'Changes the authenticated user password. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Settings'], responses: messageResponse('Password changed successfully.') },

});

Object.assign(docs, {
  'GET /api/v1/companies': { summary: 'List companies', description: 'Lists companies. Authentication required: Bearer JWT. Permission required: companies.read.', tags: ['Companies'], permission: 'companies.read', querystring: paginationQuery, responses: paginatedResponse('Companies returned successfully.') },
  'GET /api/v1/companies/:id': { summary: 'Get company by ID', description: 'Returns a company by numeric ID. Authentication required: Bearer JWT. Permission required: companies.read.', tags: ['Companies'], permission: 'companies.read', params: idParam(), responses: resourceResponse('Company returned successfully.') },
  'GET /api/v1/companies/:id/products': { summary: 'Get company products', description: 'Returns products for a company. Authentication required: Bearer JWT. Permission required: companies.read.', tags: ['Companies'], permission: 'companies.read', params: idParam(), responses: resourceResponse('Company products returned successfully.') },
  'GET /api/v1/companies/:id/settings': { summary: 'Get company settings', description: 'Returns company settings. Authentication required: Bearer JWT. Permission required: companies.read or companies.manage_settings.', tags: ['Companies'], permission: 'companies.read OR companies.manage_settings', params: idParam(), responses: resourceResponse('Company settings returned successfully.') },
  'GET /api/v1/companies/:id/statistics': { summary: 'Get company statistics', description: 'Returns company statistics. Authentication required: Bearer JWT. Permission required: companies.view_statistics.', tags: ['Companies'], permission: 'companies.view_statistics', params: idParam(), responses: resourceResponse('Company statistics returned successfully.') },
  'POST /api/v1/companies': { summary: 'Create company', description: 'Creates a company. Authentication required: Bearer JWT. Permission required: companies.create.', tags: ['Companies'], permission: 'companies.create', responses: createdResponse('Company created successfully.') },
  'PATCH /api/v1/companies/:id': { summary: 'Update company', description: 'Updates company details. Authentication required: Bearer JWT. Permission required: companies.update or company_profile.update.', tags: ['Companies'], permission: 'companies.update OR company_profile.update', params: idParam(), responses: resourceResponse('Company updated successfully.') },
  'DELETE /api/v1/companies/:id': { summary: 'Delete company', description: 'Soft deletes a company. Authentication required: Bearer JWT. Permission required: companies.delete.', tags: ['Companies'], permission: 'companies.delete', params: idParam(), responses: messageResponse('Company deleted successfully.') },
  'PATCH /api/v1/companies/:id/restore': { summary: 'Restore company', description: 'Restores a soft-deleted company. Authentication required: Bearer JWT. Permission required: companies.restore.', tags: ['Companies'], permission: 'companies.restore', params: idParam(), responses: resourceResponse('Company restored successfully.') },
  'PATCH /api/v1/companies/:id/status': { summary: 'Change company status', description: 'Activates or deactivates a company. Authentication required: Bearer JWT. Permission required: companies.activate or companies.deactivate.', tags: ['Companies'], permission: 'companies.activate OR companies.deactivate', params: idParam(), responses: resourceResponse('Company status updated successfully.') },
  'PATCH /api/v1/companies/:id/verify': { summary: 'Toggle company verification', description: 'Toggles company verification state. Authentication required: Bearer JWT. Permission required: companies.update.', tags: ['Companies'], permission: 'companies.update', params: idParam(), responses: resourceResponse('Company verification updated successfully.') },
  'PATCH /api/v1/companies/:id/logo': { summary: 'Update company logo', description: 'Updates a company logo. Authentication required: Bearer JWT. Permission required: companies.update or company_profile.update.', tags: ['Companies'], permission: 'companies.update OR company_profile.update', params: idParam(), responses: resourceResponse('Company logo updated successfully.') },
  'PATCH /api/v1/companies/:id/settings': { summary: 'Update company settings', description: 'Updates company settings. Authentication required: Bearer JWT. Permission required: companies.manage_settings.', tags: ['Companies'], permission: 'companies.manage_settings', params: idParam(), responses: resourceResponse('Company settings updated successfully.') },
});

Object.assign(docs, {
  'GET /api/v1/categories': { summary: 'List public categories', description: 'Lists active categories for anonymous and authenticated marketplace visitors. Authentication required: none.', tags: ['Categories'], authRequired: false, responses: resourceResponse('Active public categories returned successfully.') },
  'GET /api/v1/categories/:id': { summary: 'Get an active public category', description: 'Returns an active category for public marketplace browsing. Inactive categories are not exposed. Authentication required: none.', tags: ['Categories'], authRequired: false, params: idParam(), responses: resourceResponse('Active public category returned successfully.') },
  'GET /api/v1/categories/:id/products': { summary: 'List public products in a category', description: 'Returns public catalogue products for the requested category. Authentication required: none. Product visibility and publication filters are applied by the service.', tags: ['Categories'], authRequired: false, params: idParam(), responses: resourceResponse('Public category products returned successfully.') },
  'POST /api/v1/categories': { summary: 'Create category', description: 'Creates a category. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN role.', tags: ['Categories'], permission: 'SUPER_ADMIN role', responses: createdResponse('Category created successfully.') },
  'PATCH /api/v1/categories/:id': { summary: 'Update category', description: 'Updates a category. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN role.', tags: ['Categories'], permission: 'SUPER_ADMIN role', params: idParam(), responses: resourceResponse('Category updated successfully.') },
  'DELETE /api/v1/categories/:id': { summary: 'Delete category', description: 'Deletes a category. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN role.', tags: ['Categories'], permission: 'SUPER_ADMIN role', params: idParam(), responses: messageResponse('Category deleted successfully.') },
});

Object.assign(docs, {
  'GET /api/v1/products': { summary: 'List public marketplace products', description: 'Lists products available in the public catalogue. Authentication required: none. The public service projection is limited to published and public products.', tags: ['Products'], authRequired: false, querystring: paginationQuery, responses: paginatedResponse('Public products returned successfully.') },
  'GET /api/v1/products/:id': { summary: 'Get a public marketplace product', description: 'Returns a product from the public catalogue. Authentication required: none. Only products eligible for public publication and visibility are exposed; management users use the separate /manage route.', tags: ['Products'], authRequired: false, params: idParam(), responses: resourceResponse('Public product returned successfully.') },
  'POST /api/v1/products': { summary: 'Create product', description: 'Creates a product. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN or company user.', tags: ['Products'], permission: 'SUPER_ADMIN role OR company user account', responses: createdResponse('Product created successfully.') },
  'PATCH /api/v1/products/:id': { summary: 'Update product', description: 'Updates product details. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN or company user.', tags: ['Products'], permission: 'SUPER_ADMIN role OR company user account', params: idParam(), responses: resourceResponse('Product updated successfully.') },
  'DELETE /api/v1/products/:id': { summary: 'Delete product', description: 'Deletes a product. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN or company user.', tags: ['Products'], permission: 'SUPER_ADMIN role OR company user account', params: idParam(), responses: messageResponse('Product deleted successfully.') },
  'POST /api/v1/products/:id/submit-review': { summary: 'Submit product for review', description: 'Submits a product for review. Authentication required: Bearer JWT. Permission required: products.submit_review.', tags: ['Products'], permission: 'products.submit_review', params: idParam(), responses: resourceResponse('Product submitted for review.') },
  'POST /api/v1/products/:id/approve': { summary: 'Approve product', description: 'Approves a product. Authentication required: Bearer JWT. Permission required: products.approve.', tags: ['Products'], permission: 'products.approve', params: idParam(), responses: resourceResponse('Product approved successfully.') },
  'POST /api/v1/products/:id/reject': { summary: 'Reject product', description: 'Rejects a product. Authentication required: Bearer JWT. Permission required: products.reject.', tags: ['Products'], permission: 'products.reject', params: idParam(), responses: resourceResponse('Product rejected successfully.') },
  'POST /api/v1/products/:id/publish': { summary: 'Publish product', description: 'Publishes a product. Authentication required: Bearer JWT. Permission required: products.publish.', tags: ['Products'], permission: 'products.publish', params: idParam(), responses: resourceResponse('Product published successfully.') },
  'POST /api/v1/products/:id/hide': { summary: 'Hide product', description: 'Hides a product. Authentication required: Bearer JWT. Permission required: products.hide.', tags: ['Products'], permission: 'products.hide', params: idParam(), responses: resourceResponse('Product hidden successfully.') },
  'POST /api/v1/products/:id/archive': { summary: 'Archive product', description: 'Archives a product. Authentication required: Bearer JWT. Permission required: products.archive.', tags: ['Products'], permission: 'products.archive', params: idParam(), responses: resourceResponse('Product archived successfully.') },
  'POST /api/v1/products/:id/restore-draft': { summary: 'Restore product to draft', description: 'Restores a product to draft status. Authentication required: Bearer JWT. Permission required: products.review.', tags: ['Products'], permission: 'products.review', params: idParam(), responses: resourceResponse('Product restored to draft.') },
  'POST /api/v1/products/:id/price-tiers': { summary: 'Add product price tier', description: 'Adds a price tier to a product. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN or company user.', tags: ['Products'], permission: 'SUPER_ADMIN role OR company user account', params: idParam(), responses: createdResponse('Price tier added successfully.') },
  'PATCH /api/v1/products/:id/price-tiers/:tierId': { summary: 'Update product price tier', description: 'Updates a product price tier. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN or company user.', tags: ['Products'], permission: 'SUPER_ADMIN role OR company user account', params: twoIdParams('id', 'tierId'), responses: resourceResponse('Price tier updated successfully.') },
  'DELETE /api/v1/products/:id/price-tiers/:tierId': { summary: 'Delete product price tier', description: 'Deletes a product price tier. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN or company user.', tags: ['Products'], permission: 'SUPER_ADMIN role OR company user account', params: twoIdParams('id', 'tierId'), responses: messageResponse('Price tier deleted successfully.') },
  'POST /api/v1/products/:id/images': { summary: 'Upload product image', description: 'Uploads a product image. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN or company user (product ownership enforced).', tags: ['Products'], permission: 'SUPER_ADMIN role OR company user account', params: idParam(), consumes: ['multipart/form-data'], body: multipartFileBody('image'), responses: createdResponse('Product image uploaded successfully.') },
  'DELETE /api/v1/products/:id/images/:imageId': { summary: 'Delete product image', description: 'Deletes a product image. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN or company user (product ownership enforced).', tags: ['Products'], permission: 'SUPER_ADMIN role OR company user account', params: twoIdParams('id', 'imageId'), responses: messageResponse('Product image deleted successfully.') },
  'PATCH /api/v1/products/:id/images/:imageId/primary': { summary: 'Set primary product image', description: 'Sets a product image as primary. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN or company user (product ownership enforced).', tags: ['Products'], permission: 'SUPER_ADMIN role OR company user account', params: twoIdParams('id', 'imageId'), responses: resourceResponse('Primary image updated successfully.') },
  'PATCH /api/v1/products/:id/images/sort': { summary: 'Sort product images', description: 'Updates product image display order. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN or company user (product ownership enforced).', tags: ['Products'], permission: 'SUPER_ADMIN role OR company user account', params: idParam(), responses: resourceResponse('Product image order updated successfully.') },
  'POST /api/v1/products/:id/documents': { summary: 'Upload product document', description: 'Uploads a product document. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN or company user (product ownership enforced).', tags: ['Products'], permission: 'SUPER_ADMIN role OR company user account', params: idParam(), consumes: ['multipart/form-data'], body: multipartFileBody('document'), responses: createdResponse('Product document uploaded successfully.') },
  'DELETE /api/v1/products/:id/documents/:documentId': { summary: 'Delete product document', description: 'Deletes a product document. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN or company user (product ownership enforced).', tags: ['Products'], permission: 'SUPER_ADMIN role OR company user account', params: twoIdParams('id', 'documentId'), responses: messageResponse('Product document deleted successfully.') },
  'GET /api/v1/products/:id/activity': { summary: 'Get product activity log', description: 'Returns the immutable activity trail for a product (field edits, price/media changes, workflow transitions). Authentication required: Bearer JWT. Permission required: authenticated user (product ownership enforced).', tags: ['Products'], params: idParam(), responses: resourceResponse('Product activity returned successfully.') },
});

const inquiryListQuery = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1, example: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20, example: 20 },
    search: { type: 'string', description: 'Free-text search across inquiry title and description.', example: 'router' },
    status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'OPEN', 'CLOSED', 'EXPIRED', 'COMPLETED', 'CANCELLED'], description: 'Filter by inquiry status.', example: 'OPEN' },
    scope: { type: 'string', enum: ['sent', 'received', 'all'], description: "Visibility scope: 'sent' = inquiries created by the caller's company (buyer), 'received' = inquiries requesting a product owned by the caller's company (seller), 'all' = every inquiry (SUPER_ADMIN only).", example: 'sent' },
    sortBy: { type: 'string', enum: ['id', 'title', 'status', 'createdAt', 'updatedAt', 'responseDeadline'], default: 'createdAt', example: 'createdAt' },
    sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc', example: 'desc' },
  },
};

Object.assign(docs, {
  'GET /api/v1/inquiries/subscription/payment/callback': {
    summary: 'Verify Zarinpal subscription callback',
    description: 'Public payment-provider callback. The stored Authority and server-side Zarinpal verification determine activation; query parameters alone are never trusted.',
    tags: ['Inquiries'],
    authRequired: false,
    includeNotFound: false,
    responses: { 302: { description: 'Redirects to the configured subscription result URL.' } },
  },
  'GET /api/v1/inquiries': { summary: 'List inquiries', description: 'Lists inquiries with server-side pagination, search, status filtering, scope-based visibility (sent/received/all) and sorting. Company-based access is enforced: buyers see their own inquiries, sellers see inquiries requesting their products, and SUPER_ADMIN can see all. Authentication required: Bearer JWT. Permission required: leads.read or inquiries.read.', tags: ['Inquiries'], permission: 'leads.read OR inquiries.read', querystring: inquiryListQuery, responses: paginatedResponse('Inquiries returned successfully.') },
  'GET /api/v1/inquiries/:id': { summary: 'Get inquiry by ID', description: 'Returns a single inquiry with items, responses and recent status history. Read access is restricted to the owning (buyer) company, companies owning a requested product (seller), and SUPER_ADMIN; anyone else receives 404. Authentication required: Bearer JWT. Permission required: leads.read or inquiries.read.', tags: ['Inquiries'], permission: 'leads.read OR inquiries.read', params: idParam(), responses: resourceResponse('Inquiry returned successfully.') },
  'POST /api/v1/inquiries': { summary: 'Create inquiry', description: 'Creates a new inquiry with items. Authentication required: Bearer JWT. Permission required: leads.create or inquiries.create.', tags: ['Inquiries'], permission: 'leads.create OR inquiries.create', responses: createdResponse('Inquiry created successfully.') },

  'GET /api/v1/inquiries/:id/items': { summary: 'List inquiry items', description: 'Returns items for an inquiry. Authentication required: Bearer JWT. Permission required: leads.read or inquiries.read.', tags: ['Inquiries'], permission: 'leads.read OR inquiries.read', params: idParam(), responses: resourceResponse('Inquiry items returned successfully.') },
  'PATCH /api/v1/inquiries/:id/status': { summary: 'Change inquiry status', description: 'Updates inquiry status. Authentication required: Bearer JWT. Permission required: leads.update or inquiries.update.', tags: ['Inquiries'], permission: 'leads.update OR inquiries.update', params: idParam(), responses: resourceResponse('Inquiry status updated successfully.') },
  'POST /api/v1/inquiries/:id/items': { summary: 'Add inquiry item', description: 'Adds an item to an inquiry. Authentication required: Bearer JWT. Permission required: leads.update or inquiries.create.', tags: ['Inquiries'], permission: 'leads.update OR inquiries.create', params: idParam(), responses: createdResponse('Inquiry item added successfully.') },
  'PATCH /api/v1/inquiries/:id/items/:itemId': { summary: 'Update inquiry item', description: 'Updates an inquiry item. Authentication required: Bearer JWT. Permission required: leads.update or inquiries.create.', tags: ['Inquiries'], permission: 'leads.update OR inquiries.create', params: twoIdParams('id', 'itemId'), responses: resourceResponse('Inquiry item updated successfully.') },
  'DELETE /api/v1/inquiries/:id/items/:itemId': { summary: 'Delete inquiry item', description: 'Deletes an inquiry item. Authentication required: Bearer JWT. Permission required: leads.delete or inquiries.create.', tags: ['Inquiries'], permission: 'leads.delete OR inquiries.create', params: twoIdParams('id', 'itemId'), responses: messageResponse('Inquiry item deleted successfully.') },
  'GET /api/v1/inquiries/:id/responses': { summary: 'List inquiry responses', description: 'Returns responses submitted for an inquiry. Authentication required: Bearer JWT. Permission required: inquiries.read, inquiries.respond, or leads.read.', tags: ['Inquiries'], permission: 'inquiries.read OR inquiries.respond OR leads.read', params: idParam(), responses: resourceResponse('Inquiry responses returned successfully.') },
  'POST /api/v1/inquiries/:id/responses': { summary: 'Submit inquiry response', description: 'Submits a response to an inquiry. Authentication required: Bearer JWT. Permission required: inquiries.respond or leads.update.', tags: ['Inquiries'], permission: 'inquiries.respond OR leads.update', params: idParam(), responses: createdResponse('Inquiry response submitted successfully.') },
  'PATCH /api/v1/inquiries/:id/responses/:responseId': { summary: 'Update inquiry response', description: 'Updates a submitted inquiry response. Authentication required: Bearer JWT. Permission required: inquiries.respond or leads.update.', tags: ['Inquiries'], permission: 'inquiries.respond OR leads.update', params: twoIdParams('id', 'responseId'), responses: resourceResponse('Inquiry response updated successfully.') },
});


// Additional source-backed route metadata — coverage pass 16A.
Object.assign(docs, {
  'PATCH /api/v1/users/:id/access-active': {
    summary: 'Activate or deactivate a user access profile',
    description: 'Changes whether the target user may access the assigned application panel. Authentication required: Bearer JWT. Permission required: users.activate or users.deactivate. Target ownership and permitted access-profile scope are enforced by the user service.',
    tags: ['Users'], permission: 'users.activate OR users.deactivate', params: idParam(),
    body: { type: 'object', required: ['isActive'], additionalProperties: false, properties: { isActive: { type: 'boolean' } } },
    responses: resourceResponse('User access profile state updated successfully.'),
  },
  'PATCH /api/v1/users/:id/company': {
    summary: 'Move a user to another company',
    description: 'Changes the company assignment of a user. Authentication required: Bearer JWT. Permission required: users.update. The service restricts this privileged cross-company operation to the authorized administrative context.',
    tags: ['Users'], permission: 'users.update', params: idParam(),
    body: { type: 'object', required: ['companyId'], additionalProperties: false, properties: { companyId: { type: 'integer', minimum: 1 } } },
    responses: resourceResponse('User company assignment updated successfully.'),
  },
  'GET /api/v1/addresses': {
    summary: 'List the current customer addresses',
    description: 'Returns addresses owned by the authenticated customer. Authentication required: Bearer JWT. Access context required: CUSTOMER. Results are scoped to the current user.',
    tags: ['Addresses'], responses: resourceResponse('Customer addresses returned successfully.'),
  },
  'POST /api/v1/addresses': {
    summary: 'Create a customer address',
    description: 'Creates an address for the authenticated customer. Authentication required: Bearer JWT. Access context required: CUSTOMER. Required fields: recipientName, recipientPhone, province, city and addressLine; optional fields include label, postalCode and isDefault.',
    tags: ['Addresses'], body: { type: 'object', required: ['recipientName', 'recipientPhone', 'province', 'city', 'addressLine'], additionalProperties: false, properties: {
      label: { type: 'string', minLength: 1, maxLength: 50 }, recipientName: { type: 'string', minLength: 1, maxLength: 120 },
      recipientPhone: { type: 'string', minLength: 5, maxLength: 30 }, province: { type: 'string', minLength: 1, maxLength: 100 },
      city: { type: 'string', minLength: 1, maxLength: 100 }, addressLine: { type: 'string', minLength: 5, maxLength: 1000 },
      postalCode: { type: ['string', 'null'], maxLength: 30 }, isDefault: { type: 'boolean' },
    } }, responses: createdResponse('Customer address created successfully.'),
  },
  'GET /api/v1/addresses/:id': {
    summary: 'Get an owned customer address',
    description: 'Returns one address belonging to the authenticated customer. Authentication required: Bearer JWT. Access context required: CUSTOMER. An address outside the caller’s ownership is not exposed.',
    tags: ['Addresses'], params: idParam(), responses: resourceResponse('Customer address returned successfully.'),
  },
  'PATCH /api/v1/addresses/:id': {
    summary: 'Update an owned customer address',
    description: 'Updates one address belonging to the authenticated customer. Authentication required: Bearer JWT. Access context required: CUSTOMER. At least one allowed address field must be supplied.',
    tags: ['Addresses'], params: idParam(), body: { type: 'object', minProperties: 1, additionalProperties: false, properties: {
      label: { type: 'string', minLength: 1, maxLength: 50 }, recipientName: { type: 'string', minLength: 1, maxLength: 120 },
      recipientPhone: { type: 'string', minLength: 5, maxLength: 30 }, province: { type: 'string', minLength: 1, maxLength: 100 },
      city: { type: 'string', minLength: 1, maxLength: 100 }, addressLine: { type: 'string', minLength: 5, maxLength: 1000 },
      postalCode: { type: ['string', 'null'], maxLength: 30 }, isDefault: { type: 'boolean' },
    } }, responses: resourceResponse('Customer address updated successfully.'),
  },
  'PATCH /api/v1/addresses/:id/default': {
    summary: 'Set an owned address as the customer default',
    description: 'Marks an address owned by the authenticated customer as the default address. Authentication required: Bearer JWT. Access context required: CUSTOMER.',
    tags: ['Addresses'], params: idParam(), responses: resourceResponse('Default customer address updated successfully.'),
  },
  'DELETE /api/v1/addresses/:id': {
    summary: 'Delete an owned customer address',
    description: 'Deletes an address belonging to the authenticated customer. Authentication required: Bearer JWT. Access context required: CUSTOMER.',
    tags: ['Addresses'], params: idParam(), responses: { 204: { description: 'Customer address deleted successfully; no response body.' } },
  },
  'GET /api/v1/roles/assignable': {
    summary: 'List roles assignable by the current user',
    description: 'Returns roles that the caller may assign within the caller’s own access-type domain. Authentication required: Bearer JWT. Access context required: STAFF or COMPANY. Permission required: users.create or users.assign_roles.',
    tags: ['Roles'], permission: 'users.create OR users.assign_roles', responses: resourceResponse('Assignable roles returned successfully.'),
  },
  'GET /api/v1/categories/:id/subcategories': {
    summary: 'List active subcategories for a category',
    description: 'Returns active subcategories of the requested active category for public marketplace browsing. Authentication required: none.',
    tags: ['Categories'], authRequired: false, params: idParam(), responses: resourceResponse('Active subcategories returned successfully.'),
  },
  'GET /api/v1/categories/:id/subcategories/:subId': {
    summary: 'Get an active category subcategory',
    description: 'Returns one active subcategory under an active parent category for public marketplace browsing. Authentication required: none.',
    tags: ['Categories'], authRequired: false, params: twoIdParams('id', 'subId'), responses: resourceResponse('Active subcategory returned successfully.'),
  },
  'GET /api/v1/categories/manage': {
    summary: 'List categories for staff management',
    description: 'Returns categories for administrative management, including inactive entries. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: categories.read.',
    tags: ['Categories'], permission: 'categories.read', responses: resourceResponse('Categories returned for management.'),
  },
  'POST /api/v1/categories/:id/subcategories': {
    summary: 'Create a subcategory',
    description: 'Creates a subcategory under the specified category. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: categories.create. Request validation is defined by the route handler and category service.',
    tags: ['Categories'], permission: 'categories.create', params: idParam(), responses: createdResponse('Subcategory created successfully.'),
  },
  'PATCH /api/v1/categories/:id/subcategories/:subId': {
    summary: 'Update a subcategory',
    description: 'Updates a subcategory under the specified category. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: categories.update.',
    tags: ['Categories'], permission: 'categories.update', params: twoIdParams('id', 'subId'), responses: resourceResponse('Subcategory updated successfully.'),
  },
  'DELETE /api/v1/categories/:id/subcategories/:subId': {
    summary: 'Delete a subcategory',
    description: 'Deletes a subcategory under the specified category. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: categories.delete.',
    tags: ['Categories'], permission: 'categories.delete', params: twoIdParams('id', 'subId'), responses: { 204: { description: 'Subcategory deleted successfully; no response body.' } },
  },
  'GET /api/v1/products/:id/price-history': {
    summary: 'Get public retail price history',
    description: 'Returns the public retail price history for a product, intended for the six-month price chart. Authentication required: none. Only the public product projection is exposed.',
    tags: ['Products'], authRequired: false, params: idParam(), responses: resourceResponse('Public retail price history returned successfully.'),
  },
  'GET /api/v1/products/my-products': {
    summary: 'List products available to the current management user',
    description: 'Lists products visible to the authenticated company or staff management context. Authentication required: Bearer JWT. Access context required: COMPANY or STAFF. Permission required: products.read; company ownership is enforced by the service.',
    tags: ['Products'], permission: 'products.read', responses: paginatedResponse('Managed products returned successfully.'),
  },
  'GET /api/v1/products/:id/manage': {
    summary: 'Get a product for management',
    description: 'Returns a product in any workflow status for authorized management/editing. Authentication required: Bearer JWT. Access context required: COMPANY or STAFF. Permission required: products.read; company ownership is enforced by the service.',
    tags: ['Products'], permission: 'products.read', params: idParam(), responses: resourceResponse('Managed product returned successfully.'),
  },
  'GET /api/v1/products/:id/history': {
    summary: 'Get product status and change history',
    description: 'Returns the product change history for an authorized management user. Authentication required: Bearer JWT. Access context required: COMPANY or STAFF. Permission required: products.read; tenant ownership is enforced by the service.',
    tags: ['Products'], permission: 'products.read', params: idParam(), responses: resourceResponse('Product history returned successfully.'),
  },
  'GET /api/v1/specification-library': {
    summary: 'Search the public specification library',
    description: 'Searches reusable product specification definitions for product form and catalogue use. Authentication required: none.',
    tags: ['Specification Library'], authRequired: false, responses: resourceResponse('Specification library search results returned successfully.'),
  },
  'GET /api/v1/specification-library/all': {
    summary: 'List all public specification definitions',
    description: 'Returns the complete reusable specification definition list. Authentication required: none.',
    tags: ['Specification Library'], authRequired: false, responses: resourceResponse('Specification definitions returned successfully.'),
  },
});


// Source-backed metadata for monetization, inquiry conversation and notification operations.
Object.assign(docs, {
  'GET /api/v1/admin/inquiry-monetization/settings': {
    summary: 'Get inquiry monetization settings',
    description: 'Returns platform-level inquiry subscription enforcement settings. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: system_settings.manage.',
    tags: ['Admin'], permission: 'system_settings.manage', responses: resourceResponse('Inquiry monetization settings returned successfully.'),
  },
  'PATCH /api/v1/admin/inquiry-monetization/settings': {
    summary: 'Update inquiry monetization settings',
    description: 'Updates whether inquiry subscription enforcement is enabled. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: system_settings.manage.',
    tags: ['Admin'], permission: 'system_settings.manage',
    body: { type: 'object', required: ['subscriptionEnforcement'], additionalProperties: false, properties: { subscriptionEnforcement: { type: 'boolean' } } },
    responses: resourceResponse('Inquiry monetization settings updated successfully.'),
  },
  'GET /api/v1/admin/inquiry-plans': {
    summary: 'List inquiry subscription plans for administration',
    description: 'Lists inquiry plans for staff administration. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: system_settings.manage.',
    tags: ['Admin'], permission: 'system_settings.manage', responses: resourceResponse('Inquiry plans returned successfully.'),
  },
  'POST /api/v1/admin/inquiry-plans': {
    summary: 'Create an inquiry subscription plan',
    description: 'Creates a subscription plan with duration, price and per-period inquiry, response, internal-message and SMS allowances. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: system_settings.manage.',
    tags: ['Admin'], permission: 'system_settings.manage',
    body: { type: 'object', required: ['code', 'name', 'durationDays', 'price'], additionalProperties: false, properties: {
      code: { type: 'string', minLength: 2, maxLength: 50 }, name: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 1000 }, durationDays: { type: 'integer', minimum: 1, maximum: 3650 },
      price: { type: 'number', minimum: 1 }, currency: { type: 'string', minLength: 3, maxLength: 8 },
      inquiriesPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 }, responsesPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 },
      internalMessagesPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 }, smsPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 },
      isActive: { type: 'boolean' },
    } }, responses: createdResponse('Inquiry subscription plan created successfully.'),
  },
  'PATCH /api/v1/admin/inquiry-plans/:id': {
    summary: 'Update an inquiry subscription plan',
    description: 'Updates configurable plan details and usage allowances. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: system_settings.manage.',
    tags: ['Admin'], permission: 'system_settings.manage', params: idParam(),
    body: { type: 'object', minProperties: 1, additionalProperties: false, properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 }, description: { type: 'string', maxLength: 1000 },
      durationDays: { type: 'integer', minimum: 1, maximum: 3650 }, price: { type: 'number', minimum: 0 },
      currency: { type: 'string', minLength: 3, maxLength: 8 }, inquiriesPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 },
      responsesPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 }, internalMessagesPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 },
      smsPerPeriod: { type: 'integer', minimum: 0, maximum: 100000000 }, isActive: { type: 'boolean' },
    } }, responses: resourceResponse('Inquiry subscription plan updated successfully.'),
  },
  'GET /api/v1/admin/inquiry-subscriptions': {
    summary: 'List inquiry subscriptions for administration',
    description: 'Lists inquiry subscriptions for staff review and management. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: system_settings.manage.',
    tags: ['Admin'], permission: 'system_settings.manage', responses: resourceResponse('Inquiry subscriptions returned successfully.'),
  },
  'POST /api/v1/admin/inquiry-subscriptions/:id/activate': {
    summary: 'Activate a pending inquiry subscription',
    description: 'Confirms a pending subscription payment and activates the subscription. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: system_settings.manage. paymentConfirmed must be true.',
    tags: ['Admin'], permission: 'system_settings.manage', params: idParam(),
    body: { type: 'object', required: ['paymentConfirmed'], additionalProperties: false, properties: { paymentConfirmed: { type: 'boolean', const: true }, notes: { type: 'string', maxLength: 1000 } } },
    responses: resourceResponse('Inquiry subscription activated successfully.'),
  },
  'POST /api/v1/admin/inquiry-subscriptions/:id/reject': {
    summary: 'Reject a pending inquiry subscription',
    description: 'Rejects a pending subscription request and may record staff notes. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: system_settings.manage.',
    tags: ['Admin'], permission: 'system_settings.manage', params: idParam(),
    body: { type: 'object', additionalProperties: false, properties: { notes: { type: 'string', maxLength: 1000 } } },
    responses: resourceResponse('Inquiry subscription rejected successfully.'),
  },
  'POST /api/v1/admin/inquiry-subscriptions/grant': {
    summary: 'Grant an inquiry subscription manually',
    description: 'Grants a selected plan to a company or user as an administrative action. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: system_settings.manage. Supply planId and the intended companyId or userId.',
    tags: ['Admin'], permission: 'system_settings.manage',
    body: { type: 'object', required: ['planId'], additionalProperties: false, properties: { planId: { type: 'integer', minimum: 1 }, companyId: { type: 'integer', minimum: 1 }, userId: { type: 'integer', minimum: 1 }, notes: { type: 'string', maxLength: 1000 } } },
    responses: createdResponse('Inquiry subscription granted successfully.'),
  },
  'POST /api/v1/admin/notifications/send': {
    summary: 'Send an administrative announcement',
    description: 'Sends an announcement to active users in the selected audience through the selected in-app and/or email channels. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: notifications.send.',
    tags: ['Notifications'], permission: 'notifications.send',
    body: { type: 'object', required: ['title', 'message', 'audience', 'channels'], additionalProperties: false, properties: {
      title: { type: 'string', minLength: 1, maxLength: 120 }, message: { type: 'string', minLength: 1, maxLength: 5000 },
      audience: { type: 'string', enum: ['ALL_ACTIVE', 'CUSTOMER', 'COMPANY', 'STAFF'] },
      channels: { type: 'array', minItems: 1, uniqueItems: true, items: { type: 'string', enum: ['IN_APP', 'EMAIL'] } },
    } }, responses: { 202: { description: 'Announcement accepted and queued for delivery.', type: 'object', additionalProperties: true } },
  },
  'GET /api/v1/admin/notifications/folders': {
    summary: 'List administratively managed notification folders',
    description: 'Lists notification folder definitions and their audience scopes. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: system_settings.manage.',
    tags: ['Notifications'], permission: 'system_settings.manage', responses: resourceResponse('Notification folders returned successfully.'),
  },
  'POST /api/v1/admin/notifications/folders': {
    summary: 'Create a notification folder',
    description: 'Creates a system-managed notification folder for the selected audience scope. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: system_settings.manage.',
    tags: ['Notifications'], permission: 'system_settings.manage',
    body: { type: 'object', required: ['name', 'scope'], additionalProperties: false, properties: {
      name: { type: 'string', minLength: 2, maxLength: 60 }, scope: { type: 'string', enum: ['ALL', 'WEBSITE', 'COMPANY', 'ADMIN'] },
      sortOrder: { type: 'integer', minimum: 0, maximum: 10000 },
    } }, responses: createdResponse('Notification folder created successfully.'),
  },
  'PATCH /api/v1/admin/notifications/folders/:id': {
    summary: 'Update a notification folder',
    description: 'Updates a system-managed notification folder, including its name, audience scope, ordering or active state. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: system_settings.manage.',
    tags: ['Notifications'], permission: 'system_settings.manage', params: idParam(),
    body: { type: 'object', minProperties: 1, additionalProperties: false, properties: {
      name: { type: 'string', minLength: 2, maxLength: 60 }, scope: { type: 'string', enum: ['ALL', 'WEBSITE', 'COMPANY', 'ADMIN'] },
      sortOrder: { type: 'integer', minimum: 0, maximum: 10000 }, isActive: { type: 'boolean' },
    } }, responses: resourceResponse('Notification folder updated successfully.'),
  },
  'GET /api/v1/admin/notifications/delivery-stats': {
    summary: 'Get notification delivery statistics',
    description: 'Returns aggregate notification delivery statistics for staff monitoring. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: delivery.view.',
    tags: ['Admin'], permission: 'delivery.view', responses: resourceResponse('Notification delivery statistics returned successfully.'),
  },
  'GET /api/v1/admin/notifications/deliveries': {
    summary: 'List notification delivery records',
    description: 'Lists delivery records for operational monitoring. Authentication required: Bearer JWT. Access context required: STAFF. Permission required: delivery.view.',
    tags: ['Admin'], permission: 'delivery.view', responses: paginatedResponse('Notification delivery records returned successfully.'),
  },
  'GET /api/v1/inquiries/plans': {
    summary: 'List inquiry subscription plans',
    description: 'Lists available inquiry subscription plans for eligible buyer and supplier application contexts. Authentication required: Bearer JWT. Access context required: STAFF, COMPANY or CUSTOMER. Permission required: leads.read, inquiries.read or inquiries.create.',
    tags: ['Inquiries'], permission: 'leads.read OR inquiries.read OR inquiries.create', responses: resourceResponse('Available inquiry plans returned successfully.'),
  },
  'POST /api/v1/inquiries/subscription/:id/verify-payment': {
    summary: 'Retry verification of an inquiry subscription payment',
    description: 'Retries server-side verification for the caller-owned inquiry subscription payment. Authentication required: Bearer JWT. Access context required: COMPANY or CUSTOMER. Permission required: inquiries.read, inquiries.create or inquiries.respond. The provider reference is resolved from the stored subscription; caller ownership is enforced.',
    tags: ['Inquiries'], permission: 'inquiries.read OR inquiries.create OR inquiries.respond',
    params: { type: 'object', required: ['id'], properties: { id: { type: 'string', minLength: 1, maxLength: 10 } } },
    responses: resourceResponse('Inquiry subscription payment verification result returned.'),
  },
  'GET /api/v1/inquiries/subscription/me': {
    summary: 'List the current user or company inquiry subscriptions',
    description: 'Returns subscriptions owned by the authenticated customer user or company. Authentication required: Bearer JWT. Access context required: COMPANY or CUSTOMER. Permission required: inquiries.read, inquiries.create or inquiries.respond.',
    tags: ['Inquiries'], permission: 'inquiries.read OR inquiries.create OR inquiries.respond', responses: resourceResponse('Caller-owned inquiry subscriptions returned successfully.'),
  },
  'POST /api/v1/inquiries/subscription': {
    summary: 'Request an inquiry subscription',
    description: 'Requests a plan for the authenticated company or customer user. Authentication required: Bearer JWT. Access context required: COMPANY or CUSTOMER. Permission required: inquiries.create or inquiries.respond. Optional paymentReference is used for manual payment review when applicable.',
    tags: ['Inquiries'], permission: 'inquiries.create OR inquiries.respond',
    body: { type: 'object', required: ['planId'], additionalProperties: false, properties: { planId: { type: 'integer', minimum: 1 }, paymentReference: { type: 'string', maxLength: 120 } } },
    responses: createdResponse('Inquiry subscription request created successfully.'),
  },
  'GET /api/v1/inquiries/quota': {
    summary: 'Get the current inquiry subscription quota',
    description: 'Returns the remaining inquiry, response, internal-message and SMS allowances for the authenticated owner. Authentication required: Bearer JWT. Access context required: COMPANY or CUSTOMER. Permission required: leads.read, inquiries.read or inquiries.create.',
    tags: ['Inquiries'], permission: 'leads.read OR inquiries.read OR inquiries.create', responses: resourceResponse('Current inquiry quota returned successfully.'),
  },
  'GET /api/v1/inquiries/stats': {
    summary: 'Get inquiry statistics for the current access context',
    description: 'Returns inquiry aggregates scoped to the authenticated buyer, supplier company or authorized staff platform context. Authentication required: Bearer JWT. Access context required: STAFF, COMPANY or CUSTOMER. Permission required: leads.read or inquiries.read.',
    tags: ['Inquiries'], permission: 'leads.read OR inquiries.read', responses: resourceResponse('Inquiry statistics returned successfully.'),
  },
  'PATCH /api/v1/inquiries/:id': {
    summary: 'Update an inquiry',
    description: 'Updates an inquiry within the caller’s authorized management context. Authentication required: Bearer JWT. Access context required: STAFF or COMPANY. Permission required: leads.update or inquiries.update. Buyer/supplier ownership and lifecycle rules are enforced by the service.',
    tags: ['Inquiries'], permission: 'leads.update OR inquiries.update', params: idParam(),
    responses: resourceResponse('Inquiry updated successfully.'),
  },
  'POST /api/v1/inquiries/:id/reveal': {
    summary: 'Reveal sealed inquiry responses',
    description: 'Requests early reveal of sealed supplier responses when the inquiry policy allows it. Authentication required: Bearer JWT. Access context required: STAFF, COMPANY or CUSTOMER. Permission required: leads.read, inquiries.read, leads.update or inquiries.update. Buyer ownership and reveal policy are enforced by the service.',
    tags: ['Inquiries'], permission: 'leads.read OR inquiries.read OR leads.update OR inquiries.update', params: idParam(),
    responses: resourceResponse('Inquiry response reveal result returned successfully.'),
  },
  'GET /api/v1/inquiries/:id/messages': {
    summary: 'List private inquiry messages',
    description: 'Returns the private buyer/supplier conversation for an inquiry. Authentication required: Bearer JWT. Access context required: STAFF, COMPANY or CUSTOMER. Permission required: leads.read or inquiries.read. Conversation membership and inquiry visibility are enforced by the service.',
    tags: ['Inquiries'], permission: 'leads.read OR inquiries.read', params: idParam(), responses: resourceResponse('Inquiry messages returned successfully.'),
  },
  'POST /api/v1/inquiries/:id/messages': {
    summary: 'Send a private inquiry message',
    description: 'Sends a message in an authorized inquiry conversation and may request an SMS alert when recipient preference and sender quota allow it. Authentication required: Bearer JWT. Access context required: COMPANY or CUSTOMER. Permission required: inquiries.create or inquiries.respond. Each send is subject to subscription message quota.',
    tags: ['Inquiries'], permission: 'inquiries.create OR inquiries.respond', params: idParam(),
    body: { type: 'object', required: ['message'], additionalProperties: false, properties: {
      message: { type: 'string', minLength: 1, maxLength: 5000 }, recipientCompanyId: { type: 'integer', minimum: 1 }, notifyBySms: { type: 'boolean' },
    } }, responses: createdResponse('Inquiry message sent successfully.'),
  },
  'PATCH /api/v1/inquiries/:id/responses/:responseId/decision': {
    summary: 'Accept or reject an inquiry response',
    description: 'Records the buyer’s decision on a supplier response. Authentication required: Bearer JWT. Access context required: STAFF, COMPANY or CUSTOMER. Permission required: inquiries.create, inquiries.update or leads.update. Buyer ownership and response decision rules are enforced by the service.',
    tags: ['Inquiries'], permission: 'inquiries.create OR inquiries.update OR leads.update', params: twoIdParams('id', 'responseId'),
    body: { type: 'object', required: ['decision'], additionalProperties: false, properties: { decision: { type: 'string', enum: ['SELECTED', 'REJECTED'] }, comment: { type: 'string', maxLength: 2000 } } },
    responses: resourceResponse('Inquiry response decision saved successfully.'),
  },
  'POST /api/v1/inquiries/:id/responses/:responseId/withdraw': {
    summary: 'Withdraw a supplier response',
    description: 'Withdraws the authenticated supplier company’s response. Authentication required: Bearer JWT. Access context required: COMPANY. Permission required: inquiries.respond. Response ownership is enforced by the service.',
    tags: ['Inquiries'], permission: 'inquiries.respond', params: twoIdParams('id', 'responseId'),
    body: { type: 'object', additionalProperties: false, properties: { companyId: { type: 'integer' } } },
    responses: resourceResponse('Inquiry response withdrawn successfully.'),
  },
  'POST /api/v1/inquiries/:id/responses/:responseId/attachments': {
    summary: 'Upload an attachment to a supplier response',
    description: 'Uploads a file attachment to the authenticated supplier company’s response. Authentication required: Bearer JWT. Access context required: COMPANY. Permission required: inquiries.respond. Request content type: multipart/form-data.',
    tags: ['Inquiries'], permission: 'inquiries.respond', params: twoIdParams('id', 'responseId'),
    responses: createdResponse('Inquiry response attachment uploaded successfully.'),
  },
  'DELETE /api/v1/inquiries/:id/responses/:responseId/attachments/:attachmentId': {
    summary: 'Delete an attachment from a supplier response',
    description: 'Deletes an attachment owned by the authenticated supplier company’s response. Authentication required: Bearer JWT. Access context required: COMPANY. Permission required: inquiries.respond. Attachment and response ownership are enforced by the service.',
    tags: ['Inquiries'], permission: 'inquiries.respond',
    params: { type: 'object', required: ['id', 'responseId', 'attachmentId'], properties: { id: { type: 'integer' }, responseId: { type: 'integer' }, attachmentId: { type: 'integer' } } },
    responses: { 204: { description: 'Inquiry response attachment deleted successfully; no response body.' } },
  },
  'GET /api/v1/settings/notifications': {
    summary: 'List the current user notifications',
    description: 'Lists notifications belonging to the authenticated user, including the selected inbox/folder scope and pagination where supported. Authentication required: Bearer JWT. Results are user-scoped.',
    tags: ['Notifications'], responses: paginatedResponse('User notifications returned successfully.'),
  },
  'GET /api/v1/settings/notifications/unread-count': {
    summary: 'Get the current user unread notification count',
    description: 'Returns unread notification counts for the authenticated user’s notification folders. Authentication required: Bearer JWT. Results are user-scoped.',
    tags: ['Notifications'], responses: resourceResponse('Unread notification counts returned successfully.'),
  },
  'POST /api/v1/settings/notifications/bulk-read-state': {
    summary: 'Set read state for multiple notifications',
    description: 'Marks up to 100 selected notifications as read or unread for the authenticated user. Authentication required: Bearer JWT. Every notification ID is scoped to the caller.',
    tags: ['Notifications'],
    body: { type: 'object', required: ['ids', 'isRead'], additionalProperties: false, properties: {
      ids: { type: 'array', minItems: 1, maxItems: 100, uniqueItems: true, items: { type: 'integer', minimum: 1 } }, isRead: { type: 'boolean' },
    } }, responses: resourceResponse('Notification read states updated successfully.'),
  },
  'POST /api/v1/settings/notifications/bulk-delete': {
    summary: 'Delete multiple notifications',
    description: 'Deletes up to 100 selected notifications belonging to the authenticated user. Authentication required: Bearer JWT. Every notification ID is scoped to the caller.',
    tags: ['Notifications'],
    body: { type: 'object', required: ['ids'], additionalProperties: false, properties: { ids: { type: 'array', minItems: 1, maxItems: 100, uniqueItems: true, items: { type: 'integer', minimum: 1 } } } },
    responses: messageResponse('Selected notifications deleted successfully.'),
  },
  'GET /api/v1/settings/notifications/folders': {
    summary: 'List notification folders available to the current user',
    description: 'Returns system-defined folders available in the authenticated user’s application context. Authentication required: Bearer JWT. Folder visibility is scoped to the user’s context.',
    tags: ['Notifications'], responses: resourceResponse('Available notification folders returned successfully.'),
  },
  'POST /api/v1/settings/notifications/:id/folders': {
    summary: 'Copy or move a notification to a folder',
    description: 'Copies or moves an owned notification into a permitted folder. Authentication required: Bearer JWT. Notification ownership and folder scope are enforced by the service.',
    tags: ['Notifications'], params: idParam(),
    body: { type: 'object', required: ['folderId', 'action'], additionalProperties: false, properties: {
      folderId: { type: 'integer', minimum: 1 }, action: { type: 'string', enum: ['copy', 'move'] }, sourceFolderId: { type: 'integer', minimum: 1 },
    } }, responses: resourceResponse('Notification folder assignment updated successfully.'),
  },
  'PATCH /api/v1/settings/notifications/:id/read-state': {
    summary: 'Set a notification read state',
    description: 'Marks an owned notification as read or unread. Authentication required: Bearer JWT. Notification ownership is enforced by the service.',
    tags: ['Notifications'], params: idParam(),
    body: { type: 'object', required: ['isRead'], additionalProperties: false, properties: { isRead: { type: 'boolean' } } },
    responses: resourceResponse('Notification read state updated successfully.'),
  },
  'PATCH /api/v1/settings/notifications/:id/read': {
    summary: 'Mark a notification as read',
    description: 'Marks an owned notification as read. Authentication required: Bearer JWT. Notification ownership is enforced by the service.',
    tags: ['Notifications'], params: idParam(), responses: resourceResponse('Notification marked as read successfully.'),
  },
  'PATCH /api/v1/settings/notifications/read-all': {
    summary: 'Mark all current user notifications as read',
    description: 'Marks all notifications belonging to the authenticated user as read. Authentication required: Bearer JWT. Updates are scoped to the caller.',
    tags: ['Notifications'], responses: resourceResponse('All user notifications marked as read.'),
  },
  'DELETE /api/v1/settings/notifications/:id': {
    summary: 'Delete an owned notification',
    description: 'Deletes a notification belonging to the authenticated user. Authentication required: Bearer JWT. Notification ownership is enforced by the service.',
    tags: ['Notifications'], params: idParam(), responses: messageResponse('Notification deleted successfully.'),
  },
});


// Concrete response contracts derived from controller envelopes, service projections and Prisma selects.
const addressItemResponseSchema = {
  type: 'object',
  required: ['id', 'userId', 'label', 'recipientName', 'recipientPhone', 'province', 'city', 'addressLine', 'postalCode', 'isDefault', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'integer' }, userId: { type: 'integer' }, label: { type: 'string' },
    recipientName: { type: 'string' }, recipientPhone: { type: 'string' }, province: { type: 'string' },
    city: { type: 'string' }, addressLine: { type: 'string' }, postalCode: { type: ['string', 'null'] },
    isDefault: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
  },
};
const addressEnvelope = (array = false) => ({
  200: { description: array ? 'Customer addresses returned successfully.' : 'Customer address returned successfully.', type: 'object', required: ['data'], properties: {
    data: array ? { type: 'array', items: addressItemResponseSchema } : addressItemResponseSchema,
  } },
});
const notificationFolderUserSchema = {
  type: 'object', required: ['id', 'key', 'name', 'scope'],
  properties: { id: { type: 'integer' }, key: { type: 'string' }, name: { type: 'string' }, scope: { type: 'string', enum: ['ALL', 'WEBSITE', 'COMPANY', 'ADMIN'] } },
};
const notificationFolderAdminSchema = {
  type: 'object', required: ['id', 'key', 'name', 'scope', 'isSystem', 'isActive', 'sortOrder', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'integer' }, key: { type: 'string' }, name: { type: 'string' },
    scope: { type: 'string', enum: ['ALL', 'WEBSITE', 'COMPANY', 'ADMIN'] },
    isSystem: { type: 'boolean' }, isActive: { type: 'boolean' }, sortOrder: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
  },
};
const notificationItemResponseSchema = {
  type: 'object',
  required: ['id', 'userId', 'type', 'data', 'title', 'message', 'isRead', 'createdAt', 'folderMemberships'],
  properties: {
    id: { type: 'integer' }, userId: { type: 'integer' }, type: { type: ['string', 'null'] },
    data: { anyOf: [{ type: 'object', additionalProperties: true }, { type: 'null' }] },
    title: { type: 'string' }, message: { type: 'string' }, isRead: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    folderMemberships: { type: 'array', items: { type: 'object', required: ['id', 'notificationId', 'folderId', 'createdAt', 'folder'], properties: {
      id: { type: 'integer' }, notificationId: { type: 'integer' }, folderId: { type: 'integer' },
      createdAt: { type: 'string', format: 'date-time' },
      folder: { type: 'object', required: ['id', 'key', 'name', 'scope'], properties: {
        id: { type: 'integer' }, key: { type: 'string' }, name: { type: 'string' }, scope: { type: 'string', enum: ['ALL', 'WEBSITE', 'COMPANY', 'ADMIN'] },
      } },
    } } },
  },
};
const paginationMetaResponseSchema = {
  type: 'object', required: ['page', 'limit', 'total', 'totalPages'],
  properties: { page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' }, totalPages: { type: 'integer' } },
};
const inquiryPlanResponseSchema = {
  type: 'object', required: ['id', 'code', 'name', 'description', 'durationDays', 'price', 'currency', 'inquiriesPerPeriod', 'responsesPerPeriod', 'internalMessagesPerPeriod', 'smsPerPeriod'],
  properties: {
    id: { type: 'integer' }, code: { type: 'string' }, name: { type: 'string' }, description: { type: ['string', 'null'] },
    durationDays: { type: 'integer' }, price: { type: 'string' }, currency: { type: 'string' },
    inquiriesPerPeriod: { type: 'integer' }, responsesPerPeriod: { type: 'integer' },
    internalMessagesPerPeriod: { type: 'integer' }, smsPerPeriod: { type: 'integer' },
    isActive: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
  },
};
const inquiryQuotaResponseSchema = {
  type: 'object', required: ['enforced', 'subscription', 'quotas', 'capabilities'],
  properties: {
    enforced: { type: 'boolean' },
    subscription: { anyOf: [{ type: 'object', required: ['id', 'planId', 'planName', 'startsAt', 'endsAt', 'status'], properties: {
      id: { type: 'integer' }, planId: { type: 'integer' }, planName: { type: 'string' },
      startsAt: { type: 'string', format: 'date-time' }, endsAt: { type: 'string', format: 'date-time' }, status: { type: 'string' },
    } }, { type: 'null' }] },
    quotas: { anyOf: [{ type: 'object', additionalProperties: { type: 'object', required: ['used', 'limit', 'remaining'], properties: {
      used: { type: 'integer' }, limit: { type: 'integer' }, remaining: { type: 'integer' },
    } } }, { type: 'null' }] },
    capabilities: { type: 'object', required: ['smsConfigured'], properties: { smsConfigured: { type: 'boolean' } } },
  },
};
const successEnvelope = (payload, description) => ({
  200: { description, type: 'object', required: ['data'], properties: { data: payload } },
});
const notificationSimpleSuccess = {
  type: 'object', required: ['success'], properties: { success: { type: 'boolean' } },
};
const notificationBulkSuccess = {
  type: 'object', required: ['success', 'count'], properties: { success: { type: 'boolean' }, count: { type: 'integer' } },
};

Object.assign(docs, {
  ['GET /api/v1/addresses']: { ...docs['GET /api/v1/addresses'], responses: addressEnvelope(true) },
  ['GET /api/v1/addresses/:id']: { ...docs['GET /api/v1/addresses/:id'], responses: addressEnvelope(false) },
  ['POST /api/v1/addresses']: { ...docs['POST /api/v1/addresses'], responses: { 201: { ...addressEnvelope(false)[200], description: 'Customer address created successfully.' } } },
  ['PATCH /api/v1/addresses/:id']: { ...docs['PATCH /api/v1/addresses/:id'], responses: addressEnvelope(false) },
  ['PATCH /api/v1/addresses/:id/default']: { ...docs['PATCH /api/v1/addresses/:id/default'], responses: addressEnvelope(false) },

  ['GET /api/v1/settings/notifications']: {
    ...docs['GET /api/v1/settings/notifications'],
    responses: { 200: { description: 'Notifications and pagination metadata returned successfully.', type: 'object', required: ['data', 'meta'], properties: {
      data: { type: 'array', items: notificationItemResponseSchema }, meta: paginationMetaResponseSchema,
    } } },
  },
  ['GET /api/v1/settings/notifications/unread-count']: {
    ...docs['GET /api/v1/settings/notifications/unread-count'],
    responses: { 200: { description: 'Unread notification count returned successfully.', type: 'object', required: ['count'], properties: { count: { type: 'integer' } } } },
  },
  ['POST /api/v1/settings/notifications/bulk-read-state']: {
    ...docs['POST /api/v1/settings/notifications/bulk-read-state'],
    responses: { 200: { description: 'Bulk notification read state updated.', ...notificationBulkSuccess } },
  },
  ['POST /api/v1/settings/notifications/bulk-delete']: {
    ...docs['POST /api/v1/settings/notifications/bulk-delete'],
    responses: { 200: { description: 'Bulk notification deletion completed.', ...notificationBulkSuccess } },
  },
  ['GET /api/v1/settings/notifications/folders']: {
    ...docs['GET /api/v1/settings/notifications/folders'],
    responses: { 200: { description: 'Folders available to the current app context returned successfully.', type: 'object', required: ['data'], properties: { data: { type: 'array', items: notificationFolderUserSchema } } } },
  },
  ['POST /api/v1/settings/notifications/:id/folders']: {
    ...docs['POST /api/v1/settings/notifications/:id/folders'],
    responses: { 200: { description: 'Notification folder membership changed successfully.', type: 'object', required: ['success', 'action', 'notificationId', 'folderId'], properties: {
      success: { type: 'boolean' }, action: { type: 'string', enum: ['copy', 'move'] }, notificationId: { type: 'integer' }, folderId: { type: 'integer' },
    } } },
  },
  ['PATCH /api/v1/settings/notifications/:id/read-state']: { ...docs['PATCH /api/v1/settings/notifications/:id/read-state'], responses: { 200: { description: 'Notification read state updated.', ...notificationSimpleSuccess } } },
  ['PATCH /api/v1/settings/notifications/:id/read']: { ...docs['PATCH /api/v1/settings/notifications/:id/read'], responses: { 200: { description: 'Notification marked as read.', ...notificationSimpleSuccess } } },
  ['PATCH /api/v1/settings/notifications/read-all']: { ...docs['PATCH /api/v1/settings/notifications/read-all'], responses: { 200: { description: 'All current user notifications marked as read.', ...notificationSimpleSuccess } } },
  ['DELETE /api/v1/settings/notifications/:id']: { ...docs['DELETE /api/v1/settings/notifications/:id'], responses: { 200: { description: 'Notification deleted successfully.', ...notificationSimpleSuccess } } },

  ['GET /api/v1/admin/notifications/folders']: {
    ...docs['GET /api/v1/admin/notifications/folders'],
    responses: { 200: { description: 'All notification folders returned successfully.', type: 'object', required: ['data'], properties: { data: { type: 'array', items: notificationFolderAdminSchema } } } },
  },
  ['POST /api/v1/admin/notifications/folders']: {
    ...docs['POST /api/v1/admin/notifications/folders'],
    responses: { 201: { description: 'Notification folder created successfully.', type: 'object', required: ['data'], properties: { data: notificationFolderAdminSchema } } },
  },
  ['PATCH /api/v1/admin/notifications/folders/:id']: {
    ...docs['PATCH /api/v1/admin/notifications/folders/:id'],
    responses: { 200: { description: 'Notification folder updated successfully.', type: 'object', required: ['data'], properties: { data: notificationFolderAdminSchema } } },
  },
  ['GET /api/v1/admin/notifications/delivery-stats']: {
    ...docs['GET /api/v1/admin/notifications/delivery-stats'],
    responses: { 200: { description: 'Notification delivery monitoring aggregates returned successfully.', type: 'object', required: ['data'], properties: { data: {
      type: 'object', required: ['total', 'byStatus', 'byChannel', 'recentFailures'], properties: {
        total: { type: 'integer' },
        byStatus: { type: 'object', required: ['PENDING', 'SENT', 'FAILED', 'SKIPPED'], properties: { PENDING: { type: 'integer' }, SENT: { type: 'integer' }, FAILED: { type: 'integer' }, SKIPPED: { type: 'integer' } } },
        byChannel: { type: 'object', required: ['IN_APP', 'EMAIL', 'SMS'], properties: { IN_APP: { type: 'integer' }, EMAIL: { type: 'integer' }, SMS: { type: 'integer' } } },
        recentFailures: { type: 'array', items: { type: 'object', required: ['id', 'eventType', 'channel', 'status', 'attempts', 'maxAttempts', 'createdAt'], properties: {
          id: { type: 'integer' }, eventType: { type: 'string' }, channel: { type: 'string' }, status: { type: 'string' },
          recipient: { type: ['string', 'null'] }, lastError: { type: ['string', 'null'] }, attempts: { type: 'integer' },
          maxAttempts: { type: 'integer' }, nextAttemptAt: { type: 'string', format: 'date-time' }, createdAt: { type: 'string', format: 'date-time' },
        } } },
      },
    } } } },
  },
  ['GET /api/v1/admin/notifications/deliveries']: {
    ...docs['GET /api/v1/admin/notifications/deliveries'],
    responses: { 200: { description: 'Notification delivery rows and pagination metadata returned successfully.', type: 'object', required: ['data', 'meta'], properties: {
      data: { type: 'array', items: { type: 'object', additionalProperties: true } }, meta: paginationMetaResponseSchema,
    } } },
  },

  ['GET /api/v1/inquiries/plans']: { ...docs['GET /api/v1/inquiries/plans'], responses: successEnvelope({ type: 'array', items: inquiryPlanResponseSchema }, 'Active inquiry subscription plans returned successfully.') },
  ['GET /api/v1/inquiries/quota']: { ...docs['GET /api/v1/inquiries/quota'], responses: successEnvelope(inquiryQuotaResponseSchema, 'Current inquiry subscription quota returned successfully.') },
  ['GET /api/v1/admin/inquiry-monetization/settings']: { ...docs['GET /api/v1/admin/inquiry-monetization/settings'], responses: successEnvelope({ type: 'object', required: ['subscriptionEnforcement'], properties: { subscriptionEnforcement: { type: 'boolean' } } }, 'Inquiry subscription enforcement settings returned successfully.') },
  ['PATCH /api/v1/admin/inquiry-monetization/settings']: { ...docs['PATCH /api/v1/admin/inquiry-monetization/settings'], responses: successEnvelope({ type: 'object', required: ['subscriptionEnforcement'], properties: { subscriptionEnforcement: { type: 'boolean' } } }, 'Inquiry subscription enforcement settings updated successfully.') },
  ['GET /api/v1/admin/inquiry-plans']: { ...docs['GET /api/v1/admin/inquiry-plans'], responses: successEnvelope({ type: 'array', items: inquiryPlanResponseSchema }, 'Inquiry plans returned successfully.') },
});


// Inquiry subscription response shapes are based on inquiry-subscription/payment service projections.
const inquirySubscriptionResponseSchema = {
  type: 'object',
  required: ['id', 'planId', 'companyId', 'userId', 'status', 'startsAt', 'endsAt', 'activatedBy', 'paymentReference', 'paymentProvider', 'paymentAuthority', 'paymentRefId', 'paymentAmount', 'paymentVerifiedAt', 'notes', 'createdAt', 'updatedAt', 'plan'],
  properties: {
    id: { type: 'integer' }, planId: { type: 'integer' }, companyId: { type: ['integer', 'null'] }, userId: { type: ['integer', 'null'] },
    status: { type: 'string', enum: ['PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'] },
    startsAt: { type: ['string', 'null'], format: 'date-time' }, endsAt: { type: ['string', 'null'], format: 'date-time' },
    activatedBy: { type: ['integer', 'null'] }, paymentReference: { type: ['string', 'null'] }, paymentProvider: { type: ['string', 'null'] },
    paymentAuthority: { type: ['string', 'null'] }, paymentRefId: { type: ['string', 'null'] }, paymentAmount: { type: ['integer', 'null'] },
    paymentVerifiedAt: { type: ['string', 'null'], format: 'date-time' }, notes: { type: ['string', 'null'] },
    createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
    plan: { type: 'object', required: ['id', 'code', 'name', 'durationDays', 'price', 'currency', 'inquiriesPerPeriod', 'responsesPerPeriod', 'internalMessagesPerPeriod', 'smsPerPeriod'], properties: {
      id: { type: 'integer' }, code: { type: 'string' }, name: { type: 'string' }, durationDays: { type: 'integer' },
      price: { type: 'string' }, currency: { type: 'string' }, inquiriesPerPeriod: { type: 'integer' },
      responsesPerPeriod: { type: 'integer' }, internalMessagesPerPeriod: { type: 'integer' }, smsPerPeriod: { type: 'integer' },
    } },
  },
};
const inquirySubscriptionCreateResponseSchema = {
  ...inquirySubscriptionResponseSchema,
  properties: {
    ...inquirySubscriptionResponseSchema.properties,
    plan: { type: 'object', required: ['id', 'name', 'durationDays', 'price', 'currency'], properties: {
      id: { type: 'integer' }, name: { type: 'string' }, durationDays: { type: 'integer' },
      price: { type: 'string' }, currency: { type: 'string' },
    } },
  },
};
const subscriptionPaymentResultSchema = {
  type: 'object', required: ['payment', 'subscriptionId', 'refId'],
  properties: {
    payment: { type: 'string', enum: ['success', 'failed', 'pending', 'cancelled'] },
    subscriptionId: { type: 'integer' }, refId: { type: ['string', 'null'] },
  },
};
Object.assign(docs, {
  ['GET /api/v1/inquiries/subscription/me']: {
    ...docs['GET /api/v1/inquiries/subscription/me'],
    responses: successEnvelope({ type: 'object', required: ['subscriptions', 'quota'], properties: {
      subscriptions: { type: 'array', items: inquirySubscriptionResponseSchema }, quota: inquiryQuotaResponseSchema,
    } }, 'Caller-owned inquiry subscriptions and current quota returned successfully.'),
  },
  ['POST /api/v1/inquiries/subscription']: {
    ...docs['POST /api/v1/inquiries/subscription'],
    responses: { 201: { description: 'Inquiry subscription request created; payment mode and next action returned.', type: 'object', required: ['data'], properties: { data: {
      type: 'object', required: ['paymentMode', 'subscription', 'paymentUrl'], properties: {
        paymentMode: { type: 'string', enum: ['MANUAL_REVIEW', 'ONLINE'] },
        subscription: inquirySubscriptionCreateResponseSchema,
        paymentUrl: { type: ['string', 'null'], format: 'uri' },
      },
    } } } },
  },
  ['POST /api/v1/inquiries/subscription/:id/verify-payment']: {
    ...docs['POST /api/v1/inquiries/subscription/:id/verify-payment'],
    responses: { 200: { description: 'Server-side inquiry subscription payment verification result.', type: 'object', required: ['data'], properties: { data: subscriptionPaymentResultSchema } } },
  },
});


// Product history and inquiry conversation/response contracts from service projections.
const productActorResponseSchema = {
  type: 'object', required: ['id', 'email', 'profile'], properties: {
    id: { type: 'integer' }, email: { type: ['string', 'null'] },
    profile: { anyOf: [{ type: 'object', properties: { firstName: { type: ['string', 'null'] }, lastName: { type: ['string', 'null'] } }, additionalProperties: true }, { type: 'null' }] },
  },
};
const productPriceSnapshotResponseSchema = {
  type: 'object', required: ['id', 'priceTierId', 'minQuantity', 'maxQuantity', 'price', 'unit', 'action', 'recordedAt'],
  properties: {
    id: { type: 'integer' }, priceTierId: { type: ['integer', 'null'] }, minQuantity: { type: 'integer' },
    maxQuantity: { type: ['integer', 'null'] }, price: { type: 'string' }, unit: { type: ['string', 'null'] },
    action: { type: 'string' }, recordedAt: { type: 'string', format: 'date-time' },
  },
};
const productStatusHistoryResponseSchema = {
  type: 'object', required: ['id', 'productId', 'previousStatus', 'newStatus', 'changedByUserId', 'comment', 'createdAt', 'changedBy'],
  properties: {
    id: { type: 'integer' }, productId: { type: 'integer' }, previousStatus: { type: 'string' }, newStatus: { type: 'string' },
    changedByUserId: { type: 'integer' }, comment: { type: ['string', 'null'] }, createdAt: { type: 'string', format: 'date-time' },
    changedBy: productActorResponseSchema,
  },
};
const productActivityLogResponseSchema = {
  type: 'object', required: ['id', 'productId', 'actorUserId', 'action', 'detail', 'comment', 'createdAt', 'actor'],
  properties: {
    id: { type: 'integer' }, productId: { type: 'integer' }, actorUserId: { type: 'integer' }, action: { type: 'string' },
    detail: { type: ['string', 'null'] }, comment: { type: ['string', 'null'] }, createdAt: { type: 'string', format: 'date-time' },
    actor: productActorResponseSchema,
  },
};
const inquiryMessageResponseSchema = {
  type: 'object',
  required: ['id', 'inquiryId', 'senderUserId', 'senderCompanyId', 'recipientUserId', 'recipientCompanyId', 'body', 'createdAt', 'readAt'],
  properties: {
    id: { type: 'integer' }, inquiryId: { type: 'integer' },
    senderUserId: { type: ['integer', 'null'] }, senderCompanyId: { type: ['integer', 'null'] },
    recipientUserId: { type: ['integer', 'null'] }, recipientCompanyId: { type: ['integer', 'null'] },
    body: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, readAt: { type: ['string', 'null'], format: 'date-time' },
    senderUser: {
      anyOf: [
        {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            profile: {
              anyOf: [
                { type: 'object', properties: { firstName: { type: ['string', 'null'] }, lastName: { type: ['string', 'null'] } }, additionalProperties: true },
                { type: 'null' },
              ],
            },
          },
          additionalProperties: true,
        },
        { type: 'null' },
      ],
    },
    senderCompany: { anyOf: [{ type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } }, additionalProperties: true }, { type: 'null' }] },
    recipientUser: { anyOf: [{ type: 'object', properties: { id: { type: 'integer' } } }, { type: 'null' }] },
    recipientCompany: { anyOf: [{ type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } }, additionalProperties: true }, { type: 'null' }] },
    smsQueued: { type: 'boolean' }, smsSkippedReason: { type: ['string', 'null'] },
  },
};
const inquiryResponseAttachmentResponseSchema = {
  type: 'object', required: ['id', 'responseId', 'url', 'filename', 'mimetype', 'size', 'createdAt'],
  properties: {
    id: { type: 'integer' }, responseId: { type: 'integer' }, url: { type: 'string', minLength: 1 },
    filename: { type: 'string' }, mimetype: { type: ['string', 'null'] }, size: { type: ['integer', 'null'] },
    createdAt: { type: 'string', format: 'date-time' },
  },
};
const inquiryResponseItemResponseSchema = {
  type: 'object', required: ['id', 'responseId', 'inquiryItemId', 'price', 'currency', 'availableQuantity', 'deliveryTime', 'description', 'inquiryItem'],
  properties: {
    id: { type: 'integer' }, responseId: { type: 'integer' }, inquiryItemId: { type: 'integer' },
    price: { type: 'string' }, currency: { type: 'string' }, availableQuantity: { type: 'integer' },
    deliveryTime: { type: ['string', 'null'] }, description: { type: ['string', 'null'] },
    inquiryItem: { type: 'object', properties: {
      id: { type: 'integer' }, inquiryId: { type: 'integer' }, productId: { type: 'integer' },
      description: { type: ['string', 'null'] }, quantity: { type: 'integer' }, attachment: { type: ['string', 'null'] },
      createdAt: { type: 'string', format: 'date-time' },
      product: { type: 'object', properties: { id: { type: 'integer' }, title: { type: 'string' }, slug: { type: 'string' }, companyId: { type: 'integer' } }, additionalProperties: true },
    }, additionalProperties: true },
  },
};
const inquiryResponseResponseSchema = {
  type: 'object', required: ['id', 'inquiryId', 'status', 'withdrawnAt', 'createdAt', 'updatedAt', 'company', 'attachments', 'items'],
  properties: {
    id: { type: 'integer' }, inquiryId: { type: 'integer' }, companyId: { type: 'integer' },
    status: { type: 'string', enum: ['PENDING', 'SELECTED', 'REJECTED', 'WITHDRAWN'] },
    withdrawnAt: { type: ['string', 'null'], format: 'date-time' }, createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    company: { type: 'object', required: ['name', 'type'], properties: { id: { type: 'integer' }, name: { type: 'string' }, type: { type: ['string', 'null'] } }, additionalProperties: true },
    attachments: { type: 'array', items: inquiryResponseAttachmentResponseSchema },
    items: { type: 'array', items: inquiryResponseItemResponseSchema },
    inquiry: { type: 'object', additionalProperties: true },
  },
};
const inquiryDecisionReceiptResponseSchema = {
  type: 'object', required: ['id', 'inquiryId', 'status'],
  properties: { id: { type: 'integer' }, inquiryId: { type: 'integer' }, status: { type: 'string', enum: ['SELECTED', 'REJECTED'] } },
};

Object.assign(docs, {
  ['GET /api/v1/products/:id/price-history']: {
    ...docs['GET /api/v1/products/:id/price-history'],
    responses: { 200: { description: 'Complete public retail price snapshot series in chronological order.', type: 'object', required: ['data'], properties: { data: { type: 'array', items: productPriceSnapshotResponseSchema } } } },
  },
  ['GET /api/v1/products/:id/history']: {
    ...docs['GET /api/v1/products/:id/history'],
    responses: { 200: { description: 'Product status history with the actor projection returned by the service.', type: 'object', required: ['data'], properties: { data: { type: 'array', items: productStatusHistoryResponseSchema } } } },
  },
  ['GET /api/v1/products/:id/activity']: {
    ...docs['GET /api/v1/products/:id/activity'],
    responses: { 200: { description: 'Immutable product activity log with actor projection.', type: 'object', required: ['data'], properties: { data: { type: 'array', items: productActivityLogResponseSchema } } } },
  },
  ['GET /api/v1/inquiries/:id/messages']: {
    ...docs['GET /api/v1/inquiries/:id/messages'],
    responses: { 200: { description: 'Inquiry messages visible to the caller, ordered oldest first; recipient messages may be marked read.', type: 'object', required: ['data'], properties: { data: { type: 'array', maxItems: 500, items: inquiryMessageResponseSchema } } } },
  },
  ['POST /api/v1/inquiries/:id/messages']: {
    ...docs['POST /api/v1/inquiries/:id/messages'],
    responses: { 201: { description: 'Created inquiry message and optional SMS delivery outcome.', type: 'object', required: ['data'], properties: { data: inquiryMessageResponseSchema } } },
  },
  ['GET /api/v1/inquiries/:id/responses']: {
    ...docs['GET /api/v1/inquiries/:id/responses'],
    responses: { 200: { description: 'Supplier responses visible under inquiry visibility rules. Sealed buyer views may return an empty array until reveal; anonymous sealed views redact supplier identifiers.', type: 'object', required: ['data'], properties: { data: { type: 'array', items: inquiryResponseResponseSchema } } } },
  },
  ['POST /api/v1/inquiries/:id/responses']: {
    ...docs['POST /api/v1/inquiries/:id/responses'],
    responses: { 201: { description: 'Created supplier response with its response items and attachments.', type: 'object', required: ['data'], properties: { data: inquiryResponseResponseSchema } } },
  },
  ['PATCH /api/v1/inquiries/:id/responses/:responseId']: {
    ...docs['PATCH /api/v1/inquiries/:id/responses/:responseId'],
    responses: { 200: { description: 'Updated supplier response and response items. The service also includes the inquiry record for the supplier editor.', type: 'object', required: ['data'], properties: { data: inquiryResponseResponseSchema } } },
  },
  ['PATCH /api/v1/inquiries/:id/responses/:responseId/decision']: {
    ...docs['PATCH /api/v1/inquiries/:id/responses/:responseId/decision'],
    responses: { 200: { description: 'Minimal buyer decision receipt; supplier identity is not echoed.', type: 'object', required: ['data'], properties: { data: inquiryDecisionReceiptResponseSchema } } },
  },
  ['POST /api/v1/inquiries/:id/responses/:responseId/withdraw']: {
    ...docs['POST /api/v1/inquiries/:id/responses/:responseId/withdraw'],
    responses: { 200: { description: 'Withdrawn supplier response with response items and attachments.', type: 'object', required: ['data'], properties: { data: inquiryResponseResponseSchema } } },
  },
  ['POST /api/v1/inquiries/:id/responses/:responseId/attachments']: {
    ...docs['POST /api/v1/inquiries/:id/responses/:responseId/attachments'],
    responses: { 201: { description: 'Created response attachment metadata.', type: 'object', required: ['data'], properties: { data: inquiryResponseAttachmentResponseSchema } } },
  },
});


// Admin subscription/delivery, inquiry dashboard and product management list contracts.
const inquiryPlanAdminResponseSchema = {
  type: 'object', required: ['id', 'code', 'name', 'durationDays', 'price', 'currency', 'inquiriesPerPeriod', 'responsesPerPeriod', 'internalMessagesPerPeriod', 'smsPerPeriod', 'isActive'],
  properties: {
    id: { type: 'integer' }, code: { type: 'string' }, name: { type: 'string' }, description: { type: ['string', 'null'] },
    durationDays: { type: 'integer' }, price: { type: 'string' }, currency: { type: 'string' },
    inquiriesPerPeriod: { type: 'integer' }, responsesPerPeriod: { type: 'integer' },
    internalMessagesPerPeriod: { type: 'integer' }, smsPerPeriod: { type: 'integer' }, isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
  },
};
const inquirySubscriptionAdminResponseSchema = {
  type: 'object', required: ['id', 'planId', 'status', 'createdAt', 'updatedAt', 'plan'],
  properties: {
    id: { type: 'integer' }, planId: { type: 'integer' }, companyId: { type: ['integer', 'null'] }, userId: { type: ['integer', 'null'] },
    status: { type: 'string', enum: ['PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'] },
    startsAt: { type: ['string', 'null'], format: 'date-time' }, endsAt: { type: ['string', 'null'], format: 'date-time' },
    activatedBy: { type: ['integer', 'null'] }, paymentReference: { type: ['string', 'null'] },
    paymentProvider: { type: ['string', 'null'] }, paymentAmount: { type: ['integer', 'null'] },
    paymentVerifiedAt: { type: ['string', 'null'], format: 'date-time' }, notes: { type: ['string', 'null'] },
    createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
    plan: inquiryPlanAdminResponseSchema,
    company: { anyOf: [{ type: 'object', required: ['id', 'name'], properties: { id: { type: 'integer' }, name: { type: 'string' } }, additionalProperties: true }, { type: 'null' }] },
    user: { anyOf: [{ type: 'object', properties: { id: { type: 'integer' }, phone: { type: ['string', 'null'] }, email: { type: ['string', 'null'] } }, additionalProperties: true }, { type: 'null' }] },
  },
};
const notificationDeliveryResponseSchema = {
  type: 'object', required: ['id', 'userId', 'eventType', 'channel', 'status', 'attempts', 'maxAttempts', 'nextAttemptAt', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'integer' }, userId: { type: 'integer' }, notificationId: { type: ['integer', 'null'] },
    eventType: { type: 'string' }, channel: { type: 'string', enum: ['IN_APP', 'EMAIL', 'SMS'] },
    status: { type: 'string', enum: ['PENDING', 'SENT', 'FAILED', 'SKIPPED'] },
    recipient: { type: ['string', 'null'] }, subject: { type: ['string', 'null'] }, body: { type: ['string', 'null'] },
    provider: { type: ['string', 'null'] }, attempts: { type: 'integer' }, maxAttempts: { type: 'integer' },
    nextAttemptAt: { type: 'string', format: 'date-time' }, lastError: { type: ['string', 'null'] },
    sentAt: { type: ['string', 'null'], format: 'date-time' }, dedupeKey: { type: ['string', 'null'] },
    createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
  },
};
const inquirySummaryRowResponseSchema = {
  type: 'object', required: ['id', 'title', 'status', 'createdAt', '_count'],
  properties: {
    id: { type: 'integer' }, title: { type: 'string' }, status: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    _count: { type: 'object', required: ['items', 'responses'], properties: { items: { type: 'integer' }, responses: { type: 'integer' } } },
  }, additionalProperties: true,
};
const inquiryStatsResponseSchema = {
  type: 'object', required: ['sent', 'received', 'responses', 'recentInquiries', 'recentResponses'],
  properties: {
    sent: { type: 'object', required: ['total', 'byStatus'], properties: { total: { type: 'integer' }, byStatus: { type: 'object', additionalProperties: { type: 'integer' } } } },
    received: { type: 'object', required: ['total', 'byStatus', 'new', 'closed'], properties: { total: { type: 'integer' }, byStatus: { type: 'object', additionalProperties: { type: 'integer' } }, new: { type: 'integer' }, closed: { type: 'integer' } } },
    responses: { type: 'object', required: ['total', 'byStatus', 'awaiting', 'selected', 'successRate'], properties: { total: { type: 'integer' }, byStatus: { type: 'object', additionalProperties: { type: 'integer' } }, awaiting: { type: 'integer' }, selected: { type: 'integer' }, successRate: { type: 'integer', minimum: 0, maximum: 100 } } },
    recentInquiries: { type: 'array', maxItems: 5, items: inquirySummaryRowResponseSchema },
    recentResponses: { type: 'array', maxItems: 5, items: { type: 'object', required: ['id', 'status', 'createdAt', 'inquiry', '_count'], properties: { id: { type: 'integer' }, status: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, company: { type: ['object', 'null'], additionalProperties: true }, inquiry: { type: 'object', additionalProperties: true }, _count: { type: 'object', properties: { items: { type: 'integer' } } } }, additionalProperties: true } },
  },
};
const inquiryListItemResponseSchema = {
  ...inquirySummaryRowResponseSchema,
  required: ['id', 'title', 'status', 'createdAt', 'company', '_count'],
  properties: {
    id: { type: 'integer' }, title: { type: 'string' }, status: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    company: { anyOf: [{ type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, type: { type: ['string', 'null'] } }, additionalProperties: true }, { type: 'null' }] },
    _count: { type: 'object', required: ['items'], properties: { items: { type: 'integer' }, responses: { type: 'integer' } } },
  }, additionalProperties: true,
};
const managedProductResponseSchema = {
  type: 'object', required: ['id', 'title', 'slug', 'status', 'visibility', 'companyId', 'categoryId', 'subcategoryId', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'integer' }, title: { type: 'string' }, slug: { type: 'string' },
    shortDescription: { type: ['string', 'null'] }, description: { type: ['string', 'null'] },
    sku: { type: ['string', 'null'] }, brand: { type: ['string', 'null'] }, model: { type: ['string', 'null'] },
    specifications: { type: ['object', 'array', 'null'] },
    status: { type: 'string' }, visibility: { type: 'string' }, isFeatured: { type: 'boolean' },
    companyId: { type: 'integer' }, categoryId: { type: 'integer' }, subcategoryId: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
    company: { type: 'object', additionalProperties: true }, category: { type: 'object', additionalProperties: true },
    subcategory: { type: 'object', additionalProperties: true }, prices: { type: 'array', items: { type: 'object', additionalProperties: true } },
    images: { type: 'array', items: { type: 'object', additionalProperties: true } }, documents: { type: 'array', items: { type: 'object', additionalProperties: true } },
  }, additionalProperties: true,
};

Object.assign(docs, {
  ['GET /api/v1/admin/inquiry-subscriptions']: {
    ...docs['GET /api/v1/admin/inquiry-subscriptions'],
    responses: { 200: { description: 'Up to 100 newest subscriptions, with the admin list plan, company and user projections.', type: 'object', required: ['data'], properties: { data: { type: 'array', maxItems: 100, items: inquirySubscriptionAdminResponseSchema } } } },
  },
  ['POST /api/v1/admin/inquiry-subscriptions/grant']: {
    ...docs['POST /api/v1/admin/inquiry-subscriptions/grant'],
    responses: { 201: { description: 'Manually granted active subscription with full plan and compact owner projections.', type: 'object', required: ['data'], properties: { data: inquirySubscriptionAdminResponseSchema } } },
  },
  ['POST /api/v1/admin/inquiry-subscriptions/:id/activate']: {
    ...docs['POST /api/v1/admin/inquiry-subscriptions/:id/activate'],
    responses: { 200: { description: 'Activated subscription after explicit staff confirmation for an offline payment.', type: 'object', required: ['data'], properties: { data: inquirySubscriptionAdminResponseSchema } } },
  },
  ['POST /api/v1/admin/inquiry-subscriptions/:id/reject']: {
    ...docs['POST /api/v1/admin/inquiry-subscriptions/:id/reject'],
    responses: { 200: { description: 'Cancelled pending subscription with plan and compact owner projections.', type: 'object', required: ['data'], properties: { data: inquirySubscriptionAdminResponseSchema } } },
  },
  ['GET /api/v1/admin/notifications/delivery-stats']: {
    ...docs['GET /api/v1/admin/notifications/delivery-stats'],
    responses: { 200: { description: 'Aggregate counts by status and channel, plus at most ten recent failures.', type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['total', 'byStatus', 'byChannel', 'recentFailures'], properties: {
      total: { type: 'integer' },
      byStatus: { type: 'object', required: ['PENDING', 'SENT', 'FAILED', 'SKIPPED'], properties: { PENDING: { type: 'integer' }, SENT: { type: 'integer' }, FAILED: { type: 'integer' }, SKIPPED: { type: 'integer' } } },
      byChannel: { type: 'object', required: ['IN_APP', 'EMAIL', 'SMS'], properties: { IN_APP: { type: 'integer' }, EMAIL: { type: 'integer' }, SMS: { type: 'integer' } } },
      recentFailures: { type: 'array', maxItems: 10, items: { type: 'object', required: ['id', 'eventType', 'channel', 'status', 'attempts', 'maxAttempts', 'createdAt'], properties: { id: { type: 'integer' }, eventType: { type: 'string' }, channel: { type: 'string', enum: ['IN_APP', 'EMAIL', 'SMS'] }, status: { type: 'string', enum: ['FAILED'] }, recipient: { type: ['string', 'null'] }, lastError: { type: ['string', 'null'] }, attempts: { type: 'integer' }, maxAttempts: { type: 'integer' }, nextAttemptAt: { type: 'string', format: 'date-time' }, createdAt: { type: 'string', format: 'date-time' } } } },
    } } } } },
  },
  ['GET /api/v1/admin/notifications/deliveries']: {
    ...docs['GET /api/v1/admin/notifications/deliveries'],
    responses: { 200: { description: 'Newest delivery rows with pagination metadata; rows are returned as persisted scalar NotificationDelivery fields.', type: 'object', required: ['data', 'meta'], properties: { data: { type: 'array', items: notificationDeliveryResponseSchema }, meta: { type: 'object', required: ['page', 'limit', 'total', 'totalPages'], properties: { page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' }, totalPages: { type: 'integer' } } } } } },
  },
  ['GET /api/v1/inquiries/stats']: {
    ...docs['GET /api/v1/inquiries/stats'],
    responses: { 200: { description: 'Caller-scoped sent/received/response aggregates and up to five recent inquiries/responses. CUSTOMER and COMPANY scopes differ; STAFF statistics are platform-wide.', type: 'object', required: ['data'], properties: { data: inquiryStatsResponseSchema } } },
  },
  ['GET /api/v1/inquiries']: {
    ...docs['GET /api/v1/inquiries'],
    responses: { 200: { description: 'Caller-scoped inquiry rows and pagination metadata. Confidential company identity and sealed response counts are redacted for supplier views when required.', type: 'object', required: ['data', 'meta'], properties: { data: { type: 'array', items: inquiryListItemResponseSchema }, meta: { type: 'object', required: ['page', 'limit', 'total', 'totalPages'], properties: { page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' }, totalPages: { type: 'integer' } } } } } },
  },
  ['GET /api/v1/products/my-products']: {
    ...docs['GET /api/v1/products/my-products'],
    responses: { 200: { description: 'Management product rows with pagination metadata; company users see only their own company and staff management contexts may span companies.', type: 'object', required: ['data', 'meta'], properties: { data: { type: 'array', items: managedProductResponseSchema }, meta: { type: 'object', required: ['page', 'limit', 'total', 'totalPages'], properties: { page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' }, totalPages: { type: 'integer' } } } } } },
  },
  ['GET /api/v1/products/:id/manage']: {
    ...docs['GET /api/v1/products/:id/manage'],
    responses: { 200: { description: 'Full management product projection, including relations used by authorized product editors.', type: 'object', required: ['data'], properties: { data: managedProductResponseSchema } } },
  },
});


// Company and category response contracts derived from service includes/selects.
const companyLimitResponseSchema = {
  type: 'object', required: ['id', 'companyId', 'key', 'value'],
  properties: { id: { type: 'integer' }, companyId: { type: 'integer' }, key: { type: 'string' }, value: { type: 'integer' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } },
};
const companyInquiryLimitResponseSchema = {
  type: 'object', required: ['id', 'companyId', 'maxOpenInquiries', 'maxActiveResponses'],
  properties: { id: { type: 'integer' }, companyId: { type: 'integer' }, maxOpenInquiries: { type: 'integer' }, maxActiveResponses: { type: 'integer' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } },
};
const companyUserSummaryResponseSchema = {
  type: 'object', required: ['id', 'type', 'isActive', 'status', 'createdAt'],
  properties: {
    id: { type: 'integer' }, email: { type: ['string', 'null'] }, status: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' }, type: { type: 'string' }, isActive: { type: 'boolean' },
    firstName: { type: ['string', 'null'] }, lastName: { type: ['string', 'null'] }, avatar: { type: ['string', 'null'] },
  },
};
const companyResponseSchema = {
  type: 'object', required: ['id', 'name', 'type', 'status', 'isVerified', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'integer' }, name: { type: 'string' }, nameEn: { type: ['string', 'null'] },
    nationalId: { type: ['string', 'null'] }, registrationNumber: { type: ['string', 'null'] },
    type: { type: ['string', 'null'], enum: ['MANUFACTURER', 'IMPORTER', 'TELECOM_OPERATOR', null] },
    description: { type: ['string', 'null'] }, logo: { type: ['string', 'null'] }, email: { type: ['string', 'null'] },
    phone: { type: ['string', 'null'] }, address: { type: ['string', 'null'] }, website: { type: ['string', 'null'] },
    status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'] }, isVerified: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' }, deletedAt: { type: ['string', 'null'], format: 'date-time' },
    _count: { type: 'object', properties: { products: { type: 'integer' }, accessProfiles: { type: 'integer' }, inquiries: { type: 'integer' } } },
    inquiryLimit: { anyOf: [companyInquiryLimitResponseSchema, { type: 'null' }] },
    limits: { type: 'array', items: companyLimitResponseSchema },
    users: { type: 'array', maxItems: 10, items: companyUserSummaryResponseSchema },
  }, additionalProperties: true,
};
const companySettingsResponseSchema = {
  type: 'object', required: ['inquiryLimit', 'limits'],
  properties: { inquiryLimit: { anyOf: [companyInquiryLimitResponseSchema, { type: 'null' }] }, limits: { type: 'array', items: companyLimitResponseSchema } },
};
const companyStatisticsResponseSchema = {
  type: 'object', required: ['counts', 'recentProducts', 'recentOrders'],
  properties: {
    counts: { type: 'object', required: ['products', 'publishedProducts', 'orders', 'pendingOrders', 'users', 'activeUsers'], properties: {
      products: { type: 'integer' }, publishedProducts: { type: 'integer' }, orders: { type: 'integer' }, pendingOrders: { type: 'integer' }, users: { type: 'integer' }, activeUsers: { type: 'integer' },
    } },
    recentProducts: { type: 'array', maxItems: 5, items: { type: 'object', required: ['id', 'title', 'status', 'createdAt'], properties: { id: { type: 'integer' }, title: { type: 'string' }, status: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' } } } },
    recentOrders: { type: 'array', maxItems: 5, items: { type: 'object', required: ['id', 'title', 'status', 'createdAt'], properties: { id: { type: 'integer' }, title: { type: 'string' }, status: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' } } } },
  },
};
const categorySubcategorySummaryResponseSchema = {
  type: 'object', required: ['id', 'slug', 'nameFa', 'nameEn', 'status', 'sortOrder'],
  properties: { id: { type: 'integer' }, categoryId: { type: 'integer' }, slug: { type: 'string' }, nameFa: { type: 'string' }, nameEn: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] }, sortOrder: { type: 'integer' } },
};
const categoryResponseSchema = {
  type: 'object', required: ['id', 'slug', 'nameFa', 'nameEn', 'status', 'showInMenu', 'sortOrder'],
  properties: {
    id: { type: 'integer' }, slug: { type: 'string' }, nameFa: { type: 'string' }, nameEn: { type: 'string' },
    image: { type: ['string', 'null'] }, status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
    showInMenu: { type: 'boolean' }, sortOrder: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
    subcategories: { type: 'array', items: categorySubcategorySummaryResponseSchema },
  }, additionalProperties: true,
};
const categorySubcategoryDetailResponseSchema = {
  ...categorySubcategorySummaryResponseSchema,
  properties: {
    ...categorySubcategorySummaryResponseSchema.properties,
    category: { type: 'object', additionalProperties: true },
    specificationTemplate: { anyOf: [{ type: 'object', properties: {
      id: { type: 'integer' }, subcategoryId: { type: 'integer' }, name: { type: 'string' }, description: { type: ['string', 'null'] }, isActive: { type: 'boolean' },
      fields: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, templateId: { type: 'integer' }, name: { type: 'string' }, key: { type: 'string' }, type: { type: 'string' }, isRequired: { type: 'boolean' }, unit: { type: ['string', 'null'] }, options: {}, sortOrder: { type: 'integer' } }, additionalProperties: true } },
    }, additionalProperties: true }, { type: 'null' }] },
  },
  additionalProperties: true,
};
const companyProductResponseSchema = {
  ...managedProductResponseSchema,
  properties: {
    ...managedProductResponseSchema.properties,
    category: { type: 'object', properties: { id: { type: 'integer' }, nameFa: { type: 'string' }, nameEn: { type: 'string' } }, additionalProperties: true },
    subcategory: { type: 'object', properties: { id: { type: 'integer' }, nameFa: { type: 'string' }, nameEn: { type: 'string' } }, additionalProperties: true },
    company: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } }, additionalProperties: true },
  },
};

Object.assign(docs, {
  ['GET /api/v1/companies']: {
    ...docs['GET /api/v1/companies'],
    responses: { 200: { description: 'Company rows with product/access-profile/inquiry counts and company inquiry limits, paginated.', type: 'object', required: ['data', 'meta'], properties: { data: { type: 'array', items: companyResponseSchema }, meta: paginationMetaResponseSchema } } },
  },
  ['GET /api/v1/companies/:id']: {
    ...docs['GET /api/v1/companies/:id'],
    responses: { 200: { description: 'Company details, counts, inquiry limits, ordered custom limits and up to ten flattened user summaries.', type: 'object', required: ['data'], properties: { data: companyResponseSchema } } },
  },
  ['POST /api/v1/companies']: {
    ...docs['POST /api/v1/companies'],
    responses: { 201: { description: 'Created company record.', type: 'object', required: ['data'], properties: { data: companyResponseSchema } } },
  },
  ['PATCH /api/v1/companies/:id']: {
    ...docs['PATCH /api/v1/companies/:id'],
    responses: { 200: { description: 'Updated company record.', type: 'object', required: ['data'], properties: { data: companyResponseSchema } } },
  },
  ['DELETE /api/v1/companies/:id']: {
    ...docs['DELETE /api/v1/companies/:id'],
    responses: { 204: { description: 'Company soft-deleted successfully; no response body.' } },
  },
  ['PATCH /api/v1/companies/:id/restore']: {
    ...docs['PATCH /api/v1/companies/:id/restore'],
    responses: { 200: { description: 'Restored company record.', type: 'object', required: ['data'], properties: { data: companyResponseSchema } } },
  },
  ['PATCH /api/v1/companies/:id/status']: {
    ...docs['PATCH /api/v1/companies/:id/status'],
    responses: { 200: { description: 'Company record with updated status.', type: 'object', required: ['data'], properties: { data: companyResponseSchema } } },
  },
  ['PATCH /api/v1/companies/:id/verify']: {
    ...docs['PATCH /api/v1/companies/:id/verify'],
    responses: { 200: { description: 'Company record with updated verification flag.', type: 'object', required: ['data'], properties: { data: companyResponseSchema } } },
  },
  ['PATCH /api/v1/companies/:id/logo']: {
    ...docs['PATCH /api/v1/companies/:id/logo'],
    responses: { 200: { description: 'Company record with updated logo path.', type: 'object', required: ['data'], properties: { data: companyResponseSchema } } },
  },
  ['GET /api/v1/companies/:id/settings']: {
    ...docs['GET /api/v1/companies/:id/settings'],
    responses: { 200: { description: 'Company inquiry limit and ordered key/value limits.', type: 'object', required: ['data'], properties: { data: companySettingsResponseSchema } } },
  },
  ['PATCH /api/v1/companies/:id/settings']: {
    ...docs['PATCH /api/v1/companies/:id/settings'],
    responses: { 200: { description: 'Updated company inquiry limit and ordered key/value limits.', type: 'object', required: ['data'], properties: { data: companySettingsResponseSchema } } },
  },
  ['GET /api/v1/companies/:id/statistics']: {
    ...docs['GET /api/v1/companies/:id/statistics'],
    responses: { 200: { description: 'Company dashboard counts and up to five recent products and inquiries.', type: 'object', required: ['data'], properties: { data: companyStatisticsResponseSchema } } },
  },
  ['GET /api/v1/companies/:id/products']: {
    ...docs['GET /api/v1/companies/:id/products'],
    responses: { 200: { description: 'Company products with compact category/subcategory/company projections and pagination metadata.', type: 'object', required: ['data', 'meta'], properties: { data: { type: 'array', items: companyProductResponseSchema }, meta: paginationMetaResponseSchema } } },
  },
  ['GET /api/v1/categories']: {
    ...docs['GET /api/v1/categories'],
    responses: successEnvelope({ type: 'array', items: categoryResponseSchema }, 'Active categories with active subcategory summaries returned successfully.'),
  },
  ['GET /api/v1/categories/manage']: {
    ...docs['GET /api/v1/categories/manage'],
    responses: successEnvelope({ type: 'array', items: categoryResponseSchema }, 'All categories, including inactive categories and subcategories, returned for staff management.'),
  },
  ['GET /api/v1/categories/:id']: {
    ...docs['GET /api/v1/categories/:id'],
    responses: successEnvelope(categoryResponseSchema, 'Active category with its subcategories returned successfully.'),
  },
  ['GET /api/v1/categories/:id/subcategories']: {
    ...docs['GET /api/v1/categories/:id/subcategories'],
    responses: successEnvelope({ type: 'array', items: categorySubcategorySummaryResponseSchema }, 'Active subcategories for the selected active category returned successfully.'),
  },
  ['GET /api/v1/categories/:id/subcategories/:subId']: {
    ...docs['GET /api/v1/categories/:id/subcategories/:subId'],
    responses: successEnvelope(categorySubcategoryDetailResponseSchema, 'Active subcategory with category and specification-template fields returned successfully.'),
  },
  ['GET /api/v1/categories/:id/products']: {
    ...docs['GET /api/v1/categories/:id/products'],
    responses: { 200: { description: 'Publicly published and public products in the category with pagination metadata.', type: 'object', required: ['data', 'meta'], properties: { data: { type: 'array', items: companyProductResponseSchema }, meta: paginationMetaResponseSchema } } },
  },
  ['POST /api/v1/categories']: {
    ...docs['POST /api/v1/categories'],
    responses: { 201: { description: 'Created category record.', type: 'object', required: ['data'], properties: { data: categoryResponseSchema } } },
  },
  ['PATCH /api/v1/categories/:id']: {
    ...docs['PATCH /api/v1/categories/:id'],
    responses: { 200: { description: 'Updated category record.', type: 'object', required: ['data'], properties: { data: categoryResponseSchema } } },
  },
  ['DELETE /api/v1/categories/:id']: {
    ...docs['DELETE /api/v1/categories/:id'],
    responses: { 204: { description: 'Category deleted successfully; no response body.' } },
  },
  ['POST /api/v1/categories/:id/subcategories']: {
    ...docs['POST /api/v1/categories/:id/subcategories'],
    responses: { 201: { description: 'Created subcategory record.', type: 'object', required: ['data'], properties: { data: categorySubcategoryDetailResponseSchema } } },
  },
  ['PATCH /api/v1/categories/:id/subcategories/:subId']: {
    ...docs['PATCH /api/v1/categories/:id/subcategories/:subId'],
    responses: { 200: { description: 'Updated subcategory record.', type: 'object', required: ['data'], properties: { data: categorySubcategoryDetailResponseSchema } } },
  },
  ['DELETE /api/v1/categories/:id/subcategories/:subId']: {
    ...docs['DELETE /api/v1/categories/:id/subcategories/:subId'],
    responses: { 204: { description: 'Subcategory deleted successfully; no response body.' } },
  },
});


// User, RBAC, authentication and personal-settings response contracts.
const safeAuthUserResponseSchema = {
  type: 'object', required: ['id', 'email', 'phone', 'status', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'integer' }, email: { type: ['string', 'null'] }, phone: { type: 'string' },
    status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'REJECTED'] },
    createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
  },
};
const profileResponseSchema = {
  type: 'object', required: ['id', 'firstName', 'lastName', 'avatar'],
  properties: {
    id: { type: 'integer' }, firstName: { type: ['string', 'null'] }, lastName: { type: ['string', 'null'] },
    avatar: { type: ['string', 'null'] }, metadata: {},
  }, additionalProperties: true,
};
const accessProfileResponseSchema = {
  type: 'object', required: ['id', 'type', 'companyId', 'isActive'],
  properties: {
    id: { type: 'integer' }, type: { type: 'string', enum: ['STAFF', 'COMPANY'] },
    companyId: { type: ['integer', 'null'] }, isActive: { type: 'boolean' },
    company: { anyOf: [{ type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, type: { type: ['string', 'null'] }, status: { type: 'string' } }, additionalProperties: true }, { type: 'null' }] },
  }, additionalProperties: true,
};
const permissionResponseSchema = {
  type: 'object', required: ['id', 'name', 'label', 'description', 'group', 'createdAt'],
  properties: {
    id: { type: 'integer' }, name: { type: 'string' }, label: { type: 'string' },
    description: { type: ['string', 'null'] }, group: { type: ['string', 'null'] },
    createdAt: { type: 'string', format: 'date-time' },
  },
};
const rolePermissionLinkResponseSchema = {
  type: 'object', required: ['permission'],
  properties: { permission: { type: 'object', required: ['id', 'name', 'label', 'group'], properties: { id: { type: 'integer' }, name: { type: 'string' }, label: { type: 'string' }, group: { type: ['string', 'null'] } } } },
};
const roleResponseSchema = {
  type: 'object', required: ['id', 'name', 'label', 'description', 'isSystem', 'scope', 'permissions', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'integer' }, name: { type: 'string' }, label: { type: 'string' },
    description: { type: ['string', 'null'] }, isSystem: { type: 'boolean' },
    scope: { type: 'string', enum: ['STAFF', 'COMPANY', 'CUSTOMER'] },
    permissions: { type: 'array', items: rolePermissionLinkResponseSchema },
    _count: { type: 'object', properties: { users: { type: 'integer' } } },
    createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
  },
};
const assignableRoleResponseSchema = {
  type: 'object', required: ['id', 'name', 'label', 'scope'],
  properties: { id: { type: 'integer' }, name: { type: 'string' }, label: { type: 'string' }, scope: { type: 'string', enum: ['STAFF', 'COMPANY', 'CUSTOMER'] } },
};
const userResponseSchema = {
  type: 'object', required: ['id', 'email', 'phone', 'status', 'createdAt', 'updatedAt', 'profile', 'accessProfile', 'roles', 'permissions'],
  properties: {
    ...safeAuthUserResponseSchema.properties,
    profile: { anyOf: [profileResponseSchema, { type: 'null' }] },
    accessProfile: { anyOf: [accessProfileResponseSchema, { type: 'null' }] },
    roles: { type: 'array', items: { anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }] } },
    permissions: { type: 'array', items: { anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }] } },
  }, additionalProperties: true,
};
const authContextResponseSchema = {
  type: 'object', required: ['user', 'profile', 'accessProfile', 'roles', 'permissions'],
  properties: {
    user: safeAuthUserResponseSchema,
    profile: { anyOf: [profileResponseSchema, { type: 'null' }] },
    accessProfile: { anyOf: [accessProfileResponseSchema, { type: 'null' }] },
    roles: { type: 'array', items: { type: 'string' } },
    permissions: { type: 'array', items: { type: 'string' } },
  },
};
const authTokensResponseSchema = {
  type: 'object', required: ['tokens'], properties: {
    tokens: { type: 'object', required: ['accessToken', 'expiresIn'], properties: { accessToken: { type: 'string' }, expiresIn: { type: 'integer' } } },
  },
};
const messageReceiptResponseSchema = {
  type: 'object', required: ['message'], properties: { message: { type: 'string' } },
};
const permissionListResponseSchema = {
  anyOf: [
    { type: 'array', items: permissionResponseSchema },
    { type: 'object', required: ['all', 'grouped'], properties: {
      all: { type: 'array', items: permissionResponseSchema },
      grouped: { type: 'object', additionalProperties: { type: 'array', items: permissionResponseSchema } },
    } },
  ],
};
const userProfileSettingsResponseSchema = {
  ...userResponseSchema,
  properties: {
    ...safeAuthUserResponseSchema.properties,
    profile: { anyOf: [profileResponseSchema, { type: 'null' }] },
    accessProfile: { anyOf: [{ ...accessProfileResponseSchema, properties: {
      ...accessProfileResponseSchema.properties,
      company: { anyOf: [{ type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, type: { type: ['string', 'null'] }, status: { type: 'string' } }, additionalProperties: true }, { type: 'null' }] },
    } }, { type: 'null' }] },
    roles: { type: 'array', items: { type: 'object', required: ['role'], properties: { role: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, label: { type: 'string' } }, additionalProperties: true } } } },
  },
};

Object.assign(docs, {
  ['GET /api/v1/users']: {
    ...docs['GET /api/v1/users'],
    responses: { 200: { description: 'Paginated users with safe identity/profile/access projections and role/permission name arrays. Password hashes are never selected.', type: 'object', required: ['data', 'meta'], properties: { data: { type: 'array', items: userResponseSchema }, meta: paginationMetaResponseSchema } } },
  },
  ['GET /api/v1/users/:id']: {
    ...docs['GET /api/v1/users/:id'],
    responses: successEnvelope(userResponseSchema, 'User details with safe identity/profile/access data and detailed role/permission records.'),
  },
  ['POST /api/v1/users']: {
    ...docs['POST /api/v1/users'],
    responses: { 201: { description: 'Created user with safe identity/profile/access data and detailed role/permission records.', type: 'object', required: ['data'], properties: { data: userResponseSchema } } },
  },
  ['PATCH /api/v1/users/:id']: {
    ...docs['PATCH /api/v1/users/:id'],
    responses: successEnvelope(userResponseSchema, 'Updated user with safe identity/profile/access data and detailed role/permission records.'),
  },
  ['PATCH /api/v1/users/:id/access']: {
    ...docs['PATCH /api/v1/users/:id/access'],
    responses: successEnvelope(userResponseSchema, 'Updated role assignment and resulting detailed user access context. Direct permission IDs are not persisted.'),
  },
  ['PATCH /api/v1/users/:id/access-active']: {
    ...docs['PATCH /api/v1/users/:id/access-active'],
    responses: successEnvelope(userResponseSchema, 'Updated access-profile active state and resulting detailed user access context.'),
  },
  ['PATCH /api/v1/users/:id/company']: {
    ...docs['PATCH /api/v1/users/:id/company'],
    responses: successEnvelope(userResponseSchema, 'Moved user to the selected company and returned the resulting detailed access context.'),
  },
  ['DELETE /api/v1/users/:id']: {
    ...docs['DELETE /api/v1/users/:id'],
    responses: successEnvelope(messageReceiptResponseSchema, 'User deletion receipt.'),
  },
  ['GET /api/v1/roles']: {
    ...docs['GET /api/v1/roles'],
    responses: {
      200: { description: 'Role list: a success-wrapped array when unpaginated, or data/meta when page/limit is supplied.', anyOf: [
        { type: 'object', required: ['data'], properties: { data: { type: 'array', items: roleResponseSchema } } },
        { type: 'object', required: ['data', 'meta'], properties: { data: { type: 'array', items: roleResponseSchema }, meta: paginationMetaResponseSchema } },
      ] },
    },
  },
  ['GET /api/v1/roles/assignable']: {
    ...docs['GET /api/v1/roles/assignable'],
    responses: successEnvelope({ type: 'array', items: assignableRoleResponseSchema }, 'Roles scoped to the caller access type, limited to id/name/label/scope.'),
  },
  ['GET /api/v1/roles/:id']: {
    ...docs['GET /api/v1/roles/:id'],
    responses: successEnvelope(roleResponseSchema, 'Role details with permission links and assigned-user count.'),
  },
  ['POST /api/v1/roles']: {
    ...docs['POST /api/v1/roles'],
    responses: { 201: { description: 'Created role with permission links and assigned-user count.', type: 'object', required: ['data'], properties: { data: roleResponseSchema } } },
  },
  ['PATCH /api/v1/roles/:id']: {
    ...docs['PATCH /api/v1/roles/:id'],
    responses: successEnvelope(roleResponseSchema, 'Updated role with permission links and assigned-user count.'),
  },
  ['DELETE /api/v1/roles/:id']: {
    ...docs['DELETE /api/v1/roles/:id'],
    responses: successEnvelope(messageReceiptResponseSchema, 'Role deletion receipt.'),
  },
  ['GET /api/v1/permissions']: {
    ...docs['GET /api/v1/permissions'],
    responses: {
      200: { description: 'Permission list: success-wrapped array, success-wrapped all/grouped object, or paginated data/meta depending on query options.', anyOf: [
        { type: 'object', required: ['data'], properties: { data: permissionListResponseSchema } },
        { type: 'object', required: ['data', 'meta'], properties: { data: { type: 'array', items: permissionResponseSchema }, meta: paginationMetaResponseSchema } },
      ] },
    },
  },
  ['GET /api/v1/permissions/:id']: {
    ...docs['GET /api/v1/permissions/:id'],
    responses: successEnvelope(permissionResponseSchema, 'Permission record returned successfully.'),
  },
  ['POST /api/v1/permissions']: {
    ...docs['POST /api/v1/permissions'],
    responses: { 201: { description: 'Created permission record.', type: 'object', required: ['data'], properties: { data: permissionResponseSchema } } },
  },
  ['PATCH /api/v1/permissions/:id']: {
    ...docs['PATCH /api/v1/permissions/:id'],
    responses: successEnvelope(permissionResponseSchema, 'Updated permission record.'),
  },
  ['DELETE /api/v1/permissions/:id']: {
    ...docs['DELETE /api/v1/permissions/:id'],
    responses: successEnvelope(messageReceiptResponseSchema, 'Permission deletion receipt.'),
  },
  ['POST /api/v1/auth/login']: {
    ...docs['POST /api/v1/auth/login'],
    responses: { 200: { description: 'Authenticated user context and access token. Refresh token is set only in the httpOnly cookie and is never returned in the JSON body.', type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['tokens', 'user', 'profile', 'accessProfile', 'roles', 'permissions'], properties: {
      tokens: authTokensResponseSchema.properties.tokens, user: safeAuthUserResponseSchema,
      profile: { anyOf: [profileResponseSchema, { type: 'null' }] },
      accessProfile: { anyOf: [accessProfileResponseSchema, { type: 'null' }] },
      roles: { type: 'array', items: { type: 'string' } }, permissions: { type: 'array', items: { type: 'string' } },
    } } } },
  },
  ['POST /api/v1/auth/refresh']: {
    ...docs['POST /api/v1/auth/refresh'],
    responses: successEnvelope(authTokensResponseSchema.properties, 'Rotated access token; rotated refresh token is set only in the httpOnly cookie.'),
  },
  ['POST /api/v1/auth/logout']: {
    ...docs['POST /api/v1/auth/logout'],
    responses: successEnvelope(messageReceiptResponseSchema, 'Current refresh session revoked and cookie cleared.'),
  },
  ['POST /api/v1/auth/logout-all']: {
    ...docs['POST /api/v1/auth/logout-all'],
    responses: successEnvelope(messageReceiptResponseSchema, 'All refresh sessions revoked and current cookie cleared.'),
  },
  ['GET /api/v1/auth/me']: {
    ...docs['GET /api/v1/auth/me'],
    responses: successEnvelope(authContextResponseSchema, 'Current authenticated user context without password or refresh-token secrets.'),
  },
  ['PATCH /api/v1/auth/users/:id/password']: {
    ...docs['PATCH /api/v1/auth/users/:id/password'],
    responses: successEnvelope(messageReceiptResponseSchema, 'Administrative password-reset receipt.'),
  },
  ['POST /api/v1/auth/register']: {
    ...docs['POST /api/v1/auth/register'],
    responses: { 201: { description: 'Registered customer account. No AccessProfile is created for CUSTOMER users; roles contains the CUSTOMER_USER role name.', type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['message', 'user', 'profile', 'accessProfile', 'roles'], properties: {
      message: { type: 'string' }, user: safeAuthUserResponseSchema, profile: profileResponseSchema,
      accessProfile: { type: 'null' }, roles: { type: 'array', items: { type: 'string' } },
    } } } },
  },
  ['POST /api/v1/auth/register-company']: {
    ...docs['POST /api/v1/auth/register-company'],
    responses: { 201: { description: 'Pending company and manager registration. Company manager access profile is inactive until staff approval; no role is granted in this response.', type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['message', 'company', 'user', 'accessProfile'], properties: {
      message: { type: 'string' }, company: companyResponseSchema, user: safeAuthUserResponseSchema, accessProfile: accessProfileResponseSchema,
    } } } },
  },
  ['POST /api/v1/auth/handoff']: {
    ...docs['POST /api/v1/auth/handoff'],
    responses: { 201: { description: 'One-time PKCE-bound handoff code valid for 60 seconds. No access or refresh token is returned.', type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['code', 'expiresIn'], properties: { code: { type: 'string' }, expiresIn: { type: 'integer', enum: [60] } } } } },
  },
  ['POST /api/v1/auth/handoff/redeem']: {
    ...docs['POST /api/v1/auth/handoff/redeem'],
    responses: { 200: { description: 'Fresh access token and authenticated context; refresh token is set only in the httpOnly cookie.', type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['user', 'profile', 'accessProfile', 'roles', 'permissions', 'tokens'], properties: {
      ...authContextResponseSchema.properties, tokens: authTokensResponseSchema.properties.tokens,
    } } } },
  },
  ['GET /api/v1/settings/profile']: {
    ...docs['GET /api/v1/settings/profile'],
    responses: successEnvelope(userProfileSettingsResponseSchema, 'Current user identity, personal profile, access profile, company summary and role links.'),
  },
  ['PATCH /api/v1/settings/profile']: {
    ...docs['PATCH /api/v1/settings/profile'],
    responses: successEnvelope(userProfileSettingsResponseSchema, 'Updated current user profile and unchanged safe identity/access projections.'),
  },
  ['POST /api/v1/settings/profile/avatar']: {
    ...docs['POST /api/v1/settings/profile/avatar'],
    responses: successEnvelope({ type: 'object', required: ['avatarUrl'], properties: { avatarUrl: { type: 'string' } } }, 'Uploaded avatar path returned successfully.'),
  },
  ['DELETE /api/v1/settings/profile/avatar']: {
    ...docs['DELETE /api/v1/settings/profile/avatar'],
    responses: successEnvelope(messageReceiptResponseSchema, 'Avatar deletion receipt.'),
  },
  ['PATCH /api/v1/settings/change-password']: {
    ...docs['PATCH /api/v1/settings/change-password'],
    responses: successEnvelope(messageReceiptResponseSchema, 'Password changed and existing refresh sessions revoked.'),
  },
  ['GET /api/v1/admin/stats']: {
    ...docs['GET /api/v1/admin/stats'],
    responses: { 200: { description: 'Admin dashboard totals, up to five recent users and up to twenty pending products with compact creator/company/category projections.', type: 'object', required: ['data'], properties: { data: { type: 'object', required: ['counts', 'recentUsers', 'pendingProducts'], properties: {
      counts: { type: 'object', required: ['users', 'activeUsers', 'companies', 'products', 'pendingProducts', 'orders', 'roles', 'permissions'], properties: {
        users: { type: 'integer' }, activeUsers: { type: 'integer' }, companies: { type: 'integer' }, products: { type: 'integer' }, pendingProducts: { type: 'integer' }, orders: { type: 'integer' }, roles: { type: 'integer' }, permissions: { type: 'integer' },
      } },
      recentUsers: { type: 'array', maxItems: 5, items: { type: 'object', required: ['id', 'email', 'status', 'createdAt', 'profile'], properties: { id: { type: 'integer' }, email: { type: ['string', 'null'] }, status: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' }, profile: { anyOf: [{ type: 'object', properties: { firstName: { type: ['string', 'null'] }, lastName: { type: ['string', 'null'] } }, { type: 'null' }] } } } },
      pendingProducts: { type: 'array', maxItems: 20, items: { type: 'object', required: ['id', 'title', 'status', 'company', 'category', 'subcategory', 'createdBy'], properties: {
        id: { type: 'integer' }, title: { type: 'string' }, status: { type: 'string' },
        company: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } },
        category: { type: 'object', properties: { id: { type: 'integer' }, nameFa: { type: 'string' } } },
        subcategory: { type: 'object', properties: { id: { type: 'integer' }, nameFa: { type: 'string' } } },
        createdBy: { type: 'object', properties: { id: { type: 'integer' }, email: { type: ['string', 'null'] }, profile: { anyOf: [{ type: 'object', properties: { firstName: { type: ['string', 'null'] }, lastName: { type: ['string', 'null'] } } }, { type: 'null' }] } } },
      }, additionalProperties: true } },
    } } } },
  },
  ['GET /api/v1/admin/settings']: {
    ...docs['GET /api/v1/admin/settings'],
    responses: successEnvelope({ type: 'object', required: ['productReviewEditThreshold'], properties: { productReviewEditThreshold: { type: 'integer', minimum: 1 } } }, 'Admin-managed product review threshold setting.'),
  },
  ['PATCH /api/v1/admin/settings/product-review-threshold']: {
    ...docs['PATCH /api/v1/admin/settings/product-review-threshold'],
    responses: successEnvelope({ type: 'object', required: ['productReviewEditThreshold'], properties: { productReviewEditThreshold: { type: 'integer', minimum: 1 } } }, 'Updated admin-managed product review threshold setting.'),
  },
});

module.exports = docs;