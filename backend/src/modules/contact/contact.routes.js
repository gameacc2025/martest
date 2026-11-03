const contactService = require('./contact.service');

const contactMessageBody = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'email', 'subject', 'message'],
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 120, pattern: '.*\\S.*' },
    email: { type: 'string', format: 'email', maxLength: 254 },
    phone: { type: 'string', maxLength: 30 },
    subject: {
      type: 'string',
      enum: ['product_question', 'order_issue', 'partnership', 'bug_report', 'general_question'],
    },
    message: { type: 'string', minLength: 10, maxLength: 5000, pattern: '.*\\S.*' },
  },
};

async function contactRoutes(fastify) {
  fastify.post('/messages', {
    config: {
      rateLimit: { max: 3, timeWindow: '10 minutes' },
    },
    schema: {
      summary: 'Send a public contact message to the configured support inbox',
      tags: ['Contact'],
      security: [],
      body: contactMessageBody,
      response: {
        200: {
          type: 'object',
          properties: { success: { type: 'boolean' } },
          required: ['success'],
        },
      },
    },
  }, async (request, reply) => {
    const payload = {
      name: request.body.name.trim(),
      email: request.body.email.trim().toLowerCase(),
      phone: request.body.phone?.trim() || '',
      subject: request.body.subject,
      message: request.body.message.trim(),
    };

    await contactService.sendContactMessage(payload);
    return reply.code(200).send({ success: true });
  });
}

module.exports = contactRoutes;
