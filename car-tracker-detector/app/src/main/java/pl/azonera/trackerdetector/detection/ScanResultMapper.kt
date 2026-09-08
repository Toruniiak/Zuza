package pl.azonera.trackerdetector.detection

import android.annotation.SuppressLint
import android.bluetooth.le.ScanRecord
import android.bluetooth.le.ScanResult
import android.os.Build
import pl.azonera.trackerdetector.core.model.BleDeviceReading

/**
 * Konwertuje surowy Android `ScanResult` na neutralny model domenowy [BleDeviceReading],
 * który nie ma żadnej zależności od Androida (żyje w module `:core`).
 *
 * Odczyt `device.address` i `scanRecord.deviceName` NIE wymaga uprawnienia BLUETOOTH_CONNECT —
 * oba pochodzą wyłącznie z danych już zawartych w pakiecie advertising / Parcelable, bez
 * żadnego dodatkowego zapytania do zdalnego urządzenia.
 */
@SuppressLint("MissingPermission") // patrz komentarz wyżej: nie wymaga BLUETOOTH_CONNECT
fun ScanResult.toBleDeviceReading(nowMillis: Long): BleDeviceReading {
    val record: ScanRecord? = scanRecord

    val manufacturerData: Map<Int, List<Byte>> = record?.manufacturerSpecificData?.let { sparse ->
        buildMap {
            for (i in 0 until sparse.size()) {
                val bytes = sparse.valueAt(i)
                put(sparse.keyAt(i), bytes?.toList() ?: emptyList())
            }
        }
    } ?: emptyMap()

    val serviceUuids: List<String> = record?.serviceUuids?.map { it.uuid.toString() } ?: emptyList()

    val serviceData: Map<String, List<Byte>> = record?.serviceData?.entries?.associate { entry ->
        entry.key.uuid.toString() to entry.value.toList()
    } ?: emptyMap()

    val txPower = record?.txPowerLevel?.takeIf { it != ScanRecord.TX_POWER_NOT_PRESENT }

    return BleDeviceReading(
        address = device.address,
        name = record?.deviceName,
        rssi = rssi,
        timestampMillis = nowMillis,
        manufacturerData = manufacturerData,
        serviceUuids = serviceUuids,
        serviceData = serviceData,
        isConnectable = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) isConnectable else true,
        txPowerLevel = txPower
    )
}
