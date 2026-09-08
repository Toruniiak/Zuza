package pl.azonera.trackerdetector.data.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Decyzja użytkownika o konkretnym adresie MAC ("Moje urządzenie" / "Ignoruj" / "Obserwuj"),
 * zapamiętywana lokalnie i stosowana przy kolejnych skanach.
 *
 * Ograniczenie: część urządzeń BLE losowo rotuje adres MAC (funkcja prywatności samego BLE),
 * więc oznaczenie po adresie może w rzadkich przypadkach nie "rozpoznać" tego samego
 * fizycznego urządzenia przy następnym skanie. To ograniczenie technologii BLE, nie tej bazy.
 */
@Entity(tableName = "known_devices")
data class KnownDeviceEntity(
    @PrimaryKey val address: String,
    val action: String,
    val updatedAtMillis: Long,
    val label: String? = null
)
