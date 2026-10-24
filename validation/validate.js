const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const toValidate = {};
  if (schema.body) toValidate.body = req.body;
  if (schema.params) toValidate.params = req.params;
  if (schema.query) toValidate.query = req.query;

  const validationSchema = Joi.object(schema);

  const { error, value } = validationSchema.validate(toValidate, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(400).json({
      success: false,
      message: errors.join(', '),
      errors,
    });
  }

  if (value.body) req.body = value.body;
  if (value.params) req.params = value.params;
  if (value.query) req.query = value.query;

  next();
};

module.exports = validate;
