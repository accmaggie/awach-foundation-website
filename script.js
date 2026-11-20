/**
 * ==========================================================================
 * AWACH FOUNDATION - CORE INTERACTIVE ENGINE
 * Unified modern JavaScript for Header, Footer & Interactive Features
 * ==========================================================================
 */

(function () {
    "use strict";

    // --------------------------------------------------------------------------
    // 1. TOAST NOTIFICATION SYSTEM
    // --------------------------------------------------------------------------
    let toastContainer = null;

    function getToastContainer() {
        if (!toastContainer) {
            toastContainer = document.getElementById("toastContainer");
            if (!toastContainer) {
                toastContainer = document.createElement("div");
                toastContainer.id = "toastContainer";
                toastContainer.className = "toast-container";
                toastContainer.setAttribute("aria-live", "polite");
                toastContainer.setAttribute("aria-atomic", "true");
                document.body.appendChild(toastContainer);
            }
        }
        return toastContainer;
    }

    function showToast(message, type = "info", duration = 3600) {
        const container = getToastContainer();
        const toast = document.createElement("div");
        toast.className = `toast-message toast-${type}`;
        toast.setAttribute("role", "status");

        const icons = {
            success: "✓",
            info: "ℹ",
            warning: "⚠",
            error: "✕"
        };
        const icon = icons[type] || "ℹ";

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-text">${message}</span>
            <button type="button" class="toast-close" aria-label="Dismiss notification">✕</button>
        `;

        const closeBtn = toast.querySelector(".toast-close");
        const removeToast = () => {
            toast.classList.remove("show");
            toast.addEventListener("transitionend", () => {
                if (toast.parentElement) toast.parentElement.removeChild(toast);
            }, { once: true });
        };

        if (closeBtn) closeBtn.addEventListener("click", removeToast);

        container.appendChild(toast);
        // Force reflow for CSS transition
        void toast.offsetWidth;
        toast.classList.add("show");

        setTimeout(removeToast, duration);
    }

    window.showToast = showToast;

    // --------------------------------------------------------------------------
    // 2. THEME CONTROLLER (DARK / LIGHT MODE)
    // --------------------------------------------------------------------------
    function initTheme() {
        const savedTheme = localStorage.getItem("awach-theme");
        const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        const currentTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

        applyTheme(currentTheme, false);

        document.addEventListener("click", function (event) {
            const toggle = event.target.closest("#themeToggle, .theme-toggle");
            if (!toggle) return;

            const active = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
            applyTheme(active, true);
        });

        // Listen for OS scheme change if user hasn't chosen manually
        if (window.matchMedia) {
            window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
                if (!localStorage.getItem("awach-theme")) {
                    applyTheme(e.matches ? "dark" : "light", false);
                }
            });
        }
    }

    function applyTheme(theme, save = true) {
        document.documentElement.setAttribute("data-theme", theme);
        if (save) {
            localStorage.setItem("awach-theme", theme);
            showToast(theme === "dark" ? "Dark mode enabled" : "Light mode enabled", "info", 2000);
        }

        const isDark = theme === "dark";
        const icons = document.querySelectorAll("#themeIcon, .theme-icon");
        icons.forEach(icon => {
            icon.textContent = isDark ? "☀️" : "🌙";
        });

        const toggles = document.querySelectorAll("#themeToggle, .theme-toggle");
        toggles.forEach(btn => {
            const label = isDark ? "Switch to light mode" : "Switch to dark mode";
            btn.setAttribute("aria-label", label);
            btn.setAttribute("title", label);
        });
    }

    // --------------------------------------------------------------------------
    // 3. HEADER & MOBILE NAVIGATION
    // --------------------------------------------------------------------------
    function initHeader() {
        const header = document.querySelector(".site-header") || document.querySelector("header");
        const progressBar = document.getElementById("scrollProgressLine");

        function onScroll() {
            const scrollY = window.scrollY || window.pageYOffset;
            if (header) {
                header.classList.toggle("scrolled", scrollY > 20);
            }

            if (progressBar) {
                const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                const progress = totalHeight > 0 ? (scrollY / totalHeight) * 100 : 0;
                progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
            }
        }

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
    }

    function initMobileNav() {
        const menuBtn = document.getElementById("menuBtn");
        const navLinks = document.getElementById("navLinks");
        if (!menuBtn || !navLinks) return;

        // Create overlay if not present
        let overlay = document.querySelector(".mobile-nav-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.className = "mobile-nav-overlay";
            overlay.setAttribute("aria-hidden", "true");
            document.body.appendChild(overlay);
        }

        function toggleMenu(forceClose = false) {
            const isOpen = forceClose ? false : !navLinks.classList.contains("active");
            navLinks.classList.toggle("active", isOpen);
            menuBtn.classList.toggle("menu-open", isOpen);
            menuBtn.setAttribute("aria-expanded", String(isOpen));
            overlay.classList.toggle("active", isOpen);
            document.body.classList.toggle("mobile-menu-open", isOpen);

            const iconSpan = menuBtn.querySelector(".menu-icon-bars") || menuBtn;
            if (iconSpan) {
                iconSpan.textContent = isOpen ? "✕" : "☰";
            }
        }

        menuBtn.addEventListener("click", () => toggleMenu());
        overlay.addEventListener("click", () => toggleMenu(true));

        // Close on link click
        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => toggleMenu(true));
        });

        // Close on Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && navLinks.classList.contains("active")) {
                toggleMenu(true);
            }
        });
    }

    // --------------------------------------------------------------------------
    // 4. ACTIVE NAVIGATION LINK HIGHLIGHTER
    // --------------------------------------------------------------------------
    function initActiveNav() {
        const currentPath = window.location.pathname;
        const pageName = currentPath.substring(currentPath.lastIndexOf("/") + 1) || "index.html";

        const navLinks = document.querySelectorAll(".nav-links a, .nav-item");
        navLinks.forEach(link => {
            const href = link.getAttribute("href");
            if (!href) return;
            const linkPage = href.substring(href.lastIndexOf("/") + 1) || "index.html";

            if (linkPage === pageName || (pageName === "" && linkPage === "index.html")) {
                link.classList.add("active");
                link.classList.add("active-page");
                link.classList.add("current-page");
                link.setAttribute("aria-current", "page");
            } else {
                link.classList.remove("active");
                link.classList.remove("active-page");
                link.classList.remove("current-page");
                link.removeAttribute("aria-current");
            }
        });
    }

    // --------------------------------------------------------------------------
    // 5. GLOBAL SEARCH ENGINE & MODAL
    // --------------------------------------------------------------------------
    const searchDatabase = [
        {
            title: "Awach Foundation Home",
            category: "Page",
            badge: "Overview",
            summary: "Empowering people and transforming communities through youth and community development.",
            url: "index.html",
            keywords: "home welcome about foundation vision community empowerment"
        },
        {
            title: "About Us",
            category: "About",
            badge: "Organization",
            summary: "Learn about our guiding purpose, vision, mission, and foundational principles.",
            url: "pages/about.html",
            keywords: "about us purpose vision mission values guiding principles history team"
        },
        {
            title: "Our Programs",
            category: "Programs",
            badge: "Focus Areas",
            summary: "Comprehensive community focus areas supporting youth, learning, and social progress.",
            url: "pages/programs.html",
            keywords: "programs youth development education learning community initiatives"
        },
        {
            title: "Youth Development Program",
            category: "Programs",
            badge: "Youth",
            summary: "Empowering young people to develop skills, self-confidence, leadership, and positive mindset.",
            url: "pages/programs.html",
            keywords: "youth mentorship sports leadership coaching young people skills"
        },
        {
            title: "Education & Learning Initiatives",
            category: "Programs",
            badge: "Education",
            summary: "Supporting educational opportunities, digital skills, workshops, and student assistance.",
            url: "pages/programs.html",
            keywords: "education schooling training learning workshops books literacy"
        },
        {
            title: "Community Wellbeing & Social Impact",
            category: "Programs",
            badge: "Community",
            summary: "Promoting cooperation, social inclusion, and active neighborhood engagement.",
            url: "pages/programs.html",
            keywords: "community social empowerment inclusion wellbeing cooperation development"
        },
        {
            title: "Awach Youth Football Project",
            category: "Projects",
            badge: "Sports",
            summary: "Using sports and football to build teamwork, discipline, physical health, and community pride.",
            url: "pages/projects.html",
            keywords: "football soccer youth sports tournament athletics recreation team awach sacco"
        },
        {
            title: "Foundation Projects & Initiatives",
            category: "Projects",
            badge: "Showcase",
            summary: "Discover active community initiatives and sustainable project activities.",
            url: "pages/projects.html",
            keywords: "projects action showcase grassroots local impact ethiopia"
        },
        {
            title: "News, Updates & Events",
            category: "News",
            badge: "Latest",
            summary: "Stay up to date with foundation announcements, activities, stories, and press releases.",
            url: "pages/news.html",
            keywords: "news events updates announcements stories activities press"
        },
        {
            title: "Photo & Activity Gallery",
            category: "Gallery",
            badge: "Media",
            summary: "Explore verified moments and authentic photos from Awach community initiatives.",
            url: "pages/gallery.html",
            keywords: "gallery photos images pictures moments events projects community"
        },
        {
            title: "Resources & Publication Center",
            category: "Resources",
            badge: "Knowledge",
            summary: "Access foundation reports, guides, community resources, and download center.",
            url: "pages/resources.html",
            keywords: "resources reports documents downloads pdf publications guidelines research"
        },
        {
            title: "Get Involved & Volunteering",
            category: "Get Involved",
            badge: "Action",
            summary: "Partner with us, volunteer your skills, or collaborate to strengthen our communities.",
            url: "pages/get-involved.html",
            keywords: "get involved volunteer collaborate partner donate support join contribution"
        },
        {
            title: "Contact Awach Foundation",
            category: "Contact",
            badge: "Support",
            summary: "Get in touch with our office in Addis Ababa, send an inquiry, or visit our location.",
            url: "pages/contact.html",
            keywords: "contact address email phone location office map inquiries hours addis ababa"
        }
    ];

    function initGlobalSearch() {
        const searchBtn = document.getElementById("searchBtn");
        let searchModal = document.getElementById("searchModal");

        // Helper to normalize URLs based on whether current page is in /pages/ or root
        const isInnerPage = window.location.pathname.includes("/pages/");
        function resolveSearchUrl(rawUrl) {
            if (isInnerPage) {
                return rawUrl.startsWith("pages/") ? rawUrl.replace("pages/", "") : `../${rawUrl}`;
            } else {
                return rawUrl;
            }
        }

        function openSearch() {
            if (!searchModal) return;
            searchModal.classList.add("active");
            searchModal.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
            const input = document.getElementById("globalSearchInput");
            if (input) {
                input.value = "";
                setTimeout(() => input.focus(), 100);
            }
            renderSearchResults("");
        }

        function closeSearch() {
            if (!searchModal) return;
            searchModal.classList.remove("active");
            searchModal.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
        }

        if (searchBtn) {
            searchBtn.addEventListener("click", openSearch);
        }

        // Global Keyboard Shortcut: Ctrl+K or Cmd+K or / (when not focused on input)
        document.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                openSearch();
            } else if (e.key === "Escape" && searchModal && searchModal.classList.contains("active")) {
                closeSearch();
            } else if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
                e.preventDefault();
                openSearch();
            }
        });

        if (searchModal) {
            const closeBtn = document.getElementById("searchCloseBtn");
            const backdrop = document.getElementById("searchBackdrop");
            const clearBtn = document.getElementById("searchClearBtn");
            const searchInput = document.getElementById("globalSearchInput");

            if (closeBtn) closeBtn.addEventListener("click", closeSearch);
            if (backdrop) backdrop.addEventListener("click", closeSearch);

            if (clearBtn && searchInput) {
                clearBtn.addEventListener("click", () => {
                    searchInput.value = "";
                    searchInput.focus();
                    renderSearchResults("");
                });
            }

            if (searchInput) {
                searchInput.addEventListener("input", (e) => {
                    renderSearchResults(e.target.value.trim());
                });
            }

            // Quick search tags
            searchModal.querySelectorAll(".quick-tag").forEach(tag => {
                tag.addEventListener("click", () => {
                    const term = tag.getAttribute("data-tag") || tag.textContent.trim();
                    if (searchInput) {
                        searchInput.value = term;
                        searchInput.focus();
                    }
                    renderSearchResults(term);
                });
            });
        }

        function renderSearchResults(query) {
            const resultsContainer = document.getElementById("searchResults");
            if (!resultsContainer) return;

            const q = query.toLowerCase();

            if (!q) {
                resultsContainer.innerHTML = `
                    <div class="search-initial-state">
                        <p>Type keywords to search programs, initiatives, articles, and pages.</p>
                        <small>Use shortcuts: <kbd>Ctrl + K</kbd> to search anywhere • <kbd>ESC</kbd> to close</small>
                    </div>
                `;
                return;
            }

            const matches = searchDatabase.filter(item => {
                const haystack = `${item.title} ${item.category} ${item.summary} ${item.keywords}`.toLowerCase();
                return haystack.includes(q);
            });

            if (matches.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="search-empty-state">
                        <span class="empty-icon">🔍</span>
                        <h3>No results found for "${escapeHtml(query)}"</h3>
                        <p>Try searching for broader terms such as <strong>Youth</strong>, <strong>Education</strong>, <strong>Projects</strong>, or <strong>Volunteer</strong>.</p>
                    </div>
                `;
                return;
            }

            const html = matches.map(item => {
                const targetUrl = resolveSearchUrl(item.url);
                return `
                    <a href="${targetUrl}" class="search-result-item">
                        <div class="search-result-header">
                            <span class="search-result-category">${escapeHtml(item.category)}</span>
                            <span class="search-result-badge">${escapeHtml(item.badge)}</span>
                        </div>
                        <h4 class="search-result-title">${highlightMatch(item.title, q)}</h4>
                        <p class="search-result-summary">${highlightMatch(item.summary, q)}</p>
                        <span class="search-result-link">Visit page →</span>
                    </a>
                `;
            }).join("");

            resultsContainer.innerHTML = `<div class="search-results-list">${html}</div>`;
        }

        function highlightMatch(text, query) {
            if (!query) return escapeHtml(text);
            const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
            return escapeHtml(text).replace(regex, "<mark>$1</mark>");
        }

        function escapeHtml(string) {
            const div = document.createElement("div");
            div.textContent = string;
            return div.innerHTML;
        }
    }

    // --------------------------------------------------------------------------
    // 6. NEWSLETTER SUBSCRIPTION ENGINE (Connected to Backend API)
    // --------------------------------------------------------------------------
    function initNewsletter() {
        const form = document.getElementById("newsletterForm");
        if (!form) return;

        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            const input = document.getElementById("newsletterEmail");
            const submitBtn = form.querySelector("button[type='submit']");
            const feedback = document.getElementById("newsletterFeedback");
            if (!input) return;

            const email = input.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!email || !emailRegex.test(email)) {
                if (feedback) {
                    feedback.textContent = "Please enter a valid email address.";
                    feedback.className = "newsletter-feedback error";
                }
                showToast("Please provide a valid email address.", "error");
                input.focus();
                return;
            }

            const originalBtnText = submitBtn ? submitBtn.textContent : "Subscribe";
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "...";
            }

            try {
                // Call Backend API
                const response = await fetch("/api/newsletter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    input.value = "";
                    if (feedback) {
                        feedback.textContent = data.message;
                        feedback.className = "newsletter-feedback success";
                    }
                    showToast(data.message, "success", 4500);

                    // Also cache locally
                    try {
                        let subs = JSON.parse(localStorage.getItem("awach_newsletter_subscribers") || "[]");
                        if (!subs.includes(email.toLowerCase())) {
                            subs.push(email.toLowerCase());
                            localStorage.setItem("awach_newsletter_subscribers", JSON.stringify(subs));
                        }
                    } catch (err) {}

                } else {
                    throw new Error(data.error || "Subscription failed");
                }

            } catch (err) {
                // Local fallback if offline
                let subscribers = [];
                try {
                    subscribers = JSON.parse(localStorage.getItem("awach_newsletter_subscribers") || "[]");
                } catch (e) {
                    subscribers = [];
                }

                if (subscribers.includes(email.toLowerCase())) {
                    if (feedback) {
                        feedback.textContent = "This email is already subscribed to our newsletter!";
                        feedback.className = "newsletter-feedback info";
                    }
                    showToast("You are already subscribed with this email.", "info");
                } else {
                    subscribers.push(email.toLowerCase());
                    localStorage.setItem("awach_newsletter_subscribers", JSON.stringify(subscribers));
                    input.value = "";
                    if (feedback) {
                        feedback.textContent = "Thank you! You have subscribed to Awach Foundation updates.";
                        feedback.className = "newsletter-feedback success";
                    }
                    showToast("Thank you for subscribing to Awach Foundation updates!", "success");
                }

            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
                setTimeout(() => {
                    if (feedback && feedback.classList.contains("success")) {
                        feedback.textContent = "";
                    }
                }, 7000);
            }
        });
    }

    // --------------------------------------------------------------------------
    // 7. CLICK-TO-COPY CONTACT DETAILS
    // --------------------------------------------------------------------------
    function initClickToCopy() {
        document.addEventListener("click", (e) => {
            const target = e.target.closest(".contact-copy-link, [data-copy]");
            if (!target) return;

            // If user clicks on tel: or mailto: links, let them copy or open
            const textToCopy = target.getAttribute("data-copy") || target.textContent.trim().replace(/^[^\w+]+/, "");
            if (!textToCopy) return;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showToast(`Copied "${textToCopy}" to clipboard!`, "success", 2400);
                }).catch(() => {
                    // Fallback
                });
            }
        });
    }

    // --------------------------------------------------------------------------
    // 8. BACK TO TOP BUTTON
    // --------------------------------------------------------------------------
    function initBackToTop() {
        let backToTop = document.getElementById("backToTop");
        if (!backToTop) {
            backToTop = document.createElement("button");
            backToTop.id = "backToTop";
            backToTop.className = "back-to-top";
            backToTop.type = "button";
            backToTop.setAttribute("aria-label", "Scroll back to top");
            backToTop.setAttribute("title", "Back to top");
            backToTop.innerHTML = '<span class="top-icon">↑</span>';
            document.body.appendChild(backToTop);
        }

        const scrollToTop = () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        };

        backToTop.addEventListener("click", scrollToTop);

        const footerTopBtn = document.getElementById("footerTopBtn");
        if (footerTopBtn) {
            footerTopBtn.addEventListener("click", (e) => {
                e.preventDefault();
                scrollToTop();
            });
        }

        window.addEventListener("scroll", () => {
            const scrollY = window.scrollY || window.pageYOffset;
            backToTop.classList.toggle("show", scrollY > 350);
        }, { passive: true });
    }

    // --------------------------------------------------------------------------
    // 9. SCROLL REVEAL ANIMATIONS
    // --------------------------------------------------------------------------
    function initScrollReveal() {
        const revealElements = document.querySelectorAll(`
            .section,
            .program-card,
            .news-card,
            .purpose-card,
            .vm-card,
            .value-card,
            .objective-item,
            .approach-grid > *,
            .project-card,
            .featured-project,
            .involvement-card,
            .gallery-item
        `);

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
                threshold: 0.1,
                rootMargin: "0px 0px -25px 0px"
            });

            revealElements.forEach(element => {
                revealObserver.observe(element);
            });
        } else {
            revealElements.forEach(element => {
                element.classList.add("visible");
            });
        }
    }

    // --------------------------------------------------------------------------
    // 10. ANIMATED NUMBER COUNTERS
    // --------------------------------------------------------------------------
    function initCounters() {
        const counters = document.querySelectorAll("[data-count]");
        if (!counters.length) return;

        function animateCounter(counter) {
            const target = Number(counter.dataset.count);
            if (!Number.isFinite(target)) return;

            const duration = 1600;
            const startTime = performance.now();

            function updateNumber(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = 1 - Math.pow(1 - progress, 3);

                counter.textContent = Math.floor(target * easedProgress).toLocaleString();

                if (progress < 1) {
                    requestAnimationFrame(updateNumber);
                } else {
                    counter.textContent = target.toLocaleString();
                }
            }

            requestAnimationFrame(updateNumber);
        }

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            counters.forEach(c => observer.observe(c));
        } else {
            counters.forEach(animateCounter);
        }
    }

    // --------------------------------------------------------------------------
    // 11. GALLERY FILTERS & LIGHTBOX VIEWER
    // --------------------------------------------------------------------------
    function initGallery() {
        const galleryFilters = document.querySelectorAll(".gallery-filter");
        const galleryItems = document.querySelectorAll(".gallery-item");

        if (galleryFilters.length && galleryItems.length) {
            galleryFilters.forEach(button => {
                button.addEventListener("click", () => {
                    const selectedCategory = button.dataset.filter;

                    galleryFilters.forEach(f => f.classList.remove("active"));
                    button.classList.add("active");

                    galleryItems.forEach(item => {
                        const matches = selectedCategory === "all" || item.dataset.category === selectedCategory;
                        item.classList.toggle("hidden", !matches);
                        if (matches) {
                            item.style.display = "";
                        } else {
                            item.style.display = "none";
                        }
                    });
                });
            });
        }

        // Lightbox
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
                if (!image) return;

                if (galleryLightbox && lightboxImage && lightboxCaption) {
                    lightboxImage.src = image.src;
                    lightboxCaption.textContent = item.querySelector("h3")?.textContent || image.alt || "Gallery Photo";

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
            galleryLightbox.addEventListener("click", (event) => {
                if (event.target === galleryLightbox) closeGalleryLightbox();
            });
        }

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && galleryLightbox && galleryLightbox.classList.contains("open")) {
                closeGalleryLightbox();
            }
        });
    }

    // --------------------------------------------------------------------------
    // 12. RESOURCE LIBRARY SEARCH
    // --------------------------------------------------------------------------
    function initResourceSearch() {
        const resourceSearch = document.getElementById("resourceSearch");
        const resourceItems = document.querySelectorAll(".resource-item");
        const noResources = document.getElementById("noResources");

        if (!resourceSearch || !resourceItems.length) return;

        resourceSearch.addEventListener("input", () => {
            const searchTerm = resourceSearch.value.toLowerCase().trim();
            let visibleCount = 0;

            resourceItems.forEach(item => {
                const searchableText = `${item.textContent} ${item.dataset.search || ""}`.toLowerCase();
                const matches = searchableText.includes(searchTerm);
                item.hidden = !matches;
                if (matches) visibleCount++;
            });

            if (noResources) {
                noResources.hidden = visibleCount !== 0;
            }
        });
    }

    // --------------------------------------------------------------------------
    // 13. CONTACT FORM HANDLER (Connected to Backend API with confirmation email)
    // --------------------------------------------------------------------------
    function initContactForm() {
        const contactForm = document.getElementById("contactForm");
        if (!contactForm) return;

        contactForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const fullNameInput = document.getElementById("fullName");
            const emailInput = document.getElementById("email");
            const subjectInput = document.getElementById("subject");
            const messageInput = document.getElementById("message");
            const submitBtn = contactForm.querySelector("button[type='submit']");
            const feedback = document.getElementById("formFeedback");

            const fullName = fullNameInput?.value.trim() || "";
            const email = emailInput?.value.trim() || "";
            const subject = subjectInput?.value || "";
            const message = messageInput?.value.trim() || "";

            if (!fullName || !email || !subject || !message) {
                if (feedback) {
                    feedback.textContent = "Please complete all required fields.";
                    feedback.className = "form-feedback error";
                }
                showToast("Please fill in all required fields.", "error");
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (feedback) {
                    feedback.textContent = "Please provide a valid email address.";
                    feedback.className = "form-feedback error";
                }
                showToast("Please provide a valid email address.", "error");
                emailInput?.focus();
                return;
            }

            const originalBtnText = submitBtn ? submitBtn.innerHTML : "Submit";
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = "Sending message & confirmation... ⏳";
            }

            if (feedback) {
                feedback.textContent = "Processing your message and sending confirmation email...";
                feedback.className = "form-feedback info";
            }

            try {
                // Call Backend API
                const response = await fetch("/api/contact", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ fullName, email, subject, message })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    contactForm.reset();
                    if (feedback) {
                        feedback.textContent = `✓ ${data.message}`;
                        feedback.className = "form-feedback success";
                    }
                    showToast("Message sent! A confirmation email has been dispatched to your inbox.", "success", 5000);
                } else {
                    throw new Error(data.error || "Submission failed");
                }

            } catch (err) {
                console.warn("[Contact Form] Backend API unreachable, falling back to mailto client:", err.message);

                if (feedback) {
                    feedback.textContent = "Notice: Backend server is offline or unreachable. Opening your email app to prepare the message...";
                    feedback.className = "form-feedback info";
                }
                showToast("Backend offline. Opening email app...", "info", 3500);

                const foundationEmail = "info@awachfoundation.org";
                const emailSubject = encodeURIComponent(`[Awach Foundation Inquiry] ${subject} - ${fullName}`);
                const emailBody = encodeURIComponent(
                    `Full Name: ${fullName}\nEmail Address: ${email}\nInquiry Type: ${subject}\n\nMessage:\n${message}\n\nSent via Awach Foundation Website.`
                );

                setTimeout(() => {
                    window.location.href = `mailto:${foundationEmail}?subject=${emailSubject}&body=${emailBody}`;
                }, 800);

            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        });
    }

    // --------------------------------------------------------------------------
    // 14. DYNAMIC COPYRIGHT YEAR
    // --------------------------------------------------------------------------
    function initCopyright() {
        const yearElements = document.querySelectorAll("#year, .current-year");
        const currentYear = new Date().getFullYear();
        yearElements.forEach(el => {
            el.textContent = currentYear;
        });
    }

    // --------------------------------------------------------------------------
    // INITIALIZATION LIFECYCLE
    // --------------------------------------------------------------------------
    function onReady() {
        initTheme();
        initHeader();
        initMobileNav();
        initActiveNav();
        initGlobalSearch();
        initNewsletter();
        initClickToCopy();
        initBackToTop();
        initScrollReveal();
        initCounters();
        initGallery();
        initResourceSearch();
        initContactForm();
        initCopyright();

        console.log("Awach Foundation interactive website initialized successfully.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", onReady);
    } else {
        onReady();
    }

})();
