/**
 * Student AI Dashboard Component
 * Displays AI-powered student performance predictions, insights, and intervention plans
 */

import { useEffect, useState, useCallback } from 'react';
import { enhancedAIService, PerformancePrediction } from '@/lib/api/services/ai.service.enhanced';
import { apiService } from '@/lib/api/apiService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Brain,
  Target,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StudentAIDashboardProps {
  studentId: string;
}

interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
}

interface InterventionPlan {
  id: string;
  title: string;
  description: string;
  actions: {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
  }[];
  timeline: string;
}

export function StudentAIDashboard({ studentId }: StudentAIDashboardProps) {
  const [predictions, setPredictions] = useState<PerformancePrediction | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [interventionPlan, setInterventionPlan] = useState<InterventionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAIData = useCallback(async () => {
    setLoading(true);
    try {
      // Load predictions
      const pred = await enhancedAIService.predictStudentPerformance(studentId, 'monthly');
      setPredictions(pred);

      // Load insights
      try {
        const insResponse = await apiService.get<{ data: AIInsight[] }>(
          `/ai/students/${studentId}/insights`
        );
        setInsights(insResponse.data || []);
      } catch (error) {
        console.warn('Failed to load insights:', error);
      }

      // Generate intervention plan
      try {
        const planResponse = await enhancedAIService.processNLQ(
          `Create a personalized intervention plan for student ${studentId} based on current performance`,
          { student_data: pred }
        );

        if (planResponse.response) {
          setInterventionPlan(planResponse.response as InterventionPlan);
        }
      } catch (error) {
        console.warn('Failed to generate intervention plan:', error);
      }
    } catch (error: any) {
      console.error('Failed to load AI data:', error);
      toast.error('Failed to load AI insights', {
        description: error.message || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadAIData();

    // Subscribe to real-time updates
    const unsubscribe = apiService.subscribe(
      `student.${studentId}.performance_updates`,
      (update: any) => {
        if (predictions) {
          setPredictions((prev) => ({
            ...prev!,
            predictions: prev!.predictions.map((p) =>
              p.subject === update.subject
                ? { ...p, predicted_grade: update.new_prediction }
                : p
            ),
          }));
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [studentId, loadAIData]);

  const generateReport = useCallback(async () => {
    try {
      const report = await enhancedAIService.generateSmartReport(
        'student_performance_analysis',
        { student_id: studentId },
        'pdf'
      );

      // Download report
      window.open(report.url, '_blank');
      toast.success('Report generated', {
        description: 'Your AI analysis report is ready',
      });
    } catch (error: any) {
      toast.error('Failed to generate report', {
        description: error.message || 'An error occurred',
      });
    }
  }, [studentId]);

  const markActionComplete = useCallback(async (actionId: string) => {
    if (!interventionPlan) return;

    try {
      await apiService.post(`/interventions/${interventionPlan.id}/actions/${actionId}/complete`);

      setInterventionPlan((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          actions: prev.actions.map((action) =>
            action.id === actionId ? { ...action, completed: true } : action
          ),
        };
      });

      toast.success('Action marked as complete');
    } catch (error: any) {
      toast.error('Failed to update action', {
        description: error.message || 'An error occurred',
      });
    }
  }, [interventionPlan]);

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading AI insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            AI Performance Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered insights and predictions for student performance
          </p>
        </div>
        <Button onClick={generateReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="intervention">Intervention Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          {predictions && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {predictions.predictions.map((pred, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{pred.subject}</span>
                      <Badge
                        variant="outline"
                        className={cn(getRiskColor(pred.risk_level))}
                      >
                        {pred.risk_level} risk
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Predicted Grade</span>
                        <span className="text-2xl font-bold">{pred.predicted_grade.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Confidence</span>
                        <span className="text-sm font-medium">
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 mt-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${pred.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {predictions?.recommendations && predictions.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {predictions.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights.length > 0 ? (
            insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {insight.severity === 'high' ? (
                      <AlertTriangle className={cn('h-5 w-5', getSeverityColor(insight.severity))} />
                    ) : (
                      <BookOpen className={cn('h-5 w-5', getSeverityColor(insight.severity))} />
                    )}
                    {insight.title}
                  </CardTitle>
                  <CardDescription>{insight.description}</CardDescription>
                </CardHeader>
                {insight.recommendations.length > 0 && (
                  <CardContent>
                    <p className="text-sm font-medium mb-2">Recommendations:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {insight.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No insights available
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="intervention" className="space-y-4">
          {interventionPlan ? (
            <Card>
              <CardHeader>
                <CardTitle>{interventionPlan.title}</CardTitle>
                <CardDescription>{interventionPlan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interventionPlan.actions.map((action) => (
                    <div
                      key={action.id}
                      className={cn(
                        'p-4 border rounded-lg',
                        action.completed && 'opacity-60'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{action.title}</h4>
                            <Badge variant="outline" className={getRiskColor(action.priority)}>
                              {action.priority} priority
                            </Badge>
                            {action.completed && (
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                Completed
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                        {!action.completed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markActionComplete(action.id)}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Timeline: {interventionPlan.timeline}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No intervention plan available
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default StudentAIDashboard;
