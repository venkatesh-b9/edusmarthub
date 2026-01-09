/**
 * Core Integration Exports
 * Central export point for all core integration components
 */

export { IntegrationManager } from './IntegrationManager';
export { DataSyncManager } from './DataSyncManager';
export { GlobalEventSystem } from './EventSystem';
export { WorkflowEngine } from './WorkflowEngine';
export { TestOrchestrator } from './TestOrchestrator';

// Initialize integration on import
import { IntegrationManager } from './IntegrationManager';

// Auto-initialize in production
if (import.meta.env.PROD) {
  IntegrationManager.getInstance()
    .initializeServices()
    .catch((error) => {
      console.error('Failed to initialize integration manager:', error);
    });
}
