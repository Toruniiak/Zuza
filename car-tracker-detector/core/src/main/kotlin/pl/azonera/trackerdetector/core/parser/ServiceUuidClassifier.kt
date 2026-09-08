package pl.azonera.trackerdetector.core.parser

/**
 * Niewielki, zweryfikowany wycinek oficjalnego rejestru Bluetooth SIG
 * "16-bit UUID Numbers Document" (assigned service UUIDs). Pełna postać 128-bitowa
 * standardowych usług BLE to `0000XXXX-0000-1000-8000-00805F9B34FB`, gdzie XXXX to
 * poniższe 16-bitowe ID — tak zwraca je też Android w `ScanResult.getScanRecord().getServiceUuids()`.
 */
object ServiceUuidClassifier {

    /** Krótkie (16-bit) UUID w formie hex string bez prefiksu, wielkimi literami. */
    const val TILE = "FEED"
    const val BATTERY_SERVICE = "180F"
    const val HID_OVER_GATT = "1812"
    const val DEVICE_INFORMATION = "180A"

    private val KNOWN_NAMES: Map<String, String> = mapOf(
        TILE to "Tile, Inc. (usługa BLE zarejestrowana dla Tile)",
        BATTERY_SERVICE to "Standardowa usługa GATT: Battery Service",
        HID_OVER_GATT to "Standardowa usługa GATT: HID over GATT (np. klawiatura/mysz)",
        DEVICE_INFORMATION to "Standardowa usługa GATT: Device Information"
    )

    /** Wyciąga krótką formę 16-bit z pełnego UUID 128-bit lub zwraca wejście, jeśli już jest krótkie. */
    fun shortForm(uuid: String): String {
        val normalized = uuid.trim().uppercase().removePrefix("0X")
        val fullPattern = Regex("^0000([0-9A-F]{4})-0000-1000-8000-00805F9B34FB$")
        val match = fullPattern.find(normalized)
        return match?.groupValues?.get(1) ?: normalized.removePrefix("0X")
    }

    fun nameFor(uuid: String): String? = KNOWN_NAMES[shortForm(uuid)]

    fun isKnown(uuid: String): Boolean = KNOWN_NAMES.containsKey(shortForm(uuid))
}
