package pl.azonera.trackerdetector.core.model

/**
 * Pojedyncza, surowa obserwacja pakietu advertising BLE — dokładnie to, co Android
 * udostępnia przez `ScanResult`/`ScanRecord`. Żadne dane nie są tu dosyntetyzowane.
 *
 * Manufacturer data i service data trzymamy jako `List<Byte>` (nie `ByteArray`), żeby
 * `equals`/`hashCode` działały strukturalnie — istotne przy deduplikacji i testach.
 */
data class BleDeviceReading(
    val address: String,
    val name: String?,
    val rssi: Int,
    val timestampMillis: Long,
    val manufacturerData: Map<Int, List<Byte>> = emptyMap(),
    val serviceUuids: List<String> = emptyList(),
    val serviceData: Map<String, List<Byte>> = emptyMap(),
    val isConnectable: Boolean = true,
    val txPowerLevel: Int? = null
)
