\set ON_ERROR_STOP on
-- Explicit psql-only development seed, outside Flyway. Requires an existing user.
SELECT current_database() = 'task2_dev'
       AND inet_server_addr() = '127.0.0.1'::inet AS safe_dev_database \gset
\if :safe_dev_database
\else
    \echo 'Refusing seed: use a local task2_dev database.'
    DO $$ BEGIN RAISE EXCEPTION 'Development seed requires loopback task2_dev'; END $$;
\endif

BEGIN;
SELECT set_config('app.current_user_id', :'owner_id', true);

INSERT INTO public.projects(id, owner_id, name, description)
VALUES ('10000000-0000-0000-0000-000000000001', :'owner_id'::uuid,
        'Development project', 'Optional local development data')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tasks(id, project_id, title, status, priority)
VALUES ('20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001', 'Try the task board', 'TODO', 'MEDIUM'),
       ('20000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001', 'Completed example', 'DONE', 'LOW')
ON CONFLICT (id) DO NOTHING;
COMMIT;
