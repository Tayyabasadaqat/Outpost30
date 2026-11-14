
# ==========================================
# OUTPOST 30 - FULL GAME ENGINE TEST
# ==========================================

$ErrorActionPreference = "Stop"

$API = "http://localhost:3000/api/mission"

Write-Host "`nOUTPOST 30 - SIMULATION TEST" -ForegroundColor Cyan
Write-Host "================================"

try {
    # START MISSION
    $response = Invoke-RestMethod `
        -Uri $API `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"action":"start"}'

    if (-not $response.success) {
        throw "Mission failed to start"
    }

    $state = $response.state
    $nasaCount = 0

    # PLAY ALL 30 DAYS
    for ($day = 1; $day -le 30; $day++) {

        if ($state.status -ne "active") {
            Write-Host "Mission ended before Day $day"
            break
        }

        if ($state.day -ne $day) {
            throw "Expected Day $day but got Day $($state.day)"
        }

        $body = @{
            action = "decide"
            state = $state
            choiceId = "safe"
        } | ConvertTo-Json -Depth 30

        $response = Invoke-RestMethod `
            -Uri $API `
            -Method POST `
            -ContentType "application/json" `
            -Body $body

        if (-not $response.success) {
            throw "Decision failed on Day $day"
        }

        $state = $response.state

        if ($response.wasNASAMission) {
            $nasaCount++

            Write-Host "DAY $day - NASA MISSION" -ForegroundColor Yellow
            Write-Host "Event: $($response.nasaEventId)"
            Write-Host "Source: $($response.nasaSource)"
        }
        else {
            Write-Host "DAY $day - COMPLETE" -ForegroundColor Green
        }

        Write-Host "Oxygen: $($state.resources.oxygen) | Power: $($state.resources.power) | Health: $($state.resources.health)"
        Write-Host "--------------------------------"
    }

    # FINAL RESULT
    Write-Host "`n================================"
    Write-Host "FINAL MISSION REPORT" -ForegroundColor Cyan

    $completedDays = $state.history.Count

    Write-Host "Days Completed: $completedDays / 30"
    Write-Host "Final Score: $($state.score)"
    Write-Host "Mission Status: $($state.status)"
    Write-Host "NASA Missions: $nasaCount"

    Write-Host "`nFINAL RESOURCES:"
    $state.resources | Format-List

    if (
        $state.status -eq "completed" -and
        $completedDays -eq 30 -and
        $nasaCount -eq 3
    ) {
        Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
    }
    else {
        Write-Host "TEST FAILED OR INCOMPLETE" -ForegroundColor Red
        exit 1
    }

}
catch {
    Write-Host "TEST ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}