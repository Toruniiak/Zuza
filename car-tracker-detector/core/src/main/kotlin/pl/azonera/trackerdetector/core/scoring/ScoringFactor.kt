package pl.azonera.trackerdetector.core.scoring

/**
 * Pojedynczy czynnik, który wpłynął na wynik scoringu — pokazywany użytkownikowi
 * w trybie technicznym i na ekranie szczegółów urządzenia, żeby ocena nie była "czarną skrzynką".
 */
data class ScoringFactor(
    val descriptionPl: String,
    val points: Int
)
