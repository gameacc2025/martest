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
  'GET /api/v1/categories': { summary: 'List categories', description: 'Lists categories. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Categories'], responses: resourceResponse('Categories returned successfully.') },
  'GET /api/v1/categories/:id': { summary: 'Get category by ID', description: 'Returns a category by numeric ID. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Categories'], params: idParam(), responses: resourceResponse('Category returned successfully.') },
  'GET /api/v1/categories/:id/products': { summary: 'Get category products', description: 'Returns products in a category. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Categories'], params: idParam(), responses: resourceResponse('Category products returned successfully.') },
  'POST /api/v1/categories': { summary: 'Create category', description: 'Creates a category. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN role.', tags: ['Categories'], permission: 'SUPER_ADMIN role', responses: createdResponse('Category created successfully.') },
  'PATCH /api/v1/categories/:id': { summary: 'Update category', description: 'Updates a category. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN role.', tags: ['Categories'], permission: 'SUPER_ADMIN role', params: idParam(), responses: resourceResponse('Category updated successfully.') },
  'DELETE /api/v1/categories/:id': { summary: 'Delete category', description: 'Deletes a category. Authentication required: Bearer JWT. Permission required: SUPER_ADMIN role.', tags: ['Categories'], permission: 'SUPER_ADMIN role', params: idParam(), responses: messageResponse('Category deleted successfully.') },
});

Object.assign(docs, {
  'GET /api/v1/products': { summary: 'List products', description: 'Lists products. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Products'], querystring: paginationQuery, responses: paginatedResponse('Products returned successfully.') },
  'GET /api/v1/products/:id': { summary: 'Get product by ID', description: 'Returns a product by numeric ID. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Products'], params: idParam(), responses: resourceResponse('Product returned successfully.') },
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
    tags: ['Addresses'], params: idParam(), responses: messageResponse('Customer address deleted successfully.'),
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
    tags: ['Categories'], permission: 'categories.delete', params: twoIdParams('id', 'subId'), responses: messageResponse('Subcategory deleted successfully.'),
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

module.exports = docs;