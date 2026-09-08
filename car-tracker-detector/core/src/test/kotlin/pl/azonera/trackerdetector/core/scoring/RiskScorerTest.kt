package pl.azonera.trackerdetector.core.scoring

import pl.azonera.trackerdetector.core.model.RiskLevel
import pl.azonera.trackerdetector.core.signature.TrackerSignatureDatabase
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class RiskScorerTest {

    private fun baseInput() = ScoringInput(
        hasName = true,
        detectionCount = 1,
        scanDurationSeconds = 60,
        strongSignalRatio = 0.0,
        matchedSignature = null,
        isUserMarkedKnown = false,
        seenInPastSessionsCount = 0
    )

    @Test
    fun `user marked device always scores zero regardless of other factors`() {
        val input = baseInput().copy(
            isUserMarkedKnown = true,
            strongSignalRatio = 1.0,
            seenInPastSessionsCount = 10,
            matchedSignature = TrackerSignatureDatabase.byId("tile-service-uuid")
        )
        val result = RiskScorer.score(input)
        assertEquals(0, result.score)
        assertEquals(RiskLevel.LOW, result.level)
    }

    @Test
    fun `unknown device with no extra signals lands in UNKNOWN bucket`() {
        val result = RiskScorer.score(baseInput())
        assertEquals(RiskLevel.UNKNOWN, result.level)
    }

    @Test
    fun `strong signal alone never crosses into SUSPICIOUS or higher`() {
        val input = baseInput().copy(strongSignalRatio = 1.0)
        val result = RiskScorer.score(input)
        assertTrue(
            result.level == RiskLevel.LOW || result.level == RiskLevel.UNKNOWN,
            "Strong RSSI alone must not push risk into SUSPICIOUS/HIGH, was ${result.level} (${result.score})"
        )
    }

    @Test
    fun `benign signature match reduces score below baseline`() {
        val headphones = TrackerSignatureDatabase.byId("name-pattern-headphones")
        val input = baseInput().copy(matchedSignature = headphones)
        val result = RiskScorer.score(input)
        assertTrue(result.score < 35, "Expected reduction from baseline 35, got ${result.score}")
    }

    @Test
    fun `apple manufacturer alone does not imply tracker (no signature match case)`() {
        // Regression guard for rule 7/22: recognizing a manufacturer must never by itself
        // be treated as evidence of tracking. This is simulated by NOT supplying a
        // matchedSignature even though the device could technically be an Apple device --
        // the scorer has no "isAppleDevice" input at all, by design.
        val result = RiskScorer.score(baseInput())
        assertTrue(result.score <= 59, "Must not exceed UNKNOWN bucket without real evidence")
    }

    @Test
    fun `recurring across many independent past sessions pushes toward high risk`() {
        val input = baseInput().copy(
            hasName = false,
            strongSignalRatio = 0.8,
            seenInPastSessionsCount = 4,
            detectionCount = 30
        )
        val result = RiskScorer.score(input)
        assertTrue(result.score >= 60, "Expected SUSPICIOUS or higher, got ${result.score}")
    }

    @Test
    fun `unverified suspicious signature yields lower bonus than verified one`() {
        val verified = TrackerSignatureDatabase.byId("tile-service-uuid") // verified = true
        val unverified = TrackerSignatureDatabase.byId("name-pattern-gps-tracker") // verified = false

        val verifiedScore = RiskScorer.score(baseInput().copy(matchedSignature = verified)).score
        val unverifiedScore = RiskScorer.score(baseInput().copy(matchedSignature = unverified)).score

        assertTrue(
            verifiedScore >= unverifiedScore,
            "Verified signature ($verifiedScore) should score >= unverified one ($unverifiedScore)"
        )
    }

    @Test
    fun `score is always clamped between 0 and 100`() {
        val extreme = baseInput().copy(
            hasName = false,
            strongSignalRatio = 1.0,
            seenInPastSessionsCount = 50,
            detectionCount = 1000,
            matchedSignature = TrackerSignatureDatabase.byId("tile-service-uuid")
        )
        val result = RiskScorer.score(extreme)
        assertTrue(result.score in 0..100)
    }
}
