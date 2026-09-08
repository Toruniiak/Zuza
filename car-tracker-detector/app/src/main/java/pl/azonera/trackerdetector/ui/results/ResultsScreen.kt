package pl.azonera.trackerdetector.ui.results

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import pl.azonera.trackerdetector.ui.common.DeviceListItem
import pl.azonera.trackerdetector.ui.theme.TextSecondary
import pl.azonera.trackerdetector.util.rememberAppContainer

@Composable
fun ResultsScreen(
    sessionId: String,
    onScanAgain: () -> Unit,
    onOpenTechnicalMode: (String) -> Unit,
    onDeviceClick: (address: String) -> Unit
) {
    val container = rememberAppContainer()
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
            Text(stringResource(R.string.results_title), style = MaterialTheme.typography.headlineLarge)
            Spacer(Modifier.height(4.dp))
            Text(
                stringResource(R.string.results_devices_found, current.totalDevicesFound),
                color = TextSecondary
            )
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("🟢 ${current.lowRiskCount}")
                Text("🟡 ${current.unknownCount}")
                Text("🟠 ${current.suspiciousCount}")
                Text("🔴 ${current.highRiskCount}")
            }
            Spacer(Modifier.height(16.dp))

            if (current.devices.isEmpty()) {
                Text(stringResource(R.string.results_empty), color = TextSecondary)
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(current.devices, key = { it.address }) { device ->
                        DeviceListItem(device = device, onClick = { onDeviceClick(device.address) })
                    }
                }
            }

            Spacer(Modifier.height(12.dp))
            OutlinedButton(onClick = { onOpenTechnicalMode(sessionId) }, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.results_technical_mode))
            }
            Spacer(Modifier.height(8.dp))
            Button(onClick = onScanAgain, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.results_scan_again))
            }
        }
    }
}
