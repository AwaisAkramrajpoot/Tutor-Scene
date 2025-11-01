export const TipsForSuccessSection = () => {
  const tips = [
    {
      id: 1,
      bgColor: "bg-[#0f3e78]",
      title: "Review Platform Features",
      description:
        "Explore the tutor dashboard and familiarize yourself with all available features and tools.",
    },
    {
      id: 2,
      bgColor: "bg-[#2a66b8]",
      title: "Set Your Availability",
      description:
        "Add your available time slots so students can start booking sessions with you.",
    },
    {
      id: 3,
      bgColor: "bg-[#c89e45]",
      title: "Start Accepting Bookings",
      description:
        "Once your schedule is set, students can find you and book their first session!",
    },
  ];

  return (
    <section className="w-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <div className="inline-flex items-center bg-white text-[#2A66B8] rounded-full px-4 py-1 text-sm font-normal">TUTOR SCENE</div>
          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl text-[#101727]">What to Do Next</h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {tips.map((tip) => (
            <article key={tip.id} className="bg-white rounded-2xl border border-black/10 p-8 text-center">
              <div className={`w-16 h-16 mx-auto rounded-full ${tip.bgColor} text-white flex items-center justify-center text-2xl`}>{tip.id}</div>
              <h3 className="mt-6 text-2xl text-[#101727]">{tip.title}</h3>
              <p className="mt-3 text-[#495565] text-lg">{tip.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
