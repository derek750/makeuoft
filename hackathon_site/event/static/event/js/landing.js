// Change navbar color on scroll
$(document).scroll(function () {
    let $nav = $(".navbar");
    $nav.toggleClass("scrolled", $(this).scrollTop() > $nav.height());
});

// Pick a readable font colour (dark or light) for a given hex background, so the
// text colour is always derived from the section's actual background. This
// replaces a hard-coded per-index colour list, which silently desynced whenever
// a section was added/removed/reordered (e.g. leaving white text on a white panel).
function contrastFontColor(hex) {
    let c = (hex || "").replace("#", "");
    if (c.length === 3) {
        c = c.replace(/(.)/g, "$1$1"); // expand shorthand e.g. "fff" -> "ffffff"
    }
    if (c.length !== 6) {
        return "#333";
    }
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    // Perceived luminance (ITU-R BT.601); bright backgrounds get dark text.
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 150 ? "#333" : "#FFF";
}

// Background color changing
$(window)
    .scroll(function () {
        let $window = $(window),
            $wrapper = $(".wrapper"),
            $colorScrollPanel = $(".colorScroll");

        // Change 40% earlier than scroll position so colour is there when you arrive.
        let scroll = $window.scrollTop() + $window.height() * 0.4;
        if ($window.scrollTop() < 300) {
            $wrapper.css("background-color", "#fff");
        }
        $colorScrollPanel.each(function () {
            let $this = $(this);

            if (
                $this.position().top <= scroll &&
                $this.position().top + $this.height() > scroll
            ) {
                let bg = $this.attr("data-background-color");
                $wrapper.css("background-color", bg);
                $colorScrollPanel.css("color", contrastFontColor(bg));
            }
        });
    })
    .scroll();

$(document).ready(function () {
    // Materialize stuff
    $(".carousel").carousel({ dist: 0, padding: 600 });
    setInterval(function () {
        $(".carousel").carousel("next");
    }, 3000);

    $(".scrollspy").scrollSpy();
    $(".collapsible").collapsible({ accordion: false });

    // Countdown stuff

    const now = new Date();
    let countDownDate;

    // Set the title based off what it's counting down to
    if (registrationOpenDate >= now) {
        countDownDate = registrationOpenDate;
        $("#countdownTitle").html("Registration Opens In");
    } else if (registrationCloseDate >= now) {
        countDownDate = registrationCloseDate;
        $("#countdownTitle").html("Registration Closes In");
    } else if (eventStartDate >= now) {
        countDownDate = eventStartDate;
        $("#countdownTitle").html("Event Starts In");
    }

    // Delete the entire countdown if event start date has passed
    if (eventStartDate < now) {
        $("#countdown").remove();
        $("#aboutText").removeClass("l7");
    } else {
        // Update the countdown every ten minute
        setInterval(setCounter(countDownDate), 600000);
    }
});

function setCounter(countDownDate) {
    const now = new Date();
    const distance = countDownDate - now;
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(distance / (1000 * 60 * 60));

    console.log("days, hours", days, hours);

    if (hours < 1) {
        console.log("less than 1 hour");
        const minutes = Math.floor(distance / (1000 * 60));
        // Change to show minutes on the website
        $("#day1").parent().remove();
        $("#day2").html(Math.floor(minutes / 10));
        $("#day3").html(minutes % 10);
        $("#countdownUnit").html(minutes === 1 ? "Minute" : "Minutes");
        return;
    }

    if (days < 2) {
        console.log("less than 2 days");
        // Change to show hours on the website
        $("#day1").parent().remove();
        $("#day2").html(Math.floor(hours / 10));
        $("#day3").html(hours % 10);
        $("#countdownUnit").html(hours === 1 ? "Hour" : "Hours");
        return;
    }

    // Check if we need a third digit or not
    if (days > 99) {
        $("#day1").html(Math.floor(days / 100));
    } else {
        $("#day1").parent().remove();
    }

    $("#day2").html(Math.floor(days / 10) % 10);
    $("#day3").html(days % 10);
}

// Native sticky positioning keeps entry/exit continuous. Scroll distance controls
// the lights in both directions without cancelling input or moving the page.
function initStatsScroll() {
    const board = document.querySelector(".hackathonStats-board");
    if (!board) return;
    const section = board.closest(".hackathonStats");
    const content = section.querySelector(".section");
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
    let frame = null;
    let travel = 0;
    let pinTop = 0;
    let paddingTop = 0;

    const clamp = (value) => Math.max(0, Math.min(1, value));

    function paint() {
        frame = null;
        if (reducedMotion.matches) return;
        const distance = pinTop - section.getBoundingClientRect().top - paddingTop;
        // The lighting sequence ends before the extra reading space begins.
        const progress = clamp((distance / travel - 0.08) / 0.84);
        const brightnesses = digits.map((digit, index) => {
            const amount = clamp(progress * digits.length - index);
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

    function schedulePaint() {
        if (frame === null) frame = window.requestAnimationFrame(paint);
    }

    function measure() {
        const enabled = !reducedMotion.matches;
        section.classList.toggle("is-scroll-pinned", enabled);
        board.classList.toggle("is-scroll-lit", enabled);
        if (!enabled) {
            pins.forEach(({ element }) => element.style.removeProperty("--pin-power"));
            digits.forEach((digit) => {
                digit.style.removeProperty("--stat-segment-color");
                digit.style.removeProperty("--stat-segment-glow");
            });
            return;
        }
        travel = Math.max(720, window.innerHeight * 1.15);
        pinTop = Math.max(88, (window.innerHeight - content.offsetHeight) / 2);
        paddingTop = parseFloat(window.getComputedStyle(section).paddingTop) || 0;
        section.style.setProperty(
            "--stats-content-height",
            `${content.offsetHeight}px`
        );
        // Extend the pinned section without slowing the lighting sequence.
        // Keep the fully lit stats centered for another ~two-thirds of a screen.
        const readingSpace = Math.max(420, window.innerHeight * 0.65);
        section.style.setProperty("--stats-travel", `${travel + readingSpace}px`);
        section.style.setProperty("--stats-pin-top", `${pinTop}px`);
        schedulePaint();
    }

    window.addEventListener("scroll", schedulePaint, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("pageshow", measure);
    reducedMotion.addEventListener("change", measure);
    if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(measure).observe(content);
    }
    measure();
}

$(document).ready(initStatsScroll);
