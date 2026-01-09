/**
 * Integration Layer Exports
 * Central export point for all integration components
 */

export { MasterOrchestrator } from '@/core/MasterOrchestrator';
export { DataFlowOrchestrator } from './DataFlowOrchestrator';
export { RealTimeEventBus } from './RealTimeEventBus';
export { WorkflowIntegrator } from './WorkflowIntegrator';
export { ProductionMonitorService } from '@/monitoring/ProductionMonitorService';

// Auto-initialize in production
if (import.meta.env.PROD) {
  import('./initialize').then((module) => {
    module.initializeAllIntegrations();
  });
}
