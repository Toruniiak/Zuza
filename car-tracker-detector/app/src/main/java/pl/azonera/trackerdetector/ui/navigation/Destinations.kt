package pl.azonera.trackerdetector.ui.navigation

import android.net.Uri

enum class ScanMode { QUICK, FULL }

object Destinations {
    const val HOME = "home"
    const val CAR_MAP = "carmap"
    const val HISTORY = "history"
    const val PRIVACY = "privacy"

    const val SCANNING = "scanning/{mode}"
    const val RESULTS = "results/{sessionId}"
    const val TECHNICAL = "technical/{sessionId}"
    const val DEVICE_DETAIL = "device/{sessionId}/{address}"
    const val LOCATE_SIGNAL = "locate/{sessionId}/{address}"

    fun scanning(mode: ScanMode) = "scanning/${mode.name}"
    fun results(sessionId: String) = "results/${Uri.encode(sessionId)}"
    fun technical(sessionId: String) = "technical/${Uri.encode(sessionId)}"
    fun deviceDetail(sessionId: String, address: String) =
        "device/${Uri.encode(sessionId)}/${Uri.encode(address)}"
    fun locateSignal(sessionId: String, address: String) =
        "locate/${Uri.encode(sessionId)}/${Uri.encode(address)}"
}
