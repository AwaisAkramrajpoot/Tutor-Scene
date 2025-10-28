import React from "react";

export const BookingRequestsSection = () => {
  const bookingRequests = [
    {
      id: 1,
      name: "Alex Johnson",
      subject: "Mathematics",
      date: "Oct 21",
      time: "03:00 PM",
    },
    {
      id: 2,
      name: "Maria Garcia",
      subject: "Physics",
      date: "Oct 23",
      time: "10:00 AM",
    },
  ];

  const upcomingSessions = [
    {
      id: 1,
      name: "Kevin Brown",
      subject: "Mathematics",
      date: "Oct 20",
      time: "02:00 PM",
    },
    {
      id: 2,
      name: "Lisa Chen",
      subject: "Physics",
      date: "Oct 22",
      time: "11:00 AM",
    },
  ];

  const earningsPeriods = [
    {
      period: "This Week",
      amount: "$540",
      sessions: "12",
    },
    {
      period: "This Month",
      amount: "$3,240",
      sessions: "72",
    },
  ];

  const notifications = [
    {
      id: 1,
      message: "New booking request from Alex Johnson",
      time: "30 minutes ago",
    },
    {
      id: 2,
      message: "Session with Kevin Brown starts in 2 hours",
      time: "1 hour ago",
    },
    {
      id: 3,
      message: "You received a 5-star review from Maria Garcia",
      time: "3 hours ago",
    },
  ];

  const performanceMetrics = [
    {
      label: "Response Rate",
      value: "98%",
      percentage: 98,
    },
    {
      label: "Completion Rate",
      value: "95%",
      percentage: 95,
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Messages */}
          <div className="rounded-2xl p-4 bg-gradient-to-r from-[#47A6E2] to-[#004D94] text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-xl">💬</div>
              <div>
                <h3 className="text-lg font-normal">Messages</h3>
                <p className="text-white/80 text-sm">Chat with your students</p>
              </div>
            </div>
            <div className="bg-white text-[#6a3de8] px-3 py-1 rounded-lg text-sm font-medium">3 New</div>
          </div>

          {/* New Booking Requests */}
          <article className="bg-white rounded-2xl border border-black/10 p-6">
            <h2 className="text-2xl text-[#101727] mb-6">New Booking Requests</h2>
            <div className="space-y-4">
              {bookingRequests.map((request) => (
                <div key={request.id} className="bg-gray-50 rounded-xl p-5">
                  <h3 className="text-xl text-[#101727]">{request.name}</h3>
                  <div className="mt-2 inline-flex items-center bg-purple-50 text-[#6a3de8] px-3 py-1 rounded-lg text-sm border border-transparent">
                    {request.subject}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-[#495565]">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <time>{request.date}</time>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🕐</span>
                      <time>{request.time}</time>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-4">
                    <button className="flex-1 bg-[#01519A] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
                      Accept
                    </button>
                    <button className="flex-1 bg-white border border-black/10 text-[#101727] px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Upcoming Sessions */}
          <article className="bg-white rounded-2xl border border-black/10 p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">📅</span>
              <h2 className="text-2xl text-[#101727]">Upcoming Sessions</h2>
            </div>
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="bg-gray-50 rounded-xl p-5 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-xl text-[#101727]">{session.name}</h3>
                    <div className="mt-2 inline-flex items-center bg-purple-50 text-[#6a3de8] px-3 py-1 rounded-lg text-sm border border-transparent">
                      {session.subject}
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-[#495565]">
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <time>{session.date}</time>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🕐</span>
                        <time>{session.time}</time>
                      </div>
                    </div>
                  </div>
                  <button className="bg-[#01519A] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
                    Start Session
                  </button>
                </div>
              ))}
            </div>
          </article>

          {/* Earnings Overview */}
          <article className="bg-white rounded-2xl border border-black/10 p-6">
            <h2 className="text-2xl text-[#101727] mb-6">Earnings Overview</h2>
            <div className="space-y-4">
              {earningsPeriods.map((period, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[#495565] text-lg">{period.period}</p>
                    <p className="text-[#101727] text-3xl mt-1">{period.amount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#495565] text-lg">Sessions</p>
                    <p className="text-[#101727] text-2xl mt-1">{period.sessions}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        {/* Right column - 1/3 width */}
        <aside className="space-y-6">
          {/* Notifications */}
          <article className="bg-white rounded-2xl border border-black/10 p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">🔔</span>
              <h2 className="text-2xl text-[#101727]">Notifications</h2>
            </div>
            <ul className="space-y-4">
              {notifications.map((notification, index) => (
                <li key={notification.id} className={`pb-4 ${index < notifications.length - 1 ? "border-b border-black/10" : ""}`}>
                  <p className="text-[#101727]">{notification.message}</p>
                  <time className="text-[#697282] text-sm mt-1 block">{notification.time}</time>
                </li>
              ))}
            </ul>
          </article>

          {/* Quick Actions */}
          <article className="bg-white rounded-2xl border border-black/10 p-6">
            <h2 className="text-2xl text-[#101727] mb-6">Quick Actions</h2>
            <nav className="space-y-3">
              <button className="w-full bg-[#01519A] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
                Manage Availability
              </button>
              <button className="w-full bg-white border border-black/10 text-[#101727] px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                Update Profile
              </button>
              <button className="w-full bg-white border border-black/10 text-[#101727] px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                View Analytics
              </button>
            </nav>
          </article>

          {/* Performance */}
          <article className="bg-white rounded-2xl border border-black/10 p-6">
            <h2 className="text-2xl text-[#101727] mb-6">Performance</h2>
            <div className="space-y-6">
              {performanceMetrics.map((metric, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#495565] text-lg">{metric.label}</p>
                    <p className="text-[#101727] text-lg font-medium">{metric.value}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#47A6E2] to-[#004D94]"
                      style={{ width: `${metric.percentage}%` }}
                      role="progressbar"
                      aria-valuenow={metric.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${metric.label}: ${metric.value}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
};
