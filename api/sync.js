const MAX_BODY_BYTES = 100 * 1024;
const REQUIRED_FIELDS = ['id', 'name', 'location', 'description', 'reportDate'];
const DEFAULT_RECEIVER_EMAIL = 'abdulganiyu838@gmail.com';

function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function validCard(card) {
  return card &&
    typeof card === 'object' &&
    REQUIRED_FIELDS.every((field) => typeof card[field] === 'string' && card[field].trim()) &&
    Array.isArray(card.category) &&
    Array.isArray(card.type) &&
    Array.isArray(card.nature);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let raw = '';
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('payload_too_large'));
        req.destroy();
        return;
      }
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

async function persistCard(card) {
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase persistence is not configured');

  const response = await fetch(`${url}/rest/v1/cards?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify({ ...card, synced_at: new Date().toISOString() })
  });
  if (!response.ok) throw new Error(`supabase_http_${response.status}`);
}

async function forwardCard(card) {
  const receiver = process.env.SYNC_FORWARD_URL;
  if (!receiver) return;

  const response = await fetch(receiver, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.SYNC_FORWARD_TOKEN
        ? { Authorization: `Bearer ${process.env.SYNC_FORWARD_TOKEN}` }
        : {})
    },
    body: JSON.stringify({
      ...card,
      receiverEmail: process.env.RECEIVER_EMAIL || DEFAULT_RECEIVER_EMAIL
    })
  });
  if (!response.ok) throw new Error(`receiver_http_${response.status}`);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'method_not_allowed' });
  }

  try {
    const card = await readBody(req);
    if (!validCard(card)) {
      return sendJson(res, 400, { error: 'invalid_card', required: REQUIRED_FIELDS });
    }
    await persistCard(card);
    await forwardCard(card);
    return sendJson(res, 200, { accepted: true, cardId: card.id });
  } catch (error) {
    if (error.message === 'payload_too_large') {
      return sendJson(res, 413, { error: 'payload_too_large' });
    }
    if (error.message === 'invalid_json') {
      return sendJson(res, 400, { error: 'invalid_json' });
    }
    console.error('Card sync failed:', error.message);
    return sendJson(res, 503, {
      error: 'sync_unavailable',
      message: error.message === 'Supabase persistence is not configured'
        ? 'Central storage is not configured on the server.'
        : error.message.startsWith('supabase_http_')
          ? 'Central storage rejected the card. Check the Supabase cards table schema.'
          : 'The server could not save this card.'
    });
  }
};