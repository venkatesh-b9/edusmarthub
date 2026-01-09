/**
 * Integration Initialization
 * Initializes all integration components
 */

import { MasterOrchestrator } from '@/core/MasterOrchestrator';
import { RealTimeEventBus } from './RealTimeEventBus';
import { WorkflowIntegrator } from './WorkflowIntegrator';
import { ProductionMonitorService } from '@/monitoring/ProductionMonitorService';

export async function initializeAllIntegrations(): Promise<void> {
  console.log('🚀 Initializing All Integrations...');

  try {
    // 1. Initialize Master Orchestrator
    const orchestrator = MasterOrchestrator.getInstance();
    await orchestrator.initializeAllServices();

    // 2. Initialize Real-Time Event Bus
    const eventBus = RealTimeEventBus.getInstance();
    await eventBus.initialize();

    // 3. Initialize Workflow Integrator
    const workflowIntegrator = WorkflowIntegrator.getInstance();
    await workflowIntegrator.initializeWorkflows();

    // 4. Start Production Monitoring
    const monitor = ProductionMonitorService.getInstance();
    await monitor.startMonitoring();

    console.log('✅ All Integrations Initialized');
  } catch (error) {
    console.error('❌ Integration Initialization Failed:', error);
    throw error;
  }
}

// Export for manual initialization
export default initializeAllIntegrations;
