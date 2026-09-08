package pl.azonera.trackerdetector.data.bluetooth

import android.annotation.SuppressLint
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.os.Build
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import pl.azonera.trackerdetector.detection.toBleDeviceReading
import pl.azonera.trackerdetector.permissions.BlePermissions

/** Prawdziwa implementacja [BleScanner] oparta o `BluetoothLeScanner` z Android BLE API. */
class AndroidBleScanner(
    private val context: Context,
    private val availability: BleAvailability = BleAvailability(context)
) : BleScanner {

    @SuppressLint("MissingPermission") // sprawdzane ręcznie niżej przed każdym wywołaniem API
    override fun scan(): Flow<BleEvent> = callbackFlow {
        if (!availability.isBleSupported()) {
            trySend(BleEvent.Error(BleScanError.BluetoothNotSupported))
            close()
            return@callbackFlow
        }
        if (!availability.isBluetoothEnabled()) {
            trySend(BleEvent.Error(BleScanError.BluetoothDisabled))
            close()
            return@callbackFlow
        }
        val missingPermissions = BlePermissions.missing(context)
        if (missingPermissions.isNotEmpty()) {
            trySend(BleEvent.Error(BleScanError.PermissionsMissing(missingPermissions)))
            close()
            return@callbackFlow
        }
        if (availability.isSystemLocationRequiredAndDisabled()) {
            trySend(BleEvent.Error(BleScanError.SystemLocationDisabled))
            close()
            return@callbackFlow
        }

        val scanner = availability.bluetoothAdapter()?.bluetoothLeScanner
        if (scanner == null) {
            trySend(BleEvent.Error(BleScanError.BluetoothDisabled))
            close()
            return@callbackFlow
        }

        val callback = object : ScanCallback() {
            override fun onScanResult(callbackType: Int, result: ScanResult) {
                trySend(BleEvent.Reading(result.toBleDeviceReading(System.currentTimeMillis())))
            }

            override fun onBatchScanResults(results: MutableList<ScanResult>) {
                val now = System.currentTimeMillis()
                results.forEach { trySend(BleEvent.Reading(it.toBleDeviceReading(now))) }
            }

            override fun onScanFailed(errorCode: Int) {
                trySend(BleEvent.Error(BleScanError.ScanFailed(errorCode, describeScanFailure(errorCode))))
                close()
            }
        }

        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build()

        try {
            scanner.startScan(null, settings, callback)
        } catch (t: Throwable) {
            trySend(BleEvent.Error(BleScanError.Unknown(t)))
            close()
        }

        awaitClose {
            try {
                scanner.stopScan(callback)
            } catch (_: Throwable) {
                // Adapter mógł zostać wyłączony w międzyczasie -- bezpiecznie ignorujemy przy sprzątaniu.
            }
        }
    }

    private fun describeScanFailure(errorCode: Int): String = when (errorCode) {
        ScanCallback.SCAN_FAILED_ALREADY_STARTED -> "Skanowanie już trwa."
        ScanCallback.SCAN_FAILED_APPLICATION_REGISTRATION_FAILED -> "Nie udało się zarejestrować skanera w systemie."
        ScanCallback.SCAN_FAILED_FEATURE_UNSUPPORTED -> "Ta funkcja skanowania nie jest wspierana na tym urządzeniu."
        ScanCallback.SCAN_FAILED_INTERNAL_ERROR -> "Wewnętrzny błąd stosu Bluetooth systemu Android."
        else -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && errorCode == ScanCallback.SCAN_FAILED_SCANNING_TOO_FREQUENTLY) {
            "System Android ograniczył częstotliwość skanowania — odczekaj chwilę."
        } else {
            "Nieznany błąd skanowania (kod $errorCode)."
        }
    }
}
