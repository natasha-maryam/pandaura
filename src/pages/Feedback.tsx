import React, { useState } from "react";
import { Send, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, Textarea, Button, Alert } from "../components/ui";

export default function Feedback() {
  const navigate = useNavigate();
  
  const [appFeedback, setAppFeedback] = useState("");
  const [aiFeedback, setAiFeedback] = useState("");
  const [advancedFeedback, setAdvancedFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if at least one field has content
    if (!appFeedback.trim() && !aiFeedback.trim() && !advancedFeedback.trim()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate API call to send email
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would send to pandauracares@mail.com
      const emailBody = createEmailBody();
      console.log('Feedback submission:', emailBody);
      
      setSubmitStatus('success');
      
      // Clear form after successful submission
      setTimeout(() => {
        setAppFeedback("");
        setAiFeedback("");
        setAdvancedFeedback("");
        setSubmitStatus('idle');
      }, 3000);
      
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const createEmailBody = () => {
    let body = "";
    
    if (appFeedback.trim()) {
      body += "— Feedback About the App —\n" + appFeedback.trim() + "\n\n";
    }
    
    if (aiFeedback.trim()) {
      body += "— Feedback About the AI —\n" + aiFeedback.trim() + "\n\n";
    }
    
    if (advancedFeedback.trim()) {
      body += "— Advanced Feedback —\n" + advancedFeedback.trim() + "\n\n";
    }
    
    body += `Submitted on: ${new Date().toLocaleString()}\n`;
    body += `User Session: ${Math.random().toString(36).substr(2, 9)}`;
    
    return body;
  };

  const hasContent = appFeedback.trim() || aiFeedback.trim() || advancedFeedback.trim();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Feedback"
        subtitle="Help us improve Pandaura AS"
        showBackButton
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary mb-2">We'd love to hear from you</h2>
          <p className="text-muted">
            Your feedback helps us build better automation tools. Share your thoughts in any or all sections below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* App Feedback */}
          <Card title="Your thoughts on the app" subtitle="What's been working well? What's been frustrating? Tell us anything about your experience with Pandaura.">
            <Textarea
              value={appFeedback}
              onChange={(e) => setAppFeedback(e.target.value)}
              placeholder="Share your experience with the app..."
              rows={6}
              maxLength={2000}
              helpText="Optional • Be as detailed as you'd like"
              showCharCount
            />
          </Card>

          {/* AI Feedback */}
          <Card title="Your thoughts on the AI" subtitle="How helpful has the AI been for you? Any moments it surprised you—or totally missed the mark?">
            <Textarea
              value={aiFeedback}
              onChange={(e) => setAiFeedback(e.target.value)}
              placeholder="Tell us about your AI assistant experience..."
              rows={6}
              maxLength={2000}
              helpText="Optional • We're always improving the AI"
              showCharCount
            />
          </Card>

          {/* Advanced Feedback */}
          <Card title="Want to go deeper?" subtitle="If you've got technical notes, feature requests, or specific examples — we'd love to hear them here.">
            <Textarea
              value={advancedFeedback}
              onChange={(e) => setAdvancedFeedback(e.target.value)}
              placeholder="Share technical feedback, feature requests, or specific examples..."
              rows={6}
              maxLength={3000}
              helpText="Optional • Technical details welcome"
              showCharCount
            />
          </Card>

          {/* Submit Section */}
          <Card>
            {submitStatus === 'success' && (
              <Alert variant="success" className="mb-4">
                Thanks — we seriously read every message. ✅
              </Alert>
            )}

            {submitStatus === 'error' && (
              <Alert variant="error" className="mb-4">
                Something went wrong. Try again or email us directly at pandauracares@mail.com. ❌
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">
                Your feedback goes directly to <span className="font-mono">pandauracares@mail.com</span>
              </p>
              
              <Button
                type="submit"
                disabled={!hasContent || isSubmitting}
                loading={isSubmitting}
                icon={isSubmitting ? Loader : Send}
              >
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </Button>
            </div>
          </Card>
        </form>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted">
            All feedback is sent securely and never shared with third parties. 
            We read everything and use it to improve Pandaura AS.
          </p>
        </div>
      </div>
    </div>
  );
}