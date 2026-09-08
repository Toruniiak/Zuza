package pl.azonera.trackerdetector.core.model

/** Poziom pewności sygnatury — jak bardzo można ufać dopasowaniu. */
enum class SignatureConfidence { LOW, MEDIUM, HIGH }

/**
 * Wzorzec dopasowania danych producenta (Manufacturer Specific Data, AD type 0xFF).
 * `companyId` odpowiada 16-bitowemu identyfikatorowi firmy przyznanemu przez Bluetooth SIG
 * (Android już go wydziela z surowych danych reklamowych). `payloadPrefix`, jeśli podany,
 * musi być prefiksem bajtów danych (bez samego companyId).
 */
data class ManufacturerDataPattern(
    val companyId: Int,
    val payloadPrefix: List<Byte>? = null
)

/**
 * Pojedynczy wpis w lokalnej bazie sygnatur potencjalnych urządzeń śledzących.
 *
 * Baza jest rozszerzalna — patrz [pl.azonera.trackerdetector.core.signature.TrackerSignatureDatabase].
 * Pole [verified] mówi wprost, czy dopasowanie pochodzi z oficjalnie potwierdzonego źródła
 * (np. rejestru Bluetooth SIG) czy z nieoficjalnych obserwacji/community research — w tym
 * drugim przypadku sygnatura MUSI być traktowana jako niepewna wskazówka, nie dowód.
 */
data class TrackerSignature(
    val id: String,
    val manufacturer: String?,
    val manufacturerDataPattern: ManufacturerDataPattern?,
    val serviceUuid: String?,
    val deviceNamePattern: Regex?,
    val category: DeviceCategory,
    val confidence: SignatureConfidence,
    val verified: Boolean,
    val descriptionPl: String
)
