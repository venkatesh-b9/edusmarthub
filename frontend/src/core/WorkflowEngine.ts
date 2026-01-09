/**
 * Workflow Orchestrator
 * Executes complex workflows spanning multiple components
 */

import { EventEmitter } from 'events';
import { enhancedAIService } from '@/lib/api/services/ai.service.enhanced';
import { apiService } from '@/lib/api/apiService';
import { GlobalEventSystem } from './EventSystem';

export interface WorkflowDefinition {
  name: string;
  version: string;
  description: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  name: string;
  type: 'validation' | 'action' | 'decision' | 'ai_correction' | 'ai_optimization' | 'ai_generation' | 'notification' | 'end';
  service?: string;
  method?: string;
  aiPrompt?: string;
  aiDecision?: boolean;
  dependsOn?: string[];
  parallel?: string[];
  onFailure?: string;
  branches?: Record<string, string>;
}

export interface WorkflowInstance {
  id: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startTime: number;
  endTime?: number;
  currentStep: number;
  input: any;
  output: any;
  steps: WorkflowStepResult[];
  metadata: Record<string, any>;
  error?: Error;
}

export interface WorkflowStepResult {
  stepName: string;
  status: 'success' | 'failed' | 'skipped';
  result?: any;
  error?: Error;
  duration: number;
  timestamp: number;
}

export interface WorkflowResult {
  instanceId: string;
  status: 'success' | 'failed' | 'partial';
  output: any;
  steps: WorkflowStepResult[];
  duration: number;
}

export interface AIDecision {
  branch?: string;
  confidence: number;
  reasoning: string;
  alternatives?: string[];
}

export class WorkflowEngine extends EventEmitter {
  private static instance: WorkflowEngine;
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private workflowInstances: Map<string, WorkflowInstance> = new Map();
  private eventSystem: GlobalEventSystem;

  private constructor() {
    super();
    this.eventSystem = GlobalEventSystem.getInstance();
    this.registerDefaultWorkflows();
  }

  static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowName: string, input: any): Promise<WorkflowResult> {
    const definition = this.workflows.get(workflowName);
    if (!definition) {
      throw new Error(`Workflow ${workflowName} not found`);
    }

    // Create workflow instance
    const instance: WorkflowInstance = {
      id: this.generateId(),
      workflowName,
      status: 'running',
      startTime: Date.now(),
      currentStep: 0,
      input,
      output: null,
      steps: [],
      metadata: {},
    };

    this.workflowInstances.set(instance.id, instance);
    this.emit('workflow_started', { instanceId: instance.id, workflowName });

    try {
      // Execute steps
      for (let i = 0; i < definition.steps.length; i++) {
        const step = definition.steps[i];
        instance.currentStep = i;

        // Check dependencies
        if (step.dependsOn) {
          const dependenciesMet = step.dependsOn.every((dep) =>
            instance.steps.some((s) => s.stepName === dep && s.status === 'success')
          );
          if (!dependenciesMet) {
            instance.steps.push({
              stepName: step.name,
              status: 'skipped',
              duration: 0,
              timestamp: Date.now(),
            });
            continue;
          }
        }

        try {
          const stepResult = await this.executeStep(step, instance);
          instance.steps.push(stepResult);

          // AI decision for next step
          if (step.type === 'decision' && step.aiDecision) {
            const decision = await this.getAIDecision(step, instance);
            if (decision.branch) {
              // Jump to different step based on AI decision
              const branchStepIndex = definition.steps.findIndex((s) => s.name === decision.branch);
              if (branchStepIndex !== -1) {
                i = branchStepIndex - 1; // -1 because loop will increment
                continue;
              }
            }
          }

          // Check for workflow completion
          if (step.type === 'end' || instance.status === 'completed') {
            break;
          }
        } catch (error) {
          instance.status = 'failed';
          instance.error = error as Error;

          // Try AI-powered recovery
          const recovered = await this.attemptAIRecovery(instance, error as Error, step);
          if (recovered) {
            i--; // Retry current step
            instance.status = 'running';
            continue;
          }

          // Handle failure
          if (step.onFailure) {
            const failureStep = definition.steps.find((s) => s.name === step.onFailure);
            if (failureStep) {
              i = definition.steps.indexOf(failureStep) - 1;
              continue;
            }
          }

          break;
        }
      }

      // Finalize workflow
      instance.status = instance.status === 'running' ? 'completed' : instance.status;
      instance.endTime = Date.now();
      instance.output = this.generateOutput(instance);

      this.emit('workflow_completed', { instanceId: instance.id, status: instance.status });

      return this.generateWorkflowResult(instance);
    } catch (error) {
      instance.status = 'failed';
      instance.error = error as Error;
      instance.endTime = Date.now();

      this.emit('workflow_failed', { instanceId: instance.id, error });

      throw error;
    }
  }

  private async executeStep(step: WorkflowStep, instance: WorkflowInstance): Promise<WorkflowStepResult> {
    const startTime = Date.now();

    try {
      let result: any;

      switch (step.type) {
        case 'validation':
          result = await this.executeValidation(step, instance);
          break;
        case 'action':
          result = await this.executeAction(step, instance);
          break;
        case 'decision':
          result = await this.executeDecision(step, instance);
          break;
        case 'ai_correction':
          result = await this.executeAICorrection(step, instance);
          break;
        case 'ai_optimization':
          result = await this.executeAIOptimization(step, instance);
          break;
        case 'ai_generation':
          result = await this.executeAIGeneration(step, instance);
          break;
        case 'notification':
          result = await this.executeNotification(step, instance);
          break;
        case 'end':
          instance.status = 'completed';
          result = { completed: true };
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      return {
        stepName: step.name,
        status: 'success',
        result,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        stepName: step.name,
        status: 'failed',
        error: error as Error,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  private async executeValidation(step: WorkflowStep, instance: WorkflowInstance): Promise<any> {
    // Execute validation logic
    if (step.service && step.method) {
      // Call service method
      return await this.callServiceMethod(step.service, step.method, instance.input);
    }
    return { validated: true };
  }

  private async executeAction(step: WorkflowStep, instance: WorkflowInstance): Promise<any> {
    if (step.service && step.method) {
      return await this.callServiceMethod(step.service, step.method, instance.input);
    }
    return { action: 'completed' };
  }

  private async executeDecision(step: WorkflowStep, instance: WorkflowInstance): Promise<any> {
    if (step.service && step.method) {
      return await this.callServiceMethod(step.service, step.method, instance.input);
    }
    return { decision: 'continue' };
  }

  private async executeAICorrection(step: WorkflowStep, instance: WorkflowInstance): Promise<any> {
    if (!step.aiPrompt) {
      throw new Error('AI prompt required for AI correction step');
    }

    const prompt = `${step.aiPrompt}\n\nData: ${JSON.stringify(instance.input)}`;
    const response = await enhancedAIService.processNLQ(prompt, {
      type: 'data_correction',
      workflow: instance.workflowName,
    });

    return response.response || response;
  }

  private async executeAIOptimization(step: WorkflowStep, instance: WorkflowInstance): Promise<any> {
    if (!step.aiPrompt) {
      throw new Error('AI prompt required for AI optimization step');
    }

    const prompt = `${step.aiPrompt}\n\nContext: ${JSON.stringify(instance)}`;
    const response = await enhancedAIService.processNLQ(prompt, {
      type: 'optimization',
      workflow: instance.workflowName,
    });

    return response.response || response;
  }

  private async executeAIGeneration(step: WorkflowStep, instance: WorkflowInstance): Promise<any> {
    if (!step.aiPrompt) {
      throw new Error('AI prompt required for AI generation step');
    }

    const prompt = `${step.aiPrompt}\n\nContext: ${JSON.stringify(instance)}`;
    const response = await enhancedAIService.processNLQ(prompt, {
      type: 'generation',
      workflow: instance.workflowName,
    });

    return response.response || response;
  }

  private async executeNotification(step: WorkflowStep, instance: WorkflowInstance): Promise<any> {
    // Send notifications
    await this.eventSystem.emit({
      type: 'notification',
      channel: 'notifications',
      data: instance.input,
      timestamp: Date.now(),
      metadata: {},
    });

    return { notified: true };
  }

  private async getAIDecision(step: WorkflowStep, instance: WorkflowInstance): Promise<AIDecision> {
    const prompt = `
      Make a decision for workflow step: ${step.name}
      Workflow: ${instance.workflowName}
      Current state: ${JSON.stringify(instance)}
      Step configuration: ${JSON.stringify(step)}
      
      Available options: ${JSON.stringify(step.branches)}
      
      Consider:
      1. Business rules
      2. Historical patterns
      3. Current context
      4. Risk factors
    `;

    const response = await enhancedAIService.processNLQ(prompt, {
      type: 'workflow_decision',
      workflow: instance.workflowName,
    });

    return {
      branch: response.branch,
      confidence: response.confidence || 0.5,
      reasoning: response.reasoning || '',
      alternatives: response.alternatives,
    };
  }

  private async attemptAIRecovery(
    instance: WorkflowInstance,
    error: Error,
    step: WorkflowStep
  ): Promise<boolean> {
    try {
      const prompt = `
        Attempt to recover from workflow error:
        Workflow: ${instance.workflowName}
        Step: ${step.name}
        Error: ${error.message}
        Current state: ${JSON.stringify(instance)}
        
        Provide recovery strategy or return null if recovery is not possible.
      `;

      const response = await enhancedAIService.processNLQ(prompt, {
        type: 'workflow_recovery',
        workflow: instance.workflowName,
      });

      if (response.recoverable && response.strategy) {
        // Apply recovery strategy
        await this.applyRecoveryStrategy(instance, response.strategy);
        return true;
      }
    } catch (recoveryError) {
      console.error('AI recovery failed:', recoveryError);
    }

    return false;
  }

  private async applyRecoveryStrategy(instance: WorkflowInstance, strategy: any): Promise<void> {
    // Apply recovery strategy
    if (strategy.retry) {
      // Retry logic
    } else if (strategy.skip) {
      // Skip step
    } else if (strategy.modify) {
      // Modify input
      instance.input = { ...instance.input, ...strategy.modify };
    }
  }

  private async callServiceMethod(service: string, method: string, input: any): Promise<any> {
    // Map service names to actual service calls
    const serviceMap: Record<string, any> = {
      apiService,
      enhancedAIService,
    };

    const serviceInstance = serviceMap[service];
    if (!serviceInstance || !serviceInstance[method]) {
      throw new Error(`Service ${service} or method ${method} not found`);
    }

    return await serviceInstance[method](input);
  }

  private generateOutput(instance: WorkflowInstance): any {
    // Generate output from workflow steps
    const outputs: Record<string, any> = {};
    instance.steps.forEach((step) => {
      if (step.status === 'success' && step.result) {
        outputs[step.stepName] = step.result;
      }
    });
    return outputs;
  }

  private generateWorkflowResult(instance: WorkflowInstance): WorkflowResult {
    return {
      instanceId: instance.id,
      status: instance.status === 'completed' ? 'success' : instance.status === 'failed' ? 'failed' : 'partial',
      output: instance.output,
      steps: instance.steps,
      duration: (instance.endTime || Date.now()) - instance.startTime,
    };
  }

  private registerDefaultWorkflows(): void {
    // Register student enrollment workflow
    this.registerStudentEnrollmentWorkflow();
  }

  private registerStudentEnrollmentWorkflow(): void {
    const workflow: WorkflowDefinition = {
      name: 'student_enrollment',
      version: '1.0',
      description: 'Complete student enrollment with AI assistance',
      steps: [
        {
          name: 'validate_data',
          type: 'validation',
          service: 'apiService',
          method: 'post',
          onFailure: 'data_correction',
        },
        {
          name: 'data_correction',
          type: 'ai_correction',
          aiPrompt: 'Correct and complete student enrollment data',
        },
        {
          name: 'check_eligibility',
          type: 'decision',
          service: 'apiService',
          method: 'post',
          aiDecision: true,
          branches: {
            eligible: 'create_account',
            not_eligible: 'handle_rejection',
            requires_approval: 'send_for_approval',
          },
        },
        {
          name: 'create_account',
          type: 'action',
          service: 'apiService',
          method: 'post',
          parallel: ['assign_class', 'setup_parent_account'],
        },
        {
          name: 'assign_class',
          type: 'ai_optimization',
          aiPrompt: 'Optimize class assignment for student',
          dependsOn: ['create_account'],
        },
        {
          name: 'notify_stakeholders',
          type: 'notification',
        },
        {
          name: 'generate_documents',
          type: 'ai_generation',
          aiPrompt: 'Generate enrollment documents',
        },
        {
          name: 'complete_enrollment',
          type: 'end',
        },
      ],
    };

    this.workflows.set(workflow.name, workflow);
  }

  registerWorkflow(definition: WorkflowDefinition): void {
    this.workflows.set(definition.name, definition);
  }

  getWorkflow(name: string): WorkflowDefinition | undefined {
    return this.workflows.get(name);
  }

  getWorkflowInstance(instanceId: string): WorkflowInstance | undefined {
    return this.workflowInstances.get(instanceId);
  }

  private generateId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default WorkflowEngine.getInstance();
