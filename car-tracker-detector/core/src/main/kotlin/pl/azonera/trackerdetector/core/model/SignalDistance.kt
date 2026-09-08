package pl.azonera.trackerdetector.core.model

/**
 * Przybliżona strefa odległości na podstawie RSSI.
 *
 * WAŻNE: RSSI nie jest dokładnym pomiarem odległości. Zależy od mocy nadawania
 * urządzenia, anteny, przeszkód (metal karoserii, tapicerka), odbić sygnału itd.
 * Te progi to jedynie orientacyjna klasyfikacja, nie pomiar metryczny.
 */
enum class SignalDistance(val displayNamePl: String) {
    VERY_CLOSE("bardzo blisko"),
    CLOSE("blisko"),
    MEDIUM("średnio"),
    FAR("daleko / słaby sygnał");

    companion object {
        fun fromRssi(rssi: Int): SignalDistance = when {
            rssi >= -40 -> VERY_CLOSE
            rssi >= -60 -> CLOSE
            rssi >= -80 -> MEDIUM
            else -> FAR
        }
    }
}
