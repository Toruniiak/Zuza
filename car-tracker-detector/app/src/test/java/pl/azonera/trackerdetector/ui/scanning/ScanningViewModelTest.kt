package pl.azonera.trackerdetector.ui.scanning

import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import pl.azonera.trackerdetector.core.model.BleDeviceReading
import pl.azonera.trackerdetector.core.model.UserDeviceAction
import pl.azonera.trackerdetector.data.bluetooth.BleEvent
import pl.azonera.trackerdetector.data.bluetooth.BleScanError
import pl.azonera.trackerdetector.data.repository.FakeBleRepository
import pl.azonera.trackerdetector.data.repository.FakeKnownDeviceRepository
import pl.azonera.trackerdetector.ui.navigation.ScanMode
import pl.azonera.trackerdetector.util.MainDispatcherRule

@OptIn(ExperimentalCoroutinesApi::class)
class ScanningViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private fun reading(address: String, rssi: Int, t: Long) =
        BleDeviceReading(address = address, name = "Device $address", rssi = rssi, timestampMillis = t)

    @Test
    fun `finishes scan, aggregates devices and saves the session`() = runTest {
        val events = listOf(
            BleEvent.Reading(reading("AA", -50, 1)),
            BleEvent.Reading(reading("AA", -48, 2)),
            BleEvent.Reading(reading("BB", -70, 3))
        )
        val bleRepository = FakeBleRepository(events)
        val viewModel = ScanningViewModel(bleRepository, FakeKnownDeviceRepository(), ScanMode.QUICK)

        viewModel.startScan()
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue("Expected Finished, got $state", state is ScanningViewModel.UiState.Finished)
        val saved = bleRepository.savedSummary
        requireNotNull(saved)
        assertEquals(2, saved.devices.size)
        assertEquals(2, saved.devices.first { it.address == "AA" }.detectionCount)
    }

    @Test
    fun `scanner error surfaces as Error state and nothing is saved`() = runTest {
        val bleRepository = FakeBleRepository(listOf(BleEvent.Error(BleScanError.BluetoothDisabled)))
        val viewModel = ScanningViewModel(bleRepository, FakeKnownDeviceRepository(), ScanMode.QUICK)

        viewModel.startScan()
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is ScanningViewModel.UiState.Error)
        assertEquals(BleScanError.BluetoothDisabled, (state as ScanningViewModel.UiState.Error).error)
        assertEquals(null, bleRepository.savedSummary)
    }

    @Test
    fun `device already marked as MY_DEVICE ends up with zero risk score in the saved session`() = runTest {
        val events = listOf(BleEvent.Reading(reading("AA", -35, 1)))
        val bleRepository = FakeBleRepository(events)
        val knownDeviceRepository = FakeKnownDeviceRepository(mapOf("AA" to UserDeviceAction.MY_DEVICE))
        val viewModel = ScanningViewModel(bleRepository, knownDeviceRepository, ScanMode.QUICK)

        viewModel.startScan()
        advanceUntilIdle()

        val saved = requireNotNull(bleRepository.savedSummary)
        assertEquals(0, saved.devices.single().riskScore)
    }
}
