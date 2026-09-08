package pl.azonera.trackerdetector.data.bluetooth

import kotlinx.coroutines.flow.Flow
import pl.azonera.trackerdetector.core.model.BleDeviceReading

/** Zdarzenie emitowane przez skaner BLE. */
sealed class BleEvent {
    data class Reading(val reading: BleDeviceReading) : BleEvent()
    data class Error(val error: BleScanError) : BleEvent()
}

/**
 * Abstrakcja skanera BLE. Dzięki interfejsowi, ViewModel/Repository nie zależą bezpośrednio
 * od Android Bluetooth API i można je testować z fałszywą (mock/fake) implementacją —
 * patrz `FakeBleScanner` w testach.
 */
interface BleScanner {
    /**
     * Zimny Flow: rozpoczyna skanowanie przy pierwszej subskrypcji, zatrzymuje przy anulowaniu
     * (np. `viewModelScope` skasowany albo timeout skanu). Emituje [BleEvent.Reading] dla
     * każdego pojedynczego pakietu advertising oraz [BleEvent.Error], jeśli skan nie może się
     * rozpocząć lub zostanie przerwany przez system.
     */
    fun scan(): Flow<BleEvent>
}
