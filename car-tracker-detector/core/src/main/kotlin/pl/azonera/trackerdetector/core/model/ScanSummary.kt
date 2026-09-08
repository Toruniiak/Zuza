package pl.azonera.trackerdetector.core.model

/** Podsumowanie jednej sesji skanowania — zapisywane do historii lokalnej. */
data class ScanSummary(
    val sessionId: String,
    val startedAtMillis: Long,
    val finishedAtMillis: Long,
    val totalDevicesFound: Int,
    val lowRiskCount: Int,
    val unknownCount: Int,
    val suspiciousCount: Int,
    val highRiskCount: Int,
    val devices: List<DetectedDevice>
)
