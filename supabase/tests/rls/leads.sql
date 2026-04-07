BEGIN;

SELECT plan(10);

-- Test 1: leads table exists
SELECT has_table('public', 'leads', 'leads table exists');

-- Test 2: RLS enabled on leads
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'leads'),
  'RLS enabled on leads'
);

-- Test 3: RLS enabled on tenants
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'tenants'),
  'RLS enabled on tenants'
);

-- Test 4: RLS enabled on agents
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'agents'),
  'RLS enabled on agents'
);

-- Test 5: RLS enabled on calls
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'calls'),
  'RLS enabled on calls'
);

-- Test 6: RLS enabled on appointments
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'appointments'),
  'RLS enabled on appointments'
);

-- Test 7: RLS enabled on metrics
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'metrics'),
  'RLS enabled on metrics'
);

-- Test 8: RLS enabled on agent_logs
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'agent_logs'),
  'RLS enabled on agent_logs'
);

-- Test 9: RLS enabled on alerts
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'alerts'),
  'RLS enabled on alerts'
);

-- Test 10: auth helper function exists
SELECT has_function('auth', 'is_ceo', 'auth.is_ceo() function exists');

SELECT finish();
ROLLBACK;
