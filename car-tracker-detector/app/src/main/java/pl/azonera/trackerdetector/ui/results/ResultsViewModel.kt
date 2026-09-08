package pl.azonera.trackerdetector.ui.results

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import pl.azonera.trackerdetector.core.model.ScanSummary
import pl.azonera.trackerdetector.data.repository.HistoryRepository

class ResultsViewModel(
    private val historyRepository: HistoryRepository,
    private val sessionId: String
) : ViewModel() {

    private val _summary = MutableStateFlow<ScanSummary?>(null)
    val summary: StateFlow<ScanSummary?> = _summary.asStateFlow()

    init {
        viewModelScope.launch {
            _summary.value = historyRepository.getFullSession(sessionId)
        }
    }
}
