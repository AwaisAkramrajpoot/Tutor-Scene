import React, { useState } from "react";

export const ValuesSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const contactInfo = [
    {
      icon: "📧",
      title: "Email",
      details: ["support@tutorscene.com"],
    },
    {
      icon: "📞",
      title: "Phone",
      details: ["+1 (555) 123-4567"],
    },
    {
      icon: "📍",
      title: "Office",
      details: ["123 Education Street", "San Francisco, CA 94102"],
    },
  ];

  const formFields = [
    {
      id: "name",
      label: "Name",
      placeholder: "Your name",
      type: "text",
      rows: 1,
    },
    {
      id: "email",
      label: "Email",
      placeholder: "your@email.com",
      type: "email",
      rows: 1,
    },
    {
      id: "subject",
      label: "Subject",
      placeholder: "How can we help?",
      type: "text",
      rows: 1,
    },
    {
      id: "message",
      label: "Message",
      placeholder: "Tell us more about your inquiry...",
      type: "textarea",
      rows: 4,
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <section className="w-full bg-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left column - Contact Info */}
          <div>
            <h2 className="text-4xl md:text-5xl text-[#101727] mb-6">Get in Touch</h2>
            <p className="text-[#495565] text-lg mb-8">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
            <address className="space-y-6 not-italic">
              {contactInfo.map((contact, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {contact.icon}
                  </div>
                  <div>
                    <h3 className="text-[#101727] text-lg font-medium mb-1">{contact.title}</h3>
                    {contact.details.map((detail, detailIndex) => (
                      <p key={detailIndex} className="text-[#495565]">{detail}</p>
                    ))}
                  </div>
                </div>
              ))}
            </address>
          </div>

          {/* Right column - Contact Form */}
          <div className="bg-white rounded-2xl border border-black/10 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {formFields.map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.id} className="block text-[#101727] mb-2">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={field.id}
                      name={field.id}
                      value={formData[field.id]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      rows={field.rows}
                      className="w-full px-4 py-3 bg-[#f3f3f5] rounded-lg border border-transparent text-[#717182] resize-none focus:outline-none focus:border-[#47A6E2] focus:ring-1 focus:ring-[#47A6E2]"
                    />
                  ) : (
                    <input
                      type={field.type}
                      id={field.id}
                      name={field.id}
                      value={formData[field.id]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 bg-[#f3f3f5] rounded-lg border border-transparent text-[#717182] focus:outline-none focus:border-[#47A6E2] focus:ring-1 focus:ring-[#47A6E2]"
                    />
                  )}
                </div>
              ))}
              <button
                type="submit"
                className="w-full h-12 rounded-lg bg-gradient-to-r from-[#47A6E2] to-[#004D94] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <span>✉️</span>
                <span>Send Message</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
