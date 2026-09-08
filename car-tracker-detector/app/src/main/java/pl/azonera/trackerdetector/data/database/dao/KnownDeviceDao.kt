package pl.azonera.trackerdetector.data.database.dao

import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow
import pl.azonera.trackerdetector.data.database.entity.KnownDeviceEntity

@androidx.room.Dao
interface KnownDeviceDao {

    @Query("SELECT * FROM known_devices WHERE address = :address")
    suspend fun get(address: String): KnownDeviceEntity?

    @Query("SELECT * FROM known_devices")
    fun observeAll(): Flow<List<KnownDeviceEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: KnownDeviceEntity)

    @Query("DELETE FROM known_devices WHERE address = :address")
    suspend fun delete(address: String)

    @Query("DELETE FROM known_devices")
    suspend fun deleteAll()
}
