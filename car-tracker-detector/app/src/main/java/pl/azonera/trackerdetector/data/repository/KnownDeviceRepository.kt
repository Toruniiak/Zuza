package pl.azonera.trackerdetector.data.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import pl.azonera.trackerdetector.core.model.UserDeviceAction
import pl.azonera.trackerdetector.data.database.dao.KnownDeviceDao
import pl.azonera.trackerdetector.data.database.entity.KnownDeviceEntity

/**
 * Decyzje użytkownika o urządzeniach ("Moje urządzenie" / "Ignoruj" / "Obserwuj"),
 * przechowywane wyłącznie lokalnie i stosowane przy każdym kolejnym skanie.
 */
interface KnownDeviceRepository {
    fun observeActionsByAddress(): Flow<Map<String, UserDeviceAction>>
    suspend fun setAction(address: String, action: UserDeviceAction)
    suspend fun clearAll()
}

class DefaultKnownDeviceRepository(private val dao: KnownDeviceDao) : KnownDeviceRepository {

    override fun observeActionsByAddress(): Flow<Map<String, UserDeviceAction>> = dao.observeAll().map { list ->
        list.associate { it.address to UserDeviceAction.valueOf(it.action) }
    }

    override suspend fun setAction(address: String, action: UserDeviceAction) {
        if (action == UserDeviceAction.NONE) {
            dao.delete(address)
        } else {
            dao.upsert(
                KnownDeviceEntity(
                    address = address,
                    action = action.name,
                    updatedAtMillis = System.currentTimeMillis()
                )
            )
        }
    }

    override suspend fun clearAll() = dao.deleteAll()
}
