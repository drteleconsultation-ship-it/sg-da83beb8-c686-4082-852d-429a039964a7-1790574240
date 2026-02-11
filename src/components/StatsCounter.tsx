import React, { useEffect, useRef, useState } from "react";
import { Users, Star, MessageSquare, Calendar } from "lucide-react";
import { useLanguage } from "@/components/LanguageSelector";

interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  label: string;
  duration?: number;
}

const StatItem: React.FC<StatItemProps> = ({ 
  icon, 
  value, 
  suffix = "", 
  label, 
  duration = 2000 
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, value, duration]);

  return (
    <div
      ref={ref}
      className="relative group"
    >
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:scale-105">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full group-hover:scale-110 transition-transform duration-300">
            <div className="text-primary dark:text-primary-foreground">
              {icon}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {count.toLocaleString()}{suffix}
            </div>
            <div className="text-sm md:text-base text-gray-600 dark:text-gray-300 font-medium">
              {label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCounter: React.FC = () => {
  const { t } = useLanguage();

  const stats = [
    {
      icon: <Users className="w-8 h-8" />,
      value: 10000,
      suffix: "+",
      label: t("stats.patientsTreated") || "Patients Treated",
    },
    {
      icon: <Star className="w-8 h-8" />,
      value: 5.0,
      suffix: "",
      label: t("stats.googleRating") || "Google Rating",
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      value: 428,
      suffix: "+",
      label: t("stats.reviews") || "Reviews",
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      value: 6,
      suffix: "+",
      label: t("stats.yearsExperience") || "Years Experience",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("stats.title") || "Our Achievements"}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            {t("stats.subtitle") || "Trusted by thousands of patients for quality healthcare"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              icon={stat.icon}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              duration={2000 + index * 200}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;