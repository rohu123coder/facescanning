
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReputationStore } from '@/hooks/use-reputation-store.tsx';
import { generateReviewReply } from '@/ai/flows/generate-review-reply';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Star, MessageSquare, CornerUpLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useClientStore } from '@/hooks/use-client-store.tsx';
import Link from 'next/link';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
        />
      ))}
    </div>
  );
}

export default function ReputationManagementPage() {
  const { reviews } = useReputationStore();
  const { currentClient } = useClientStore();
  const { toast } = useToast();
  const [loadingReplyFor, setLoadingReplyFor] = useState<string | null>(null);
  const [generatedReplies, setGeneratedReplies] = useState<Record<string, string>>({});

  const handleGenerateReply = async (reviewId: string, reviewText: string, rating: number) => {
    setLoadingReplyFor(reviewId);
    try {
      const result = await generateReviewReply({ reviewText, rating });
      setGeneratedReplies(prev => ({ ...prev, [reviewId]: result.reply }));
    } catch (error) {
      console.error('Failed to generate reply:', error);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Could not generate a reply. Please try again.',
      });
    } finally {
      setLoadingReplyFor(null);
    }
  };

  const handleTextareaChange = (reviewId: string, newText: string) => {
    setGeneratedReplies(prev => ({ ...prev, [reviewId]: newText }));
  };
  
  const positiveReviews = reviews.filter(r => r.rating >= 4).length;
  const negativeReviews = reviews.filter(r => r.rating <= 2).length;
  const stats = [
    { title: 'Total Reviews', value: reviews.length, icon: <MessageSquare className="text-muted-foreground" /> },
    { title: 'Positive Reviews', value: positiveReviews, icon: <ThumbsUp className="text-muted-foreground" /> },
    { title: 'Negative Reviews', value: negativeReviews, icon: <ThumbsDown className="text-muted-foreground" /> },
  ];

  if (!currentClient?.isGbpConnected) {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Reputation Management</h1>
                <p className="text-muted-foreground">Monitor and improve your online reputation.</p>
            </div>
             <Card className="text-center p-8">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Connect to Google Business Profile</CardTitle>
                    <CardDescription>To manage your online reviews, you need to connect your Google Business Profile account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/dashboards/client/settings">Connect Now</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Reputation Management</h1>
        <p className="text-muted-foreground">Monitor and respond to your Google reviews.</p>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
            {stats.map(stat => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        {stat.icon}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {reviews.map((review) => (
          <Card key={review.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={review.reviewerImageUrl} alt={review.reviewerName} />
                    <AvatarFallback>{review.reviewerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{review.reviewerName}</p>
                    <p className="text-sm text-muted-foreground">{review.relativeTimeDescription}</p>
                  </div>
                </div>
                <StarRating rating={review.rating} />
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">{review.text}</p>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4 bg-muted/50 p-4">
              {generatedReplies[review.id] ? (
                <div className="w-full space-y-2">
                  <Textarea
                    value={generatedReplies[review.id]}
                    onChange={(e) => handleTextareaChange(review.id, e.target.value)}
                    className="bg-background"
                    rows={4}
                  />
                  <Button size="sm">
                    <CornerUpLeft className="mr-2 h-4 w-4" /> Post Reply
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleGenerateReply(review.id, review.text, review.rating)}
                  disabled={loadingReplyFor === review.id}
                  variant="outline"
                  size="sm"
                >
                  {loadingReplyFor === review.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4 text-primary" />
                  )}
                  Generate Reply with AI
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
