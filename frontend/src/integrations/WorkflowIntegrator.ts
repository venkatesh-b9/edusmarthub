/**
 * Complete Workflow Integration
 * Connects workflows across all components
 */

import { WorkflowEngine } from '@/core/WorkflowEngine';
import { GlobalEventSystem } from '@/core/EventSystem';
import { apiService } from '@/lib/api/apiService';
import { enhancedAIService } from '@/lib/api/services/ai.service.enhanced';

export interface IntegratedWorkflow {
  name: string;
  description: string;
  steps: WorkflowStep[];
  aiDriven?: boolean;
}

export interface WorkflowStep {
  component: string;
  action: string;
  dependsOn?: string[];
  aiAssisted?: boolean;
  trigger?: string;
  parallel?: string[];
}

export interface WorkflowContext {
  [key: string]: any;
}

export interface WorkflowResult {
  workflowName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  steps: WorkflowStepResult[];
  status: 'running' | 'completed' | 'failed' | 'partial';
  output?: any;
}

export interface WorkflowStepResult extends WorkflowStep {
  status: 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  timestamp: number;
  duration?: number;
}

export class WorkflowIntegrator {
  private static instance: WorkflowIntegrator;
  private workflows: Map<string, IntegratedWorkflow> = new Map();
  private workflowEngine: WorkflowEngine;
  private eventSystem: GlobalEventSystem;

  private constructor() {
    this.workflowEngine = WorkflowEngine.getInstance();
    this.eventSystem = GlobalEventSystem.getInstance();
  }

  static getInstance(): WorkflowIntegrator {
    if (!WorkflowIntegrator.instance) {
      WorkflowIntegrator.instance = new WorkflowIntegrator();
    }
    return WorkflowIntegrator.instance;
  }

  /**
   * Initialize all workflows
   */
  async initializeWorkflows(): Promise<void> {
    console.log('🔄 Initializing Integrated Workflows...');

    // Academic Workflows
    this.registerAcademicWorkflows();

    // Administrative Workflows
    this.registerAdministrativeWorkflows();

    // Communication Workflows
    this.registerCommunicationWorkflows();

    // AI-Powered Workflows
    this.registerAIWorkflows();

    // System Workflows
    this.registerSystemWorkflows();

    console.log(`✅ Workflows Initialized: ${this.workflows.size} workflows`);
  }

  private registerAcademicWorkflows(): void {
    // Student Enrollment → Class Assignment → Parent Setup → Notification
    this.workflows.set('student_enrollment_complete', {
      name: 'Complete Student Enrollment',
      description: 'End-to-end student enrollment with AI assistance',
      steps: [
        {
          component: 'database',
          action: 'create_student_record',
          dependsOn: [],
        },
        {
          component: 'ai_timetable',
          action: 'assign_optimal_class',
          dependsOn: ['create_student_record'],
          aiAssisted: true,
        },
        {
          component: 'user_service',
          action: 'create_parent_account',
          dependsOn: ['create_student_record'],
        },
        {
          component: 'notification',
          action: 'send_welcome_emails',
          dependsOn: ['create_parent_account', 'assign_optimal_class'],
        },
        {
          component: 'ai_performance',
          action: 'create_baseline_profile',
          dependsOn: ['create_student_record'],
          aiAssisted: true,
        },
      ],
    });

    // Exam Cycle: Schedule → Invigilation → Grading → Results → Analysis
    this.workflows.set('exam_cycle_complete', {
      name: 'Complete Exam Cycle',
      description: 'Full exam cycle from scheduling to results',
      steps: [
        {
          component: 'timetable',
          action: 'schedule_exams',
          aiAssisted: true,
        },
        {
          component: 'ai_timetable',
          action: 'assign_invigilators',
          aiAssisted: true,
        },
        {
          component: 'teacher_portal',
          action: 'conduct_exams',
        },
        {
          component: 'grading_system',
          action: 'grade_papers',
        },
        {
          component: 'ai_performance',
          action: 'analyze_results',
          aiAssisted: true,
        },
        {
          component: 'report_system',
          action: 'generate_report_cards',
          aiAssisted: true,
        },
        {
          component: 'parent_portal',
          action: 'publish_results',
        },
        {
          component: 'analytics',
          action: 'update_dashboards',
        },
      ],
    });
  }

  private registerAdministrativeWorkflows(): void {
    // Teacher Onboarding
    this.workflows.set('teacher_onboarding', {
      name: 'Teacher Onboarding',
      description: 'Complete teacher onboarding process',
      steps: [
        {
          component: 'user_service',
          action: 'create_teacher_account',
        },
        {
          component: 'ai_timetable',
          action: 'assign_schedule',
          aiAssisted: true,
        },
        {
          component: 'notification',
          action: 'send_welcome',
        },
        {
          component: 'training',
          action: 'assign_training',
        },
      ],
    });
  }

  private registerCommunicationWorkflows(): void {
    // Parent-Teacher Meeting
    this.workflows.set('parent_teacher_meeting', {
      name: 'Parent-Teacher Meeting',
      description: 'Schedule and conduct parent-teacher meeting',
      steps: [
        {
          component: 'scheduling',
          action: 'find_available_slots',
          aiAssisted: true,
        },
        {
          component: 'notification',
          action: 'send_invitations',
        },
        {
          component: 'meeting',
          action: 'conduct_meeting',
        },
        {
          component: 'ai_nlq',
          action: 'generate_summary',
          aiAssisted: true,
        },
        {
          component: 'notification',
          action: 'send_summary',
        },
      ],
    });
  }

  private registerAIWorkflows(): void {
    // AI-Powered Intervention Workflow
    this.workflows.set('ai_intervention_workflow', {
      name: 'AI-Powered Student Intervention',
      description: 'Automated intervention for at-risk students',
      aiDriven: true,
      steps: [
        {
          component: 'ai_performance',
          action: 'detect_at_risk_student',
          trigger: 'performance_below_threshold',
          aiAssisted: true,
        },
        {
          component: 'ai_nlq',
          action: 'analyze_root_causes',
          dependsOn: ['detect_at_risk_student'],
          aiAssisted: true,
        },
        {
          component: 'ai_performance',
          action: 'generate_intervention_plan',
          dependsOn: ['analyze_root_causes'],
          aiAssisted: true,
        },
        {
          component: 'workflow_engine',
          action: 'assign_intervention_tasks',
          dependsOn: ['generate_intervention_plan'],
        },
        {
          component: 'notification',
          action: 'notify_stakeholders',
          dependsOn: ['assign_intervention_tasks'],
        },
        {
          component: 'monitoring',
          action: 'track_intervention_progress',
          dependsOn: ['notify_stakeholders'],
        },
        {
          component: 'ai_performance',
          action: 'evaluate_intervention_effectiveness',
          dependsOn: ['track_intervention_progress'],
          aiAssisted: true,
        },
      ],
    });
  }

  private registerSystemWorkflows(): void {
    // System Maintenance
    this.workflows.set('system_maintenance', {
      name: 'System Maintenance',
      description: 'Automated system maintenance workflow',
      steps: [
        {
          component: 'backup',
          action: 'create_backup',
        },
        {
          component: 'database',
          action: 'optimize_database',
        },
        {
          component: 'cache',
          action: 'clear_cache',
        },
        {
          component: 'monitoring',
          action: 'verify_health',
        },
      ],
    });
  }

  /**
   * Execute integrated workflow
   */
  async executeIntegratedWorkflow(
    workflowName: string,
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Workflow ${workflowName} not found`);
    }

    const result: WorkflowResult = {
      workflowName,
      startTime: Date.now(),
      steps: [],
      status: 'running',
    };

    try {
      // Execute each step with dependency resolution
      for (const step of workflow.steps) {
        const stepStartTime = Date.now();

        try {
          // Check dependencies
          if (step.dependsOn && step.dependsOn.length > 0) {
            const dependenciesMet = step.dependsOn.every((dep) =>
              result.steps.some((s) => s.action === dep && s.status === 'completed')
            );

            if (!dependenciesMet) {
              result.steps.push({
                ...step,
                status: 'skipped',
                error: 'Dependencies not met',
                timestamp: Date.now(),
                duration: Date.now() - stepStartTime,
              });
              continue;
            }
          }

          // Execute step
          const stepResult = await this.executeStep(step, context, result);

          result.steps.push({
            ...step,
            ...stepResult,
            timestamp: Date.now(),
            duration: Date.now() - stepStartTime,
          });

          // If AI-assisted, log AI involvement
          if (step.aiAssisted) {
            await this.logAIAssistance(step, stepResult);
          }
        } catch (error: any) {
          result.steps.push({
            ...step,
            status: 'failed',
            error: error.message || 'Step execution failed',
            timestamp: Date.now(),
            duration: Date.now() - stepStartTime,
          });

          // Attempt recovery
          const recovered = await this.attemptRecovery(step, error, context, result);
          if (!recovered) {
            result.status = 'failed';
            break;
          }
        }
      }

      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;
      result.status = result.status === 'running' ? 'completed' : result.status;

      // Send workflow completion event
      await this.eventSystem.emit({
        type: 'workflow_completed',
        channel: 'system',
        data: result,
        timestamp: Date.now(),
        metadata: {},
      });

      return result;
    } catch (error: any) {
      result.status = 'failed';
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;
      throw error;
    }
  }

  private async executeStep(
    step: WorkflowStep,
    context: WorkflowContext,
    result: WorkflowResult
  ): Promise<Omit<WorkflowStepResult, keyof WorkflowStep>> {
    let stepResult: any;

    switch (step.component) {
      case 'database':
        stepResult = await this.executeDatabaseAction(step, context);
        break;
      case 'ai_timetable':
      case 'ai_performance':
      case 'ai_nlq':
        stepResult = await this.executeAIAction(step, context);
        break;
      case 'user_service':
      case 'notification':
      case 'scheduling':
        stepResult = await this.executeAPIAction(step, context);
        break;
      default:
        stepResult = await this.executeGenericAction(step, context);
    }

    return {
      status: 'completed' as const,
      result: stepResult,
    };
  }

  private async executeDatabaseAction(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    // Database actions are handled by backend API
    return await apiService.post(`/workflows/${step.action}`, context);
  }

  private async executeAIAction(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    if (step.action === 'assign_optimal_class') {
      return await enhancedAIService.optimizeTimetable(
        context.constraints || {},
        {
          optimization_goal: 'balanced_workload',
          include_visualization: true,
          school_id: context.schoolId,
        }
      );
    } else if (step.action === 'analyze_root_causes') {
      return await enhancedAIService.processNLQ(
        `Analyze root causes for student performance issues: ${JSON.stringify(context)}`,
        { type: 'root_cause_analysis' }
      );
    } else if (step.action === 'generate_intervention_plan') {
      return await enhancedAIService.processNLQ(
        `Generate intervention plan: ${JSON.stringify(context)}`,
        { type: 'intervention_plan' }
      );
    }
    return {};
  }

  private async executeAPIAction(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    return await apiService.post(`/workflows/${step.action}`, context);
  }

  private async executeGenericAction(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    // Generic action execution
    return { action: step.action, completed: true };
  }

  private async logAIAssistance(step: WorkflowStep, result: any): Promise<void> {
    await apiService.post('/analytics/track', {
      event: 'ai_assistance',
      data: {
        step: step.action,
        component: step.component,
        result: result.result,
      },
    });
  }

  private async attemptRecovery(
    step: WorkflowStep,
    error: Error,
    context: WorkflowContext,
    result: WorkflowResult
  ): Promise<boolean> {
    // Attempt automatic recovery
    try {
      if (step.aiAssisted) {
        // Use AI for recovery
        const recovery = await enhancedAIService.processNLQ(
          `Recover from workflow error: ${error.message}`,
          { type: 'workflow_recovery', step, context }
        );
        if (recovery.recoverable) {
          return true;
        }
      }
    } catch {
      // Recovery failed
    }
    return false;
  }

  getWorkflow(name: string): IntegratedWorkflow | undefined {
    return this.workflows.get(name);
  }

  getAllWorkflows(): Map<string, IntegratedWorkflow> {
    return new Map(this.workflows);
  }
}

export default WorkflowIntegrator.getInstance();
