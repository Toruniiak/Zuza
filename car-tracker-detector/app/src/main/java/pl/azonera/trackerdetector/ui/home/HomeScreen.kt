@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package pl.azonera.trackerdetector.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.PrivacyTip
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import pl.azonera.trackerdetector.R
import pl.azonera.trackerdetector.ui.navigation.ScanMode
import pl.azonera.trackerdetector.ui.theme.TextSecondary

@Composable
fun HomeScreen(
    onStartScan: (ScanMode) -> Unit,
    onOpenHistory: () -> Unit,
    onOpenPrivacy: () -> Unit,
    onOpenCarMap: () -> Unit
) {
    var mode by remember { mutableStateOf(ScanMode.FULL) }
    var showProcedureDialog by remember { mutableStateOf(false) }

    if (showProcedureDialog) {
        FullScanProcedureDialog(
            onConfirm = {
                showProcedureDialog = false
                onStartScan(ScanMode.FULL)
            },
            onDismiss = { showProcedureDialog = false }
        )
    }

    Scaffold { padding: PaddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.Bluetooth,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(56.dp)
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = stringResource(R.string.home_title),
                style = MaterialTheme.typography.headlineLarge,
                textAlign = TextAlign.Center
            )

            Spacer(Modifier.height(24.dp))
            DisclaimerCard()

            Spacer(Modifier.height(24.dp))
            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                SegmentedButton(
                    selected = mode == ScanMode.FULL,
                    onClick = { mode = ScanMode.FULL },
                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2)
                ) { Text(stringResource(R.string.home_full_scan_mode)) }
                SegmentedButton(
                    selected = mode == ScanMode.QUICK,
                    onClick = { mode = ScanMode.QUICK },
                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2)
                ) { Text(stringResource(R.string.home_quick_scan_mode)) }
            }

            Spacer(Modifier.height(24.dp))
            Button(
                onClick = {
                    if (mode == ScanMode.FULL) showProcedureDialog = true else onStartScan(mode)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text(
                    text = stringResource(R.string.home_start_scan),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(Modifier.height(8.dp))
            Text(
                text = stringResource(R.string.home_status_ready),
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )

            Spacer(Modifier.height(32.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                HomeMenuAction(Icons.Default.History, stringResource(R.string.home_menu_history), onOpenHistory)
                HomeMenuAction(Icons.Default.Map, stringResource(R.string.home_menu_car_map), onOpenCarMap)
                HomeMenuAction(Icons.Default.PrivacyTip, stringResource(R.string.home_menu_privacy), onOpenPrivacy)
            }
        }
    }
}

@Composable
private fun HomeMenuAction(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        OutlinedButton(onClick = onClick, shape = RoundedCornerShape(50)) {
            Icon(icon, contentDescription = label)
        }
        Spacer(Modifier.height(4.dp))
        Text(label, style = MaterialTheme.typography.bodyMedium, color = TextSecondary, textAlign = TextAlign.Center)
    }
}

private val procedureSteps = listOf(
    R.string.procedure_step_1, R.string.procedure_step_2, R.string.procedure_step_3,
    R.string.procedure_step_4, R.string.procedure_step_5, R.string.procedure_step_6,
    R.string.procedure_step_7, R.string.procedure_step_8, R.string.procedure_step_9,
    R.string.procedure_step_10
)

@Composable
private fun FullScanProcedureDialog(onConfirm: () -> Unit, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.procedure_title)) },
        text = {
            Column {
                procedureSteps.forEach { stepRes ->
                    Text(
                        text = stringResource(stepRes),
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(vertical = 3.dp)
                    )
                }
            }
        },
        confirmButton = {
            Button(onClick = onConfirm) { Text(stringResource(R.string.procedure_start)) }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) { Text("Anuluj") }
        }
    )
}

@Composable
private fun DisclaimerCard() {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(
                text = stringResource(R.string.home_disclaimer_title),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.secondary
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = stringResource(R.string.home_disclaimer_body),
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
        }
    }
}
