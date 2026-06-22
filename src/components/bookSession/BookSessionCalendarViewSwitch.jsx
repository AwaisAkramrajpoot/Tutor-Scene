const CALENDAR_VIEWS = [
  { id: 'dayGridMonth', label: 'Month' },
  { id: 'timeGridWeek', label: 'Week' },
  { id: 'timeGridDay', label: 'Day' },
];

const BookSessionCalendarViewSwitch = ({ activeView, onChange }) => (
  <div
    className="bs-calendar-view-switch"
    role="tablist"
    aria-label="Calendar view"
  >
    {CALENDAR_VIEWS.map((view) => {
      const isActive = activeView === view.id;
      return (
        <button
          key={view.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(view.id)}
          className={isActive ? 'is-active' : undefined}
        >
          {view.label}
        </button>
      );
    })}
  </div>
);

export default BookSessionCalendarViewSwitch;
