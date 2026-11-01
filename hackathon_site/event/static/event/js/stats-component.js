// Keep the original scroll-driven lighting sequence while the compact stats
// section stays at one page position in either direction.
function initStatsScroll() {
    const board = document.querySelector(".hackathonStats-board");
    if (!board) return;
    const section = board.closest(".hackathonStats");
    const digits = Array.from(board.querySelectorAll(".hackathonStats-digit"));
    const pins = Array.from(board.querySelectorAll(".hackathonStats-pin")).map(
        (pin) => {
            const boxDigits = pin
                .closest(".hackathonStats-stat")
                .querySelectorAll(".hackathonStats-digit");
            const isRight =
                pin.classList.contains("hackathonStats-pin--topRight") ||
                pin.classList.contains("hackathonStats-pin--bottomRight");
            return {
                element: pin,
                digitIndex: digits.indexOf(
                    boxDigits[isRight ? boxDigits.length - 1 : 0]
                ),
            };
        }
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let travel = 0;
    let distance = 0;
    let enabled = false;
    let locked = false;
    let lastY = window.scrollY;
    let touchY = null;

    const clamp = (value) => Math.max(0, Math.min(1, value));

    function paint() {
        if (!enabled) return;
        const lightProgress = clamp((distance / travel - 0.08) / 0.84);
        const brightnesses = digits.map((digit, index) => {
            const amount = clamp(lightProgress * digits.length - index);
            return amount * amount * (3 - 2 * amount);
        });
        digits.forEach((digit, index) => {
            const brightness = brightnesses[index];
            const channel = Math.round(240 * (1 - brightness));
            digit.style.setProperty(
                "--stat-segment-color",
                `rgb(${channel}, ${channel}, ${channel})`
            );
            digit.style.setProperty(
                "--stat-segment-glow",
                `0 0 5px rgba(245, 166, 35, ${brightness * 0.35})`
            );
        });
        pins.forEach(({ element, digitIndex }) => {
            element.style.setProperty("--pin-power", brightnesses[digitIndex]);
        });
    }

    function measure() {
        // Short viewports must still be able to scroll through the whole board.
        enabled =
            !reducedMotion.matches && section.offsetHeight <= window.innerHeight + 2;
        board.classList.toggle("is-scroll-lit", enabled);
        if (!enabled) {
            locked = false;
            pins.forEach(({ element }) => element.style.removeProperty("--pin-power"));
            digits.forEach((digit) => {
                digit.style.removeProperty("--stat-segment-color");
                digit.style.removeProperty("--stat-segment-glow");
            });
            return;
        }
        travel = Math.max(720, window.innerHeight * 1.15);
        paint();
    }

    function lockPosition() {
        // Center the compact, naturally sized section before taking scroll input.
        return (
            section.getBoundingClientRect().top +
            window.scrollY -
            Math.max(0, (window.innerHeight - section.offsetHeight) / 2)
        );
    }

    function holdPosition(anchor) {
        lastY = anchor;
        if (Math.abs(window.scrollY - anchor) > 0.5) {
            window.scrollTo({ top: anchor, behavior: "instant" });
        }
    }

    function consumeScroll(event, delta) {
        if (!enabled || !delta) return;
        const anchor = lockPosition();
        const current = window.scrollY;
        if (!locked) {
            if (delta > 0 && current <= anchor + 1 && current + delta >= anchor) {
                distance = 0;
                delta -= Math.max(0, anchor - current);
            } else if (
                delta < 0 &&
                current >= anchor - 1 &&
                current + delta <= anchor
            ) {
                distance = travel;
                delta += Math.max(0, current - anchor);
            } else {
                return;
            }
            locked = true;
        } else if (
            (distance === travel && delta > 0) ||
            (distance === 0 && delta < 0)
        ) {
            locked = false;
            return;
        }

        // scroll guard still restores Y while their deltas reverse the lights.
        if (event.cancelable) event.preventDefault();
        distance = Math.max(0, Math.min(travel, distance + delta));
        holdPosition(anchor);
        paint();
    }

    function guardScroll() {
        if (!enabled) {
            lastY = window.scrollY;
            return;
        }
        const anchor = lockPosition();
        const current = window.scrollY;
        if (locked) {
            holdPosition(anchor);
        } else if (lastY < anchor - 1 && current >= anchor) {
            // Covers scrolling initiated inside an iframe or by browser momentum.
            locked = true;
            distance = 0;
            holdPosition(anchor);
            paint();
        } else if (lastY > anchor + 1 && current <= anchor) {
            locked = true;
            distance = travel;
            holdPosition(anchor);
            paint();
        } else {
            lastY = current;
        }
    }

    window.addEventListener(
        "wheel",
        (event) => {
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
            const unit =
                event.deltaMode === 1
                    ? 16
                    : event.deltaMode === 2
                    ? window.innerHeight
                    : 1;
            consumeScroll(event, event.deltaY * unit);
        },
        { passive: false }
    );
    window.addEventListener("keydown", (event) => {
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey)
            return;
        if (event.target.closest("input, textarea, select, [contenteditable]")) return;
        const step = window.innerHeight * 0.85;
        const deltas = {
            ArrowDown: 40,
            ArrowUp: -40,
            PageDown: step,
            PageUp: -step,
            " ": event.shiftKey ? -step : step,
        };
        consumeScroll(event, deltas[event.key]);
    });
    window.addEventListener(
        "touchstart",
        (event) => {
            touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
        },
        { passive: true }
    );
    window.addEventListener(
        "touchmove",
        (event) => {
            if (touchY === null || event.touches.length !== 1) return;
            const nextY = event.touches[0].clientY;
            const delta = touchY - nextY;
            touchY = nextY;
            consumeScroll(event, delta);
        },
        { passive: false }
    );
    window.addEventListener("touchend", () => {
        touchY = null;
    });
    window.addEventListener("scroll", guardScroll, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("pageshow", measure);
    reducedMotion.addEventListener("change", measure);
    if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(measure).observe(section.querySelector(".section"));
    }
    measure();

    // Direct links to the heading should show the centered board at its start.
    function alignStatsLink() {
        if (window.location.hash !== "#hackathon-stats-title") return;
        distance = 0;
        locked = true;
        holdPosition(lockPosition());
        paint();
    }
    window.addEventListener("hashchange", alignStatsLink);
    window.addEventListener("pageshow", alignStatsLink);
    alignStatsLink();
}

$(document).ready(initStatsScroll);
