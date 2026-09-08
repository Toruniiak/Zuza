package pl.azonera.trackerdetector.data.bluetooth

/** Wszystkie przewidziane sposoby, w jakie skanowanie BLE może się nie udać. */
sealed class BleScanError {
    data object BluetoothNotSupported : BleScanError()
    data object BluetoothDisabled : BleScanError()
    data object SystemLocationDisabled : BleScanError()
    data class PermissionsMissing(val permissions: List<String>) : BleScanError()
    data class ScanFailed(val androidErrorCode: Int, val messagePl: String) : BleScanError()
    data class Unknown(val throwable: Throwable) : BleScanError()
}
