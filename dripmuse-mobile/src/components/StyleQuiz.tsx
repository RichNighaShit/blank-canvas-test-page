
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

const QUIZ_QUESTIONS = [
  {
    id: 'style_personality',
    question: 'Which style best describes you?',
    type: 'radio',
    options: [
      { value: 'classic', label: 'Classic', description: 'Timeless, elegant pieces' },
      { value: 'trendy', label: 'Trendy', description: 'Latest fashion trends' },
      { value: 'bohemian', label: 'Bohemian', description: 'Free-spirited, artistic' },
      { value: 'minimalist', label: 'Minimalist', description: 'Clean, simple lines' },
      { value: 'edgy', label: 'Edgy', description: 'Bold, unconventional' },
      { value: 'romantic', label: 'Romantic', description: 'Feminine, flowing' }
    ]
  },
  {
    id: 'color_preferences',
    question: 'Which colors do you gravitate towards?',
    type: 'checkbox',
    options: [
      { value: 'black', label: 'Black' },
      { value: 'white', label: 'White' },
      { value: 'navy', label: 'Navy' },
      { value: 'beige', label: 'Beige/Neutral' },
      { value: 'red', label: 'Red' },
      { value: 'blue', label: 'Blue' },
      { value: 'green', label: 'Green' },
      { value: 'pink', label: 'Pink' },
      { value: 'yellow', label: 'Yellow' },
      { value: 'purple', label: 'Purple' }
    ]
  },
  {
    id: 'lifestyle',
    question: 'What best describes your lifestyle?',
    type: 'radio',
    options: [
      { value: 'professional', label: 'Professional', description: 'Office work, meetings' },
      { value: 'casual', label: 'Casual', description: 'Relaxed, everyday' },
      { value: 'active', label: 'Active', description: 'Sports, outdoors' },
      { value: 'social', label: 'Social', description: 'Events, parties' }
    ]
  },
  {
    id: 'preferred_fit',
    question: 'How do you prefer your clothes to fit?',
    type: 'radio',
    options: [
      { value: 'fitted', label: 'Fitted', description: 'Close to body' },
      { value: 'relaxed', label: 'Relaxed', description: 'Comfortable, loose' },
      { value: 'oversized', label: 'Oversized', description: 'Loose, flowing' }
    ]
  },
  {
    id: 'budget_range',
    question: 'What\'s your typical shopping budget?',
    type: 'radio',
    options: [
      { value: 'budget', label: 'Budget-Friendly', description: 'Under $50 per item' },
      { value: 'mid-range', label: 'Mid-Range', description: '$50-150 per item' },
      { value: 'luxury', label: 'Luxury', description: '$150+ per item' }
    ]
  },
  {
    id: 'style_goals',
    question: 'What are your style goals?',
    type: 'checkbox',
    options: [
      { value: 'professional', label: 'Look more professional' },
      { value: 'confident', label: 'Feel more confident' },
      { value: 'comfortable', label: 'Be more comfortable' },
      { value: 'trendy', label: 'Stay on-trend' },
      { value: 'unique', label: 'Express my uniqueness' }
    ]
  }
];

interface QuizAnswers {
  [key: string]: string | string[];
}

export const StyleQuiz: React.FC<{ onComplete: (results: any) => void }> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAnswer = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const canProceed = () => {
    const currentQ = QUIZ_QUESTIONS[currentQuestion];
    const answer = answers[currentQ.id];
    return answer && (Array.isArray(answer) ? answer.length > 0 : answer.length > 0);
  };

  const handleNext = () => {
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      submitQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const quizData = {
        user_id: user.id,
        style_personality: answers.style_personality as string,
        color_preferences: answers.color_preferences as string[],
        lifestyle: answers.lifestyle as string,
        preferred_fit: answers.preferred_fit as string,
        budget_range: answers.budget_range as string,
        style_goals: answers.style_goals as string[],
        quiz_answers: answers,
        confidence_score: 0.85
      };

      const { error } = await supabase
        .from('user_style_quiz')
        .upsert(quizData, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Style Quiz Complete!",
        description: "Your style profile has been created successfully."
      });

      onComplete(quizData);
    } catch (error) {
      console.error('Error saving quiz results:', error);
      toast({
        title: "Error",
        description: "Failed to save quiz results. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;
  const currentQ = QUIZ_QUESTIONS[currentQuestion];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <CardTitle>Style Quiz</CardTitle>
        </div>
        <Progress value={progress} className="mt-2" />
        <p className="text-sm text-muted-foreground">
          Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">{currentQ.question}</h3>
          
          {currentQ.type === 'radio' && (
            <RadioGroup 
              value={answers[currentQ.id] as string || ''} 
              onValueChange={(value) => handleAnswer(currentQ.id, value)}
            >
              {currentQ.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQ.type === 'checkbox' && (
            <div className="grid grid-cols-2 gap-3">
              {currentQ.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50">
                  <Checkbox 
                    id={option.value}
                    checked={(answers[currentQ.id] as string[] || []).includes(option.value)}
                    onCheckedChange={(checked) => {
                      const current = answers[currentQ.id] as string[] || [];
                      if (checked) {
                        handleAnswer(currentQ.id, [...current, option.value]);
                      } else {
                        handleAnswer(currentQ.id, current.filter(v => v !== option.value));
                      }
                    }}
                  />
                  <Label htmlFor={option.value} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
          >
            {currentQuestion === QUIZ_QUESTIONS.length - 1 ? (
              isSubmitting ? 'Saving...' : 'Complete Quiz'
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
