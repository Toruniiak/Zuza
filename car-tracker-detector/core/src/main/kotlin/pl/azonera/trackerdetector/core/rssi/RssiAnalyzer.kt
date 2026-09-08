package pl.azonera.trackerdetector.core.rssi

import pl.azonera.trackerdetector.core.model.SignalDistance
import kotlin.math.abs

/** Trend siły sygnału w czasie, używany w funkcji "Znajdź źródło sygnału". */
enum class SignalTrend { RISING, FALLING, STABLE, INSUFFICIENT_DATA }

/**
 * Analiza RSSI w czasie rzeczywistym. RSSI to wartość logarytmiczna i szumi z powodu
 * odbić, przeszkód i wahań anteny — dlatego trend liczymy na oknie kilku ostatnich
 * próbek, a nie na dwóch pojedynczych odczytach.
 */
object RssiAnalyzer {

    private const val NOISE_THRESHOLD_DBM = 3

    fun distanceZone(rssi: Int): SignalDistance = SignalDistance.fromRssi(rssi)

    /**
     * Wyznacza trend na podstawie historii RSSI (od najstarszego do najnowszego).
     * Porównuje średnią starszej i nowszej połowy okna, z progiem szumu [NOISE_THRESHOLD_DBM] dBm,
     * żeby pojedyncze wahnięcia sygnału nie generowały fałszywego "zbliżasz się/oddalasz się".
     */
    fun trend(rssiHistory: List<Int>): SignalTrend {
        if (rssiHistory.size < 4) return SignalTrend.INSUFFICIENT_DATA

        val window = rssiHistory.takeLast(10)
        val mid = window.size / 2
        val olderAvg = window.take(mid).average()
        val newerAvg = window.takeLast(window.size - mid).average()
        val delta = newerAvg - olderAvg

        return when {
            abs(delta) < NOISE_THRESHOLD_DBM -> SignalTrend.STABLE
            delta > 0 -> SignalTrend.RISING
            else -> SignalTrend.FALLING
        }
    }
}
