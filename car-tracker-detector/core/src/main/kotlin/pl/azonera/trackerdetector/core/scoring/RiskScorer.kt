package pl.azonera.trackerdetector.core.scoring

import pl.azonera.trackerdetector.core.model.DeviceCategory
import pl.azonera.trackerdetector.core.model.RiskLevel
import pl.azonera.trackerdetector.core.model.SignatureConfidence
import pl.azonera.trackerdetector.core.model.TrackerSignature

/**
 * Dane wejściowe do scoringu jednego urządzenia. Wszystkie pola dają się wyliczyć wyłącznie
 * z tego, co Android faktycznie udostępnia ze skanu BLE + lokalnej historii skanów.
 */
data class ScoringInput(
    val hasName: Boolean,
    val detectionCount: Int,
    val scanDurationSeconds: Int,
    val strongSignalRatio: Double,
    val matchedSignature: TrackerSignature?,
    val isUserMarkedKnown: Boolean,
    val seenInPastSessionsCount: Int
)

data class ScoringResult(
    val score: Int,
    val level: RiskLevel,
    val factors: List<ScoringFactor>
)

/**
 * Prosty, przejrzysty (nie "black box") algorytm scoringowy 0-100.
 *
 * Zasady projektowe (patrz punkt 22 specyfikacji):
 * - Silny sygnał RSSI SAM w sobie nigdy nie podbija urządzenia powyżej progu "NIEZNANE".
 * - Rozpoznany producent (np. Apple/Samsung) NIGDY sam w sobie nie oznacza trackera.
 * - Najsilniejszym, uczciwym sygnałem jest powtarzalna obecność w NIEZALEŻNYCH sesjach
 *   skanowania (to samo urządzenie towarzyszy samochodowi wielokrotnie, różnego dnia/w różnym miejscu).
 * - Oznaczenie urządzenia jako "MOJE URZĄDZENIE" zawsze zeruje ryzyko.
 */
object RiskScorer {

    private const val BASELINE_UNKNOWN = 35

    fun score(input: ScoringInput): ScoringResult {
        if (input.isUserMarkedKnown) {
            return ScoringResult(
                score = 0,
                level = RiskLevel.LOW,
                factors = listOf(ScoringFactor("Oznaczone przez Ciebie jako \"Moje urządzenie\"", 0))
            )
        }

        val factors = mutableListOf<ScoringFactor>()
        var score = BASELINE_UNKNOWN
        factors += ScoringFactor("Wartość bazowa dla nierozpoznanego urządzenia BLE", BASELINE_UNKNOWN)

        val signature = input.matchedSignature
        if (signature != null) {
            val benignCategories = setOf(
                DeviceCategory.SMARTPHONE,
                DeviceCategory.HEADPHONES,
                DeviceCategory.CAR_MULTIMEDIA,
                DeviceCategory.VEHICLE_ACCESSORY,
                DeviceCategory.OTHER
            )
            if (signature.category in benignCategories) {
                val reduction = if (signature.verified) -20 else -12
                score += reduction
                factors += ScoringFactor(
                    "Dopasowano do znanej, zwykle niegroźnej kategorii: ${signature.category.displayNamePl}",
                    reduction
                )
            } else {
                val bonus = when (signature.confidence) {
                    SignatureConfidence.HIGH -> if (signature.verified) 30 else 20
                    SignatureConfidence.MEDIUM -> if (signature.verified) 22 else 14
                    SignatureConfidence.LOW -> if (signature.verified) 12 else 6
                }
                score += bonus
                val verifiedNote = if (signature.verified) "zweryfikowana sygnatura" else "niezweryfikowana sygnatura"
                factors += ScoringFactor(
                    "Dopasowanie do ${signature.category.displayNamePl} ($verifiedNote)",
                    bonus
                )
            }
        }

        if (!input.hasName) {
            score += 8
            factors += ScoringFactor("Urządzenie nie rozgłasza żadnej nazwy", 8)
        }

        if (input.strongSignalRatio > 0.6) {
            val bonus = 8
            score += bonus
            factors += ScoringFactor(
                "Bardzo silny sygnał w większości obserwacji (może, ale nie musi, oznaczać bliskość)",
                bonus
            )
        }

        if (input.scanDurationSeconds > 0) {
            val expectedMaxDetections = input.scanDurationSeconds / 2
            if (expectedMaxDetections > 0 && input.detectionCount >= expectedMaxDetections) {
                val bonus = 10
                score += bonus
                factors += ScoringFactor("Urządzenie wykrywane niemal nieprzerwanie przez cały skan", bonus)
            }
        }

        if (input.seenInPastSessionsCount > 0) {
            val bonus = (15 + (input.seenInPastSessionsCount - 1) * 5).coerceAtMost(35)
            score += bonus
            factors += ScoringFactor(
                "To samo urządzenie wykryto w ${input.seenInPastSessionsCount} poprzednich, " +
                    "niezależnych skanach tego samochodu — to najsilniejsza przesłanka",
                bonus
            )
        }

        val clamped = score.coerceIn(0, 100)
        return ScoringResult(
            score = clamped,
            level = RiskLevel.fromScore(clamped),
            factors = factors
        )
    }
}
