package pl.azonera.trackerdetector.core.dedup

import pl.azonera.trackerdetector.core.model.BleDeviceReading

/**
 * Agreguje strumień pojedynczych obserwacji [BleDeviceReading] w statystyki per adres.
 *
 * Ograniczenie: część urządzeń BLE stosuje rotację losowych adresów MAC (privacy feature
 * systemu BLE), więc deduplikacja po adresie może w rzadkich przypadkach rozdzielić to samo
 * fizyczne urządzenie na dwa wpisy. To ograniczenie technologii, nie błąd aplikacji.
 */
data class AggregatedReadings(
    val address: String,
    val readings: List<BleDeviceReading>
) {
    val firstSeenMillis: Long get() = readings.minOf { it.timestampMillis }
    val lastSeenMillis: Long get() = readings.maxOf { it.timestampMillis }
    val detectionCount: Int get() = readings.size
    val lastReading: BleDeviceReading get() = readings.maxBy { it.timestampMillis }
    val bestRssi: Int get() = readings.maxOf { it.rssi }
    val averageRssi: Int get() = readings.map { it.rssi }.average().toInt()
    val rssiHistory: List<Int> get() = readings.sortedBy { it.timestampMillis }.map { it.rssi }
    val manufacturerCompanyIds: Set<Int> get() = readings.flatMap { it.manufacturerData.keys }.toSet()
    val serviceUuids: Set<String> get() = readings.flatMap { it.serviceUuids }.toSet()

    /** Nazwa najczęściej widziana w obserwacjach (urządzenia czasem zmieniają nazwę reklamy). */
    val mostCommonName: String? get() = readings.mapNotNull { it.name }
        .groupingBy { it }
        .eachCount()
        .maxByOrNull { it.value }
        ?.key
}

object DeviceDeduplicator {

    fun aggregate(readings: List<BleDeviceReading>): List<AggregatedReadings> {
        return readings.groupBy { it.address }
            .map { (address, group) -> AggregatedReadings(address, group) }
    }
}
