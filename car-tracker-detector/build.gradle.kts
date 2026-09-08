// Root build file.
//
// NOTE on plugin declarations: the Android Gradle Plugin (and anything that depends on
// it transitively, like the Compose compiler plugin or KSP used for Room) is declared
// directly in app/build.gradle.kts with its own version, NOT here with apply-false.
// Reason: Gradle always configures the root build script even when running a task that
// only touches :core (e.g. with --configure-on-demand), so an unresolvable Android plugin
// declared here would break pure-JVM :core builds too -- and the Android Gradle Plugin is
// only published on Google's Maven repository, which some network policies (including the
// one used to develop this project) block outright. Keeping the Android toolchain
// declaration local to :app means :core stays buildable/testable with plain Gradle + JDK,
// with zero dependency on Android SDK/Google Maven availability. See README.md for details.
plugins {
    id("org.jetbrains.kotlin.jvm") version "2.0.21" apply false
}

tasks.register("clean", Delete::class) {
    delete(rootProject.layout.buildDirectory)
}
