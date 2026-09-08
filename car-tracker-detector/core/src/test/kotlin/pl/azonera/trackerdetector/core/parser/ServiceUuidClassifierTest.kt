package pl.azonera.trackerdetector.core.parser

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ServiceUuidClassifierTest {

    @Test
    fun `extracts short form from full 128-bit uuid`() {
        assertEquals("FEED", ServiceUuidClassifier.shortForm("0000feed-0000-1000-8000-00805f9b34fb"))
    }

    @Test
    fun `passes through already-short uuid`() {
        assertEquals("FEED", ServiceUuidClassifier.shortForm("feed"))
        assertEquals("FEED", ServiceUuidClassifier.shortForm("FEED"))
    }

    @Test
    fun `recognizes known tile uuid`() {
        assertTrue(ServiceUuidClassifier.isKnown(ServiceUuidClassifier.TILE))
        assertEquals(
            "Tile, Inc. (usługa BLE zarejestrowana dla Tile)",
            ServiceUuidClassifier.nameFor("0000FEED-0000-1000-8000-00805F9B34FB")
        )
    }

    @Test
    fun `unknown uuid is not classified`() {
        assertFalse(ServiceUuidClassifier.isKnown("0000ABCD-0000-1000-8000-00805F9B34FB"))
        assertNull(ServiceUuidClassifier.nameFor("0000ABCD-0000-1000-8000-00805F9B34FB"))
    }
}
