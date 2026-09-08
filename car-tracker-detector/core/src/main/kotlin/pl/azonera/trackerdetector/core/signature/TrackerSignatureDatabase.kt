package pl.azonera.trackerdetector.core.signature

import pl.azonera.trackerdetector.core.model.DeviceCategory
import pl.azonera.trackerdetector.core.model.ManufacturerDataPattern
import pl.azonera.trackerdetector.core.model.SignatureConfidence
import pl.azonera.trackerdetector.core.model.TrackerSignature
import pl.azonera.trackerdetector.core.parser.BluetoothCompanyIds
import pl.azonera.trackerdetector.core.parser.ServiceUuidClassifier

/**
 * Lokalna, statyczna baza sygnatur potencjalnych urządzeń śledzących i typowych urządzeń
 * BLE spotykanych w samochodzie.
 *
 * ZASADA: żadna sygnatura nie jest tu wymyślona "na oko". Każda ma jawnie oznaczone pole
 * [TrackerSignature.verified] — `true` tylko dla wzorców opartych o oficjalnie
 * przyznane identyfikatory Bluetooth SIG (company ID, service UUID). Wzorce oparte
 * o nazwy urządzeń lub nieoficjalne badania (np. Apple offline finding) są `verified = false`
 * i mają maksymalnie średnią pewność ([SignatureConfidence.MEDIUM]) — nazwę i część
 * manufacturer data można łatwo sfałszować lub zmienić.
 *
 * Baza jest rozszerzalna: aby dodać nową sygnaturę, dopisz kolejny [TrackerSignature]
 * do listy [all]. Patrz README.md, sekcja "Dodawanie nowych sygnatur".
 */
object TrackerSignatureDatabase {

    val all: List<TrackerSignature> = listOf(
        TrackerSignature(
            id = "apple-offline-finding",
            manufacturer = "Apple, Inc.",
            manufacturerDataPattern = ManufacturerDataPattern(
                companyId = BluetoothCompanyIds.APPLE,
                payloadPrefix = listOf(0x12)
            ),
            serviceUuid = null,
            deviceNamePattern = null,
            category = DeviceCategory.SMART_TAG,
            confidence = SignatureConfidence.MEDIUM,
            verified = false,
            descriptionPl = "Wzorzec reklamy sieci Find My (\"offline finding\") — może pochodzić " +
                "z AirTaga lub innego akcesorium Find My, ale też z iPhone'a/iPada/Maca w pobliżu. " +
                "Wzorzec pochodzi z nieoficjalnych badań społeczności (OpenHaystack), nie z oficjalnej " +
                "dokumentacji Apple — traktuj jako wskazówkę, nie dowód."
        ),
        TrackerSignature(
            id = "tile-service-uuid",
            manufacturer = "Tile, Inc.",
            manufacturerDataPattern = null,
            serviceUuid = ServiceUuidClassifier.TILE,
            deviceNamePattern = null,
            category = DeviceCategory.BLUETOOTH_TRACKER,
            confidence = SignatureConfidence.MEDIUM,
            verified = true,
            descriptionPl = "Service UUID 0xFEED jest oficjalnie zarejestrowany w Bluetooth SIG dla " +
                "Tile, Inc. Sam UUID jest zweryfikowany, ale nie gwarantuje, że to na pewno lokalizator " +
                "(Tile licencjonuje swoją technologię także innym produktom)."
        ),
        TrackerSignature(
            id = "name-pattern-gps-tracker",
            manufacturer = null,
            manufacturerDataPattern = null,
            serviceUuid = null,
            deviceNamePattern = Regex("(?i)(gps[\\s_-]?track|mini[\\s_-]?track|car[\\s_-]?track|locator)"),
            category = DeviceCategory.GPS_TRACKER,
            confidence = SignatureConfidence.LOW,
            verified = false,
            descriptionPl = "Nazwa urządzenia sugeruje lokalizator GPS/tracker. Nazwę BLE może ustawić " +
                "dowolnie każdy producent lub użytkownik — to bardzo słaba, łatwa do sfałszowania przesłanka."
        ),
        TrackerSignature(
            id = "name-pattern-smart-tag",
            manufacturer = null,
            manufacturerDataPattern = null,
            serviceUuid = null,
            deviceNamePattern = Regex("(?i)(airtag|smarttag|smart[\\s_-]?tag|chipolo|galaxy[\\s_-]?tag)"),
            category = DeviceCategory.SMART_TAG,
            confidence = SignatureConfidence.LOW,
            verified = false,
            descriptionPl = "Nazwa urządzenia pasuje do popularnych smart tagów (AirTag/SmartTag/Chipolo). " +
                "Takie urządzenie może należeć do właściciela samochodu, pasażera lub bagażu — samo w " +
                "sobie nie jest dowodem podłożenia."
        ),
        TrackerSignature(
            id = "name-pattern-vehicle-accessory",
            manufacturer = null,
            manufacturerDataPattern = null,
            serviceUuid = null,
            deviceNamePattern = Regex("(?i)(tpms|tire[\\s_-]?pressure|obd[\\s_-]?ii?|obd2)"),
            category = DeviceCategory.VEHICLE_ACCESSORY,
            confidence = SignatureConfidence.LOW,
            verified = false,
            descriptionPl = "Nazwa sugeruje fabryczny lub wpięty na stałe moduł pojazdu (czujnik ciśnienia " +
                "w oponach, złącze diagnostyczne OBD). To obniża, nie podwyższa, poziom ryzyka."
        ),
        TrackerSignature(
            id = "name-pattern-headphones",
            manufacturer = null,
            manufacturerDataPattern = null,
            serviceUuid = null,
            deviceNamePattern = Regex("(?i)(buds|airpods|headphone|earphone|earbud|wh-|wf-|beats)"),
            category = DeviceCategory.HEADPHONES,
            confidence = SignatureConfidence.LOW,
            verified = false,
            descriptionPl = "Nazwa sugeruje słuchawki. Prawdopodobnie urządzenie kierowcy lub pasażera."
        ),
        TrackerSignature(
            id = "name-pattern-car-multimedia",
            manufacturer = null,
            manufacturerDataPattern = null,
            serviceUuid = null,
            deviceNamePattern = Regex("(?i)(carplay|android[\\s_-]?auto|multimedia|infotainment|" +
                "^(pioneer|kenwood|jbl[\\s_-]?car|sony[\\s_-]?car))"),
            category = DeviceCategory.CAR_MULTIMEDIA,
            confidence = SignatureConfidence.LOW,
            verified = false,
            descriptionPl = "Nazwa sugeruje system multimedialny/infotainment samochodu."
        ),
        TrackerSignature(
            id = "standard-gatt-battery-or-hid",
            manufacturer = null,
            manufacturerDataPattern = null,
            serviceUuid = ServiceUuidClassifier.BATTERY_SERVICE,
            deviceNamePattern = null,
            category = DeviceCategory.OTHER,
            confidence = SignatureConfidence.LOW,
            verified = true,
            descriptionPl = "Standardowa usługa GATT \"Battery Service\" — typowa dla akcesoriów " +
                "(słuchawki, smartwatch, kluczyk), nie dla lokalizatorów śledzących w ukryciu."
        )
    )

    fun byId(id: String): TrackerSignature? = all.firstOrNull { it.id == id }
}
