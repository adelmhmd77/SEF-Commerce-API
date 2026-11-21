const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const User = require('../models/User.model');
const OTP = require('../models/OTP.model');
const validate = require('../middleware/validate');
const { adminOnly } = require('../middleware/role.middleware');
const { updateProfileSchema } = require('../validation/user.validation');
const authSchemas = require('../validation/auth.validation');
const { updateProfile } = require('../controllers/user.controller');
const { generateOTP } = require('../utils/generateOTP');

const tests = [];
const test = (name, run) => tests.push({ name, run });

const createResponse = () => ({
  statusCode: undefined,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const createRequest = ({ body = {}, headers = {}, user } = {}) => ({
  body,
  headers,
  params: {},
  query: {},
  user,
});

const runValidation = (schema, body) => {
  const req = createRequest({ body });
  const res = createResponse();
  let continued = false;

  validate(schema)(req, res, () => {
    continued = true;
  });

  return { req, res, continued };
};

const withOverrides = async (target, overrides, run) => {
  const originals = new Map(
    Object.keys(overrides).map((key) => [key, target[key]])
  );
  Object.assign(target, overrides);

  try {
    return await run();
  } finally {
    for (const [key, value] of originals) target[key] = value;
  }
};

const callMiddleware = async (middleware, req) => {
  const res = createResponse();
  let continued = false;
  let error;

  await middleware(req, res, (nextError) => {
    if (nextError) error = nextError;
    else continued = true;
  });

  return { req, res, continued, error };
};

const originalEnv = {
  JWT_SECRET: process.env.JWT_SECRET,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
};
process.env.JWT_SECRET = 'local-test-secret';

const userId = '507f1f77bcf86cd799439011';
const validAuthBodies = {
  registerSchema: {
    username: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  },
  verifyOtpSchema: { email: 'test@example.com', otp: '123456' },
  loginSchema: { email: 'test@example.com', password: 'password123' },
  forgotPasswordSendOtpSchema: { email: 'test@example.com' },
  forgotPasswordVerifyOtpSchema: {
    email: 'test@example.com',
    otp: '123456',
    newPassword: 'newpassword123',
  },
};

const otpPath = require.resolve('../utils/generateOTP');
const emailPath = require.resolve('../utils/sendEmail');
const authControllerPath = require.resolve('../controllers/auth.controller');
const originalOtpModule = require.cache[otpPath];
const originalEmailModule = require.cache[emailPath];
const originalAuthControllerModule = require.cache[authControllerPath];

let sentEmail;
let generatedOtp = '042681';
require.cache[otpPath] = {
  id: otpPath,
  filename: otpPath,
  loaded: true,
  exports: { generateOTP: () => generatedOtp },
};
require.cache[emailPath] = {
  id: emailPath,
  filename: emailPath,
  loaded: true,
  exports: {
    sendEmail: async (message) => {
      sentEmail = message;
    },
  },
};
delete require.cache[authControllerPath];
const authController = require('../controllers/auth.controller');

if (originalOtpModule) require.cache[otpPath] = originalOtpModule;
else delete require.cache[otpPath];
if (originalEmailModule) require.cache[emailPath] = originalEmailModule;
else delete require.cache[emailPath];
if (originalAuthControllerModule) {
  require.cache[authControllerPath] = originalAuthControllerModule;
}

test('generateOTP returns six numeric characters', () => {
  for (let index = 0; index < 1000; index += 1) {
    assert.match(generateOTP(), /^\d{6}$/);
  }
});

test('sendEmail uses the configured secure mode and forwards message fields', async () => {
  const originalCreateTransport = nodemailer.createTransport;
  const originalModule = require.cache[emailPath];

  try {
    for (const [port, secure] of [
      ['587', false],
      ['465', true],
    ]) {
      process.env.EMAIL_HOST = 'smtp.example.test';
      process.env.EMAIL_PORT = port;
      process.env.EMAIL_USER = 'sender@example.test';
      process.env.EMAIL_PASS = 'test-only-password';

      let config;
      let message;
      nodemailer.createTransport = (transportConfig) => {
        config = transportConfig;
        return {
          sendMail: async (mail) => {
            message = mail;
            return { accepted: [mail.to] };
          },
        };
      };
      delete require.cache[emailPath];
      const { sendEmail } = require(emailPath);
      await sendEmail({
        to: 'recipient@example.test',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      assert.equal(config.host, 'smtp.example.test');
      assert.equal(config.port, Number(port));
      assert.equal(config.secure, secure);
      assert.equal(message.from, 'sender@example.test');
      assert.equal(message.to, 'recipient@example.test');
      assert.equal(message.subject, 'Test');
      assert.equal(message.html, '<p>Test</p>');
    }
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    if (originalModule) require.cache[emailPath] = originalModule;
    else delete require.cache[emailPath];
  }
});

test('sendEmail propagates transport failures', async () => {
  const originalCreateTransport = nodemailer.createTransport;
  const originalModule = require.cache[emailPath];
  const deliveryError = new Error('SMTP delivery failed');

  try {
    process.env.EMAIL_HOST = 'smtp.example.test';
    process.env.EMAIL_PORT = '587';
    process.env.EMAIL_USER = 'sender@example.test';
    process.env.EMAIL_PASS = 'test-only-password';
    nodemailer.createTransport = () => ({
      sendMail: async () => {
        throw deliveryError;
      },
    });
    delete require.cache[emailPath];
    const { sendEmail } = require(emailPath);

    await assert.rejects(
      sendEmail({ to: 'recipient@example.test', subject: 'Test', html: '<p>Test</p>' }),
      deliveryError
    );
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    if (originalModule) require.cache[emailPath] = originalModule;
    else delete require.cache[emailPath];
  }
});

test('all auth schemas accept valid payloads and reject invalid payloads', () => {
  for (const [name, schema] of Object.entries(authSchemas)) {
    assert.equal(typeof schema.validate, 'function', `${name} must be a Joi schema`);
    assert.equal(schema.validate(validAuthBodies[name]).error, undefined, name);
    assert.ok(schema.validate({}).error, `${name} must reject an empty body`);
  }

  assert.ok(authSchemas.verifyOtpSchema.validate({
    email: 'test@example.com',
    otp: '12x456',
  }).error);
  assert.ok(authSchemas.registerSchema.validate({
    ...validAuthBodies.registerSchema,
    password: 'short',
  }).error);
});

test('validate supports direct Joi schemas and section-based schemas', () => {
  const direct = runValidation(updateProfileSchema, { username: 'Valid User' });
  assert.equal(direct.continued, true);

  const sectionBased = runValidation(
    { body: authSchemas.verifyOtpSchema },
    validAuthBodies.verifyOtpSchema
  );
  assert.equal(sectionBased.continued, true);

  const invalid = runValidation(authSchemas.verifyOtpSchema, {
    email: 'test@example.com',
    otp: '123',
  });
  assert.equal(invalid.continued, false);
  assert.equal(invalid.res.statusCode, 400);
});

test('protect accepts a valid token and excludes the password', async () => {
  const { protect } = require('../middleware/auth.middleware');
  const user = { _id: userId, role: 'customer' };
  await withOverrides(User, {
    findById: () => ({ select: async (fields) => {
      assert.equal(fields, '-password');
      return user;
    } }),
  }, async () => {
    const token = jwt.sign({ id: userId, role: 'customer' }, process.env.JWT_SECRET);
    const result = await callMiddleware(protect, createRequest({
      headers: { authorization: `Bearer ${token}` },
    }));

    assert.equal(result.continued, true);
    assert.equal(result.req.user, user);
    assert.equal(Object.hasOwn(result.req.user, 'password'), false);
  });
});

test('protect rejects missing, malformed, expired, invalid, and deleted-user tokens', async () => {
  const { protect } = require('../middleware/auth.middleware');
  const findById = (id) => ({
    select: async () => (id === userId ? { _id: userId } : null),
  });

  await withOverrides(User, { findById }, async () => {
    const cases = [
      [undefined, 'Not authorized, no token'],
      ['Bearer not-a-token', 'Invalid token'],
      [
        `Bearer ${jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: -1 })}`,
        'Token has expired',
      ],
      [
        `Bearer ${jwt.sign({ id: 'invalid-id' }, process.env.JWT_SECRET)}`,
        'Invalid token',
      ],
      [
        `Bearer ${jwt.sign({ id: '507f191e810c19729de860ea' }, process.env.JWT_SECRET)}`,
        'The user belonging to this token no longer exists',
      ],
    ];

    for (const [authorization, message] of cases) {
      const result = await callMiddleware(
        protect,
        createRequest({ headers: authorization ? { authorization } : {} })
      );
      assert.equal(result.continued, false);
      assert.equal(result.res.statusCode, 401);
      assert.equal(result.res.body.message, message);
    }
  });
});

test('adminOnly denies customers and allows admins', () => {
  const customerResponse = createResponse();
  let customerContinued = false;
  adminOnly({ user: { role: 'customer' } }, customerResponse, () => {
    customerContinued = true;
  });
  assert.equal(customerResponse.statusCode, 403);
  assert.equal(customerContinued, false);

  let adminContinued = false;
  adminOnly({ user: { role: 'admin' } }, createResponse(), () => {
    adminContinued = true;
  });
  assert.equal(adminContinued, true);
});

test('registration stores a hashed OTP, sends it, and returns no secrets', async () => {
  let savedOtp;
  let emailSent;
  await withOverrides(User, {
    findOne: async () => null,
  }, async () => withOverrides(OTP, {
    deleteMany: async ({ email }) => assert.equal(email, 'test@example.com'),
    create: async (document) => {
      savedOtp = document;
      return { _id: 'otp-register' };
    },
  }, async () => {
    sentEmail = undefined;
    const result = await invokeController(authController.sendRegisterOTP, {
      email: ' Test@Example.com ',
      username: 'Test User',
      password: 'plain-registration-password',
      phone: '123456',
    });
    emailSent = sentEmail;

    assert.equal(result.res.statusCode, 200);
    assert.equal(savedOtp.email, 'test@example.com');
    assert.equal(savedOtp.userData.email, 'test@example.com');
    assert.equal(savedOtp.userData.password, 'plain-registration-password');
    assert.notEqual(savedOtp.otp, generatedOtp);
    assert.equal(await bcrypt.compare(generatedOtp, savedOtp.otp), true);
    assert.match(emailSent.html, new RegExp(generatedOtp));
    assert.equal(JSON.stringify(result.res.body).includes(generatedOtp), false);
    assert.equal(JSON.stringify(result.res.body).includes('plain-registration-password'), false);
  }));
});

test('registration rejects an existing email and removes OTP if email sending fails', async () => {
  await withOverrides(User, {
    findOne: async () => ({ _id: userId }),
  }, async () => {
    let otpCreated = false;
    await withOverrides(OTP, {
      deleteMany: async () => {},
      create: async () => {
        otpCreated = true;
        return { _id: 'should-not-exist' };
      },
    }, async () => {
      const result = await invokeController(authController.sendRegisterOTP, {
        email: 'test@example.com',
        username: 'Test User',
        password: 'password123',
      });
      assert.equal(result.res.statusCode, 409);
      assert.equal(otpCreated, false);
    });
  });

  await withOverrides(User, { findOne: async () => null }, async () => {
    let deletedId;
    let nextError;
    await withOverrides(OTP, {
      deleteMany: async () => {},
      create: async () => ({ _id: 'otp-failed-email' }),
      deleteOne: async ({ _id }) => {
        deletedId = _id;
      },
    }, async () => withAuthEmail(async (controller) => {
      await controller.sendRegisterOTP(
        createRequest({ body: {
          email: 'test@example.com',
          username: 'Test User',
          password: 'password123',
        } }),
        createResponse(),
        (error) => { nextError = error; }
      );
    }));
    assert.equal(deletedId, 'otp-failed-email');
    assert.equal(nextError.message, 'mail failure');
  });
});

test('OTP verification creates a verified user and deletes the OTP', async () => {
  const otpHash = await bcrypt.hash('123456', 4);
  let createdUserData;
  let deletedId;

  await withOverrides(OTP, {
    findOne: async () => ({
      _id: 'otp-verified',
      email: 'test@example.com',
      otp: otpHash,
      expiresAt: new Date(Date.now() + 60_000),
      userData: { username: 'Test User', email: 'test@example.com', password: 'plain-password' },
    }),
    deleteOne: async ({ _id }) => { deletedId = _id; },
  }, async () => withOverrides(User, {
    findOne: async () => null,
    create: async (userData) => {
      createdUserData = userData;
      return {
        toObject: () => ({ ...userData, _id: userId, password: 'hashed-password' }),
      };
    },
  }, async () => {
    const result = await invokeController(authController.verifyRegisterOTP, {
      email: ' TEST@example.com ',
      otp: '123456',
    });

    assert.equal(result.res.statusCode, 201);
    assert.equal(createdUserData.isVerified, true);
    assert.equal(createdUserData.password, 'plain-password');
    assert.equal(deletedId, 'otp-verified');
    assert.equal(Object.hasOwn(result.res.body.user, 'password'), false);
  }));
});

test('OTP verification rejects missing, expired, and incorrect codes', async () => {
  const validOtpHash = await bcrypt.hash('123456', 4);
  const cases = [
    [null, '123456'],
    [{
      _id: 'expired',
      otp: validOtpHash,
      expiresAt: new Date(Date.now() - 1000),
      userData: { email: 'test@example.com' },
    }, '123456'],
    [{
      _id: 'wrong-code',
      otp: validOtpHash,
      expiresAt: new Date(Date.now() + 60_000),
      userData: { email: 'test@example.com' },
    }, '000000'],
  ];

  for (const [otpDocument, code] of cases) {
    await withOverrides(OTP, {
      findOne: async () => otpDocument,
      deleteOne: async () => {},
    }, async () => {
      const result = await invokeController(authController.verifyRegisterOTP, {
        email: 'test@example.com',
        otp: code,
      });
      assert.equal(result.res.statusCode, 400);
      assert.equal(result.res.body.message, 'Invalid or expired OTP');
    });
  }
});

test('OTP verification rejects an email registered during verification', async () => {
  const otpHash = await bcrypt.hash('123456', 4);
  await withOverrides(OTP, {
    findOne: async () => ({
      _id: 'otp-race',
      otp: otpHash,
      expiresAt: new Date(Date.now() + 60_000),
      userData: { email: 'test@example.com' },
    }),
  }, async () => withOverrides(User, {
    findOne: async () => ({ _id: userId }),
    create: async () => {
      throw new Error('Should not create a duplicate user');
    },
  }, async () => {
    const result = await invokeController(authController.verifyRegisterOTP, {
      email: 'test@example.com',
      otp: '123456',
    });
    assert.equal(result.res.statusCode, 409);
  }));
});

test('login returns a token without password and rejects invalid credentials', async () => {
  const safeUser = {
    _id: userId,
    role: 'customer',
    isVerified: true,
    toObject: () => ({ _id: userId, email: 'test@example.com', password: 'hash' }),
    comparePassword: async (password) => password === 'password123',
  };

  await withOverrides(User, {
    findOne: () => ({ select: async () => safeUser }),
  }, async () => {
    const success = await invokeController(authController.login, {
      email: ' TEST@example.com ',
      password: 'password123',
    });
    assert.equal(success.res.statusCode, 200);
    assert.ok(success.res.body.token);
    assert.equal(Object.hasOwn(success.res.body.user, 'password'), false);

    const rejected = await invokeController(authController.login, {
      email: 'test@example.com',
      password: 'wrong-password',
    });
    assert.equal(rejected.res.statusCode, 401);
  });
});

test('forgot-password OTP response does not disclose whether email exists', async () => {
  const responseMessages = [];
  for (const user of [null, { _id: userId }]) {
    await withOverrides(User, {
      findOne: async () => user,
    }, async () => withOverrides(OTP, {
      deleteMany: async () => {},
      create: async (document) => {
        assert.equal(typeof document.otp, 'string');
        assert.notEqual(document.otp, generatedOtp);
        return { _id: 'forgot-otp' };
      },
      deleteOne: async () => {},
    }, async () => {
      sentEmail = undefined;
      const result = await invokeController(authController.forgotPasswordSendOtp, {
        email: 'test@example.com',
      });
      assert.equal(result.res.statusCode, 200);
      responseMessages.push(result.res.body.message);
    }));
  }

  assert.equal(responseMessages[0], responseMessages[1]);
});

test('getMe and logout return safe successful responses', async () => {
  const currentUser = {
    toObject: () => ({
      _id: userId,
      email: 'test@example.com',
      password: 'hashed-password',
      resetPasswordToken: 'reset-token',
      resetPasswordExpire: new Date(),
    }),
  };
  const me = await invokeController(authController.getMe, {}, currentUser);
  assert.equal(me.res.statusCode, 200);
  assert.equal(Object.hasOwn(me.res.body.user, 'password'), false);
  assert.equal(Object.hasOwn(me.res.body.user, 'resetPasswordToken'), false);

  const logout = await invokeController(authController.logout, {});
  assert.equal(logout.res.statusCode, 200);
});

test('profile update rejects empty bodies, ignores protected fields, and omits password', async () => {
  const empty = runValidation(updateProfileSchema, {});
  assert.equal(empty.continued, false);
  assert.equal(empty.res.statusCode, 400);

  const validated = runValidation(updateProfileSchema, {
    username: 'Updated User',
    role: 'admin',
    email: 'attacker@example.com',
    password: 'attacker-password',
    isVerified: true,
  });
  assert.equal(validated.continued, true);
  assert.deepEqual(validated.req.body, { username: 'Updated User' });

  let update;
  let selectedFields;
  await withOverrides(User, {
    findByIdAndUpdate: (id, changes, options) => {
      update = { id, changes, options };
      return {
        select: async (fields) => {
          selectedFields = fields;
          return {
            _id: id,
            username: changes.$set.username,
            role: 'customer',
          };
        },
      };
    },
  }, async () => {
    const result = await invokeController(
      updateProfile,
      validated.req.body,
      { id: userId }
    );

    assert.equal(result.res.statusCode, 200);
    assert.equal(update.id, userId);
    assert.deepEqual(update.changes, { $set: { username: 'Updated User' } });
    assert.deepEqual(update.options, { new: true, runValidators: true });
    assert.equal(selectedFields, '-password');
    assert.equal(Object.hasOwn(result.res.body.data, 'password'), false);
  });
});

test('profile schema rejects non-URL avatars and invalid phone numbers', () => {
  assert.ok(updateProfileSchema.validate({ avatar: 'not-a-url' }).error);
  assert.ok(updateProfileSchema.validate({ phone: 'abc' }).error);
});

test('routes load and expose the protected profile and auth endpoints', () => {
  const userRouter = require('../routes/user.routes');
  const authRouter = require('../routes/auth.routes');
  const userPaths = userRouter.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path);
  const authPaths = authRouter.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path);

  assert.ok(userPaths.includes('/profile'));
  assert.ok(userPaths.indexOf('/profile') < userPaths.indexOf('/:id/role'));
  assert.ok(authPaths.includes('/register/send-otp'));
  assert.ok(authPaths.includes('/verify-otp'));
  assert.ok(authPaths.includes('/me'));
});

async function invokeController(controller, body, user) {
  const req = createRequest({ body, user });
  const res = createResponse();
  let nextError;
  await controller(req, res, (error) => {
    nextError = error;
  });
  if (nextError) throw nextError;
  return { req, res };
}

async function withAuthEmail(run) {
  const currentEmail = require.cache[emailPath];
  require.cache[emailPath] = {
    id: emailPath,
    filename: emailPath,
    loaded: true,
    exports: {
      sendEmail: async () => {
        throw new Error('mail failure');
      },
    },
  };

  const controllerCache = require.cache[authControllerPath];
  delete require.cache[authControllerPath];
  const testController = require('../controllers/auth.controller');

  try {
    await run(testController);
  } finally {
    require.cache[emailPath] = currentEmail;
    if (controllerCache) require.cache[authControllerPath] = controllerCache;
    else delete require.cache[authControllerPath];
  }
}

async function main() {
  let failures = 0;

  try {
    for (const { name, run } of tests) {
      try {
        await run();
        console.log(`PASS ${name}`);
      } catch (error) {
        failures += 1;
        console.error(`FAIL ${name}`);
        console.error(error);
      }
    }
  } finally {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  console.log(`\n${tests.length - failures}/${tests.length} tests passed.`);
  if (failures) process.exitCode = 1;
}

main();
