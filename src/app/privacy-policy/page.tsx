
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="flex flex-col items-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-12">
            <Link href="/" className="flex items-center justify-center gap-2 mb-4">
                <Mountain className="h-8 w-8 text-primary" />
                <h1 className="font-headline text-3xl font-semibold">
                Karma Manager
                </h1>
            </Link>
          <h2 className="text-4xl font-bold tracking-tight">Privacy Policy</h2>
          <p className="text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </header>

        <Card>
          <CardContent className="p-8 space-y-6 text-muted-foreground">
            <p>
              Karma Manager ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
            </p>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Information Collection and Use</h3>
              <p>
                We collect information that you provide to us directly when you register for an account, such as your name, email address, organization details, and other information necessary to provide our services. For employees and students, we collect information provided by the organization administrator, including name, ID, and photos for attendance purposes. We also collect information automatically when you use our services, such as attendance logs which include time and, if enabled, GPS location data.
              </p>
            </div>

             <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Use of Your Information</h3>
              <p>
                Having accurate information permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Create and manage your account.</li>
                <li>Manage staff, student, task, and salary information as directed by you.</li>
                <li>Process attendance, including using facial recognition and GPS data for verification.</li>
                <li>Generate reports and payslips.</li>
                <li>Send notifications related to app activities (e.g., new tasks, leave requests).</li>
                <li>Monitor and analyze usage and trends to improve your experience with the Application.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Data Security</h3>
              <p>
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse. All data is stored locally on your device's browser (Local Storage) and is not transmitted to our servers unless required for specific AI features.
              </p>
            </div>
            
             <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Facial Recognition and Camera Data</h3>
              <p>
                Our attendance kiosk feature uses your device's camera to capture images for facial recognition to verify identity. These images are processed on-device or sent to our secure AI service provider (Google Gemini) for the sole purpose of matching faces against registered user profiles. Captured images are not stored long-term and are only used for the duration of the verification process. We do not use this data for any other purpose.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Changes to This Privacy Policy</h3>
              <p>
                We may update this Privacy Policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by posting the new Privacy Policy on this page.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Contact Us</h3>
              <p>
                If you have questions or comments about this Privacy Policy, please contact us through the support channels provided by your organization's administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
