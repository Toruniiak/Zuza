package pl.azonera.trackerdetector.data.database.dao

import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow
import pl.azonera.trackerdetector.data.database.entity.DetectedDeviceEntity
import pl.azonera.trackerdetector.data.database.entity.ScanSessionEntity

@androidx.room.Dao
interface ScanHistoryDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: ScanSessionEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDevices(devices: List<DetectedDeviceEntity>)

    @Transaction
    suspend fun insertSessionWithDevices(session: ScanSessionEntity, devices: List<DetectedDeviceEntity>) {
        insertSession(session)
        insertDevices(devices)
    }

    @Query("SELECT * FROM scan_sessions ORDER BY startedAtMillis DESC")
    fun observeSessions(): Flow<List<ScanSessionEntity>>

    @Query("SELECT * FROM scan_sessions WHERE id = :sessionId")
    suspend fun getSession(sessionId: String): ScanSessionEntity?

    @Query("SELECT * FROM detected_devices WHERE sessionId = :sessionId")
    suspend fun devicesForSession(sessionId: String): List<DetectedDeviceEntity>

    /** Liczba INNYCH, wcześniejszych sesji, w których widziano ten sam adres MAC. */
    @Query(
        "SELECT COUNT(DISTINCT sessionId) FROM detected_devices " +
            "WHERE address = :address AND sessionId != :excludeSessionId"
    )
    suspend fun pastSessionCountForAddress(address: String, excludeSessionId: String): Int

    @Query("DELETE FROM scan_sessions WHERE id = :sessionId")
    suspend fun deleteSession(sessionId: String)

    @Query("DELETE FROM scan_sessions")
    suspend fun deleteAllSessions(): Int

    @Delete
    suspend fun deleteDevices(devices: List<DetectedDeviceEntity>)
}
