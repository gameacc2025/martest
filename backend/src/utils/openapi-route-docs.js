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
    permission: 'Authenticated refresh token',
    responses: { 200: { description: 'New access token issued.', $ref: '#/components/schemas/AuthTokens' } },
  },
  'POST /api/v1/auth/logout': {
    summary: 'Logout current device',
    description: 'Revokes the current refresh token and clears the refresh cookie. Authentication required: refresh token cookie. Permission required: authenticated session.',
    tags: ['Authentication'],
    permission: 'Authenticated refresh token',
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
  'GET /api/v1/settings/preferences': { summary: 'Get preferences', description: 'Returns the authenticated user preferences. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Settings'], responses: resourceResponse('Preferences returned successfully.') },
  'PATCH /api/v1/settings/preferences': { summary: 'Update preferences', description: 'Updates the authenticated user preferences. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Settings'], responses: resourceResponse('Preferences updated successfully.') },

  'GET /api/v1/orders/me': { summary: 'Get my recent orders', description: 'Returns recent orders for the authenticated user. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Orders'], responses: resourceResponse('Recent orders returned successfully.') },
  'GET /api/v1/orders/me/stats': { summary: 'Get my order statistics', description: 'Returns order statistics for the authenticated user. Authentication required: Bearer JWT. Permission required: authenticated user.', tags: ['Orders'], responses: resourceResponse('Order statistics returned successfully.') },
  'GET /api/v1/orders': { summary: 'List orders', description: 'Lists orders for administrative management. Authentication required: Bearer JWT. Permission required: orders.read.', tags: ['Orders'], permission: 'orders.read', querystring: paginationQuery, responses: paginatedResponse('Orders returned successfully.') },
  'POST /api/v1/orders': { summary: 'Create order', description: 'Creates a new order. Authentication required: Bearer JWT. Permission required: orders.create.', tags: ['Orders'], permission: 'orders.create', responses: createdResponse('Order created successfully.') },
  'GET /api/v1/orders/:id': { summary: 'Get order by ID', description: 'Returns an order by numeric ID. Authentication required: Bearer JWT. Permission required: orders.read.', tags: ['Orders'], permission: 'orders.read', params: idParam(), responses: resourceResponse('Order returned successfully.') },
  'PUT /api/v1/orders/:id': { summary: 'Update order', description: 'Updates an order by numeric ID. Authentication required: Bearer JWT. Permission required: orders.update.', tags: ['Orders'], permission: 'orders.update', params: idParam(), responses: resourceResponse('Order updated successfully.') },
  'DELETE /api/v1/orders/:id': { summary: 'Delete order', description: 'Deletes an order by numeric ID. Authentication required: Bearer JWT. Permission required: orders.delete.', tags: ['Orders'], permission: 'orders.delete', params: idParam(), responses: messageResponse('Order deleted successfully.') },
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

module.exports = docs;