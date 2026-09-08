package pl.azonera.trackerdetector.core.parser

/**
 * Sparsowana informacja o jednym bloku Manufacturer Specific Data.
 *
 * [looksLikeAppleOfflineFinding] opiera się o publicznie udokumentowany (przez niezależne
 * badania społeczności, np. projekt OpenHaystack — nie przez oficjalną specyfikację Apple)
 * wzorzec pierwszego bajtu payloadu (typ 0x12) dla reklam sieci "Find My" w trybie offline
 * finding. To NIE jest oficjalnie potwierdzone przez Apple, więc wynikające z tego
 * dopasowanie sygnatury jest oznaczane jako niezweryfikowane (`verified = false`).
 */
data class ManufacturerDataInfo(
    val companyId: Int,
    val companyName: String?,
    val payload: List<Byte>,
    val isKnownCompany: Boolean,
    val looksLikeAppleOfflineFinding: Boolean
)

object ManufacturerDataParser {

    private const val APPLE_OFFLINE_FINDING_TYPE: Byte = 0x12

    /**
     * Android (`ScanRecord.getManufacturerSpecificData()`) zwraca już rozdzielone
     * companyId (klucz SparseArray) i payload (bez companyId w danych) — to jest
     * format wejściowy tej funkcji.
     */
    fun parse(companyId: Int, payload: List<Byte>): ManufacturerDataInfo {
        val looksLikeAppleOfflineFinding =
            companyId == BluetoothCompanyIds.APPLE &&
                payload.isNotEmpty() &&
                payload[0] == APPLE_OFFLINE_FINDING_TYPE

        return ManufacturerDataInfo(
            companyId = companyId,
            companyName = BluetoothCompanyIds.nameFor(companyId),
            payload = payload,
            isKnownCompany = BluetoothCompanyIds.isKnown(companyId),
            looksLikeAppleOfflineFinding = looksLikeAppleOfflineFinding
        )
    }

    /**
     * Parsuje surowe bajty struktury AD (typ 0xFF): pierwsze 2 bajty (little-endian) to
     * companyId, reszta to payload. Zwraca `null`, jeśli danych jest za mało (< 2 bajty).
     */
    fun parseRaw(rawAdBytes: List<Byte>): ManufacturerDataInfo? {
        if (rawAdBytes.size < 2) return null
        val companyId = (rawAdBytes[0].toInt() and 0xFF) or ((rawAdBytes[1].toInt() and 0xFF) shl 8)
        val payload = rawAdBytes.drop(2)
        return parse(companyId, payload)
    }
}
