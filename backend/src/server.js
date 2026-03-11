import { randomUUID, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHOES } from './data/shoes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnvFile(path.join(__dirname, '../.env'));

const shoeIndex = new Map(SHOES.map((shoe) => [shoe.id, shoe]));

const config = {
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT || 4000),
  ordersFile: resolveOrdersFile(process.env.ORDERS_FILE),
  adminApiKey: (process.env.ADMIN_API_KEY || '').trim(),
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:4173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

const sendJson = (response, statusCode, payload) => {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
};

const setCorsHeaders = (request, response) => {
  const requestOrigin = request.headers.origin;
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

  if (!requestOrigin) {
    return;
  }

  if (isAllowedOrigin(requestOrigin)) {
    response.setHeader('Access-Control-Allow-Origin', requestOrigin);
    response.setHeader('Vary', 'Origin');
  }
};

const readRequestBody = async (request) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error('Request body is too large.'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(parsed);
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });

    request.on('error', reject);
  });

const loadOrders = async () => {
  try {
    const raw = await readFile(config.ordersFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveOrders = async (orders) => {
  await mkdir(path.dirname(config.ordersFile), { recursive: true });
  await writeFile(config.ordersFile, JSON.stringify(orders, null, 2), 'utf8');
};

const normalizeOrderPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { error: 'Order payload is required.' };
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return { error: 'Order must include at least one item.' };
  }

  if (!payload.contact || typeof payload.contact !== 'object') {
    return { error: 'Order contact details are required.' };
  }

  const contact = {
    name: normalizeText(payload.contact.name),
    email: normalizeText(payload.contact.email).toLowerCase(),
    city: normalizeText(payload.contact.city),
    country: normalizeText(payload.contact.country),
    delivery: normalizeText(payload.contact.delivery),
    notes: normalizeText(payload.contact.notes, 300),
  };

  const requiredContactFields = ['name', 'email', 'city', 'country', 'delivery'];
  for (const field of requiredContactFields) {
    if (contact[field].length === 0) {
      return { error: `Contact field "${field}" is required.` };
    }
  }

  if (!isValidEmail(contact.email)) {
    return { error: 'Contact email must be a valid email address.' };
  }

  if (!['Standard', 'Express'].includes(contact.delivery)) {
    return { error: 'Delivery must be either "Standard" or "Express".' };
  }

  const normalizedItems = [];
  let subtotal = 0;

  for (const [index, rawItem] of payload.items.entries()) {
    if (!rawItem || typeof rawItem !== 'object') {
      return { error: `Order item ${index + 1} is invalid.` };
    }

    const shoeId = normalizeText(rawItem.id);
    const selectedSize = normalizeText(rawItem.selectedSize);
    const quantity = Number(rawItem.quantity);
    const shoe = shoeIndex.get(shoeId);

    if (!shoe) {
      return { error: `Order item ${index + 1} references an unknown product.` };
    }

    if (!shoe.sizes.includes(selectedSize)) {
      return { error: `Selected size for "${shoe.name}" is not available.` };
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return { error: `Quantity for "${shoe.name}" must be between 1 and 10.` };
    }

    normalizedItems.push({
      ...shoe,
      lineId: `${shoe.id}-${selectedSize.replace(/\s+/g, '-').toLowerCase()}-${index + 1}`,
      selectedSize,
      quantity,
    });

    subtotal += shoe.price * quantity;
  }

  const shipping = subtotal >= 300 ? 0 : contact.delivery === 'Express' ? 32 : 18;

  return {
    value: {
      items: normalizedItems,
      subtotal,
      shipping,
      total: subtotal + shipping,
      contact,
    },
  };
};

const resolveShoes = (url) => {
  const brand = url.searchParams.get('brand');
  const isNewArrivalsFilter = url.searchParams.get('newArrivals');
  const query = url.searchParams.get('q');

  let result = [...SHOES];

  if (brand && brand !== 'All') {
    result = result.filter((shoe) => shoe.brand === brand);
  }

  if (isNewArrivalsFilter === 'true') {
    result = result.filter((shoe) => Boolean(shoe.isNew));
  }

  if (query) {
    const loweredQuery = query.toLowerCase();
    result = result.filter((shoe) => {
      return (
        shoe.name.toLowerCase().includes(loweredQuery) ||
        shoe.brand.toLowerCase().includes(loweredQuery) ||
        shoe.colorway.toLowerCase().includes(loweredQuery) ||
        shoe.category.toLowerCase().includes(loweredQuery)
      );
    });
  }

  return result;
};

const server = createServer(async (request, response) => {
  setCorsHeaders(request, response);

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }

  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const { pathname } = url;

  try {
    if (request.method === 'GET' && pathname === '/api/health') {
      sendJson(response, 200, {
        ok: true,
        service: 'velosnak-backend',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (request.method === 'GET' && pathname === '/api/shoes') {
      sendJson(response, 200, resolveShoes(url));
      return;
    }

    if (request.method === 'GET' && pathname.startsWith('/api/shoes/')) {
      const shoeId = decodeURIComponent(pathname.replace('/api/shoes/', ''));
      const shoe = SHOES.find((candidate) => candidate.id === shoeId);

      if (!shoe) {
        sendJson(response, 404, { message: 'Shoe not found.' });
        return;
      }

      sendJson(response, 200, shoe);
      return;
    }

    if (request.method === 'GET' && pathname === '/api/orders') {
      const accessError = requireAdminAccess(request);
      if (accessError) {
        sendJson(response, accessError.statusCode, { message: accessError.message });
        return;
      }

      sendJson(response, 200, await loadOrders());
      return;
    }

    if (request.method === 'GET' && pathname.startsWith('/api/orders/')) {
      const accessError = requireAdminAccess(request);
      if (accessError) {
        sendJson(response, accessError.statusCode, { message: accessError.message });
        return;
      }

      const orderId = decodeURIComponent(pathname.replace('/api/orders/', ''));
      const orders = await loadOrders();
      const order = orders.find((candidate) => candidate.id === orderId);

      if (!order) {
        sendJson(response, 404, { message: 'Order not found.' });
        return;
      }

      sendJson(response, 200, order);
      return;
    }

    if (request.method === 'POST' && pathname === '/api/orders') {
      const payload = await readRequestBody(request);
      const normalizedOrder = normalizeOrderPayload(payload);

      if (normalizedOrder.error) {
        sendJson(response, 400, { message: normalizedOrder.error });
        return;
      }

      const order = {
        ...normalizedOrder.value,
        id: buildOrderId(),
        createdAt: new Date().toISOString(),
      };

      const orders = await loadOrders();
      orders.unshift(order);
      await saveOrders(orders);
      sendJson(response, 201, order);
      return;
    }

    sendJson(response, 404, { message: 'Endpoint not found.' });
  } catch (error) {
    const message =
      error instanceof Error && error.message.length > 0
        ? error.message
        : 'Unexpected backend error.';
    sendJson(response, 500, { message });
  }
});

server.listen(config.port, config.host, () => {
  console.log(`Velosnak backend listening on http://${config.host}:${config.port}`);
  console.log(`Allowed CORS origins: ${config.corsOrigins.join(', ')}`);
});

function resolveOrdersFile(rawValue) {
  if (!rawValue || rawValue.trim().length === 0) {
    return path.join(__dirname, '../data/orders.json');
  }

  return path.isAbsolute(rawValue)
    ? rawValue
    : path.resolve(path.join(__dirname, '..'), rawValue);
}

function loadEnvFile(envFilePath) {
  if (!existsSync(envFilePath)) {
    return;
  }

  const content = readFileSync(envFilePath, 'utf8');

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value.replace(/\\n/g, '\n');
  }
}

function normalizeText(value, maxLength = 120) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildOrderId() {
  return `VS-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

function requireAdminAccess(request) {
  if (!config.adminApiKey) {
    return {
      statusCode: 503,
      message: 'Admin order access is not configured on this server.',
    };
  }

  const providedKey = getSingleHeaderValue(request.headers['x-admin-key']);
  if (!providedKey || !safeEqual(providedKey, config.adminApiKey)) {
    return {
      statusCode: 401,
      message: 'Admin access is required for order retrieval.',
    };
  }

  return null;
}

function getSingleHeaderValue(headerValue) {
  if (Array.isArray(headerValue)) {
    return headerValue[0] || '';
  }

  return typeof headerValue === 'string' ? headerValue : '';
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function isAllowedOrigin(requestOrigin) {
  const allowAllOrigins = config.corsOrigins.includes('*');
  if (allowAllOrigins || config.corsOrigins.includes(requestOrigin)) {
    return true;
  }

  try {
    const originUrl = new URL(requestOrigin);
    return isLoopbackHost(originUrl.hostname) || isPrivateNetworkHost(originUrl.hostname);
  } catch {
    return false;
  }
}

function isLoopbackHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]';
}

function isPrivateNetworkHost(hostname) {
  const match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return false;
  }

  const firstOctet = Number(match[1]);
  const secondOctet = Number(match[2]);

  return (
    firstOctet === 10 ||
    (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) ||
    (firstOctet === 192 && secondOctet === 168)
  );
}
