import React from 'react';
import { useLanguage } from './LanguageSelector';
import { Card } from '@/components/ui/card';
import { Heart, Users, FileText, Activity } from 'lucide-react';

const MissionSection = () => {
  const { t } = useLanguage();

  const challenges = [
    {
      icon: Users,
      title: 'Shortage of MBBS Doctors',
      description: 'Many regions lack access to qualified doctors and specialists at the local level, limiting healthcare availability for millions.'
    },
    {
      icon: Activity,
      title: 'Overburdened Hospitals',
      description: 'Impacting their ability to provide timely, specialized care and follow up.'
    },
    {
      icon: FileText,
      title: 'Absence of Health Record Creation',
      description: 'A reliable system for maintaining health records is crucial for effective and coordinated care. It helps patients to keep record of health while consulting doctor.'
    },
    {
      icon: Heart,
      title: 'Need for a Continuum of Care',
      description: 'Ensuring a seamless healthcare journey across different care levels improves health outcomes and reduces care gaps.'
    }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Transforming Healthcare Through Telemedicine
          </h2>
          <div className="max-w-4xl mx-auto space-y-4 text-muted-foreground">
            <p className="text-lg leading-relaxed">
              Dr Rikki Deogade started Online Telemedicine Service in India to address critical gaps in the healthcare system. 
              This platform aims to tackle:
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {challenges.map((challenge, index) => {
            const Icon = challenge.icon;
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 border-border/50 bg-card">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground">
                      ({index + 1}) {challenge.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {challenge.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="bg-primary/5 rounded-lg p-6 md:p-8 border border-primary/20">
          <p className="text-center text-lg leading-relaxed text-foreground">
            Through Online consultation, Dr Deogade is committed to overcoming these challenges by bringing 
            <span className="font-semibold text-primary"> quality healthcare to the doorstep of every Indian</span>, 
            ensuring easy, equitable, and timely access to medical consultations that too at 
            <span className="font-semibold text-primary"> affordable rates</span>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;