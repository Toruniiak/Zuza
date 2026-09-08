package pl.azonera.trackerdetector.ui.scanning

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import pl.azonera.trackerdetector.core.engine.DetectionEngine
import pl.azonera.trackerdetector.core.model.BleDeviceReading
import pl.azonera.trackerdetector.core.model.DetectedDevice
import pl.azonera.trackerdetector.core.model.RiskLevel
import pl.azonera.trackerdetector.core.model.ScanSummary
import pl.azonera.trackerdetector.data.bluetooth.BleEvent
import pl.azonera.trackerdetector.data.bluetooth.BleScanError
import pl.azonera.trackerdetector.data.repository.BleRepository
import pl.azonera.trackerdetector.data.repository.KnownDeviceRepository
import pl.azonera.trackerdetector.ui.navigation.ScanMode
import java.util.UUID

class ScanningViewModel(
    private val bleRepository: BleRepository,
    private val knownDeviceRepository: KnownDeviceRepository,
    private val mode: ScanMode
) : ViewModel() {

    sealed interface UiState {
        data object Idle : UiState
        data class Scanning(
            val elapsedSeconds: Int,
            val totalSeconds: Int,
            val devicesFound: Int,
            val suspiciousCount: Int,
            val currentSignalDbm: Int?,
            val devices: List<DetectedDevice>
        ) : UiState
        data class Error(val error: BleScanError) : UiState
        data class Finished(val sessionId: String) : UiState
    }

    val sessionId: String = UUID.randomUUID().toString()
    val totalSeconds: Int = if (mode == ScanMode.FULL) 60 else 20

    private val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    private var scanJob: Job? = null
    private var stopRequested = false

    fun startScan() {
        stopRequested = false
        scanJob?.cancel()
        scanJob = viewModelScope.launch {
            val startedAt = System.currentTimeMillis()
            val readings = mutableListOf<BleDeviceReading>()
            var currentSignal: Int? = null
            var hadError = false

            val collectJob = launch {
                bleRepository.scanEvents()
                    .onEach { event ->
                        when (event) {
                            is BleEvent.Reading -> {
                                readings.add(event.reading)
                                currentSignal = event.reading.rssi
                            }
                            is BleEvent.Error -> {
                                hadError = true
                                _uiState.value = UiState.Error(event.error)
                                throw CancellationException("Skanowanie przerwane: ${event.error}")
                            }
                        }
                    }
                    .collect()
            }

            val knownActions = knownDeviceRepository.observeActionsByAddress().first()

            var elapsed = 0
            while (elapsed < totalSeconds && collectJob.isActive && !stopRequested) {
                delay(1000)
                elapsed++
                val liveDevices = DetectionEngine.aggregate(readings.toList(), elapsed, knownActions)
                _uiState.value = UiState.Scanning(
                    elapsedSeconds = elapsed,
                    totalSeconds = totalSeconds,
                    devicesFound = liveDevices.size,
                    suspiciousCount = liveDevices.count {
                        it.riskLevel == RiskLevel.SUSPICIOUS || it.riskLevel == RiskLevel.HIGH_RISK
                    },
                    currentSignalDbm = currentSignal,
                    devices = liveDevices
                )
            }
            collectJob.cancel()

            if (hadError) return@launch

            val addresses = readings.map { it.address }.toSet()
            val pastCounts = bleRepository.pastSessionCounts(addresses, sessionId)
            val finalDevices = DetectionEngine.aggregate(readings, elapsed.coerceAtLeast(1), knownActions, pastCounts)
            val finishedAt = System.currentTimeMillis()

            val summary = ScanSummary(
                sessionId = sessionId,
                startedAtMillis = startedAt,
                finishedAtMillis = finishedAt,
                totalDevicesFound = finalDevices.size,
                lowRiskCount = finalDevices.count { it.riskLevel == RiskLevel.LOW },
                unknownCount = finalDevices.count { it.riskLevel == RiskLevel.UNKNOWN },
                suspiciousCount = finalDevices.count { it.riskLevel == RiskLevel.SUSPICIOUS },
                highRiskCount = finalDevices.count { it.riskLevel == RiskLevel.HIGH_RISK },
                devices = finalDevices
            )
            bleRepository.saveSession(summary)
            _uiState.value = UiState.Finished(sessionId)
        }
    }

    fun stopScanningEarly() {
        stopRequested = true
    }

    override fun onCleared() {
        super.onCleared()
        scanJob?.cancel()
    }
}
