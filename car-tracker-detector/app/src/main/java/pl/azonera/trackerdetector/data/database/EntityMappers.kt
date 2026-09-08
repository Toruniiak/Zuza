package pl.azonera.trackerdetector.data.database

import pl.azonera.trackerdetector.core.model.DetectedDevice
import pl.azonera.trackerdetector.core.model.DeviceCategory
import pl.azonera.trackerdetector.core.model.RiskLevel
import pl.azonera.trackerdetector.core.model.SignalDistance
import pl.azonera.trackerdetector.core.model.UserDeviceAction
import pl.azonera.trackerdetector.core.rssi.RssiAnalyzer
import pl.azonera.trackerdetector.core.scoring.RiskScorer
import pl.azonera.trackerdetector.core.scoring.ScoringInput
import pl.azonera.trackerdetector.core.signature.TrackerSignatureDatabase
import pl.azonera.trackerdetector.data.database.entity.DetectedDeviceEntity

fun DetectedDevice.toEntity(sessionId: String): DetectedDeviceEntity = DetectedDeviceEntity(
    sessionId = sessionId,
    address = address,
    displayName = displayName,
    firstSeenMillis = firstSeenMillis,
    lastSeenMillis = lastSeenMillis,
    detectionCount = detectionCount,
    lastRssi = lastRssi,
    bestRssi = bestRssi,
    averageRssi = averageRssi,
    manufacturerCompanyIds = manufacturerCompanyIds,
    lastManufacturerData = lastManufacturerData,
    serviceUuids = serviceUuids,
    rssiHistory = rssiHistory,
    category = category.name,
    matchedSignatureId = matchedSignature?.id,
    riskScore = riskScore,
    riskLevel = riskLevel.name,
    userAction = userAction.name,
    seenInPastSessionsCount = seenInPastSessionsCount
)

/**
 * Odtwarza domenowy [DetectedDevice] z encji.
 *
 * `riskScore`/`riskLevel` są odtwarzane 1:1 z zapisanej migawki (to dokładnie to, co użytkownik
 * zobaczył podczas skanu). Czynniki scoringu ([DetectedDevice.scoringFactors]) są natomiast
 * PRZELICZANE na nowo z tych samych zapisanych danych wejściowych — to bezpieczne, bo scoring
 * jest funkcją deterministyczną, więc wynik przeliczenia zawsze zgadza się z zapisanym `riskScore`.
 */
fun DetectedDeviceEntity.toDomain(scanDurationSeconds: Int): DetectedDevice {
    val signature = matchedSignatureId?.let { TrackerSignatureDatabase.byId(it) }
    val userAction = UserDeviceAction.valueOf(this.userAction)

    val strongSignalRatio = if (rssiHistory.isEmpty()) {
        0.0
    } else {
        rssiHistory.count { RssiAnalyzer.distanceZone(it) == SignalDistance.VERY_CLOSE }.toDouble() / rssiHistory.size
    }

    val recomputed = RiskScorer.score(
        ScoringInput(
            hasName = displayName != null,
            detectionCount = detectionCount,
            scanDurationSeconds = scanDurationSeconds,
            strongSignalRatio = strongSignalRatio,
            matchedSignature = signature,
            isUserMarkedKnown = userAction == UserDeviceAction.MY_DEVICE,
            seenInPastSessionsCount = seenInPastSessionsCount
        )
    )

    return DetectedDevice(
        address = address,
        displayName = displayName,
        firstSeenMillis = firstSeenMillis,
        lastSeenMillis = lastSeenMillis,
        detectionCount = detectionCount,
        lastRssi = lastRssi,
        bestRssi = bestRssi,
        averageRssi = averageRssi,
        manufacturerCompanyIds = manufacturerCompanyIds,
        lastManufacturerData = lastManufacturerData,
        serviceUuids = serviceUuids,
        rssiHistory = rssiHistory,
        category = DeviceCategory.valueOf(category),
        matchedSignature = signature,
        allMatchedSignatures = listOfNotNull(signature),
        riskScore = riskScore,
        riskLevel = RiskLevel.valueOf(riskLevel),
        scoringFactors = recomputed.factors,
        userAction = userAction,
        seenInPastSessionsCount = seenInPastSessionsCount
    )
}
