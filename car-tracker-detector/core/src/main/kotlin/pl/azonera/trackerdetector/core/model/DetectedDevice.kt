package pl.azonera.trackerdetector.core.model

/**
 * Zagregowany widok jednego urządzenia w ramach sesji skanowania — wynik połączenia
 * wielu [BleDeviceReading] o tym samym adresie przez deduplikator.
 *
 * UWAGA (ograniczenie technologiczne): niektóre urządzenia BLE stosują losowe,
 * rotowane adresy MAC (privacy-friendly address randomization). To realne ograniczenie
 * Androida/BLE — to samo fizyczne urządzenie może w rzadkich przypadkach zostać policzone
 * jako dwa różne wpisy, jeśli zmieni adres w trakcie skanowania.
 */
data class DetectedDevice(
    val address: String,
    val displayName: String?,
    val firstSeenMillis: Long,
    val lastSeenMillis: Long,
    val detectionCount: Int,
    val lastRssi: Int,
    val bestRssi: Int,
    val averageRssi: Int,
    val manufacturerCompanyIds: Set<Int>,
    val lastManufacturerData: Map<Int, List<Byte>>,
    val serviceUuids: Set<String>,
    val rssiHistory: List<Int>,
    val category: DeviceCategory,
    val matchedSignature: TrackerSignature?,
    val allMatchedSignatures: List<TrackerSignature> = emptyList(),
    val riskScore: Int,
    val riskLevel: RiskLevel,
    val scoringFactors: List<pl.azonera.trackerdetector.core.scoring.ScoringFactor> = emptyList(),
    val userAction: UserDeviceAction = UserDeviceAction.NONE,
    val seenInPastSessionsCount: Int = 0
)
