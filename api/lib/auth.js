/**
 * Authentication utilities using Vercel KV
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Redis } = require('@upstash/redis');

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'fixology-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * Hash a password
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Create a new user
 */
async function createUser({ email, password, name, phone }) {
  // Check if user already exists
  const existingUser = await redis.get(`user:${email.toLowerCase()}`);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const userId = uuidv4();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  const user = {
    id: userId,
    email: email.toLowerCase(),
    passwordHash,
    name: name || '',
    phone: phone || '',
    createdAt: now,
    updatedAt: now,
    rewardsPoints: 0,
    role: 'customer'
  };

  // Save user to KV
  await redis.set(`user:${email.toLowerCase()}`, user);
  await redis.set(`user:id:${userId}`, email.toLowerCase());
  
  // Add to users list
  await redis.sadd('users', userId);

  // Generate token
  const token = generateToken({ 
    userId: user.id, 
    email: user.email,
    role: user.role 
  });

  // Return user without password hash
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, token };
}

/**
 * Login user
 */
async function loginUser(email, password) {
  const user = await redis.get(`user:${email.toLowerCase()}`);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValidPassword = await comparePassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Generate token
  const token = generateToken({ 
    userId: user.id, 
    email: user.email,
    role: user.role 
  });

  // Return user without password hash
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, token };
}

/**
 * Get user by ID
 */
async function getUserById(userId) {
  const email = await redis.get(`user:id:${userId}`);
  if (!email) return null;
  
  const user = await redis.get(`user:${email}`);
  if (!user) return null;

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  const user = await redis.get(`user:${email.toLowerCase()}`);
  if (!user) return null;

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Update user
 */
async function updateUser(userId, updates) {
  const email = await redis.get(`user:id:${userId}`);
  if (!email) throw new Error('User not found');
  
  const user = await redis.get(`user:${email}`);
  if (!user) throw new Error('User not found');

  const updatedUser = {
    ...user,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Don't allow updating sensitive fields
  delete updatedUser.id;
  delete updatedUser.email;
  updatedUser.id = user.id;
  updatedUser.email = user.email;

  await redis.set(`user:${email}`, updatedUser);

  const { passwordHash: _, ...safeUser } = updatedUser;
  return safeUser;
}

/**
 * Middleware to authenticate requests
 */
async function authenticateRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return null;
  }

  const user = await getUserById(decoded.userId);
  return user;
}

/**
 * Create shop user
 */
async function createShopUser({ email, password, shopName, address, phone }) {
  // Check if shop user already exists
  const existingShop = await redis.get(`shop:${email.toLowerCase()}`);
  if (existingShop) {
    throw new Error('Email already registered');
  }

  const shopId = uuidv4();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  const shop = {
    id: shopId,
    email: email.toLowerCase(),
    passwordHash,
    shopName: shopName || '',
    address: address || '',
    phone: phone || '',
    createdAt: now,
    updatedAt: now,
    subscriptionPlan: 'free',
    renewalDate: null,
    websiteEnabled: false,
    imeiChecksUsed: 0,
    role: 'shop'
  };

  // Save shop to KV
  await redis.set(`shop:${email.toLowerCase()}`, shop);
  await redis.set(`shop:id:${shopId}`, email.toLowerCase());
  
  // Add to shops list
  await redis.sadd('shops', shopId);

  // Generate token
  const token = generateToken({ 
    shopId: shop.id, 
    email: shop.email,
    role: shop.role 
  });

  // Return shop without password hash
  const { passwordHash: _, ...safeShop } = shop;
  return { shop: safeShop, token };
}

/**
 * Login shop user
 */
async function loginShopUser(email, password) {
  const shop = await redis.get(`shop:${email.toLowerCase()}`);
  
  if (!shop) {
    throw new Error('Invalid email or password');
  }

  const isValidPassword = await comparePassword(password, shop.passwordHash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Generate token
  const token = generateToken({ 
    shopId: shop.id, 
    email: shop.email,
    role: shop.role 
  });

  // Return shop without password hash
  const { passwordHash: _, ...safeShop } = shop;
  return { shop: safeShop, token };
}

/**
 * Get shop by ID
 */
async function getShopById(shopId) {
  const email = await redis.get(`shop:id:${shopId}`);
  if (!email) return null;
  
  const shop = await redis.get(`shop:${email}`);
  if (!shop) return null;

  const { passwordHash: _, ...safeShop } = shop;
  return safeShop;
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  createUser,
  loginUser,
  getUserById,
  getUserByEmail,
  updateUser,
  authenticateRequest,
  createShopUser,
  loginShopUser,
  getShopById
};
