package pl.azonera.trackerdetector.permissions

import android.Manifest
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class BlePermissionsTest {

    @Test
    @Config(sdk = [30])
    fun `pre-S devices require ACCESS_FINE_LOCATION`() {
        assertEquals(listOf(Manifest.permission.ACCESS_FINE_LOCATION), BlePermissions.required().toList())
        assertEquals(true, BlePermissions.isLegacyLocationBased())
    }

    @Test
    @Config(sdk = [31])
    fun `S and above require only BLUETOOTH_SCAN`() {
        assertEquals(listOf(Manifest.permission.BLUETOOTH_SCAN), BlePermissions.required().toList())
        assertEquals(false, BlePermissions.isLegacyLocationBased())
    }

    @Test
    @Config(sdk = [34])
    fun `never requests BLUETOOTH_CONNECT - app never connects to devices`() {
        assertEquals(false, BlePermissions.required().contains(Manifest.permission.BLUETOOTH_CONNECT))
    }
}
