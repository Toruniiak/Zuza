package pl.azonera.trackerdetector.ui.settings

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.compose.viewModelFactory
import pl.azonera.trackerdetector.R
import pl.azonera.trackerdetector.permissions.BlePermissions
import pl.azonera.trackerdetector.ui.theme.TextSecondary
import pl.azonera.trackerdetector.util.rememberAppContainer

@Composable
fun PrivacyScreen() {
    val container = rememberAppContainer()
    val viewModel: PrivacyViewModel = viewModel(
        factory = viewModelFactory {
            initializer { PrivacyViewModel(container.historyRepository, container.knownDeviceRepository) }
        }
    )
    var confirmingDelete by remember { mutableStateOf(false) }

    Scaffold { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(20.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text(stringResource(R.string.privacy_title), style = MaterialTheme.typography.headlineLarge)
            Spacer(Modifier.height(16.dp))

            InfoSection(stringResource(R.string.privacy_local_first_title), stringResource(R.string.privacy_local_first_body))

            Spacer(Modifier.height(16.dp))
            Text(stringResource(R.string.privacy_permissions_title), style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.height(4.dp))
            Text(
                text = if (BlePermissions.isLegacyLocationBased()) {
                    stringResource(R.string.permissions_explanation_scan_legacy)
                } else {
                    stringResource(R.string.permissions_explanation_scan_modern)
                },
                color = TextSecondary,
                style = MaterialTheme.typography.bodyMedium
            )

            Spacer(Modifier.height(16.dp))
            InfoSection(stringResource(R.string.privacy_limitations_title), stringResource(R.string.privacy_limitations_body))

            Spacer(Modifier.height(24.dp))
            if (confirmingDelete) {
                Text(
                    "Na pewno? Ta operacja jest nieodwracalna i usunie całą historię oraz oznaczenia urządzeń.",
                    color = MaterialTheme.colorScheme.error
                )
                Spacer(Modifier.height(8.dp))
                OutlinedButton(
                    onClick = {
                        viewModel.deleteAllAppData()
                        confirmingDelete = false
                    },
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Potwierdź usunięcie") }
            } else {
                OutlinedButton(onClick = { confirmingDelete = true }, modifier = Modifier.fillMaxWidth()) {
                    Text(stringResource(R.string.privacy_delete_data))
                }
            }
        }
    }
}

@Composable
private fun InfoSection(title: String, body: String) {
    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
        Column(Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.secondary)
            Spacer(Modifier.height(6.dp))
            Text(body, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
        }
    }
}
