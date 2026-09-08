package pl.azonera.trackerdetector.data.database.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index

/**
 * Jedno urządzenie zaobserwowane w ramach jednej sesji skanowania.
 *
 * Wynik scoringu (score/level) jest zapisywany "na moment zapisu" jako migawka — jeśli
 * algorytm scoringu zostanie później zmieniony (np. w nowej wersji aplikacji), historyczne
 * wpisy nadal pokazują ocenę, jaką faktycznie zobaczył użytkownik w danej chwili.
 */
@Entity(
    tableName = "detected_devices",
    primaryKeys = ["sessionId", "address"],
    foreignKeys = [
        ForeignKey(
            entity = ScanSessionEntity::class,
            parentColumns = ["id"],
            childColumns = ["sessionId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("sessionId"), Index("address")]
)
data class DetectedDeviceEntity(
    val sessionId: String,
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
    val category: String,
    val matchedSignatureId: String?,
    val riskScore: Int,
    val riskLevel: String,
    val userAction: String,
    val seenInPastSessionsCount: Int
)
