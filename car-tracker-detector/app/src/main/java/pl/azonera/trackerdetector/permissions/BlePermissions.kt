package pl.azonera.trackerdetector.permissions

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat

/**
 * Uprawnienia wymagane do skanowania BLE, dobrane MINIMALNIE do wersji Androida.
 *
 * - API 31+ (S): tylko BLUETOOTH_SCAN. Deklarujemy je w manifeście z flagą
 *   `neverForLocation`, bo aplikacja nigdy nie wylicza fizycznej lokalizacji z wyników skanu —
 *   dzięki temu NIE musimy prosić o ACCESS_FINE_LOCATION na nowych Androidach.
 * - API 26-30: Android wymaga ACCESS_FINE_LOCATION, żeby zwrócić wyniki skanu BLE. To wymóg
 *   systemu, nie wybór tej aplikacji.
 *
 * Celowo NIE żądamy BLUETOOTH_CONNECT — aplikacja nigdy nie łączy się ani nie paruje z
 * urządzeniami, więc tego uprawnienia faktycznie nie potrzebuje.
 */
object BlePermissions {

    fun required(): Array<String> {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            arrayOf(Manifest.permission.BLUETOOTH_SCAN)
        } else {
            arrayOf(Manifest.permission.ACCESS_FINE_LOCATION)
        }
    }

    fun allGranted(context: Context): Boolean {
        return required().all {
            ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    fun missing(context: Context): List<String> {
        return required().filter {
            ContextCompat.checkSelfPermission(context, it) != PackageManager.PERMISSION_GRANTED
        }
    }

    /** Czy powinniśmy tłumaczyć uprawnienie w kontekście "lokalizacja", czy "urządzenia w pobliżu". */
    fun isLegacyLocationBased(): Boolean = Build.VERSION.SDK_INT < Build.VERSION_CODES.S
}
