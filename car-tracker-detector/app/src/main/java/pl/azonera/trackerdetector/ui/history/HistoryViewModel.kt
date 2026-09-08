package pl.azonera.trackerdetector.ui.history

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import pl.azonera.trackerdetector.data.repository.HistoryRepository
import pl.azonera.trackerdetector.data.repository.ScanSummaryListItem

class HistoryViewModel(private val historyRepository: HistoryRepository) : ViewModel() {

    val sessions: StateFlow<List<ScanSummaryListItem>> = historyRepository.observeSummaries()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun deleteSession(sessionId: String) {
        viewModelScope.launch { historyRepository.deleteSession(sessionId) }
    }

    fun deleteAll() {
        viewModelScope.launch { historyRepository.deleteAll() }
    }
}
