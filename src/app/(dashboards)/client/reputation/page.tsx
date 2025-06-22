'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { generateReviewReply } from '@/ai/flows/generate-review-reply';
import { useClientStore } from '@/hooks/use-client-store';

type Review = {
  id: string;
  authorName: string;
  authorPhotoUrl: string;
  rating: number;
  text: string;
  date: string;
};

const mockReviews: Review[] = [
  {
    id: 'rev1',
    authorName: 'Aisha Kapoor',
    authorPhotoUrl: 'https://placehold.co/100x100.png',
    rating: 5,
    text: "Absolutely fantastic service! The staff is incredibly friendly and professional. The new system they've implemented is so efficient. Highly recommended!",
    date: '2 weeks ago',
  },
  {
    id: 'rev2',
    authorName: 'Vikram Singh',
    authorPhotoUrl: 'https://placehold.co/100x100.png',
    rating: 2,
    text: "I'm very disappointed with the recent changes. The new portal is confusing and I couldn't find what I was looking for. The support team was also slow to respond. Needs a lot of improvement.",
    date: '1 month ago',
  },
  {
    id: 'rev3',
    authorName: 'Priya Sharma',
    authorPhotoUrl: 'https://placehold.co/100x100.png',
    rating: 4,
    text: 'A great experience overall. The service was prompt and the results were good. There was a small hiccup with the billing, but it was resolved quickly.',
    date: '3 days ago',
  },
];

export default function ReputationManagementPage() {
  const { toast } = useToast();
  const { currentClient } = useClientStore();
  const [selectedReview, setSelectedReview] = useState<Review | null>(mockReviews[0]);
  const [generatedReply, setGeneratedReply] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReply = async () => {
    if (!selectedReview || !currentClient) return;

    setIsGenerating(true);
    setGeneratedReply('');
    try {
      const result = await generateReviewReply({
        businessName: currentClient.organizationName,
        reviewText: selectedReview.text,
        starRating: selectedReview.rating,
      });
      setGeneratedReply(result.replyText);
    } catch (error) {
      console.error('Error generating reply:', error);
      toast({
        variant: 'destructive',
        title: 'AI Reply Failed',
        description: 'Could not generate a reply. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handlePostReply = () => {
      if (!generatedReply) return;
      toast({
          title: "Reply Posted (Simulated)",
          description: "In a real app, this would post the reply to Google Business Profile."
      });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Reputation Management</h1>
        <p className="text-muted-foreground">Monitor and reply to your Google Business reviews using AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[calc(100vh-12rem)]">
        {/* Review List */}
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            <div className="space-y-4">
              {mockReviews.map((review) => (
                <button
                  key={review.id}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedReview?.id === review.id ? 'bg-accent border-primary' : 'hover:bg-accent/50'
                  }`}
                  onClick={() => {
                      setSelectedReview(review);
                      setGeneratedReply('');
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={review.authorPhotoUrl} alt={review.authorName} data-ai-hint="person portrait" />
                      <AvatarFallback>{review.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{review.authorName}</p>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{review.text}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reply Section */}
        <Card className="md:col-span-2 flex flex-col">
          {selectedReview ? (
            <>
              <CardHeader>
                <CardTitle>Reply to {selectedReview.authorName}</CardTitle>
                <CardDescription>{selectedReview.date} &middot; <Badge variant="outline">{selectedReview.rating} Stars</Badge></CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col">
                <div className="p-4 border rounded-md bg-muted/50 mb-4">
                  <p className="text-sm">{selectedReview.text}</p>
                </div>
                <Separator className="my-4" />
                <div className="flex-grow flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">Your Reply</h3>
                         <Button onClick={handleGenerateReply} disabled={isGenerating}>
                            {isGenerating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4 text-yellow-300" />
                            )}
                            Generate AI Reply
                        </Button>
                    </div>
                  <Textarea
                    placeholder="Your generated or manually written reply will appear here..."
                    value={generatedReply}
                    onChange={(e) => setGeneratedReply(e.target.value)}
                    className="flex-grow h-48 text-base"
                  />
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={handlePostReply} disabled={!generatedReply || isGenerating}>Post Reply</Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4" />
              <p>Select a review to start.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
