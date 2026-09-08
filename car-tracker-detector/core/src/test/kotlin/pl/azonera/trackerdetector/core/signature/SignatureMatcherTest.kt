package pl.azonera.trackerdetector.core.signature

import pl.azonera.trackerdetector.core.model.BleDeviceReading
import pl.azonera.trackerdetector.core.parser.BluetoothCompanyIds
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class SignatureMatcherTest {

    private fun reading(
        name: String? = null,
        manufacturerData: Map<Int, List<Byte>> = emptyMap(),
        serviceUuids: List<String> = emptyList()
    ) = BleDeviceReading(
        address = "AA:BB:CC:DD:EE:FF",
        name = name,
        rssi = -50,
        timestampMillis = 0L,
        manufacturerData = manufacturerData,
        serviceUuids = serviceUuids
    )

    @Test
    fun `matches tile by service uuid`() {
        val r = reading(serviceUuids = listOf("0000FEED-0000-1000-8000-00805F9B34FB"))
        val match = SignatureMatcher.bestMatch(r)
        assertEquals("tile-service-uuid", match?.id)
    }

    @Test
    fun `matches apple offline finding by manufacturer data prefix`() {
        val r = reading(manufacturerData = mapOf(BluetoothCompanyIds.APPLE to listOf(0x12, 0x19, 0x00)))
        val match = SignatureMatcher.bestMatch(r)
        assertEquals("apple-offline-finding", match?.id)
    }

    @Test
    fun `does not match apple manufacturer data with unrelated type byte`() {
        val r = reading(manufacturerData = mapOf(BluetoothCompanyIds.APPLE to listOf(0x10, 0x02)))
        val match = SignatureMatcher.bestMatch(r)
        assertNull(match)
    }

    @Test
    fun `matches by device name pattern case-insensitively`() {
        val r = reading(name = "My AirTag")
        val match = SignatureMatcher.bestMatch(r)
        assertEquals("name-pattern-smart-tag", match?.id)
    }

    @Test
    fun `unrelated device with generic name has no match`() {
        val r = reading(name = "Kitchen Speaker")
        assertNull(SignatureMatcher.bestMatch(r))
    }

    @Test
    fun `matchAll returns matches ordered by descending confidence`() {
        // service uuid battery (LOW, verified) + name matches gps tracker pattern (LOW) simultaneously
        val r = reading(
            name = "gps-tracker-01",
            serviceUuids = listOf("0000FEED-0000-1000-8000-00805F9B34FB")
        )
        val matches = SignatureMatcher.matchAll(r)
        assertTrue(matches.size >= 2)
        // tile signature has MEDIUM confidence, should be ranked before LOW-confidence name pattern
        assertEquals("tile-service-uuid", matches.first().id)
    }

    @Test
    fun `no data at all yields no match`() {
        assertNull(SignatureMatcher.bestMatch(reading()))
    }
}
