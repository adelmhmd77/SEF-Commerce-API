const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const toValidate = {};
  const sections = ['body', 'params', 'query'];

  sections.forEach((section) => {
    if (schema[section]) toValidate[section] = req[section];
  });

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

  sections.forEach((section) => {
    if (!schema[section]) return;

    if (section === 'query') {
      Object.defineProperty(req, section, {
        configurable: true,
        enumerable: true,
        value: value[section],
        writable: true,
      });
      return;
    }

    req[section] = value[section];
  });

  next();
};

module.exports = validate;
