/**
 * Production Monitoring & Observability Service
 * Comprehensive monitoring with AI-powered insights
 */

import { EventEmitter } from 'events';
import { apiService } from '@/lib/api/apiService';
import { enhancedAIService } from '@/lib/api/services/ai.service.enhanced';
import { IntegrationManager } from '@/core/IntegrationManager';

export interface AIServiceMetrics {
  responseTimes: Record<string, number>;
  successRates: Record<string, number>;
  errorRates: Record<string, number>;
  predictionAccuracy: Record<string, number>;
  recommendationAdoption: Record<string, number>;
  userSatisfaction: Record<string, number>;
  modelPerformance: Record<string, any>;
  trainingDataQuality: Record<string, any>;
  inferenceCosts: Record<string, number>;
  timeSaved: number;
  improvementsGenerated: number;
  interventionsTriggered: number;
}

export interface MonitoringReport {
  timestamp: Date;
  systemHealth: any;
  applicationPerformance: any;
  aiPerformance: AIServiceMetrics;
  userExperience: any;
  businessMetrics: any;
  insights: any[];
  recommendations: any[];
  forecast: any;
}

export class ProductionMonitorService extends EventEmitter {
  private static instance: ProductionMonitorService;
  private metricsCollector: MetricsCollector;
  private alertManager: AlertManager;
  private dashboardUpdater: DashboardUpdater;
  private aiInsightGenerator: AIInsightGenerator;
  private monitoringActive: boolean = false;

  private constructor() {
    super();
    this.metricsCollector = new MetricsCollector();
    this.alertManager = new AlertManager();
    this.dashboardUpdater = new DashboardUpdater();
    this.aiInsightGenerator = new AIInsightGenerator();
  }

  static getInstance(): ProductionMonitorService {
    if (!ProductionMonitorService.instance) {
      ProductionMonitorService.instance = new ProductionMonitorService();
    }
    return ProductionMonitorService.instance;
  }

  /**
   * Start comprehensive monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoringActive) {
      console.warn('Monitoring already active');
      return;
    }

    console.log('📊 Starting Production Monitoring...');

    // 1. System Metrics
    this.startSystemMetricsCollection();

    // 2. Application Metrics
    this.startApplicationMetricsCollection();

    // 3. AI Service Metrics
    this.startAIServiceMonitoring();

    // 4. User Experience Metrics
    this.startUserExperienceMonitoring();

    // 5. Business Metrics
    this.startBusinessMetricsCollection();

    // 6. Real-time Dashboard Updates
    this.startDashboardUpdates();

    // 7. AI-Powered Insights
    this.startAIInsightGeneration();

    // 8. Alert Management
    this.startAlertManagement();

    this.monitoringActive = true;
    console.log('✅ Production Monitoring Active');
  }

  private startSystemMetricsCollection(): void {
    setInterval(async () => {
      try {
        const health = await apiService.get('/health');
        this.metricsCollector.collectSystemMetrics(health);
        this.emit('system_metrics', health);
      } catch (error) {
        console.error('System metrics collection failed:', error);
      }
    }, 10000); // Every 10 seconds
  }

  private startApplicationMetricsCollection(): void {
    setInterval(async () => {
      try {
        const metrics = await apiService.get('/monitoring/application');
        this.metricsCollector.collectApplicationMetrics(metrics);
        this.emit('application_metrics', metrics);
      } catch (error) {
        console.error('Application metrics collection failed:', error);
      }
    }, 15000); // Every 15 seconds
  }

  private startAIServiceMonitoring(): void {
    setInterval(async () => {
      try {
        const metrics: AIServiceMetrics = {
          // Performance Metrics
          responseTimes: await this.collectAIResponseTimes(),
          successRates: await this.collectAISuccessRates(),
          errorRates: await this.collectAIErrorRates(),

          // Quality Metrics
          predictionAccuracy: await this.calculatePredictionAccuracy(),
          recommendationAdoption: await this.calculateRecommendationAdoption(),
          userSatisfaction: await this.calculateUserSatisfaction(),

          // Resource Metrics
          modelPerformance: await this.collectModelPerformance(),
          trainingDataQuality: await this.assessTrainingData(),
          inferenceCosts: await this.calculateInferenceCosts(),

          // Business Impact
          timeSaved: await this.calculateTimeSaved(),
          improvementsGenerated: await this.countImprovements(),
          interventionsTriggered: await this.countInterventions(),
        };

        // Update dashboards
        await this.dashboardUpdater.updateAIMetrics(metrics);

        // Generate AI insights
        const insights = await this.aiInsightGenerator.generateInsights(metrics);

        // Send alerts for anomalies
        await this.alertManager.checkForAnomalies(metrics, insights);

        this.emit('ai_metrics', metrics);
      } catch (error) {
        console.error('AI service monitoring failed:', error);
      }
    }, 30000); // Every 30 seconds
  }

  private startUserExperienceMonitoring(): void {
    setInterval(async () => {
      try {
        const uxMetrics = await apiService.get('/monitoring/ux');
        this.metricsCollector.collectUXMetrics(uxMetrics);
        this.emit('ux_metrics', uxMetrics);
      } catch (error) {
        console.error('UX metrics collection failed:', error);
      }
    }, 20000); // Every 20 seconds
  }

  private startBusinessMetricsCollection(): void {
    setInterval(async () => {
      try {
        const businessMetrics = await apiService.get('/monitoring/business');
        this.metricsCollector.collectBusinessMetrics(businessMetrics);
        this.emit('business_metrics', businessMetrics);
      } catch (error) {
        console.error('Business metrics collection failed:', error);
      }
    }, 60000); // Every minute
  }

  private startDashboardUpdates(): void {
    setInterval(async () => {
      try {
        await this.dashboardUpdater.updateAllDashboards();
      } catch (error) {
        console.error('Dashboard update failed:', error);
      }
    }, 5000); // Every 5 seconds
  }

  private startAIInsightGeneration(): void {
    setInterval(async () => {
      try {
        const insights = await this.aiInsightGenerator.generateComprehensiveInsights();
        this.emit('ai_insights', insights);
      } catch (error) {
        console.error('AI insight generation failed:', error);
      }
    }, 60000); // Every minute
  }

  private startAlertManagement(): void {
    setInterval(async () => {
      try {
        await this.alertManager.processAlerts();
      } catch (error) {
        console.error('Alert processing failed:', error);
      }
    }, 10000); // Every 10 seconds
  }

  private async collectAIResponseTimes(): Promise<Record<string, number>> {
    const statuses = await enhancedAIService.getAllServiceStatus();
    const responseTimes: Record<string, number> = {};
    Object.entries(statuses).forEach(([name, status]) => {
      responseTimes[name] = status.response_time || 0;
    });
    return responseTimes;
  }

  private async collectAISuccessRates(): Promise<Record<string, number>> {
    // Get success rates from analytics
    try {
      const rates = await apiService.get('/monitoring/ai/success-rates');
      return rates;
    } catch {
      return {};
    }
  }

  private async collectAIErrorRates(): Promise<Record<string, number>> {
    // Get error rates from analytics
    try {
      const rates = await apiService.get('/monitoring/ai/error-rates');
      return rates;
    } catch {
      return {};
    }
  }

  private async calculatePredictionAccuracy(): Promise<Record<string, number>> {
    // Calculate prediction accuracy
    try {
      const accuracy = await apiService.get('/monitoring/ai/accuracy');
      return accuracy;
    } catch {
      return {};
    }
  }

  private async calculateRecommendationAdoption(): Promise<Record<string, number>> {
    // Calculate recommendation adoption rates
    try {
      const adoption = await apiService.get('/monitoring/ai/adoption');
      return adoption;
    } catch {
      return {};
    }
  }

  private async calculateUserSatisfaction(): Promise<Record<string, number>> {
    // Calculate user satisfaction scores
    try {
      const satisfaction = await apiService.get('/monitoring/ai/satisfaction');
      return satisfaction;
    } catch {
      return {};
    }
  }

  private async collectModelPerformance(): Promise<Record<string, any>> {
    // Collect model performance metrics
    try {
      const performance = await apiService.get('/monitoring/ai/models');
      return performance;
    } catch {
      return {};
    }
  }

  private async assessTrainingData(): Promise<Record<string, any>> {
    // Assess training data quality
    try {
      const quality = await apiService.get('/monitoring/ai/training-data');
      return quality;
    } catch {
      return {};
    }
  }

  private async calculateInferenceCosts(): Promise<Record<string, number>> {
    // Calculate inference costs
    try {
      const costs = await apiService.get('/monitoring/ai/costs');
      return costs;
    } catch {
      return {};
    }
  }

  private async calculateTimeSaved(): Promise<number> {
    // Calculate time saved by AI
    try {
      const timeSaved = await apiService.get('/monitoring/ai/time-saved');
      return timeSaved.total || 0;
    } catch {
      return 0;
    }
  }

  private async countImprovements(): Promise<number> {
    // Count improvements generated
    try {
      const improvements = await apiService.get('/monitoring/ai/improvements');
      return improvements.count || 0;
    } catch {
      return 0;
    }
  }

  private async countInterventions(): Promise<number> {
    // Count interventions triggered
    try {
      const interventions = await apiService.get('/monitoring/ai/interventions');
      return interventions.count || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Generate comprehensive monitoring report
   */
  async generateComprehensiveReport(): Promise<MonitoringReport> {
    const report: MonitoringReport = {
      timestamp: new Date(),

      // System Health
      systemHealth: await this.getSystemHealth(),

      // Application Performance
      applicationPerformance: await this.getApplicationPerformance(),

      // AI Service Performance
      aiPerformance: {
        responseTimes: await this.collectAIResponseTimes(),
        successRates: await this.collectAISuccessRates(),
        errorRates: await this.collectAIErrorRates(),
        predictionAccuracy: await this.calculatePredictionAccuracy(),
        recommendationAdoption: await this.calculateRecommendationAdoption(),
        userSatisfaction: await this.calculateUserSatisfaction(),
        modelPerformance: await this.collectModelPerformance(),
        trainingDataQuality: await this.assessTrainingData(),
        inferenceCosts: await this.calculateInferenceCosts(),
        timeSaved: await this.calculateTimeSaved(),
        improvementsGenerated: await this.countImprovements(),
        interventionsTriggered: await this.countInterventions(),
      },

      // User Experience
      userExperience: await this.getUserExperience(),

      // Business Metrics
      businessMetrics: await this.getBusinessMetrics(),

      // AI-Generated Insights
      insights: await this.aiInsightGenerator.generateComprehensiveInsights(),

      // Recommendations
      recommendations: await this.generateRecommendations(),

      // Forecast
      forecast: await this.generateForecast(),
    };

    // Send to stakeholders
    await this.distributeReport(report);

    return report;
  }

  private async getSystemHealth(): Promise<any> {
    try {
      return await apiService.get('/health');
    } catch {
      return { status: 'unknown' };
    }
  }

  private async getApplicationPerformance(): Promise<any> {
    try {
      return await apiService.get('/monitoring/application');
    } catch {
      return {};
    }
  }

  private async getUserExperience(): Promise<any> {
    try {
      return await apiService.get('/monitoring/ux');
    } catch {
      return {};
    }
  }

  private async getBusinessMetrics(): Promise<any> {
    try {
      return await apiService.get('/monitoring/business');
    } catch {
      return {};
    }
  }

  private async generateRecommendations(): Promise<any[]> {
    try {
      const insights = await this.aiInsightGenerator.generateComprehensiveInsights();
      return await enhancedAIService.processNLQ(
        `Generate recommendations based on insights: ${JSON.stringify(insights)}`,
        { type: 'recommendations' }
      );
    } catch {
      return [];
    }
  }

  private async generateForecast(): Promise<any> {
    try {
      const metrics = await this.metricsCollector.getAllMetrics();
      return await enhancedAIService.processNLQ(
        `Generate forecast based on metrics: ${JSON.stringify(metrics)}`,
        { type: 'forecast' }
      );
    } catch {
      return {};
    }
  }

  private async distributeReport(report: MonitoringReport): Promise<void> {
    // Send report to stakeholders
    try {
      await apiService.post('/monitoring/reports', report);
    } catch (error) {
      console.error('Failed to distribute report:', error);
    }
  }

  isMonitoringActive(): boolean {
    return this.monitoringActive;
  }
}

// Helper Classes
class MetricsCollector {
  private metrics: Map<string, any> = new Map();

  collectSystemMetrics(metrics: any): void {
    this.metrics.set('system', metrics);
  }

  collectApplicationMetrics(metrics: any): void {
    this.metrics.set('application', metrics);
  }

  collectUXMetrics(metrics: any): void {
    this.metrics.set('ux', metrics);
  }

  collectBusinessMetrics(metrics: any): void {
    this.metrics.set('business', metrics);
  }

  getAllMetrics(): any {
    return Object.fromEntries(this.metrics);
  }
}

class AlertManager {
  async checkForAnomalies(metrics: AIServiceMetrics, insights: any[]): Promise<void> {
    // Check for anomalies and send alerts
  }

  async processAlerts(): Promise<void> {
    // Process pending alerts
  }
}

class DashboardUpdater {
  async updateAIMetrics(metrics: AIServiceMetrics): Promise<void> {
    // Update AI metrics on dashboard
  }

  async updateAllDashboards(): Promise<void> {
    // Update all dashboards
  }
}

class AIInsightGenerator {
  async generateInsights(metrics: AIServiceMetrics): Promise<any[]> {
    try {
      const insights = await enhancedAIService.processNLQ(
        `Generate insights from metrics: ${JSON.stringify(metrics)}`,
        { type: 'insights' }
      );
      return Array.isArray(insights) ? insights : [insights];
    } catch {
      return [];
    }
  }

  async generateComprehensiveInsights(): Promise<any[]> {
    try {
      const insights = await enhancedAIService.processNLQ(
        'Generate comprehensive system insights',
        { type: 'comprehensive_insights' }
      );
      return Array.isArray(insights) ? insights : [insights];
    } catch {
      return [];
    }
  }
}

export default ProductionMonitorService.getInstance();
