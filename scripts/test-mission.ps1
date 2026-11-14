
# ==========================================
# OUTPOST 30 - COMPLETE GAMEPLAY TEST
# ==========================================

$ErrorActionPreference = "Stop"
$API = "http://localhost:3000/api/mission"

function Send-GameAction {
    param(
        [string]$Action,
        $GameState,
        [string]$ChoiceId = "",
        [string]$EmergencyId = ""
    )

    $body = @{ action = $Action }

    if ($null -ne $GameState) {
        $body.state = $GameState
    }

    if ($ChoiceId) {
        $body.choiceId = $ChoiceId
    }

    if ($EmergencyId) {
        $body.emergencyId = $EmergencyId
    }

    $json = $body | ConvertTo-Json -Depth 60

    return Invoke-RestMethod `
        -Uri $API `
        -Method POST `
        -ContentType "application/json" `
        -Body $json
}

try {
    Write-Host "`nOUTPOST 30 - FINAL GAMEPLAY TEST" -ForegroundColor Cyan
    Write-Host "================================"

    $start = Send-GameAction -Action "start"
    $state = $start.state

    $expectedNASA = @($state.nasaTimeline).Count
    $completedNASA = 0
    $resolvedCount = 0

    Write-Host "NASA mode: $($state.nasaDataMode)"
    Write-Host "NASA events: $expectedNASA"
    Write-Host "================================"

    for ($day = 1; $day -le 30; $day++) {

        if ($state.status -ne "active") {
            break
        }

        if ($state.day -ne $day) {
            throw "Day mismatch on Day $day"
        }

        # ==================================
        # RESOLVE ALL PENDING EMERGENCIES
        # ==================================

        $attempts = 0

        while ($true) {

            $today = Send-GameAction `
                -Action "challenge" `
                -GameState $state

            if (-not $today.requiresEmergencyResponse) {
                break
            }

            $attempts++

            if ($attempts -gt 15) {
                throw "Too many emergencies on Day $day"
            }

            $emergency = $today.emergency

            Write-Host "EMERGENCY: $($emergency.title)" `
                -ForegroundColor Yellow

            $result = Send-GameAction `
                -Action "resolve-emergency" `
                -GameState $state `
                -ChoiceId "safe" `
                -EmergencyId $emergency.id

            $state = $result.state
            $resolvedCount++

            if ($state.status -ne "active") {
                break
            }
        }

        if ($state.status -ne "active") {
            break
        }

        # ==================================
        # COMPLETE DAILY MISSION
        # ==================================

        $today = Send-GameAction `
            -Action "challenge" `
            -GameState $state

        if (-not $today.challenge) {
            throw "No daily challenge on Day $day"
        }

        $result = Send-GameAction `
            -Action "decide" `
            -GameState $state `
            -ChoiceId "safe"

        $state = $result.state

        if ($result.wasNASAMission) {
            $completedNASA++

            Write-Host "DAY $day - NASA: $($today.challenge.title)" `
                -ForegroundColor Magenta
        }
        else {
            Write-Host "DAY $day - $($today.challenge.title)" `
                -ForegroundColor Green
        }

        Write-Host (
            "O2: {0} | Power: {1} | Health: {2} | Fatigue: {3}" -f `
            $state.resources.oxygen, `
            $state.resources.power, `
            $state.resources.health, `
            $state.crew.fatigue
        )
    }

    Write-Host "`n================================"
    Write-Host "FINAL RESULTS" -ForegroundColor Cyan

    Write-Host "Days: $($state.history.Count)/30"
    Write-Host "NASA Events: $completedNASA/$expectedNASA"
    Write-Host "Emergencies Resolved: $resolvedCount"
    Write-Host "Score: $($state.score)"
    Write-Host "Status: $($state.status)"
    Write-Host "Crew Health: $($state.resources.health)"
    Write-Host "Crew Fatigue: $($state.crew.fatigue)"
    Write-Host "Crew Morale: $($state.crew.morale)"

    Write-Host "`nEquipment:"
    $state.equipment | Format-List

    Write-Host "`nResources:"
    $state.resources | Format-List

    if (
        $state.status -eq "completed" -and
        $state.history.Count -eq 30 -and
        $completedNASA -eq $expectedNASA
    ) {
        Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
    }
    else {
        Write-Host "MISSION DID NOT COMPLETE" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" `
        -ForegroundColor Red

    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }

    exit 1
}