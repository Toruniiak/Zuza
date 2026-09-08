@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package pl.azonera.trackerdetector.ui.device

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
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
import pl.azonera.trackerdetector.core.model.UserDeviceAction
import pl.azonera.trackerdetector.ui.common.RiskBadge
import pl.azonera.trackerdetector.ui.theme.TextSecondary
import pl.azonera.trackerdetector.util.TimeFormat
import pl.azonera.trackerdetector.util.rememberAppContainer

@Composable
fun DeviceDetailScreen(
    sessionId: String,
    address: String,
    onLocate: () -> Unit
) {
    val container = rememberAppContainer()
    val viewModel: DeviceDetailViewModel = viewModel(
        factory = viewModelFactory {
            initializer {
                DeviceDetailViewModel(container.historyRepository, container.knownDeviceRepository, sessionId, address)
            }
        }
    )
    val device by viewModel.device.collectAsState()

    Scaffold { padding ->
        val current = device
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
                .verticalScroll(rememberScrollState())
        ) {
            Text(stringResource(R.string.device_detail_title), style = MaterialTheme.typography.headlineLarge)
            Spacer(Modifier.height(12.dp))
            RiskBadge(current.riskLevel)
            Spacer(Modifier.height(16.dp))

            DetailRow(stringResource(R.string.device_detail_name), current.displayName ?: stringResource(R.string.device_detail_unknown_value))
            DetailRow(stringResource(R.string.device_detail_rssi), "${current.lastRssi} dBm")
            DetailRow(
                stringResource(R.string.device_detail_manufacturer),
                current.matchedSignature?.manufacturer ?: stringResource(R.string.device_detail_unknown_value)
            )
            DetailRow(stringResource(R.string.device_detail_first_seen), TimeFormat.time(current.firstSeenMillis))
            DetailRow(stringResource(R.string.device_detail_last_seen), TimeFormat.time(current.lastSeenMillis))
            DetailRow(stringResource(R.string.device_detail_detections), current.detectionCount.toString())
            DetailRow(stringResource(R.string.device_detail_assessment), "${current.riskLevel.emoji} ${current.riskLevel.displayNamePl}")

            Spacer(Modifier.height(16.dp))
            Text(stringResource(R.string.device_detail_why_this_score), style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.height(4.dp))
            current.scoringFactors.forEach { factor ->
                Text(
                    text = "• ${factor.descriptionPl} (${if (factor.points >= 0) "+" else ""}${factor.points})",
                    color = TextSecondary,
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            current.matchedSignature?.let { signature ->
                Spacer(Modifier.height(12.dp))
                Text(
                    text = signature.descriptionPl,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
            }

            Spacer(Modifier.height(20.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = current.userAction == UserDeviceAction.MY_DEVICE,
                    onClick = { viewModel.setAction(UserDeviceAction.MY_DEVICE) },
                    label = { Text(stringResource(R.string.device_detail_mark_mine)) }
                )
                FilterChip(
                    selected = current.userAction == UserDeviceAction.IGNORE,
                    onClick = { viewModel.setAction(UserDeviceAction.IGNORE) },
                    label = { Text(stringResource(R.string.device_detail_ignore)) }
                )
                FilterChip(
                    selected = current.userAction == UserDeviceAction.WATCH,
                    onClick = { viewModel.setAction(UserDeviceAction.WATCH) },
                    label = { Text(stringResource(R.string.device_detail_watch)) }
                )
            }

            Spacer(Modifier.height(24.dp))
            Button(onClick = onLocate, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.device_detail_locate))
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, color = TextSecondary)
        Text(value, style = MaterialTheme.typography.bodyLarge)
    }
}
