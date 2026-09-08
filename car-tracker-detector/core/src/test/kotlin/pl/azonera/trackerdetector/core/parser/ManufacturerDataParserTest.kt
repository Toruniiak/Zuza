package pl.azonera.trackerdetector.core.parser

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ManufacturerDataParserTest {

    @Test
    fun `recognizes known company id`() {
        val info = ManufacturerDataParser.parse(BluetoothCompanyIds.APPLE, listOf(0x10, 0x02))
        assertTrue(info.isKnownCompany)
        assertEquals("Apple, Inc.", info.companyName)
    }

    @Test
    fun `unknown company id is reported as unknown, not guessed`() {
        val info = ManufacturerDataParser.parse(0x9999, listOf(0x01))
        assertFalse(info.isKnownCompany)
        assertNull(info.companyName)
    }

    @Test
    fun `detects apple offline finding type byte`() {
        val info = ManufacturerDataParser.parse(BluetoothCompanyIds.APPLE, listOf(0x12, 0x19, 0x00))
        assertTrue(info.looksLikeAppleOfflineFinding)
    }

    @Test
    fun `does not flag offline finding for other apple payload types`() {
        val info = ManufacturerDataParser.parse(BluetoothCompanyIds.APPLE, listOf(0x10, 0x02))
        assertFalse(info.looksLikeAppleOfflineFinding)
    }

    @Test
    fun `does not flag offline finding for non-apple company with same first byte`() {
        val info = ManufacturerDataParser.parse(BluetoothCompanyIds.SAMSUNG, listOf(0x12, 0x19))
        assertFalse(info.looksLikeAppleOfflineFinding)
    }

    @Test
    fun `parseRaw splits little endian company id and payload`() {
        // company id 0x004C (Apple) little-endian = 0x4C, 0x00
        val info = ManufacturerDataParser.parseRaw(listOf(0x4C, 0x00, 0x12, 0x19))
        requireNotNull(info)
        assertEquals(BluetoothCompanyIds.APPLE, info.companyId)
        assertEquals(listOf<Byte>(0x12, 0x19), info.payload)
        assertTrue(info.looksLikeAppleOfflineFinding)
    }

    @Test
    fun `parseRaw returns null for too-short input`() {
        assertNull(ManufacturerDataParser.parseRaw(listOf(0x01)))
        assertNull(ManufacturerDataParser.parseRaw(emptyList()))
    }

    @Test
    fun `parse handles empty payload without crashing`() {
        val info = ManufacturerDataParser.parse(BluetoothCompanyIds.APPLE, emptyList())
        assertFalse(info.looksLikeAppleOfflineFinding)
    }
}
