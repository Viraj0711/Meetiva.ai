/**
 * Reticle development-only setup.
 * This file is tree-shaken from production builds via import.meta.env.DEV.
 *
 * Note: @reticlehq/core no longer exports registerCapabilities in newer versions.
 * The setup is preserved as a no-op to avoid build errors while keeping the file
 * as a reference for future Reticle integration.
 */
if (import.meta.env.DEV) {
  // Reticle setup placeholder — registerCapabilities was removed from @reticlehq/core
  // in a later version. Re-enable when the API stabilizes.
}
