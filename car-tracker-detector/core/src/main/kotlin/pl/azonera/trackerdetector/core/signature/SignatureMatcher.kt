package pl.azonera.trackerdetector.core.signature

import pl.azonera.trackerdetector.core.model.BleDeviceReading
import pl.azonera.trackerdetector.core.model.SignatureConfidence
import pl.azonera.trackerdetector.core.model.TrackerSignature
import pl.azonera.trackerdetector.core.parser.ServiceUuidClassifier

/** Dopasowuje odczyt BLE do sygnatur z [TrackerSignatureDatabase]. */
object SignatureMatcher {

    private val confidenceOrder = mapOf(
        SignatureConfidence.HIGH to 3,
        SignatureConfidence.MEDIUM to 2,
        SignatureConfidence.LOW to 1
    )

    /** Zwraca wszystkie dopasowane sygnatury, posortowane od najbardziej do najmniej pewnej. */
    fun matchAll(
        reading: BleDeviceReading,
        signatures: List<TrackerSignature> = TrackerSignatureDatabase.all
    ): List<TrackerSignature> {
        return signatures.filter { matches(reading, it) }
            .sortedByDescending { confidenceOrder.getValue(it.confidence) }
    }

    /** Zwraca najbardziej pewne dopasowanie, jeśli istnieje. */
    fun bestMatch(
        reading: BleDeviceReading,
        signatures: List<TrackerSignature> = TrackerSignatureDatabase.all
    ): TrackerSignature? = matchAll(reading, signatures).firstOrNull()

    private fun matches(reading: BleDeviceReading, signature: TrackerSignature): Boolean {
        signature.manufacturerDataPattern?.let { pattern ->
            val payload = reading.manufacturerData[pattern.companyId]
            if (payload != null) {
                val prefix = pattern.payloadPrefix
                val prefixOk = prefix == null || (payload.size >= prefix.size && payload.take(prefix.size) == prefix)
                if (prefixOk) return true
            }
        }

        signature.serviceUuid?.let { uuid ->
            val target = ServiceUuidClassifier.shortForm(uuid)
            if (reading.serviceUuids.any { ServiceUuidClassifier.shortForm(it) == target }) return true
        }

        signature.deviceNamePattern?.let { pattern ->
            val name = reading.name
            if (name != null && pattern.containsMatchIn(name)) return true
        }

        return false
    }
}
