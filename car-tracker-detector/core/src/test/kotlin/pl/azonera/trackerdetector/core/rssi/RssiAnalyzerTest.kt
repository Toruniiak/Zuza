package pl.azonera.trackerdetector.core.rssi

import pl.azonera.trackerdetector.core.model.SignalDistance
import kotlin.test.Test
import kotlin.test.assertEquals

class RssiAnalyzerTest {

    @Test
    fun `classifies distance zones per documented thresholds`() {
        assertEquals(SignalDistance.VERY_CLOSE, RssiAnalyzer.distanceZone(-30))
        assertEquals(SignalDistance.CLOSE, RssiAnalyzer.distanceZone(-50))
        assertEquals(SignalDistance.MEDIUM, RssiAnalyzer.distanceZone(-70))
        assertEquals(SignalDistance.FAR, RssiAnalyzer.distanceZone(-90))
    }

    @Test
    fun `boundary values classify to the closer zone (inclusive lower bound)`() {
        assertEquals(SignalDistance.VERY_CLOSE, RssiAnalyzer.distanceZone(-40))
        assertEquals(SignalDistance.CLOSE, RssiAnalyzer.distanceZone(-60))
        assertEquals(SignalDistance.MEDIUM, RssiAnalyzer.distanceZone(-80))
    }

    @Test
    fun `insufficient data with fewer than 4 samples`() {
        assertEquals(SignalTrend.INSUFFICIENT_DATA, RssiAnalyzer.trend(listOf(-50, -51, -49)))
        assertEquals(SignalTrend.INSUFFICIENT_DATA, RssiAnalyzer.trend(emptyList()))
    }

    @Test
    fun `detects rising trend when signal gets stronger (less negative)`() {
        val history = listOf(-80, -78, -76, -60, -55, -50)
        assertEquals(SignalTrend.RISING, RssiAnalyzer.trend(history))
    }

    @Test
    fun `detects falling trend when signal gets weaker (more negative)`() {
        val history = listOf(-40, -42, -45, -60, -65, -70)
        assertEquals(SignalTrend.FALLING, RssiAnalyzer.trend(history))
    }

    @Test
    fun `small fluctuations within noise threshold are reported as stable`() {
        val history = listOf(-50, -51, -49, -50, -52, -50)
        assertEquals(SignalTrend.STABLE, RssiAnalyzer.trend(history))
    }

    @Test
    fun `only considers the last 10 samples`() {
        val noisyOldData = List(20) { -90 }
        val recentRising = listOf(-80, -75, -70, -60, -50, -40)
        val history = noisyOldData + recentRising
        assertEquals(SignalTrend.RISING, RssiAnalyzer.trend(history))
    }
}
