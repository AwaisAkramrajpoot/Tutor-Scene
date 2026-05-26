import React from "react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: "📅",
      title: "Flexible Schedule",
      description:
        "Teach when you want, where you want. Set your own hours and work from anywhere in the world.",
      items: [
        { icon: "✓", text: "Work from anywhere" },
        { icon: "✓", text: "Set your own availability" },
        { icon: "✓", text: "No minimum hours" },
        { icon: "✓", text: "Seamless Onboarding" },
      ],
    },
    {
      icon: "🌍",
      title: "Grow Your Reach",
      description:
        "Connect with students from around the globe and build your reputation as an expert in your field.",
      items: [
        { icon: "✓", text: "Global student network" },
        { icon: "✓", text: "Build your brand" },
      ],
    },
    {
      icon: "💳",
      title: "Secure Payments",
      description:
        "Get paid reliably and on time. Set your own rates and receive payments through our secure platform.",
      items: [
        { icon: "✓", text: "Set your own rates" },
        { icon: "✓", text: "Weekly direct deposits" },
        { icon: "✓", text: "Protected payments" },
        { icon: "✓", text: "Earn tips too" },
      ],
    },
  ];

  return (
    <section className="w-full py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="bg-white rounded-3xl border-2 border-[#004d944c] p-8 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-b from-[#A8C7F0] to-[#2A66B8] flex items-center justify-center text-4xl">
                {feature.icon}
              </div>
              <h3 className="text-2xl text-[#101727] mb-4">{feature.title}</h3>
              <p className="text-[#495565] text-lg mb-6">{feature.description}</p>
              <ul className="space-y-3 text-left">
                {feature.items.map((item) => (
                  <li key={item.text} className="flex items-center gap-3 text-[#495565]">
                    <span className="text-[#00c950] font-bold">{item.icon}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
