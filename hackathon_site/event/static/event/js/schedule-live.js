// Calendar-day arithmetic avoids shifting Sunday by an hour across DST changes.
function scheduleDateAtOffset(startDate, offset) {
    const [year, month, day] = startDate.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10);
}

function scheduleClock(now, timeZone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(now);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return {
        date: `${values.year}-${values.month}-${values.day}`,
        time: `${values.hour}:${values.minute}`,
    };
}

function scheduleEventReached(clock, date, time, endDate) {
    // Accumulate reached milestones across both days, then reset after the weekend.
    return (
        clock.date <= endDate &&
        (clock.date > date || (clock.date === date && clock.time >= time))
    );
}

// Controls ui live schedule indicators and status text for each day and event, based on the current time in the event's time zone
function initLiveSchedule() {
    const schedule = document.querySelector(".schedule[data-start-date]");
    if (!schedule) return;
    const { startDate, timeZone } = schedule.dataset;
    const endDate = scheduleDateAtOffset(startDate, 1);
    const days = Array.from(schedule.querySelectorAll(".scheduleDay")).map((day) => ({
        date: scheduleDateAtOffset(startDate, Number(day.dataset.dayOffset)),
        indicator: day.querySelector(".scheduleIndicator"),
        status: day.querySelector(".scheduleStatusValue"),
        events: Array.from(day.querySelectorAll(".scheduleEvent")).map((event) => ({
            element: event,
            time: event.querySelector("time").getAttribute("datetime"),
            status: event.querySelector(".scheduleEventStatus"),
        })),
    }));

    function update() {
        const clock = scheduleClock(new Date(), timeZone);
        days.forEach((day) => {
            const live = clock.date === day.date;
            day.indicator.dataset.state = live ? "on" : "off";
            day.status.textContent = live ? "On" : "Off";
            day.events.forEach((event) => {
                const reached = scheduleEventReached(
                    clock,
                    day.date,
                    event.time,
                    endDate
                );
                event.element.dataset.state = reached ? "on" : "off";
                event.status.textContent = reached
                    ? "Scheduled time reached"
                    : clock.date > day.date
                    ? "Day finished"
                    : "Upcoming";
            });
        });
    }

    update();
    window.setInterval(update, 15000);
    window.addEventListener("pageshow", update);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) update();
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLiveSchedule, { once: true });
} else {
    initLiveSchedule();
}
