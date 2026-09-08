@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package pl.azonera.trackerdetector.ui.scanning

import android.bluetooth.BluetoothAdapter
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.compose.viewModelFactory
import pl.azonera.trackerdetector.R
import pl.azonera.trackerdetector.data.bluetooth.BleScanError
import pl.azonera.trackerdetector.permissions.BlePermissions
import pl.azonera.trackerdetector.ui.navigation.ScanMode
import pl.azonera.trackerdetector.ui.theme.TextSecondary
import pl.azonera.trackerdetector.util.rememberAppContainer

@Composable
fun ScanningScreen(
    mode: ScanMode,
    onFinished: (sessionId: String) -> Unit,
    onCancel: () -> Unit
) {
    val container = rememberAppContainer()
    val viewModel: ScanningViewModel = viewModel(
        factory = viewModelFactory {
            initializer { ScanningViewModel(container.bleRepository, container.knownDeviceRepository, mode) }
        }
    )
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { viewModel.startScan() }

    val enableBluetoothLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { viewModel.startScan() }

    LaunchedEffect(Unit) { viewModel.startScan() }

    LaunchedEffect(uiState) {
        val finished = uiState as? ScanningViewModel.UiState.Finished
        if (finished != null) onFinished(finished.sessionId)
    }

    Scaffold { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp)
        ) {
            when (val state = uiState) {
                is ScanningViewModel.UiState.Idle -> Unit

                is ScanningViewModel.UiState.Scanning -> ScanningContent(state, onCancel = {
                    viewModel.stopScanningEarly()
                })

                is ScanningViewModel.UiState.Finished -> Unit // nawigacja obsłużona w LaunchedEffect

                is ScanningViewModel.UiState.Error -> ErrorContent(
                    error = state.error,
                    onRequestPermissions = { permissionLauncher.launch(BlePermissions.required()) },
                    onEnableBluetooth = {
                        enableBluetoothLauncher.launch(Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE))
                    },
                    onOpenAppSettings = {
                        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                            .setData(Uri.fromParts("package", context.packageName, null))
                        context.startActivity(intent)
                    },
                    onRetry = { viewModel.startScan() },
                    onCancel = onCancel
                )
            }
        }
    }
}

@Composable
private fun ScanningContent(state: ScanningViewModel.UiState.Scanning, onCancel: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = stringResource(R.string.scanning_title),
            style = MaterialTheme.typography.headlineLarge,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(16.dp))
        RadarView(devices = state.devices, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(16.dp))
        LinearProgressIndicator(
            progress = { state.elapsedSeconds.toFloat() / state.totalSeconds.toFloat() },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(16.dp))

        StatRow(stringResource(R.string.scanning_time_label), "${state.elapsedSeconds}s / ${state.totalSeconds}s")
        StatRow(stringResource(R.string.scanning_devices_found_label), state.devicesFound.toString())
        StatRow(stringResource(R.string.scanning_suspicious_label), state.suspiciousCount.toString())
        StatRow(
            stringResource(R.string.scanning_current_signal_label),
            state.currentSignalDbm?.let { "$it dBm" } ?: "—"
        )

        Spacer(Modifier.height(24.dp))
        OutlinedButton(onClick = onCancel, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.scanning_stop))
        }
    }
}

@Composable
private fun StatRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, color = TextSecondary)
        Text(value, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
private fun ErrorContent(
    error: BleScanError,
    onRequestPermissions: () -> Unit,
    onEnableBluetooth: () -> Unit,
    onOpenAppSettings: () -> Unit,
    onRetry: () -> Unit,
    onCancel: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        when (error) {
            is BleScanError.PermissionsMissing -> {
                Text(stringResource(R.string.permissions_title), style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.height(8.dp))
                Text(
                    text = if (BlePermissions.isLegacyLocationBased()) {
                        stringResource(R.string.permissions_explanation_scan_legacy)
                    } else {
                        stringResource(R.string.permissions_explanation_scan_modern)
                    },
                    color = TextSecondary,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(16.dp))
                Button(onClick = onRequestPermissions) { Text(stringResource(R.string.permissions_grant_button)) }
                Spacer(Modifier.height(8.dp))
                Text(
                    text = stringResource(R.string.permissions_denied_message),
                    color = TextSecondary,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(8.dp))
                OutlinedButton(onClick = onOpenAppSettings) {
                    Text(stringResource(R.string.permissions_open_settings))
                }
            }

            is BleScanError.BluetoothDisabled -> {
                Text(stringResource(R.string.bluetooth_disabled_title), style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.height(8.dp))
                Text(stringResource(R.string.bluetooth_disabled_body), color = TextSecondary, textAlign = TextAlign.Center)
                Spacer(Modifier.height(16.dp))
                Button(onClick = onEnableBluetooth) { Text(stringResource(R.string.bluetooth_enable_button)) }
            }

            is BleScanError.BluetoothNotSupported -> {
                Text(stringResource(R.string.bluetooth_not_supported_title), style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.height(8.dp))
                Text(stringResource(R.string.bluetooth_not_supported_body), color = TextSecondary, textAlign = TextAlign.Center)
            }

            is BleScanError.SystemLocationDisabled -> {
                Text(stringResource(R.string.scanning_error_title), style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.height(8.dp))
                Text(
                    "Na tej wersji Androida system wymaga włączonych Usług lokalizacji, żeby skan Bluetooth " +
                        "zwracał wyniki. Włącz je w ustawieniach systemowych i spróbuj ponownie.",
                    color = TextSecondary,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(16.dp))
                Button(onClick = onRetry) { Text(stringResource(R.string.scanning_error_retry)) }
            }

            is BleScanError.ScanFailed -> {
                Text(stringResource(R.string.scanning_error_title), style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.height(8.dp))
                Text(error.messagePl, color = TextSecondary, textAlign = TextAlign.Center)
                Spacer(Modifier.height(16.dp))
                Button(onClick = onRetry) { Text(stringResource(R.string.scanning_error_retry)) }
            }

            is BleScanError.Unknown -> {
                Text(stringResource(R.string.scanning_error_title), style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.height(8.dp))
                Text(
                    error.throwable.message ?: "Nieznany błąd.",
                    color = TextSecondary,
                    textAlign = TextAlign.Center
                )
                Spacer(Modifier.height(16.dp))
                Button(onClick = onRetry) { Text(stringResource(R.string.scanning_error_retry)) }
            }
        }

        Spacer(Modifier.height(24.dp))
        OutlinedButton(onClick = onCancel) { Text("Wróć") }
    }
}
