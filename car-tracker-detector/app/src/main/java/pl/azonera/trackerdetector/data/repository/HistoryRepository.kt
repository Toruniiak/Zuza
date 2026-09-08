package pl.azonera.trackerdetector.data.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import pl.azonera.trackerdetector.core.model.ScanSummary
import pl.azonera.trackerdetector.data.database.dao.ScanHistoryDao
import pl.azonera.trackerdetector.data.database.entity.ScanSessionEntity
import pl.azonera.trackerdetector.data.database.toDomain
import kotlin.math.max

/** Lekki wiersz listy historii — bez ładowania pełnej listy urządzeń dla każdej sesji. */
data class ScanSummaryListItem(
    val sessionId: String,
    val startedAtMillis: Long,
    val totalDevicesFound: Int,
    val suspiciousAndHighRiskCount: Int
)

/** Historia skanów — wyłącznie lokalny odczyt/zapis, bez żadnej komunikacji sieciowej. */
interface HistoryRepository {
    fun observeSessionSummaries(): Flow<List<ScanSessionEntity>>
    suspend fun getFullSession(sessionId: String): ScanSummary?
    fun observeSummaries(): Flow<List<ScanSummaryListItem>>
    suspend fun deleteSession(sessionId: String)
    suspend fun deleteAll()
}

class DefaultHistoryRepository(private val historyDao: ScanHistoryDao) : HistoryRepository {

    override fun observeSessionSummaries(): Flow<List<ScanSessionEntity>> = historyDao.observeSessions()

    override suspend fun getFullSession(sessionId: String): ScanSummary? {
        val session = historyDao.getSession(sessionId) ?: return null
        val durationSeconds = max(1, ((session.finishedAtMillis - session.startedAtMillis) / 1000).toInt())
        val devices = historyDao.devicesForSession(sessionId).map { it.toDomain(durationSeconds) }
        return ScanSummary(
            sessionId = session.id,
            startedAtMillis = session.startedAtMillis,
            finishedAtMillis = session.finishedAtMillis,
            totalDevicesFound = session.totalDevicesFound,
            lowRiskCount = session.lowRiskCount,
            unknownCount = session.unknownCount,
            suspiciousCount = session.suspiciousCount,
            highRiskCount = session.highRiskCount,
            devices = devices
        )
    }

    override fun observeSummaries(): Flow<List<ScanSummaryListItem>> = observeSessionSummaries().map { sessions ->
        sessions.map {
            ScanSummaryListItem(
                sessionId = it.id,
                startedAtMillis = it.startedAtMillis,
                totalDevicesFound = it.totalDevicesFound,
                suspiciousAndHighRiskCount = it.suspiciousCount + it.highRiskCount
            )
        }
    }

    override suspend fun deleteSession(sessionId: String) = historyDao.deleteSession(sessionId)

    override suspend fun deleteAll() {
        historyDao.deleteAllSessions()
    }
}
