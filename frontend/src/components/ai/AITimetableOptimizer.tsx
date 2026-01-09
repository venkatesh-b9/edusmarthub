/**
 * AI Timetable Optimizer Component
 * Provides AI-powered timetable optimization with real-time suggestions
 */

import { useState, useCallback } from 'react';
import { enhancedAIService, TimetableConstraints, TimetablePreferences } from '@/lib/api/services/ai.service.enhanced';
import { apiService } from '@/lib/api/apiService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AITimetableOptimizerProps {
  schoolId: string;
  onOptimizationComplete?: (result: any) => void;
}

interface OptimizationResult {
  timetable_id: string;
  score: number;
  improvements: string[];
  visualization_data?: any;
  constraints_met: number;
  total_constraints: number;
}

interface AISuggestion {
  id: string;
  type: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  action: any;
}

export function AITimetableOptimizer({
  schoolId,
  onOptimizationComplete,
}: AITimetableOptimizerProps) {
  const [constraints, setConstraints] = useState<TimetableConstraints>({});
  const [optimizationInProgress, setOptimizationInProgress] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [progress, setProgress] = useState(0);

  const runOptimization = useCallback(async () => {
    setOptimizationInProgress(true);
    setProgress(0);
    setOptimizationResult(null);
    setAiSuggestions([]);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      const preferences: TimetablePreferences = {
        optimization_goal: 'balanced_workload',
        include_visualization: true,
        school_id: schoolId,
      };

      const result = await enhancedAIService.optimizeTimetable(constraints, preferences);

      clearInterval(progressInterval);
      setProgress(100);

      setOptimizationResult({
        timetable_id: result.timetable_id || `timetable-${Date.now()}`,
        score: result.score || 0,
        improvements: result.improvements || [],
        visualization_data: result.visualization_data,
        constraints_met: result.constraints_met || 0,
        total_constraints: result.total_constraints || 0,
      });

      // Get AI suggestions for improvements
      try {
        const suggestionsResponse = await enhancedAIService.processNLQ(
          'Analyze this timetable and suggest improvements for teacher workload balance',
          { timetable_data: result }
        );

        if (suggestionsResponse.recommendations) {
          setAiSuggestions(
            suggestionsResponse.recommendations.map((rec: any, index: number) => ({
              id: `suggestion-${index}`,
              type: rec.type || 'general',
              description: rec.description || rec,
              impact: rec.impact || 'medium',
              action: rec.action,
            }))
          );
        }
      } catch (suggestionError) {
        console.warn('Failed to get AI suggestions:', suggestionError);
      }

      toast.success('Timetable optimized successfully!', {
        description: `Optimization score: ${result.score || 0}%`,
      });

      if (onOptimizationComplete) {
        onOptimizationComplete(result);
      }
    } catch (error: any) {
      console.error('Optimization failed:', error);
      toast.error('Optimization failed', {
        description: error.message || 'An error occurred during optimization',
      });
    } finally {
      setOptimizationInProgress(false);
      setTimeout(() => setProgress(0), 2000);
    }
  }, [constraints, schoolId, onOptimizationComplete]);

  const applySuggestion = useCallback(
    async (suggestionId: string) => {
      const suggestion = aiSuggestions.find((s) => s.id === suggestionId);
      if (!suggestion || !optimizationResult) return;

      try {
        await apiService.post('/timetable/apply-suggestion', {
          suggestion_id: suggestionId,
          timetable_id: optimizationResult.timetable_id,
        });

        toast.success('Suggestion applied', {
          description: suggestion.description,
        });

        // Remove applied suggestion
        setAiSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      } catch (error: any) {
        toast.error('Failed to apply suggestion', {
          description: error.message || 'An error occurred',
        });
      }
    },
    [aiSuggestions, optimizationResult]
  );

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Timetable Optimizer
          </CardTitle>
          <CardDescription>
            Optimize your timetable using AI to balance workloads and maximize efficiency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Constraints Editor - Simplified for now */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Constraints</label>
            <textarea
              className="w-full min-h-[100px] p-2 border rounded-md"
              placeholder="Enter constraints (JSON format or natural language)"
              value={JSON.stringify(constraints, null, 2)}
              onChange={(e) => {
                try {
                  setConstraints(JSON.parse(e.target.value));
                } catch {
                  // Invalid JSON, ignore
                }
              }}
            />
          </div>

          <Button
            onClick={runOptimization}
            disabled={optimizationInProgress}
            className="w-full"
            size="lg"
          >
            {optimizationInProgress ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizing... {progress}%
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Run AI Optimization
              </>
            )}
          </Button>

          {optimizationInProgress && (
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {optimizationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Optimization Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Optimization Score</p>
                <p className="text-2xl font-bold">{optimizationResult.score}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Constraints Met</p>
                <p className="text-2xl font-bold">
                  {optimizationResult.constraints_met}/{optimizationResult.total_constraints}
                </p>
              </div>
            </div>

            {optimizationResult.improvements.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Improvements</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {optimizationResult.improvements.map((improvement, index) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {aiSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              AI Suggestions
            </CardTitle>
            <CardDescription>
              Recommendations to further improve your timetable
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={cn('text-xs', getImpactColor(suggestion.impact))}
                      >
                        {suggestion.impact} impact
                      </Badge>
                      <span className="text-xs text-muted-foreground">{suggestion.type}</span>
                    </div>
                    <p className="text-sm">{suggestion.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applySuggestion(suggestion.id)}
                    className="ml-4"
                  >
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AITimetableOptimizer;
