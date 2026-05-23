import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-24">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-4xl text-center mb-4">Privacy Policy</CardTitle>
            <p className="text-center text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                We collect information that you provide directly to us when you book an appointment or use our telemedicine services, including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Personal information (name, phone number, email address)</li>
                <li>Medical history and health information</li>
                <li>Appointment details and preferences</li>
                <li>Payment information (processed securely through third-party payment processors)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide and maintain our medical services</li>
                <li>Schedule and manage your appointments</li>
                <li>Communicate with you about your health and appointments</li>
                <li>Send appointment reminders and follow-up information</li>
                <li>Improve our services and patient experience</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Information Sharing and Disclosure</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>With your explicit consent</li>
                <li>With healthcare providers involved in your care</li>
                <li>When required by law or to respond to legal process</li>
                <li>To protect the rights, property, or safety of our patients and staff</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Access your personal information</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information (subject to legal requirements)</li>
                <li>Withdraw consent where processing is based on consent</li>
                <li>Lodge a complaint with relevant authorities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg text-muted-foreground">
                <p className="mb-2"><strong>Dr Deogade Clinic</strong></p>
                <p className="mb-2">Phone: +91 94221 52702</p>
                <p>Address: Near Adivasi Samaj Mandir, Kothrud, Pune, Maharashtra 411038</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;