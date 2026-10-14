const MAX_LIMIT = 100;

function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function getToken(req) {
  const value = req.headers.authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7) : '';
}

async function requireAdmin(req) {
  const token = getToken(req);
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !anonKey || !serviceKey) throw new Error('not_configured');

  const userResponse = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` }
  });
  if (!userResponse.ok) throw new Error('unauthorized');
  const user = await userResponse.json();
  if (user.app_metadata?.role !== 'admin') throw new Error('forbidden');
  return { url, serviceKey };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'method_not_allowed' });
  }

  try {
    const { url, serviceKey } = await requireAdmin(req);
    const query = new URLSearchParams({
      select: '*',
      order: 'reportDate.desc,deviceTime.desc',
      limit: String(Math.min(Math.max(Number(req.query.limit) || 50, 1), MAX_LIMIT)),
      offset: String(Math.max(Number(req.query.offset) || 0, 0))
    });
    for (const key of ['location', 'project', 'status']) {
      if (req.query[key]) query.set(key, `eq.${String(req.query[key]).slice(0, 120)}`);
    }
    if (req.query.from) query.append('reportDate', `gte.${String(req.query.from).slice(0, 10)}`);
    if (req.query.to) query.append('reportDate', `lte.${String(req.query.to).slice(0, 10)}`);
    const response = await fetch(`${url}/rest/v1/cards?${query}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
    });
    if (!response.ok) throw new Error(`supabase_http_${response.status}`);
    return sendJson(res, 200, { cards: await response.json() });
  } catch (error) {
    console.error('Admin cards request failed:', error.message);
    return sendJson(res, error.message === 'forbidden' ? 403 : 401, {
      error: error.message === 'forbidden' ? 'forbidden' : 'unauthorized'
    });
  }
};
