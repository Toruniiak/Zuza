package pl.azonera.trackerdetector.ui.device

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import pl.azonera.trackerdetector.core.model.DetectedDevice
import pl.azonera.trackerdetector.core.model.RiskLevel
import pl.azonera.trackerdetector.core.model.UserDeviceAction
import pl.azonera.trackerdetector.core.scoring.ScoringFactor
import pl.azonera.trackerdetector.data.repository.HistoryRepository
import pl.azonera.trackerdetector.data.repository.KnownDeviceRepository

class DeviceDetailViewModel(
    private val historyRepository: HistoryRepository,
    private val knownDeviceRepository: KnownDeviceRepository,
    private val sessionId: String,
    private val address: String
) : ViewModel() {

    private val loadedDevice = MutableStateFlow<DetectedDevice?>(null)

    val device: StateFlow<DetectedDevice?> = combine(
        loadedDevice,
        knownDeviceRepository.observeActionsByAddress()
    ) { device, actions ->
        device?.let { applyUserAction(it, actions[address] ?: UserDeviceAction.NONE) }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    init {
        viewModelScope.launch {
            loadedDevice.value = historyRepository.getFullSession(sessionId)?.devices?.firstOrNull { it.address == address }
        }
    }

    fun setAction(action: UserDeviceAction) {
        viewModelScope.launch {
            val newAction = if (device.value?.userAction == action) UserDeviceAction.NONE else action
            knownDeviceRepository.setAction(address, newAction)
        }
    }

    /**
     * Oznaczenie "Moje urządzenie" zawsze zeruje ryzyko natychmiast w UI, niezależnie od tego,
     * co zapisano w migawce historii — patrz [pl.azonera.trackerdetector.core.scoring.RiskScorer].
     * "Ignoruj"/"Obserwuj" nie zmieniają oceny — to tylko etykiety porządkujące dla użytkownika.
     */
    private fun applyUserAction(device: DetectedDevice, action: UserDeviceAction): DetectedDevice {
        return if (action == UserDeviceAction.MY_DEVICE) {
            device.copy(
                userAction = action,
                riskScore = 0,
                riskLevel = RiskLevel.LOW,
                scoringFactors = listOf(ScoringFactor("Oznaczone przez Ciebie jako \"Moje urządzenie\"", 0))
            )
        } else {
            device.copy(userAction = action)
        }
    }
}
