package pl.azonera.trackerdetector.ui.technical

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.compose.viewModelFactory
import pl.azonera.trackerdetector.R
import pl.azonera.trackerdetector.core.model.DetectedDevice
import pl.azonera.trackerdetector.ui.common.RiskBadge
import pl.azonera.trackerdetector.ui.results.ResultsViewModel
import pl.azonera.trackerdetector.ui.theme.TextSecondary
import pl.azonera.trackerdetector.util.TimeFormat
import pl.azonera.trackerdetector.util.rememberAppContainer

@Composable
fun TechnicalScreen(sessionId: String) {
    val container = rememberAppContainer()
    // Reużywamy ResultsViewModel - identyczne wczytywanie sesji, inny sposób prezentacji.
    val viewModel: ResultsViewModel = viewModel(
        factory = viewModelFactory {
            initializer { ResultsViewModel(container.historyRepository, sessionId) }
        }
    )
    val summary by viewModel.summary.collectAsState()

    Scaffold { padding ->
        val current = summary
        if (current == null) {
            Column(
                Modifier
                    .fillMaxSize()
                    .padding(padding),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) { CircularProgressIndicator() }
            return@Scaffold
        }

        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(20.dp)
        ) {
            Text(stringResource(R.string.technical_mode_title), style = MaterialTheme.typography.headlineLarge)
            Spacer(Modifier.height(16.dp))
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(current.devices, key = { it.address }) { device -> TechnicalDeviceCard(device) }
            }
        }
    }
}

@Composable
private fun TechnicalDeviceCard(device: DetectedDevice) {
    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(16.dp)) {
            Text(device.displayName ?: device.address, style = MaterialTheme.typography.bodyLarge)
            Spacer(Modifier.height(4.dp))
            RiskBadge(device.riskLevel)
            Spacer(Modifier.height(8.dp))

            TechRow("Adres", device.address)
            TechRow(
                stringResource(R.string.technical_manufacturer_data),
                if (device.lastManufacturerData.isEmpty()) {
                    "brak"
                } else {
                    device.lastManufacturerData.entries.joinToString("; ") { (companyId, bytes) ->
                        "0x${companyId.toString(16)}: " + bytes.joinToString(" ") { b ->
                            (b.toInt() and 0xFF).toString(16).padStart(2, '0')
                        }
                    }
                }
            )
            TechRow(
                stringResource(R.string.technical_service_uuid),
                device.serviceUuids.takeIf { it.isNotEmpty() }?.joinToString(", ") ?: "brak"
            )
            TechRow(stringResource(R.string.technical_packet_count), device.detectionCount.toString())
            TechRow(
                stringResource(R.string.technical_presence_duration),
                "${TimeFormat.time(device.firstSeenMillis)} → ${TimeFormat.time(device.lastSeenMillis)}"
            )
            TechRow(
                stringResource(R.string.technical_rssi_history),
                device.rssiHistory.takeLast(15).joinToString(", ")
            )
        }
    }
}

@Composable
private fun TechRow(label: String, value: String) {
    Column(Modifier.padding(vertical = 2.dp)) {
        Text(label, style = MaterialTheme.typography.labelLarge, color = TextSecondary)
        Text(value, style = MaterialTheme.typography.bodyMedium)
    }
}
