'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare, Sparkles, Loader2, Link as LinkIcon } from 'lucide-react';
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


function GbpConnectCard({ onConnect }: { onConnect: () => Promise<void> }) {
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = async () => {
        setIsConnecting(true);
        await onConnect();
    }

    return (
        <Card className="max-w-2xl mx-auto mt-10">
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21.8 10c0-3.9-2-6.9-5.2-8.4C14.4.4,12.8,0,11,0H9.5C4.2,0,0,4.2,0,9.5S4.2,19,9.5,19h2c1.8,0,3.3-.4,4.9-1.6 3.2-1.5,5.1-4.5,5.1-8.4zM9.5,4.6c2.4,0,4.4,2,4.4,4.4s-2,4.4-4.4,4.4-4.4-2-4.4-4.4 2-4.4,4.4,4.4zm7.6,9.3c-1.3,1.3-3,2.1-4.9,2.1h-2C5.9,16,3,13.1,3,9.5S5.9,3,9.5,3H11c1.2,0,2.3,.3,3.3,.8.8,.4,1.4,1,1.8,1.8.5,1,.8,2.1,.8,3.2v.2h-4.3c-.6,0-1.1,.5-1.1,1.1s.5,1.1,1.1,1.1h4.3z"/></svg>
                </div>
                <CardTitle>Connect your Google Business Profile</CardTitle>
                <CardDescription>
                    To manage your online reputation, connect your Google Business account. This will allow us to fetch reviews and help you reply with AI.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full" onClick={handleConnect} disabled={isConnecting}>
                    {isConnecting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        <>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Connect to Google
                        </>
                    )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                    You will be redirected to Google to authenticate securely.
                </p>
            </CardContent>
        </Card>
    );
}


export default function ReputationManagementPage() {
  const { toast } = useToast();
  const { currentClient, updateClient } = useClientStore();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [generatedReply, setGeneratedReply] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (currentClient?.isGbpConnected && mockReviews.length > 0) {
      setSelectedReview(mockReviews[0]);
    }
  }, [currentClient?.isGbpConnected]);


  const handleConnectGbp = async () => {
    if (!currentClient) return;
    
    // Simulate API call to Google and backend
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const updatedClientData = { ...currentClient, isGbpConnected: true };
    await updateClient(updatedClientData);

    toast({
        title: "Connection Successful!",
        description: "Your Google Business Profile has been connected."
    });
  }

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

  if (!currentClient) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading Client Data...</p>
        </div>
    );
  }

  if (!currentClient.isGbpConnected) {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Reputation Management</h1>
            <p className="text-muted-foreground">Monitor and reply to your Google Business reviews using AI.</p>
            <GbpConnectCard onConnect={handleConnectGbp} />
        </div>
    )
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
