"use client";

import { useState } from 'react';
import { Button } from './ui/Button';

export const ContactForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission logic here
  };

  const inputClasses = "w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-accent/50 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="firstName" className="block text-sm font-medium text-zinc-400 mb-1.5">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="John"
            className={inputClasses}
            required
          />
        </div>
        <div className="flex-1">
          <label htmlFor="lastName" className="block text-sm font-medium text-zinc-400 mb-1.5">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Doe"
            className={inputClasses}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-1.5">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="john@example.com"
          className={inputClasses}
          required
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-zinc-400 mb-1.5">Subject</label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange} // Select element also uses the same change handler signature
          className={`${inputClasses} appearance-none`}
          required
        >
          <option value="" disabled>Select a subject</option>
          <option value="general">General Inquiry</option>
          <option value="support">Technical Support</option>
          <option value="collaboration">Collaboration</option>
          <option value="feedback">Feedback</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-zinc-400 mb-1.5">Message</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
          placeholder="How can we help you?"
          className={`${inputClasses} resize-none`}
          required
        />
      </div>

      <Button variant="primary" size="lg" className="mt-2 w-full md:w-auto">
        Send Message
      </Button>
    </form>
  );
};
