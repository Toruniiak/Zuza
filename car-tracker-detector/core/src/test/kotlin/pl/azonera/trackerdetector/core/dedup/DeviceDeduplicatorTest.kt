package pl.azonera.trackerdetector.core.dedup

import pl.azonera.trackerdetector.core.model.BleDeviceReading
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class DeviceDeduplicatorTest {

    private fun reading(address: String, rssi: Int, timestamp: Long, name: String? = "Device") =
        BleDeviceReading(address = address, name = name, rssi = rssi, timestampMillis = timestamp)

    @Test
    fun `groups readings by address`() {
        val readings = listOf(
            reading("AA:AA:AA:AA:AA:AA", -50, 1000),
            reading("BB:BB:BB:BB:BB:BB", -60, 1001),
            reading("AA:AA:AA:AA:AA:AA", -45, 1002)
        )
        val aggregated = DeviceDeduplicator.aggregate(readings)
        assertEquals(2, aggregated.size)
        val a = aggregated.first { it.address == "AA:AA:AA:AA:AA:AA" }
        assertEquals(2, a.detectionCount)
    }

    @Test
    fun `computes first, last seen and best rssi correctly`() {
        val readings = listOf(
            reading("AA", -70, 1000),
            reading("AA", -40, 2000),
            reading("AA", -55, 1500)
        )
        val a = DeviceDeduplicator.aggregate(readings).single()
        assertEquals(1000L, a.firstSeenMillis)
        assertEquals(2000L, a.lastSeenMillis)
        assertEquals(-40, a.bestRssi)
        assertEquals(2000L, a.lastReading.timestampMillis)
    }

    @Test
    fun `rssi history is sorted by time`() {
        val readings = listOf(
            reading("AA", -70, 2000),
            reading("AA", -40, 1000),
            reading("AA", -55, 1500)
        )
        val a = DeviceDeduplicator.aggregate(readings).single()
        assertEquals(listOf(-40, -55, -70), a.rssiHistory)
    }

    @Test
    fun `most common name wins over occasional alternate advertised name`() {
        val readings = listOf(
            reading("AA", -50, 1000, name = "MyBuds"),
            reading("AA", -50, 1001, name = "MyBuds"),
            reading("AA", -50, 1002, name = null)
        )
        val a = DeviceDeduplicator.aggregate(readings).single()
        assertEquals("MyBuds", a.mostCommonName)
    }

    @Test
    fun `empty input yields empty aggregation`() {
        assertTrue(DeviceDeduplicator.aggregate(emptyList()).isEmpty())
    }

    @Test
    fun `average rssi is computed across all readings`() {
        val readings = listOf(reading("AA", -40, 1), reading("AA", -60, 2))
        val a = DeviceDeduplicator.aggregate(readings).single()
        assertEquals(-50, a.averageRssi)
    }
}
