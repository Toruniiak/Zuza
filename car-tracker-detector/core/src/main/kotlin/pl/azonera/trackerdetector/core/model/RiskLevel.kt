package pl.azonera.trackerdetector.core.model

/**
 * Poziom ryzyka na podstawie wyniku scoringu 0-100.
 * UWAGA: żaden poziom nie jest równoznaczny ze stuprocentową pewnością.
 * Nawet HIGH_RISK oznacza "potencjalnie podejrzane urządzenie", nie "wykryty tracker".
 */
enum class RiskLevel(val emoji: String, val displayNamePl: String, val range: IntRange) {
    LOW("🟢", "NISKIE", 0..29),
    UNKNOWN("🟡", "NIEZNANE", 30..59),
    SUSPICIOUS("🟠", "PODEJRZANE", 60..79),
    HIGH_RISK("🔴", "WYSOKIE RYZYKO", 80..100);

    companion object {
        fun fromScore(score: Int): RiskLevel {
            val clamped = score.coerceIn(0, 100)
            return entries.first { clamped in it.range }
        }
    }
}
