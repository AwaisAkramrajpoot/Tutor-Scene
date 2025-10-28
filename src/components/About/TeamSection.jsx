import React from "react";

const PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><circle cx='75' cy='75' r='75' fill='%23E0E0E0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%23666'>👤</text></svg>";

export const TeamSection = () => {
  const teamMembers = [
    {
      id: 1,
      name: "Dr. Emily Chen",
      role: "CEO & Founder",
    },
    {
      id: 2,
      name: "Michael Rodriguez",
      role: "CTO",
    },
    {
      id: 3,
      name: "Sarah Johnson",
      role: "Head of Education",
    },
    {
      id: 4,
      name: "David Kim",
      role: "Head of Operations",
    },
  ];

  return (
    <section className="w-full bg-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl text-[#101727] mb-4">Meet Our Team</h2>
          <p className="text-[#495565] text-lg">Passionate educators and technologists working together</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member) => (
            <article key={member.id} className="bg-white rounded-2xl border border-black/10 p-6 text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  alt={`${member.name} - ${member.role}`}
                  src={PLACEHOLDER}
                />
              </div>
              <h3 className="text-xl text-[#101727] mb-2">{member.name}</h3>
              <p className="text-[#495565]">{member.role}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
