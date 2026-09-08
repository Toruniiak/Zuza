package pl.azonera.trackerdetector.data.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "scan_sessions")
data class ScanSessionEntity(
    @PrimaryKey val id: String,
    val startedAtMillis: Long,
    val finishedAtMillis: Long,
    val totalDevicesFound: Int,
    val lowRiskCount: Int,
    val unknownCount: Int,
    val suspiciousCount: Int,
    val highRiskCount: Int
)
