import React from "react";

const HERO_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='700' height='400'><rect width='100%' height='100%' fill='%2347A6E2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='24' fill='white' font-family='Arial'>Tutor Scene Team</text></svg>";

export const HeroSection = () => {
  return (
    <section className="w-full bg-gradient-to-r from-[#47A6E2] to-[#004D94] text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal leading-tight">
              Empowering learning through connection.
            </h1>
            <p className="mt-6 text-[#f2e7fe] text-lg md:text-xl max-w-xl">
              Tutor Scene connects students and tutors for better education access worldwide.
            </p>
          </div>
          <div className="rounded-xl overflow-hidden shadow-2xl">
            <img
              className="w-full h-auto object-cover"
              alt="Tutor Scene Team"
              src={HERO_IMAGE}
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='700' height='400'><rect width='100%' height='100%' fill='%2347A6E2'/></svg>";
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
