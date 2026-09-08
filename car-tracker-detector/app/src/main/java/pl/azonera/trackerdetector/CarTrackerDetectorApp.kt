package pl.azonera.trackerdetector

import android.app.Application

class CarTrackerDetectorApp : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
