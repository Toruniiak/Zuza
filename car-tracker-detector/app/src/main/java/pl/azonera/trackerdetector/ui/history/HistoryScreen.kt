package pl.azonera.trackerdetector.ui.history

import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.compose.viewModelFactory
import pl.azonera.trackerdetector.R
import pl.azonera.trackerdetector.ui.theme.TextSecondary
import pl.azonera.trackerdetector.util.TimeFormat
import pl.azonera.trackerdetector.util.rememberAppContainer

@Composable
fun HistoryScreen(onOpenSession: (String) -> Unit) {
    val container = rememberAppContainer()
    val viewModel: HistoryViewModel = viewModel(
        factory = viewModelFactory { initializer { HistoryViewModel(container.historyRepository) } }
    )
    val sessions by viewModel.sessions.collectAsState()

    Scaffold { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(20.dp)
        ) {
            Text(stringResource(R.string.history_title), style = MaterialTheme.typography.headlineLarge)
            Spacer(Modifier.height(16.dp))

            if (sessions.isEmpty()) {
                Text(stringResource(R.string.history_empty), color = TextSecondary)
            } else {
                LazyColumn(modifier = Modifier.weight(1f)) {
                    items(sessions, key = { it.sessionId }) { item ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clickable { onOpenSession(item.sessionId) },
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(TimeFormat.dateTime(item.startedAtMillis), style = MaterialTheme.typography.bodyLarge)
                                    Text(
                                        stringResource(
                                            R.string.history_item_summary,
                                            item.totalDevicesFound,
                                            item.suspiciousAndHighRiskCount
                                        ),
                                        color = TextSecondary,
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                }
                                IconButton(onClick = { viewModel.deleteSession(item.sessionId) }) {
                                    Icon(Icons.Default.Delete, contentDescription = stringResource(R.string.history_delete))
                                }
                            }
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
                OutlinedButton(onClick = { viewModel.deleteAll() }, modifier = Modifier.fillMaxWidth()) {
                    Text(stringResource(R.string.history_delete_all))
                }
            }
        }
    }
}
