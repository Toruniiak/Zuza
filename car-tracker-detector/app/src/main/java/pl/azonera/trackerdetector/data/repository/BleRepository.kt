package pl.azonera.trackerdetector.data.repository

import kotlinx.coroutines.flow.Flow
import pl.azonera.trackerdetector.core.model.ScanSummary
import pl.azonera.trackerdetector.data.bluetooth.BleEvent
import pl.azonera.trackerdetector.data.bluetooth.BleScanner
import pl.azonera.trackerdetector.data.database.dao.ScanHistoryDao
import pl.azonera.trackerdetector.data.database.entity.ScanSessionEntity
import pl.azonera.trackerdetector.data.database.toEntity

/**
 * Orkiestruje pojedynczy skan na żywo oraz zapis jego wyniku do lokalnej historii.
 *
 * Interfejs (Repository pattern) - dzięki temu ViewModel można testować z fałszywą
 * implementacją, bez prawdziwego Bluetootha ani bazy danych. Patrz `FakeBleRepository`
 * w testach jednostkowych.
 */
interface BleRepository {
    fun scanEvents(): Flow<BleEvent>
    suspend fun pastSessionCounts(addresses: Set<String>, excludeSessionId: String): Map<String, Int>
    suspend fun saveSession(summary: ScanSummary)
}

class DefaultBleRepository(
    private val bleScanner: BleScanner,
    private val historyDao: ScanHistoryDao
) : BleRepository {

    override fun scanEvents(): Flow<BleEvent> = bleScanner.scan()

    override suspend fun pastSessionCounts(addresses: Set<String>, excludeSessionId: String): Map<String, Int> =
        addresses.associateWith { historyDao.pastSessionCountForAddress(it, excludeSessionId) }

    override suspend fun saveSession(summary: ScanSummary) {
        val sessionEntity = ScanSessionEntity(
            id = summary.sessionId,
            startedAtMillis = summary.startedAtMillis,
            finishedAtMillis = summary.finishedAtMillis,
            totalDevicesFound = summary.totalDevicesFound,
            lowRiskCount = summary.lowRiskCount,
            unknownCount = summary.unknownCount,
            suspiciousCount = summary.suspiciousCount,
            highRiskCount = summary.highRiskCount
        )
        val deviceEntities = summary.devices.map { it.toEntity(summary.sessionId) }
        historyDao.insertSessionWithDevices(sessionEntity, deviceEntities)
    }
}
