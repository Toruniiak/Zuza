package pl.azonera.trackerdetector.ui.device

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import pl.azonera.trackerdetector.core.model.SignalDistance
import pl.azonera.trackerdetector.core.rssi.RssiAnalyzer
import pl.azonera.trackerdetector.core.rssi.SignalTrend
import pl.azonera.trackerdetector.data.bluetooth.BleEvent
import pl.azonera.trackerdetector.data.bluetooth.BleScanError
import pl.azonera.trackerdetector.data.repository.BleRepository

private const val SIGNAL_LOST_TIMEOUT_MILLIS = 5000L

class LocateSignalViewModel(
    private val bleRepository: BleRepository,
    private val targetAddress: String
) : ViewModel() {

    data class UiState(
        val currentRssi: Int? = null,
        val trend: SignalTrend = SignalTrend.INSUFFICIENT_DATA,
        val distance: SignalDistance? = null,
        val lastSeenMillis: Long? = null,
        val signalLost: Boolean = false,
        val error: BleScanError? = null
    )

    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state.asStateFlow()

    private val rssiHistory = mutableListOf<Int>()
    private var scanJob: Job? = null
    private var tickerJob: Job? = null

    fun start() {
        scanJob?.cancel()
        tickerJob?.cancel()

        scanJob = viewModelScope.launch {
            bleRepository.scanEvents()
                .onEach { event ->
                    when (event) {
                        is BleEvent.Reading -> if (event.reading.address == targetAddress) {
                            rssiHistory.add(event.reading.rssi)
                            _state.value = _state.value.copy(
                                currentRssi = event.reading.rssi,
                                trend = RssiAnalyzer.trend(rssiHistory),
                                distance = RssiAnalyzer.distanceZone(event.reading.rssi),
                                lastSeenMillis = event.reading.timestampMillis,
                                signalLost = false,
                                error = null
                            )
                        }
                        is BleEvent.Error -> _state.value = _state.value.copy(error = event.error)
                    }
                }
                .collect()
        }

        tickerJob = viewModelScope.launch {
            while (isActive) {
                delay(1000)
                val lastSeen = _state.value.lastSeenMillis ?: continue
                if (System.currentTimeMillis() - lastSeen > SIGNAL_LOST_TIMEOUT_MILLIS) {
                    _state.value = _state.value.copy(signalLost = true)
                }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        scanJob?.cancel()
        tickerJob?.cancel()
    }
}
