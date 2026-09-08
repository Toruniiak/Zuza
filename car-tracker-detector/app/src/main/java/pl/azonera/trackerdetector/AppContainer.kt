package pl.azonera.trackerdetector

import android.content.Context
import pl.azonera.trackerdetector.data.bluetooth.AndroidBleScanner
import pl.azonera.trackerdetector.data.bluetooth.BleAvailability
import pl.azonera.trackerdetector.data.bluetooth.BleScanner
import pl.azonera.trackerdetector.data.database.AppDatabase
import pl.azonera.trackerdetector.data.repository.BleRepository
import pl.azonera.trackerdetector.data.repository.DefaultBleRepository
import pl.azonera.trackerdetector.data.repository.DefaultHistoryRepository
import pl.azonera.trackerdetector.data.repository.DefaultKnownDeviceRepository
import pl.azonera.trackerdetector.data.repository.HistoryRepository
import pl.azonera.trackerdetector.data.repository.KnownDeviceRepository

/**
 * Ręczny, prosty kontener zależności (bez frameworku DI typu Hilt/Dagger).
 *
 * Świadoma decyzja architektoniczna dla MVP: mniej ruchomych części (brak przetwarzania
 * adnotacji Hilt/KSP dla DI) = mniejsze ryzyko niekompatybilności wersji i łatwiejsze
 * utrzymanie na start. Wszystkie zależności są interfejsami tam, gdzie potrzebna jest
 * testowalność (patrz `BleScanner`), więc przejście na Hilt w przyszłości jest proste.
 */
class AppContainer(context: Context) {

    private val appContext = context.applicationContext
    private val database by lazy { AppDatabase.getInstance(appContext) }

    val bleAvailability: BleAvailability by lazy { BleAvailability(appContext) }

    val bleScanner: BleScanner by lazy { AndroidBleScanner(appContext, bleAvailability) }

    val bleRepository: BleRepository by lazy { DefaultBleRepository(bleScanner, database.scanHistoryDao()) }

    val historyRepository: HistoryRepository by lazy { DefaultHistoryRepository(database.scanHistoryDao()) }

    val knownDeviceRepository: KnownDeviceRepository by lazy {
        DefaultKnownDeviceRepository(database.knownDeviceDao())
    }
}
