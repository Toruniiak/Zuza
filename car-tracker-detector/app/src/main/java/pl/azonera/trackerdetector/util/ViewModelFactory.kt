package pl.azonera.trackerdetector.util

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import pl.azonera.trackerdetector.AppContainer
import pl.azonera.trackerdetector.CarTrackerDetectorApp

/** Pomocnik do pobrania współdzielonego [AppContainer] wewnątrz dowolnego composable. */
@Composable
fun rememberAppContainer(): AppContainer {
    val context = LocalContext.current
    return (context.applicationContext as CarTrackerDetectorApp).container
}
