package pl.azonera.trackerdetector.core.engine

import pl.azonera.trackerdetector.core.model.BleDeviceReading
import pl.azonera.trackerdetector.core.model.RiskLevel
import pl.azonera.trackerdetector.core.model.UserDeviceAction
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class DetectionEngineTest {

    private fun reading(address: String, rssi: Int, t: Long, name: String? = "Device") =
        BleDeviceReading(address = address, name = name, rssi = rssi, timestampMillis = t)

    @Test
    fun `aggregates readings into one device per address with correct counts`() {
        val readings = listOf(
            reading("AA", -50, 1000),
            reading("AA", -48, 1500),
            reading("BB", -70, 1200)
        )
        val devices = DetectionEngine.aggregate(readings, scanDurationSeconds = 60)
        assertEquals(2, devices.size)
        val a = devices.first { it.address == "AA" }
        assertEquals(2, a.detectionCount)
    }

    @Test
    fun `user marked device gets zero risk score even with suspicious signature`() {
        val readings = listOf(reading("AA", -40, 1000, name = "My AirTag"))
        val devices = DetectionEngine.aggregate(
            readings,
            scanDurationSeconds = 60,
            knownDeviceActions = mapOf("AA" to UserDeviceAction.MY_DEVICE)
        )
        val device = devices.single()
        assertEquals(0, device.riskScore)
        assertEquals(RiskLevel.LOW, device.riskLevel)
    }

    @Test
    fun `devices are sorted by descending risk score`() {
        val readings = listOf(
            reading("BENIGN", -50, 1000, name = "Sony WH-1000"),
            reading("SUSPICIOUS", -40, 1000, name = "gps-tracker-mini")
        )
        val devices = DetectionEngine.aggregate(readings, scanDurationSeconds = 60)
        assertTrue(devices.first().riskScore >= devices.last().riskScore)
    }

    @Test
    fun `past session recurrence is propagated into the result`() {
        val readings = listOf(reading("AA", -50, 1000))
        val devices = DetectionEngine.aggregate(
            readings,
            scanDurationSeconds = 60,
            pastSessionCounts = mapOf("AA" to 3)
        )
        assertEquals(3, devices.single().seenInPastSessionsCount)
    }

    @Test
    fun `empty input yields empty output without crashing`() {
        assertTrue(DetectionEngine.aggregate(emptyList(), scanDurationSeconds = 60).isEmpty())
    }
}
