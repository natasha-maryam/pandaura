import React, { useState } from 'react';
import { Button, Input, Card } from '../components/ui';

const TestInvites: React.FC = () => {
  const [orgId, setOrgId] = useState('2db8f198-523c-428a-8e15-c08a42928c3f'); // Default org ID
  const [email, setEmail] = useState('test@example.com');
  const [role, setRole] = useState('Viewer');
  const [generatedInvite, setGeneratedInvite] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateInvite = async () => {
    if (!orgId || !email) {
      setError('Organization ID and email are required');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      const response = await fetch('/auth/invites/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: orgId.trim(),
          email: email.trim(),
          role,
          expiresInDays: 7
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate invite');
      }

      const data = await response.json();
      setGeneratedInvite(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate invite');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-primary mb-6">Test Invite Generation</h1>
          
          <div className="space-y-4">
            <Input
              label="Organization ID"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              placeholder="Enter organization ID"
            />
            
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email for invite"
            />
            
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Role</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-light rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="Viewer">Viewer</option>
                <option value="Editor">Editor</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              onClick={generateInvite}
              disabled={isGenerating}
              loading={isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate Invite'}
            </Button>
          </div>

          {generatedInvite && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Invite Generated!</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-green-700">Invite Code:</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white p-2 border rounded text-sm font-mono">
                      {generatedInvite.inviteCode}
                    </code>
                    <Button
                      onClick={() => copyToClipboard(generatedInvite.inviteCode)}
                      size="sm"
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700">Invite Link:</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white p-2 border rounded text-sm font-mono break-all">
                      {generatedInvite.inviteLink}
                    </code>
                    <Button
                      onClick={() => copyToClipboard(generatedInvite.inviteLink)}
                      size="sm"
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-700">Organization:</span>
                    <p className="text-green-600">{generatedInvite.orgName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Role:</span>
                    <p className="text-green-600">{generatedInvite.role}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Email:</span>
                    <p className="text-green-600">{generatedInvite.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Expires:</span>
                    <p className="text-green-600">
                      {new Date(generatedInvite.expiresAt * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-semibold text-blue-800 mb-2">Available Organizations:</h4>
            <div className="text-sm text-blue-700 space-y-1 font-mono">
              <div>2db8f198-523c-428a-8e15-c08a42928c3f (Pandaura)</div>
              <div>628e8432-420f-4e38-b02a-7d6ce6a3147f (Pandaura)</div>
              <div>8e7bfca8-409a-4742-bd4c-0fd10996957f (Pandaura)</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TestInvites;
