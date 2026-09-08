package pl.azonera.trackerdetector.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import pl.azonera.trackerdetector.data.repository.HistoryRepository
import pl.azonera.trackerdetector.data.repository.KnownDeviceRepository

class PrivacyViewModel(
    private val historyRepository: HistoryRepository,
    private val knownDeviceRepository: KnownDeviceRepository
) : ViewModel() {

    /** Kasuje CAŁĄ historię skanów oraz listę oznaczonych urządzeń - wszystko, co aplikacja
     * kiedykolwiek zapisała lokalnie. Nieodwracalne, wyłącznie na tym telefonie. */
    fun deleteAllAppData() {
        viewModelScope.launch { historyRepository.deleteAll() }
        viewModelScope.launch { knownDeviceRepository.clearAll() }
    }
}
