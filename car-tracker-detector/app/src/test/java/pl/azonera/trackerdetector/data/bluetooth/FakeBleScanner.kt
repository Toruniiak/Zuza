package pl.azonera.trackerdetector.data.bluetooth

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

/**
 * Testowa (fałszywa) implementacja [BleScanner] — pozwala testować całą resztę aplikacji
 * (repozytoria, ViewModel) bez prawdziwego radia Bluetooth ani fizycznego telefonu, zgodnie
 * z punktem 19 specyfikacji ("Dodaj mock BLE scanner").
 *
 * Odtwarza podaną z góry sekwencję zdarzeń [BleEvent] przy każdej subskrypcji.
 */
class FakeBleScanner(private val scriptedEvents: List<BleEvent>) : BleScanner {
    override fun scan(): Flow<BleEvent> = flow {
        scriptedEvents.forEach { emit(it) }
    }
}
