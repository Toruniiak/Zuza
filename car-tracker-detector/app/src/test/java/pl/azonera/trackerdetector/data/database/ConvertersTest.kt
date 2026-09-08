package pl.azonera.trackerdetector.data.database

import org.junit.Assert.assertEquals
import org.junit.Test

class ConvertersTest {

    private val converters = Converters()

    @Test
    fun `int list round trip`() {
        val original = listOf(-40, -55, -90, 0)
        val encoded = converters.fromIntList(original)
        assertEquals(original, converters.toIntList(encoded))
    }

    @Test
    fun `empty int list round trip`() {
        assertEquals(emptyList<Int>(), converters.toIntList(converters.fromIntList(emptyList())))
    }

    @Test
    fun `int set round trip`() {
        val original = setOf(76, 117, 224)
        val encoded = converters.fromIntSet(original)
        assertEquals(original, converters.toIntSet(encoded))
    }

    @Test
    fun `string set round trip`() {
        val original = setOf("0000FEED-0000-1000-8000-00805F9B34FB", "180F")
        val encoded = converters.fromStringSet(original)
        assertEquals(original, converters.toStringSet(encoded))
    }

    @Test
    fun `empty string set round trip`() {
        assertEquals(emptySet<String>(), converters.toStringSet(converters.fromStringSet(emptySet())))
    }

    @Test
    fun `manufacturer data map round trip including zero bytes`() {
        val original = mapOf(
            0x004C to listOf(0x12.toByte(), 0x19.toByte(), 0x00.toByte()),
            0x0075 to listOf<Byte>()
        )
        val encoded = converters.fromManufacturerDataMap(original)
        assertEquals(original, converters.toManufacturerDataMap(encoded))
    }

    @Test
    fun `empty manufacturer data map round trip`() {
        assertEquals(emptyMap<Int, List<Byte>>(), converters.toManufacturerDataMap(converters.fromManufacturerDataMap(emptyMap())))
    }
}
