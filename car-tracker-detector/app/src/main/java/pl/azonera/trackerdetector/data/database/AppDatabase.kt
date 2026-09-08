package pl.azonera.trackerdetector.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import pl.azonera.trackerdetector.data.database.dao.KnownDeviceDao
import pl.azonera.trackerdetector.data.database.dao.ScanHistoryDao
import pl.azonera.trackerdetector.data.database.entity.DetectedDeviceEntity
import pl.azonera.trackerdetector.data.database.entity.KnownDeviceEntity
import pl.azonera.trackerdetector.data.database.entity.ScanSessionEntity

@Database(
    entities = [ScanSessionEntity::class, DetectedDeviceEntity::class, KnownDeviceEntity::class],
    version = 1,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {

    abstract fun scanHistoryDao(): ScanHistoryDao
    abstract fun knownDeviceDao(): KnownDeviceDao

    companion object {
        private const val DB_NAME = "car_tracker_detector.db"

        @Volatile
        private var instance: AppDatabase? = null

        /**
         * Baza danych jest wyłącznie lokalna (local-first, patrz punkt 13 specyfikacji) —
         * nigdy nie jest synchronizowana z żadnym serwerem.
         */
        fun getInstance(context: Context): AppDatabase {
            return instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    DB_NAME
                ).build().also { instance = it }
            }
        }
    }
}
