import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Mail, MapPin, Phone } from 'lucide-react';
import GradientOrbs from '@/components/GradientOrbs';
import { contactFormSchema, zodResolver, type SchemaOutput } from '@/lib/validation';

type ContactFormData = SchemaOutput<typeof contactFormSchema>;

const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', subject: '', message: '' },
  });

  const onSubmit = async (data: ContactFormData) => {
    // Simulate API call — no backend contact endpoint exists
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Contact form submitted:', data);
    setSubmitted(true);
    reset();
  };
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <GradientOrbs />

      {/* Navbar */}
      <nav className="relative z-10 container mx-auto px-6 py-4">
        <div className="flex justify-between items-center backdrop-blur-sm bg-white/70 rounded-2xl px-6 py-4 shadow-lg border border-white/20">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Meetiva.ai
            </span>
          </Link>
        </div>
      </nav>

      {/* Contact Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-gray-900 mb-6">
              Get in <span className="bg-gradient-primary bg-clip-text text-transparent">Touch</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {submitted && (
                  <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                    Thank you! We'll get back to you soon.
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    id="contact-name"
                    className={`w-full px-4 py-3 rounded-lg border transition-all ${errors.name ? 'border-red-400' : 'border-gray-300 focus:ring-2 focus:border-transparent'}`}
                    placeholder="Your name"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    id="contact-email"
                    className={`w-full px-4 py-3 rounded-lg border transition-all ${errors.email ? 'border-red-400' : 'border-gray-300 focus:ring-2 focus:border-transparent'}`}
                    placeholder="your.email@company.com"
                    {...register('email')}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    id="contact-subject"
                    className={`w-full px-4 py-3 rounded-lg border transition-all ${errors.subject ? 'border-red-400' : 'border-gray-300 focus:ring-2 focus:border-transparent'}`}
                    placeholder="How can we help?"
                    {...register('subject')}
                  />
                  {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea
                    rows={5}
                    id="contact-message"
                    className={`w-full px-4 py-3 rounded-lg border transition-all resize-none ${errors.message ? 'border-red-400' : 'border-gray-300 focus:ring-2 focus:border-transparent'}`}
                    placeholder="Tell us more about your needs..."
                    {...register('message')}
                  />
                  {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
                </div>
                <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Email</h3>
                    <p className="text-gray-600">support@meetiva.ai</p>
                    <p className="text-gray-600">sales@meetiva.ai</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Phone</h3>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                    <p className="text-sm text-gray-500 mt-1">Mon-Fri 9am-6pm EST</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Office</h3>
                    <p className="text-gray-600">
                      123 Innovation Drive<br />
                      San Francisco, CA 94102<br />
                      United States
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-6 py-12 text-center border-t border-gray-200/50">
        <p className="text-gray-600">&copy; {new Date().getFullYear()} Meetiva.ai. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ContactPage;

