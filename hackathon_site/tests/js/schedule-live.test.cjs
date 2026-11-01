const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const context = vm.createContext({
    document: { readyState: "loading", addEventListener() {} },
});
vm.runInContext(
    fs.readFileSync(path.join(__dirname, "../../event/static/event/js/schedule-live.js"), "utf8"),
    context
);
const zone = "America/Toronto";

test("second day follows the configured date across month/year and leap-day boundaries", () => {
    assert.equal(context.scheduleDateAtOffset("2026-02-14", 0), "2026-02-14");
    assert.equal(context.scheduleDateAtOffset("2026-02-14", 1), "2026-02-15");
    assert.equal(context.scheduleDateAtOffset("2026-12-31", 1), "2027-01-01");
    assert.equal(context.scheduleDateAtOffset("2028-02-28", 1), "2028-02-29");
});

test("LIVE dates follow Toronto midnight, not UTC or the visitor timezone", () => {
    assert.equal(context.scheduleClock(new Date("2026-02-15T04:59:59Z"), zone).date, "2026-02-14");
    const midnight = context.scheduleClock(new Date("2026-02-15T05:00:00Z"), zone);
    assert.equal(midnight.date, "2026-02-15");
    assert.equal(midnight.time, "00:00");
});

test("event LEDs accumulate across the weekend and turn off after Sunday", () => {
    const reached = (clock, date, time) => context.scheduleEventReached(clock, date, time, "2026-02-15");
    assert.equal(reached({ date: "2026-02-13", time: "23:59" }, "2026-02-14", "08:30"), false);
    assert.equal(reached({ date: "2026-02-14", time: "08:29" }, "2026-02-14", "08:30"), false);
    assert.equal(reached({ date: "2026-02-14", time: "08:30" }, "2026-02-14", "08:30"), true);
    assert.equal(reached({ date: "2026-02-15", time: "00:00" }, "2026-02-14", "20:00"), true);
    assert.equal(reached({ date: "2026-02-14", time: "23:59" }, "2026-02-15", "07:00"), false);
});

test("Toronto time and calendar-day offsets survive daylight-saving transitions", () => {
    assert.equal(context.scheduleDateAtOffset("2026-03-07", 1), "2026-03-08");
    assert.equal(context.scheduleClock(new Date("2026-03-08T11:00:00Z"), zone).time, "07:00");
    assert.equal(context.scheduleDateAtOffset("2026-10-31", 1), "2026-11-01");
    assert.equal(context.scheduleClock(new Date("2026-11-01T12:00:00Z"), zone).time, "07:00");
});

test("refresh updates LIVE badges and event LEDs together without touching outer pins", () => {
    let now = "2026-02-14T13:30:00Z";
    let refresh;
    const makeDay = (offset, times) => {
        const indicator = { dataset: {} }, status = {};
        const events = times.map(time => ({ dataset: {}, status: {}, querySelector(selector) {
            return selector === "time" ? { getAttribute: () => time } : this.status;
        } }));
        return { dataset: { dayOffset: offset }, indicator, status, events,
            querySelector: selector => selector === ".scheduleIndicator" ? indicator : status,
            querySelectorAll: () => events };
    };
    const days = [makeDay("0", ["08:30", "20:00"]), makeDay("1", ["07:00"])];
    const schedule = { dataset: { startDate: "2026-02-14", timeZone: zone }, querySelectorAll: () => days };
    const browser = vm.createContext({
        Date: class extends Date { constructor(...args) { super(...(args.length ? args : [now])); } },
        document: { readyState: "complete", querySelector: () => schedule, addEventListener() {} },
        window: { setInterval: callback => { refresh = callback; }, addEventListener() {} },
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, "../../event/static/event/js/schedule-live.js"), "utf8"), browser);
    assert.equal(days[0].indicator.dataset.state, "on");
    assert.equal(days[1].status.textContent, "Off");
    assert.equal(days[0].events[0].dataset.state, "on");
    assert.equal(days[0].events[1].dataset.state, "off");
    now = "2026-02-15T04:59:59Z";
    refresh();
    assert(days[0].events.every(event => event.dataset.state === "on"));
    now = "2026-02-15T05:00:00Z";
    refresh();
    assert(days[0].events.every(event => event.dataset.state === "on"));
    assert.equal(days[0].events[0].status.textContent, "Scheduled time reached");
    assert.equal(days[1].events[0].dataset.state, "off");
    now = "2026-02-15T12:00:00Z";
    refresh();
    assert.equal(days[0].status.textContent, "Off");
    assert.equal(days[1].status.textContent, "On");
    assert.equal(days[1].events[0].dataset.state, "on");
    assert(days[0].events.every(event => event.dataset.state === "on"));
    now = "2026-02-16T05:00:00Z";
    refresh();
    assert(days.every(day => day.status.textContent === "Off"));
    assert(days.every(day => day.events.every(event => event.dataset.state === "off")));
});
