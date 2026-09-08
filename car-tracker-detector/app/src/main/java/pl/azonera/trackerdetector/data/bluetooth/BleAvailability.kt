package pl.azonera.trackerdetector.data.bluetooth

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import android.os.Build
import androidx.core.content.getSystemService
import androidx.core.location.LocationManagerCompat

/** Sprawdza realne, sprzętowe/systemowe ograniczenia zanim spróbujemy skanować. */
class BleAvailability(private val context: Context) {

    fun isBleSupported(): Boolean =
        context.packageManager.hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE)

    private fun adapter(): BluetoothAdapter? =
        context.getSystemService<BluetoothManager>()?.adapter

    fun isBluetoothEnabled(): Boolean = adapter()?.isEnabled == true

    fun bluetoothAdapter(): BluetoothAdapter? = adapter()

    /**
     * Na API 26-30 niektórzy producenci (OEM) dodatkowo wymagają włączonych "Usług
     * lokalizacji" na poziomie systemu, żeby skan BLE w ogóle zwracał wyniki — to
     * udokumentowane, systemowe zachowanie Androida, nie coś, na co ta aplikacja ma wpływ.
     * Na API 31+ z uprawnieniem `neverForLocation` nie jest to wymagane.
     */
    fun isSystemLocationRequiredAndDisabled(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) return false
        val locationManager = context.getSystemService<LocationManager>() ?: return false
        // LocationManagerCompat obsługuje poprawnie API 26-27, gdzie LocationManager.isLocationEnabled()
        // (dodane dopiero w API 28) jeszcze nie istniało.
        return !LocationManagerCompat.isLocationEnabled(locationManager)
    }
}
