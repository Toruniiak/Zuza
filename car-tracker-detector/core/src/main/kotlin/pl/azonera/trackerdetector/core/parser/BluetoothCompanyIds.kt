package pl.azonera.trackerdetector.core.parser

/**
 * Niewielki, ręcznie zweryfikowany wycinek publicznego rejestru Bluetooth SIG
 * "Company Identifiers" (16-bitowe ID producenta w Manufacturer Specific Data).
 *
 * Celowo zawiera tylko pozycje, co do których mamy wysoką pewność — to NIE jest pełna
 * kopia rejestru SIG. Nieznane ID nie są tu zgadywane.
 *
 * Samo rozpoznanie producenta (np. "Apple") NIE oznacza, że urządzenie jest lokalizatorem.
 * Telefony, słuchawki, zegarki i smart tagi tego samego producenta używają tego samego ID.
 */
object BluetoothCompanyIds {
    const val APPLE = 0x004C
    const val MICROSOFT = 0x0006
    const val SAMSUNG = 0x0075
    const val GOOGLE = 0x00E0
    const val TILE_INC = 0x00E4

    private val KNOWN: Map<Int, String> = mapOf(
        APPLE to "Apple, Inc.",
        MICROSOFT to "Microsoft",
        SAMSUNG to "Samsung Electronics Co. Ltd.",
        GOOGLE to "Google LLC",
        TILE_INC to "Tile, Inc."
    )

    fun nameFor(companyId: Int): String? = KNOWN[companyId]

    fun isKnown(companyId: Int): Boolean = KNOWN.containsKey(companyId)
}
