param(
    [string]$PostgresBin = 'C:/Program Files/PostgreSQL/18/bin',
    [string]$JavaHome = 'C:/Program Files/Java/jdk-21'
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$backend = Join-Path $repo 'backend'
$frontend = Join-Path $repo 'frontend'
$run = Join-Path $backend ('target/fe08-e2e-' + [guid]::NewGuid().ToString('N'))
$data = Join-Path $run 'data'
$saved = @{}
$names = @('JAVA_HOME','DB_URL','DB_USERNAME','DB_PASSWORD','FLYWAY_DB_URL','FLYWAY_DB_USERNAME','FLYWAY_DB_PASSWORD','FLYWAY_ENABLED','JWT_SECRET','JWT_EXPIRATION','FRONTEND_URL','DASHBOARD_TIME_ZONE','VITE_API_BASE_URL','FE08_LOCAL_API','FE08_LOCAL_WEB','FE08_DISPOSABLE','FE08_TEST_JWT_SECRET')
foreach ($name in $names) { $saved[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
$apiProcess = $null
$webProcess = $null
$pgStarted = $false
function Get-FreePort {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    $listener.Start()
    $value = $listener.LocalEndpoint.Port
    $listener.Stop()
    return $value
}
function Wait-Http($url, $process) {
    for ($i = 0; $i -lt 120; $i++) {
        if ($process.HasExited) { throw 'Local service exited; inspect ignored test logs.' }
        try { if ((Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200) { return } } catch {}
        Start-Sleep -Milliseconds 500
    }
    throw 'Local service did not become ready.'
}
New-Item -ItemType Directory -Path $run -Force | Out-Null
Push-Location $repo
try {
    $env:JAVA_HOME = $JavaHome
    Push-Location $backend
    try {
        & ./mvnw.cmd --batch-mode --no-transfer-progress -DskipTests package *> (Join-Path $run 'package.log')
        if ($LASTEXITCODE -ne 0) { throw 'Backend package failed.' }
    } finally { Pop-Location }
    $pgPort = Get-FreePort
    $apiPort = Get-FreePort
    $webPort = Get-FreePort
    & "$PostgresBin/initdb.exe" -D $data -U task2_admin --auth=trust --encoding=UTF8 --locale=C *> (Join-Path $run 'initdb.log')
    if ($LASTEXITCODE -ne 0) { throw 'Disposable PostgreSQL initialization failed.' }
    $pg = Start-Process -FilePath "$PostgresBin/pg_ctl.exe" -ArgumentList "-D `"$data`" -l `"$run/postgres.log`" -o `"-h 127.0.0.1 -p $pgPort`" -w start" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$run/pg-start.log" -RedirectStandardError "$run/pg-start-error.log"
    $pg.WaitForExit()
    $pgStarted = Test-Path (Join-Path $data 'postmaster.pid')
    & "$PostgresBin/pg_isready.exe" -h 127.0.0.1 -p $pgPort *> "$run/pg-ready.log"
    if ($LASTEXITCODE -ne 0 -or !$pgStarted) { throw 'Disposable PostgreSQL startup failed.' }
    & "$PostgresBin/psql.exe" -h 127.0.0.1 -p $pgPort -U task2_admin -d postgres -v ON_ERROR_STOP=1 -c 'CREATE ROLE task2_migrator LOGIN NOSUPERUSER NOBYPASSRLS;' -c 'CREATE ROLE task2_runtime LOGIN NOSUPERUSER NOBYPASSRLS;' -c 'CREATE DATABASE task2_test OWNER task2_migrator;' *> "$run/provision.log"
    if ($LASTEXITCODE -ne 0) { throw 'Disposable role provisioning failed.' }
    $env:FLYWAY_DB_URL = "jdbc:postgresql://127.0.0.1:$pgPort/task2_test"
    $env:FLYWAY_DB_USERNAME = 'task2_migrator'
    $env:FLYWAY_DB_PASSWORD = 'local-test-only'
    $jar = Join-Path $backend 'target/backend-0.0.1-SNAPSHOT.jar'
    & "$JavaHome/bin/java.exe" '-Dloader.main=backend.config.DatabaseMigration' -cp $jar org.springframework.boot.loader.launch.PropertiesLauncher *> "$run/migration.log"
    if ($LASTEXITCODE -ne 0) { throw 'Disposable migration failed.' }
    & "$PostgresBin/psql.exe" -h 127.0.0.1 -p $pgPort -U task2_admin -d task2_test -v ON_ERROR_STOP=1 -c 'GRANT USAGE ON SCHEMA public TO task2_runtime; GRANT SELECT, INSERT, UPDATE, DELETE ON public.users, public.sessions, public.projects, public.tasks TO task2_runtime;' *> "$run/grants.log"
    if ($LASTEXITCODE -ne 0) { throw 'Disposable runtime grants failed.' }
    $env:DB_URL = $env:FLYWAY_DB_URL
    $env:DB_USERNAME = 'task2_runtime'
    $env:DB_PASSWORD = 'local-test-only'
    $env:FLYWAY_ENABLED = 'false'
    $keyBytes = New-Object byte[] 32
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($keyBytes) } finally { $random.Dispose() }
    $env:JWT_SECRET = [Convert]::ToBase64String($keyBytes)
    $env:JWT_EXPIRATION = '900000'
    $env:FRONTEND_URL = "http://127.0.0.1:$webPort"
    $env:DASHBOARD_TIME_ZONE = 'UTC'
    # No migration-owner credentials are inherited by the runtime process.
    foreach ($name in @('FLYWAY_DB_URL','FLYWAY_DB_USERNAME','FLYWAY_DB_PASSWORD')) { [Environment]::SetEnvironmentVariable($name, $null, 'Process') }
    $apiProcess = Start-Process -FilePath "$JavaHome/bin/java.exe" -ArgumentList "-jar `"$jar`" --server.address=127.0.0.1 --server.port=$apiPort --spring.datasource.url=$env:DB_URL --spring.datasource.username=task2_runtime --spring.datasource.password=local-test-only --spring.flyway.enabled=false --spring.jpa.hibernate.ddl-auto=validate --spring.sql.init.mode=never" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$run/backend.log" -RedirectStandardError "$run/backend-error.log"
    $env:VITE_API_BASE_URL = "http://127.0.0.1:$apiPort"
    $env:FE08_LOCAL_API = $env:VITE_API_BASE_URL
    $env:FE08_LOCAL_WEB = $env:FRONTEND_URL
    $env:FE08_DISPOSABLE = 'true'
    $env:FE08_TEST_JWT_SECRET = $env:JWT_SECRET
    Wait-Http "$env:FE08_LOCAL_API/api/health" $apiProcess
    Push-Location $frontend
    try {
        & node node_modules/vite/bin/vite.js build --outDir node_modules/.cache/fe08-dist --emptyOutDir *> "$run/frontend-build.log"
        if ($LASTEXITCODE -ne 0) { throw 'Isolated frontend build failed.' }
        $webProcess = Start-Process -FilePath (Get-Command node).Source -ArgumentList "node_modules/vite/bin/vite.js preview --outDir node_modules/.cache/fe08-dist --host=127.0.0.1 --port=$webPort --strictPort" -WorkingDirectory $frontend -WindowStyle Hidden -PassThru -RedirectStandardOutput "$run/preview.log" -RedirectStandardError "$run/preview-error.log"
        Wait-Http "$env:FE08_LOCAL_WEB/login" $webProcess
        $ErrorActionPreference = 'Continue'
        & node scripts/local-integration.mjs *> "$run/browser.log"
        $browserExit = $LASTEXITCODE
        $ErrorActionPreference = 'Stop'
        Get-Content "$run/browser.log"
        if ($browserExit -ne 0) { throw 'Local integration browser checks failed.' }
    } finally { Pop-Location }
} finally {
    foreach ($process in @($webProcess, $apiProcess)) { if ($process -and !$process.HasExited) { Stop-Process -Id $process.Id -Force } }
    if ($pgStarted) { & "$PostgresBin/pg_ctl.exe" -D $data -m fast -w stop *> "$run/pg-stop.log" }
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $saved[$name], 'Process') }
    Pop-Location
}
