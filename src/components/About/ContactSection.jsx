import React from "react";

const valuesData = [
  {
    title: "Quality First",
    description:
      "We carefully verify all tutors to ensure students receive the highest quality education. Every tutor is background-checked and evaluated for their expertise.",
  },
  {
    title: "Accessibility",
    description:
      "Education should be available to everyone, regardless of location or circumstance. We're committed to making learning accessible and affordable.",
  },
  {
    title: "Innovation",
    description:
      "We continuously improve our platform with cutting-edge technology to enhance the learning experience for both students and tutors.",
  },
];

export const ContactSection = () => {
  return (
    <section className="w-full bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl text-[#101727] text-center mb-12">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {valuesData.map((value, index) => (
            <article
              key={index}
              className="bg-white rounded-2xl border border-black/10 p-8"
            >
              <h3 className="text-2xl text-[#101727] mb-4">{value.title}</h3>
              <p className="text-[#495565] leading-relaxed">{value.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
