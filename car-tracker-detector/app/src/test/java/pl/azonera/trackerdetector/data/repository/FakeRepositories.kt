package pl.azonera.trackerdetector.data.repository

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import pl.azonera.trackerdetector.core.model.ScanSummary
import pl.azonera.trackerdetector.core.model.UserDeviceAction
import pl.azonera.trackerdetector.data.bluetooth.BleEvent
import pl.azonera.trackerdetector.data.bluetooth.BleScanner
import pl.azonera.trackerdetector.data.bluetooth.FakeBleScanner

/** Testowa implementacja [BleRepository] oparta o [FakeBleScanner] — bez Room, bez Bluetootha. */
class FakeBleRepository(
    scriptedEvents: List<BleEvent>,
    private val pastCounts: Map<String, Int> = emptyMap()
) : BleRepository {

    private val scanner: BleScanner = FakeBleScanner(scriptedEvents)

    var savedSummary: ScanSummary? = null
        private set

    override fun scanEvents(): Flow<BleEvent> = scanner.scan()

    override suspend fun pastSessionCounts(addresses: Set<String>, excludeSessionId: String): Map<String, Int> =
        addresses.associateWith { pastCounts[it] ?: 0 }

    override suspend fun saveSession(summary: ScanSummary) {
        savedSummary = summary
    }
}

/** Testowa implementacja [KnownDeviceRepository] trzymająca stan w pamięci. */
class FakeKnownDeviceRepository(
    initial: Map<String, UserDeviceAction> = emptyMap()
) : KnownDeviceRepository {

    private val state = MutableStateFlow(initial)

    override fun observeActionsByAddress(): Flow<Map<String, UserDeviceAction>> = state

    override suspend fun setAction(address: String, action: UserDeviceAction) {
        state.value = if (action == UserDeviceAction.NONE) {
            state.value - address
        } else {
            state.value + (address to action)
        }
    }

    override suspend fun clearAll() {
        state.value = emptyMap()
    }
}
