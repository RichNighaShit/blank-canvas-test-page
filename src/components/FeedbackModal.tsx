
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { logger } from '@/lib/logger';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  outfitId: string;
  onSubmit: (feedback: OutfitFeedback) => void;
}

export interface OutfitFeedback {
  outfitId: string;
  rating: number;
  sentiment: 'like' | 'dislike' | 'neutral';
  reasons: string[];
  comments?: string;
  wouldWear: boolean;
}

const FEEDBACK_REASONS = [
  'Colors work well together',
  'Fits my personal style',
  'Appropriate for the occasion',
  'Weather-appropriate',
  'Comfortable to wear',
  'Professional looking',
  'Trendy and fashionable',
  'Easy to put together',
  'Colors don\'t match',
  'Not my style',
  'Wrong for the occasion',
  'Not weather-appropriate',
  'Uncomfortable looking',
  'Too formal/casual',
  'Outdated style',
  'Too complicated'
];

/**
 * Enhanced feedback modal for outfit recommendations
 * Captures detailed user preferences to improve AI recommendations
 */
export const FeedbackModal = ({ isOpen, onClose, outfitId, onSubmit }: FeedbackModalProps) => {
  const [rating, setRating] = useState<number>(0);
  const [sentiment, setSentiment] = useState<'like' | 'dislike' | 'neutral'>('neutral');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comments, setComments] = useState('');
  const [wouldWear, setWouldWear] = useState(false);

  const handleSubmit = () => {
    try {
      const feedback: OutfitFeedback = {
        outfitId,
        rating,
        sentiment,
        reasons: selectedReasons,
        comments: comments.trim() || undefined,
        wouldWear,
      };

      logger.info('Submitting outfit feedback', feedback, 'FeedbackModal');
      onSubmit(feedback);
      onClose();
      
      // Reset form
      setRating(0);
      setSentiment('neutral');
      setSelectedReasons([]);
      setComments('');
      setWouldWear(false);
    } catch (error) {
      logger.logError(error as Error, 'FeedbackModal.handleSubmit');
    }
  };

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons(prev => 
      prev.includes(reason) 
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate This Outfit</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Overall Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star 
                    className={`h-6 w-6 ${
                      star <= rating 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                    }`} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Sentiment */}
          <div className="space-y-2">
            <Label>Quick Feedback</Label>
            <div className="flex gap-2">
              <Button
                variant={sentiment === 'like' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSentiment('like')}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Like
              </Button>
              <Button
                variant={sentiment === 'dislike' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSentiment('dislike')}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                Dislike
              </Button>
            </div>
          </div>

          {/* Detailed Reasons */}
          <div className="space-y-2">
            <Label>Why? (Select all that apply)</Label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {FEEDBACK_REASONS.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <Checkbox
                    id={reason}
                    checked={selectedReasons.includes(reason)}
                    onCheckedChange={() => handleReasonToggle(reason)}
                  />
                  <Label htmlFor={reason} className="text-sm">
                    {reason}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Would Wear */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="wouldWear"
              checked={wouldWear}
              onCheckedChange={(checked) => setWouldWear(checked as boolean)}
            />
            <Label htmlFor="wouldWear">I would actually wear this outfit</Label>
          </div>

          {/* Additional Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Additional Comments (Optional)</Label>
            <Textarea
              id="comments"
              placeholder="Any other thoughts about this outfit..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={rating === 0}>
              Submit Feedback
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
