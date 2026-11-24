param(
    [string]$PostgresBin = 'C:/Program Files/PostgreSQL/18/bin'
)

$ErrorActionPreference = 'Stop'
$backendPath = Split-Path $PSScriptRoot -Parent
$testPath = Join-Path $backendPath ('target/postgres-test-' + [guid]::NewGuid().ToString('N'))
$dataPath = Join-Path $testPath 'data'
$savedTestUrl = $env:TASK2_TEST_DB_URL
$serverStarted = $false
$testExit = 1

# Reserve an available loopback port; pg_ctl will fail safely if it is taken after release.
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$listener.Start()
$testPort = $listener.LocalEndpoint.Port
$listener.Stop()

New-Item -ItemType Directory -Path $testPath -Force | Out-Null
Push-Location $backendPath
try {
    & "$PostgresBin/initdb.exe" -D $dataPath -U task2_admin --auth=trust --encoding=UTF8 --locale=C
    if ($LASTEXITCODE -ne 0) { throw 'initdb failed' }
    $startArguments = "-D `"$dataPath`" -l `"$testPath/server.log`" -o `"-h 127.0.0.1 -p $testPort`" -w start"
    $controlProcess = Start-Process -FilePath "$PostgresBin/pg_ctl.exe" -ArgumentList $startArguments `
        -WindowStyle Hidden -PassThru -RedirectStandardOutput "$testPath/start.log" `
        -RedirectStandardError "$testPath/start-error.log"
    # Wait only for pg_ctl; waiting for its process tree would also wait for postgres.
    $controlProcess.WaitForExit()
    $serverStarted = Test-Path (Join-Path $dataPath 'postmaster.pid')
    & "$PostgresBin/pg_isready.exe" -h 127.0.0.1 -p $testPort
    if ($LASTEXITCODE -ne 0) { throw "PostgreSQL startup failed; see $testPath/start-error.log" }
    & "$PostgresBin/psql.exe" -h 127.0.0.1 -p $testPort -U task2_admin -d postgres -v ON_ERROR_STOP=1 `
        -c 'CREATE ROLE task2_migrator LOGIN NOSUPERUSER NOBYPASSRLS;' `
        -c 'CREATE ROLE task2_runtime LOGIN NOSUPERUSER NOBYPASSRLS;' `
        -c 'CREATE DATABASE task2_test OWNER task2_migrator;'
    if ($LASTEXITCODE -ne 0) { throw 'Test database setup failed' }
    $env:TASK2_TEST_DB_URL = "jdbc:postgresql://127.0.0.1:$testPort/task2_test"
    # Windows PowerShell treats native stderr warnings as errors under Stop.
    $ErrorActionPreference = 'Continue'
    & ./mvnw.cmd --batch-mode --no-transfer-progress compile test
    $testExit = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
}
finally {
    if ($serverStarted) {
        & "$PostgresBin/pg_ctl.exe" -D $dataPath -m fast -w stop
    }
    $env:TASK2_TEST_DB_URL = $savedTestUrl
    Pop-Location
}
exit $testExit
