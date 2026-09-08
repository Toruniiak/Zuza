package pl.azonera.trackerdetector.ui.common

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import pl.azonera.trackerdetector.core.model.DetectedDevice
import pl.azonera.trackerdetector.ui.theme.TextSecondary

@Composable
fun DeviceListItem(device: DetectedDevice, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = device.displayName ?: "Urządzenie bez nazwy",
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    text = "${device.address} · ${device.lastRssi} dBm · ${device.detectionCount}x",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
            }
            RiskBadge(level = device.riskLevel)
        }
    }
}
