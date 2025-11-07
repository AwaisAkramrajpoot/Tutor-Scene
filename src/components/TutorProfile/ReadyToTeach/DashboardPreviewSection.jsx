import { useNavigate } from "react-router-dom";

// Inline, offline-safe SVG placeholder (no network request)
const HERO_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='932' height='621'><rect width='100%' height='100%' fill='%23eef2f7'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='%236b7280' font-family='Arial'>Tutor Scene Placeholder</text></svg>";

const weeklyScheduleData = [
  { day: "Monday", time: "9:00 - 17:00", available: true },
  { day: "Tuesday", time: "9:00 - 17:00", available: true },
  { day: "Wednesday", time: "9:00 - 17:00", available: true },
  { day: "Thursday", time: "9:00 - 17:00", available: true },
  { day: "Friday", time: "9:00 - 17:00", available: true },
  { day: "Saturday", time: "Unavailable", available: false },
  { day: "Sunday", time: "Unavailable", available: false },
];

const proTipsData = [
  "Keep your availability updated to receive more bookings",
  "Respond to student messages within 24 hours",
  "Test your Zoom connection before each session",
  "Encourage students to leave reviews after sessions",
];

const dashboardFeaturesData = [
  { icon: "🎥", label: "Video Sessions" },
  { icon: "💬", label: "Student Messages" },
  { icon: "💰", label: "Earnings Tracker" },
  { icon: "📅", label: "Schedule Manager" },
];

export const DashboardPreviewSection = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="flex flex-col gap-8">
          {/* Availability card */}
          <article className="bg-white rounded-2xl border border-black/10 p-6 md:p-8">
            <header className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <span className="text-[#2a66b8] text-xl">📅</span>
              </div>
              <h3 className="text-[28px] text-[#101727]">Set Your Availability</h3>
            </header>
            <p className="mt-3 text-[#495565] text-lg">
              Choose when you&#39;re available to teach. Students will only be able to book sessions during your available time slots.
            </p>
            <div className="mt-6 border-2 rounded-xl p-5">
              <h4 className="text-xl text-[#101727] mb-4">Weekly Schedule</h4>
              <ul className="space-y-3">
                {weeklyScheduleData.map((s) => (
                  <li key={s.day} className="flex items-center gap-4">
                    <span className="w-32 text-[#495565] text-lg">{s.day}</span>
                    <div className={`flex-1 h-12 rounded-lg flex items-center justify-center ${s.available ? "bg-gradient-to-r from-[#47A6E2] to-[#004D94] text-white" : "bg-gray-100 text-[#697282]"}`}>
                      {s.time}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <button className="mt-6 w-full h-14 rounded-lg bg-gradient-to-r from-[#47A6E2] to-[#004D94] text-white">
              Customize Schedule
            </button>
          </article>

          {/* Pro tips card */}
          <aside className="rounded-2xl border border-black/10 p-6 md:p-8 bg-gradient-to-b from-[#A8C7F0] to-[#2A66B8]">
            <h4 className="text-white text-2xl mb-4">Pro Tips for Success</h4>
            <ul className="space-y-4">
              {proTipsData.map((tip) => (
                <li key={tip} className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-full bg-white text-[#2A66B8] flex items-center justify-center">✓</span>
                  <p className="text-[#DAEAFE] text-lg">{tip}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-8">
          {/* Image */}
          <figure className="rounded-xl overflow-hidden shadow-[0_12px_20px_-8px_rgba(0,0,0,.1)] h-72 sm:h-96 bg-white">
            <img src={HERO_PLACEHOLDER} alt="Tutor placeholder" className="w-full h-full object-cover" />
          </figure>

          {/* Dashboard preview */}
          <article className="bg-white rounded-2xl border border-black/10 p-6 md:p-8">
            <h3 className="text-[28px] text-[#101727]">Your Dashboard Preview</h3>
            <p className="mt-3 text-[#495565] text-lg max-w-2xl">
              Your sessions will appear here once booked. Here&#39;s what your tutor dashboard will show:
            </p>

            <div className="mt-6 bg-gray-50 border-2 rounded-xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#2A66B8] text-white flex items-center justify-center">📅</div>
                <div>
                  <div className="text-[#495565]">No sessions yet</div>
                  <div className="text-[#101727] text-lg">Your sessions will appear here once booked</div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              {dashboardFeaturesData.map((f) => (
                <div key={f.label} className="bg-blue-50 rounded-xl p-6 text-center">
                  <div className="text-2xl">{f.icon}</div>
                  <div className="mt-3 text-[#495565]">{f.label}</div>
                </div>
              ))}
            </div>
          </article>

          <button
            onClick={() => navigate('/tutor-dashboard')}
            className="w-full h-14 rounded-lg bg-gradient-to-r from-[#47A6E2] to-[#004D94] text-white"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </section>
  );
};
