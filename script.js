
// ==========================================
// AWACH FOUNDATION - INTERACTIVE WEBSITE
// ==========================================


// 1. MOBILE NAVIGATION
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("active");

        const isOpen = navLinks.classList.contains("active");

        menuBtn.setAttribute("aria-expanded", isOpen);
        menuBtn.textContent = isOpen ? "✕" : "☰";
    });

    // Close menu after selecting a link
    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("active");
            menuBtn.setAttribute("aria-expanded", "false");
            menuBtn.textContent = "☰";
        });
    });
}


// 2. AUTOMATIC COPYRIGHT YEAR
const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}


// 3. SCROLL REVEAL ANIMATIONS
const revealElements = document.querySelectorAll(
    ".section, .program-card, .news-card, .purpose-card, " +
    ".vm-card, .value-card, .objective-item, .approach-grid > *"
);

revealElements.forEach(element => {
    element.classList.add("reveal");
});

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });
} else {
    revealElements.forEach(element => {
        element.classList.add("visible");
    });
}


// 4. HEADER STYLE ON SCROLL
const header = document.querySelector(".site-header");

function updateHeader() {
    if (header) {
        header.classList.toggle("scrolled", window.scrollY > 40);
    }
}

window.addEventListener("scroll", updateHeader);
updateHeader();


// 5. HIGHLIGHT THE CURRENT PAGE IN NAVIGATION
const currentPage = window.location.pathname.split("/").pop() || "index.html";

document.querySelectorAll(".nav-links a").forEach(link => {
    const linkPage = link.getAttribute("href").split("/").pop();

    if (linkPage === currentPage) {
        link.classList.add("active-page");
        link.setAttribute("aria-current", "page");
    }
});


// 6. BACK TO TOP BUTTON
const backToTop = document.createElement("button");

backToTop.className = "back-to-top";
backToTop.type = "button";
backToTop.setAttribute("aria-label", "Back to top");
backToTop.innerHTML = "↑";

document.body.appendChild(backToTop);

window.addEventListener("scroll", () => {
    backToTop.classList.toggle("show", window.scrollY > 400);
});

backToTop.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


// 7. SMOOTH SCROLL FOR SAME-PAGE LINKS
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
        const target = document.querySelector(link.getAttribute("href"));

        if (target) {
            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});


// 8. BUTTON CLICK FEEDBACK
document.querySelectorAll(".btn").forEach(button => {
    button.addEventListener("click", () => {
        button.classList.add("button-clicked");

        setTimeout(() => {
            button.classList.remove("button-clicked");
        }, 250);
    });
});

console.log("Awach Foundation website is ready!");


/* ==========================================
   AWACH FOUNDATION
   Interactive Website Experience
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // --------------------------------------
    // 1. MOBILE NAVIGATION
    // --------------------------------------

    const menuBtn = document.getElementById("menuBtn");
    const navLinks = document.getElementById("navLinks");

    if (menuBtn && navLinks) {

        menuBtn.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("active");

            menuBtn.classList.toggle("menu-open", isOpen);
            menuBtn.setAttribute("aria-expanded", isOpen);
            menuBtn.textContent = isOpen ? "✕" : "☰";
        });

        // Close menu when a navigation link is selected
        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("active");
                menuBtn.classList.remove("menu-open");
                menuBtn.setAttribute("aria-expanded", "false");
                menuBtn.textContent = "☰";
            });
        });

        // Close menu when clicking outside it
        document.addEventListener("click", event => {
            if (
                navLinks.classList.contains("active") &&
                !navLinks.contains(event.target) &&
                !menuBtn.contains(event.target)
            ) {
                navLinks.classList.remove("active");
                menuBtn.classList.remove("menu-open");
                menuBtn.setAttribute("aria-expanded", "false");
                menuBtn.textContent = "☰";
            }
        });
    }


    // --------------------------------------
    // 2. SMART HEADER ON SCROLL
    // --------------------------------------

    const header = document.querySelector("header");

    function updateHeader() {
        if (header) {
            header.classList.toggle("scrolled", window.scrollY > 40);
        }
    }

    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();


    // --------------------------------------
    // 3. SCROLL PROGRESS INDICATOR
    // --------------------------------------

    const progressBar = document.createElement("div");
    progressBar.className = "scroll-progress";
    document.body.appendChild(progressBar);

    function updateProgress() {
        const scrollableHeight =
            document.documentElement.scrollHeight - window.innerHeight;

        const progress = scrollableHeight > 0
            ? (window.scrollY / scrollableHeight) * 100
            : 0;

        progressBar.style.width = `${progress}%`;
    }

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();


    // --------------------------------------
    // 4. REVEAL ELEMENTS AS YOU SCROLL
    // --------------------------------------

    const revealElements = document.querySelectorAll(`
        section h2,
        .section-title,
        .about-intro,
        .purpose-card,
        .vm-card,
        .value-card,
        .objective-item,
        .approach-grid > *,
        .program-card,
        .news-card,
        .project-card,
        .featured-project,
        .cta-content
    `);

    revealElements.forEach((element, index) => {
        element.classList.add("reveal");

        // Small stagger between nearby elements
        element.style.transitionDelay = `${(index % 4) * 100}ms`;
    });

    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: "0px 0px -35px 0px"
        });

        revealElements.forEach(element => {
            revealObserver.observe(element);
        });
    } else {
        revealElements.forEach(element => {
            element.classList.add("visible");
        });
    }


    // --------------------------------------
    // 5. SMOOTH SCROLL FOR SECTION LINKS
    // --------------------------------------

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", event => {
            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") return;

            const target = document.querySelector(targetId);

            if (target) {
                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });


    // --------------------------------------
    // 6. BACK TO TOP BUTTON
    // --------------------------------------

    const topButton = document.createElement("button");
    topButton.className = "back-to-top";
    topButton.type = "button";
    topButton.innerHTML = "↑";
    topButton.setAttribute("aria-label", "Back to top");
    document.body.appendChild(topButton);

    window.addEventListener("scroll", () => {
        topButton.classList.toggle("show", window.scrollY > 450);
    }, { passive: true });

    topButton.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });


    // --------------------------------------
    // 7. ANIMATED NUMBER COUNTERS
    // --------------------------------------

    const counters = document.querySelectorAll("[data-count]");

    function animateCounter(counter) {
        const target = Number(counter.dataset.count);

        if (!Number.isFinite(target)) return;

        const duration = 1800;
        const startTime = performance.now();

        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Smooth ease-out effect
            const easedProgress = 1 - Math.pow(1 - progress, 3);

            counter.textContent = Math.floor(target * easedProgress)
                .toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                counter.textContent = target.toLocaleString();
            }
        }

        requestAnimationFrame(updateNumber);
    }

    if ("IntersectionObserver" in window) {
        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }


    // --------------------------------------
    // 8. AUTOMATIC COPYRIGHT YEAR
    // --------------------------------------

    const yearElement = document.getElementById("year");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }


    // --------------------------------------
    // 9. CURRENT PAGE NAVIGATION HIGHLIGHT
    // --------------------------------------

    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".nav-links a").forEach(link => {
        const linkPage = link.getAttribute("href")?.split("/").pop();

        if (linkPage === currentPage) {
            link.classList.add("current-page");
        }
    });

});

// ==========================================
// GALLERY FILTERS
// ==========================================

const galleryFilters = document.querySelectorAll(".gallery-filter");
const galleryItems = document.querySelectorAll(".gallery-item");

galleryFilters.forEach(button => {
    button.addEventListener("click", () => {
        const selectedCategory = button.dataset.filter;

        galleryFilters.forEach(filter => {
            filter.classList.remove("active");
        });

        button.classList.add("active");

        galleryItems.forEach(item => {
            const matches =
                selectedCategory === "all" ||
                item.dataset.category === selectedCategory;

            item.classList.toggle("hidden", !matches);
        });
    });
});


// ==========================================
// GALLERY PHOTO VIEWER
// ==========================================

const galleryLightbox = document.getElementById("galleryLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");

function closeGalleryLightbox() {
    if (!galleryLightbox) return;

    galleryLightbox.classList.remove("open");
    galleryLightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

galleryItems.forEach(item => {
    item.addEventListener("click", () => {
        const image = item.querySelector("img");

        if (!image || !image.complete || image.naturalWidth === 0) {
            return;
        }

        if (galleryLightbox && lightboxImage && lightboxCaption) {
            lightboxImage.src = image.src;
            lightboxCaption.textContent =
                item.querySelector("h3")?.textContent || image.alt;

            galleryLightbox.classList.add("open");
            galleryLightbox.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
        }
    });
});

if (lightboxClose) {
    lightboxClose.addEventListener("click", closeGalleryLightbox);
}

if (galleryLightbox) {
    galleryLightbox.addEventListener("click", event => {
        if (event.target === galleryLightbox) {
            closeGalleryLightbox();
        }
    });
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeGalleryLightbox();
    }
});


// ==========================================
// RESOURCE LIBRARY SEARCH
// ==========================================

const resourceSearch = document.getElementById("resourceSearch");
const resourceItems = document.querySelectorAll(".resource-item");
const noResources = document.getElementById("noResources");

if (resourceSearch) {
    resourceSearch.addEventListener("input", () => {
        const searchTerm = resourceSearch.value
            .toLowerCase()
            .trim();

        let visibleCount = 0;

        resourceItems.forEach(item => {
            const searchableText = (
                item.textContent + " " +
                item.dataset.search
            ).toLowerCase();

            const matches = searchableText.includes(searchTerm);

            item.hidden = !matches;

            if (matches) visibleCount++;
        });

        if (noResources) {
            noResources.hidden = visibleCount !== 0;
        }
    });
}


// ==========================================
// CONTACT FORM - EMAIL PREPARATION
// ==========================================

const contactForm = document.getElementById("contactForm");

if (contactForm) {
    contactForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const subject = document.getElementById("subject").value;
        const message = document.getElementById("message").value.trim();
        const feedback = document.getElementById("formFeedback");

        if (!fullName || !email || !subject || !message) {
            feedback.textContent = "Please complete all required fields.";
            return;
        }

        // Replace this with the Foundation's official email address.
        const foundationEmail = "ADD-OFFICIAL-EMAIL-HERE";

        if (foundationEmail === "ADD-OFFICIAL-EMAIL-HERE") {
            feedback.textContent =
                "The form is ready, but the Foundation's official email address must be configured before messages can be sent.";
            return;
        }

        const emailSubject = encodeURIComponent(subject);
        const emailBody = encodeURIComponent(
            "Name: " + fullName + "\n" +
            "Email: " + email + "\n\n" +
            "Message:\n" + message
        );

        window.location.href =
            `mailto:${foundationEmail}?subject=${emailSubject}&body=${emailBody}`;
    });
}

// ==========================================
// DARK MODE / LIGHT MODE
// ==========================================

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

// Restore the visitor's saved preference
const savedTheme = localStorage.getItem("awach-theme");

// Use the saved preference, or follow the device setting
const preferredTheme = savedTheme ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

document.documentElement.setAttribute("data-theme", preferredTheme);

// Update the toggle icon
function updateThemeIcon(theme) {
    if (!themeIcon || !themeToggle) return;

    if (theme === "dark") {
        themeIcon.textContent = "☀️";
        themeToggle.setAttribute("aria-label", "Switch to light mode");
        themeToggle.setAttribute("title", "Switch to light mode");
    } else {
        themeIcon.textContent = "🌙";
        themeToggle.setAttribute("aria-label", "Switch to dark mode");
        themeToggle.setAttribute("title", "Switch to dark mode");
    }
}

updateThemeIcon(preferredTheme);

// Switch themes when clicked
if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const currentTheme =
            document.documentElement.getAttribute("data-theme");

        const newTheme = currentTheme === "dark" ? "light" : "dark";

        document.documentElement.setAttribute("data-theme", newTheme);

        localStorage.setItem("awach-theme", newTheme);

        updateThemeIcon(newTheme);
    });
}
