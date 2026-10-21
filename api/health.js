module.exports = function handler(req, res) {
  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const hasUrl = Boolean(supabaseUrl);
  const hasAnonKey = Boolean(process.env.SUPABASE_ANON_KEY);
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasReceiver = Boolean(process.env.SYNC_FORWARD_URL);
  const hasReceiverEmail = Boolean(process.env.RECEIVER_EMAIL);

  const ready = hasUrl && hasAnonKey && hasServiceRoleKey;

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: ready,
    status: ready ? 'ready' : 'not_configured',
    message: ready
      ? 'Central storage is configured and ready.'
      : 'Central storage is not configured on the server.',
    supabase: {
      urlConfigured: hasUrl,
      anonKeyConfigured: hasAnonKey,
      serviceRoleKeyConfigured: hasServiceRoleKey
    },
    sync: {
      forwardConfigured: hasReceiver,
      receiverEmailConfigured: hasReceiverEmail
    },
    timestamp: new Date().toISOString()
  });
};
