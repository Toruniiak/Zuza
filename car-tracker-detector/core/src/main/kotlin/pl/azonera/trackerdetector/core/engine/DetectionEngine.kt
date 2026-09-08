package pl.azonera.trackerdetector.core.engine

import pl.azonera.trackerdetector.core.dedup.DeviceDeduplicator
import pl.azonera.trackerdetector.core.model.DetectedDevice
import pl.azonera.trackerdetector.core.model.DeviceCategory
import pl.azonera.trackerdetector.core.model.BleDeviceReading
import pl.azonera.trackerdetector.core.model.SignalDistance
import pl.azonera.trackerdetector.core.model.TrackerSignature
import pl.azonera.trackerdetector.core.model.UserDeviceAction
import pl.azonera.trackerdetector.core.rssi.RssiAnalyzer
import pl.azonera.trackerdetector.core.scoring.RiskScorer
import pl.azonera.trackerdetector.core.scoring.ScoringInput
import pl.azonera.trackerdetector.core.signature.SignatureMatcher
import pl.azonera.trackerdetector.core.signature.TrackerSignatureDatabase

/**
 * Łączy deduplikację, dopasowanie sygnatur i scoring w jeden krok: z listy surowych
 * obserwacji BLE robi listę gotowych do wyświetlenia [DetectedDevice].
 *
 * Celowo nie ma żadnej zależności od Androida — to pozwala przetestować całą logikę
 * detekcji jednostkowo, bez emulatora ani SDK Androida.
 */
object DetectionEngine {

    fun aggregate(
        readings: List<BleDeviceReading>,
        scanDurationSeconds: Int,
        knownDeviceActions: Map<String, UserDeviceAction> = emptyMap(),
        pastSessionCounts: Map<String, Int> = emptyMap(),
        signatures: List<TrackerSignature> = TrackerSignatureDatabase.all
    ): List<DetectedDevice> {
        return DeviceDeduplicator.aggregate(readings).map { agg ->
            val lastReading = agg.lastReading
            val allMatches = SignatureMatcher.matchAll(lastReading, signatures)
            val bestMatch = allMatches.firstOrNull()

            val strongSignalRatio = agg.readings.count {
                RssiAnalyzer.distanceZone(it.rssi) == SignalDistance.VERY_CLOSE
            }.toDouble() / agg.readings.size

            val userAction = knownDeviceActions[agg.address] ?: UserDeviceAction.NONE
            val pastCount = pastSessionCounts[agg.address] ?: 0

            val scoringResult = RiskScorer.score(
                ScoringInput(
                    hasName = agg.mostCommonName != null,
                    detectionCount = agg.detectionCount,
                    scanDurationSeconds = scanDurationSeconds,
                    strongSignalRatio = strongSignalRatio,
                    matchedSignature = bestMatch,
                    isUserMarkedKnown = userAction == UserDeviceAction.MY_DEVICE,
                    seenInPastSessionsCount = pastCount
                )
            )

            DetectedDevice(
                address = agg.address,
                displayName = agg.mostCommonName,
                firstSeenMillis = agg.firstSeenMillis,
                lastSeenMillis = agg.lastSeenMillis,
                detectionCount = agg.detectionCount,
                lastRssi = lastReading.rssi,
                bestRssi = agg.bestRssi,
                averageRssi = agg.averageRssi,
                manufacturerCompanyIds = agg.manufacturerCompanyIds,
                lastManufacturerData = lastReading.manufacturerData,
                serviceUuids = agg.serviceUuids,
                rssiHistory = agg.rssiHistory,
                category = bestMatch?.category ?: DeviceCategory.UNKNOWN_BLE_DEVICE,
                matchedSignature = bestMatch,
                allMatchedSignatures = allMatches,
                riskScore = scoringResult.score,
                riskLevel = scoringResult.level,
                scoringFactors = scoringResult.factors,
                userAction = userAction,
                seenInPastSessionsCount = pastCount
            )
        }.sortedByDescending { it.riskScore }
    }
}
