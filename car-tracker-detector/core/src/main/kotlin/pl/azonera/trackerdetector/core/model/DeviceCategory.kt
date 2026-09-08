package pl.azonera.trackerdetector.core.model

/**
 * Kategoria urządzenia BLE, przypisywana na podstawie sygnatur i heurystyk.
 * Kategoria NIE jest dowodem — to najlepsza dostępna klasyfikacja na podstawie
 * danych, które udostępnia Android (nazwa, manufacturer data, service UUID, RSSI).
 */
enum class DeviceCategory(val displayNamePl: String) {
    BLUETOOTH_TRACKER("Lokalizator Bluetooth"),
    GPS_TRACKER("Potencjalny lokalizator GPS"),
    SMART_TAG("Smart tag (np. typu AirTag/SmartTag)"),
    VEHICLE_ACCESSORY("Akcesorium pojazdu (TPMS, moduł fabryczny, kluczyk)"),
    CAR_MULTIMEDIA("System multimedialny samochodu"),
    SMARTPHONE("Smartfon"),
    HEADPHONES("Słuchawki / audio"),
    UNKNOWN_BLE_DEVICE("Nieznane urządzenie BLE"),
    OTHER("Inne")
}
