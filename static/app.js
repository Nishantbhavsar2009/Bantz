// App.js - Bantz Butler Frontend Interactions

document.addEventListener("DOMContentLoaded", () => {
    // Current date helper
    updateDateDisplay();

    // 1. Navigation Controller
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".dashboard-section");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            // Remove active classes
            navItems.forEach(n => n.classList.remove("active"));
            sections.forEach(s => s.classList.remove("active"));

            // Set current active
            item.classList.add("active");
            const targetId = item.getAttribute("data-target");
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add("active");
            }

            // Trigger action on section load if needed
            if (targetId === "section-system") {
                fetchSystemDiagnostics();
            } else if (targetId === "section-schedule") {
                fetchScheduleData();
            }
        });
    });

    // 2. Butler Chat Module
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const chatMessages = document.getElementById("chat-messages");
    const butlerStatusHint = document.querySelector(".butler-status-hint");

    if (chatForm) {
        chatForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message) return;

            // Append user message to log
            appendMessage("user", message);
            chatInput.value = "";

            // Set status to busy
            butlerStatusHint.textContent = "Writing response...";
            
            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: message })
                });

                if (response.ok) {
                    const data = await response.json();
                    appendMessage("butler", data.reply);
                } else {
                    appendMessage("butler", "I apologize, sir. Something went awry with my computational core.");
                }
            } catch (err) {
                console.error("Chat error:", err);
                appendMessage("butler", "Forgive me, my liege. I could not reach my cognitive reserves due to network issues.");
            } finally {
                butlerStatusHint.textContent = "Attending your request...";
            }
        });
    }

    function appendMessage(sender, text) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", `${sender}-message`);

        const p = document.createElement("p");
        p.textContent = text;
        messageDiv.appendChild(p);

        const timeSpan = document.createElement("span");
        timeSpan.classList.add("message-time");
        timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageDiv.appendChild(timeSpan);

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 3. System Diagnostics Module
    const cpuGauge = document.getElementById("cpu-gauge");
    const cpuValue = document.getElementById("cpu-value");
    const cpuCores = document.getElementById("cpu-cores");
    const memGauge = document.getElementById("mem-gauge");
    const memValue = document.getElementById("mem-value");
    const memMeta = document.getElementById("mem-meta");
    const diskGauge = document.getElementById("disk-gauge");
    const diskValue = document.getElementById("disk-value");
    const diskMeta = document.getElementById("disk-meta");
    const processTableBody = document.querySelector("#process-table tbody");
    const quickCpu = document.getElementById("quick-cpu");
    const quickRam = document.getElementById("quick-ram");
    const quickUptime = document.getElementById("quick-uptime");
    const connectionIndicator = document.getElementById("connection-indicator");
    const connectionStatus = document.getElementById("connection-status");
    const refreshSystemBtn = document.getElementById("refresh-system-btn");

    function formatUptime(seconds) {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (hours < 24) return `${hours}h ${remainingMinutes}m`;
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h`;
    }

    function setOnlineStatus(isOnline) {
        if (!connectionIndicator || !connectionStatus) return;
        if (isOnline) {
            connectionIndicator.style.backgroundColor = "#2ecc71";
            connectionIndicator.style.boxShadow = "0 0 10px rgba(46, 204, 113, 0.6)";
            connectionStatus.textContent = "Butler Online";
        } else {
            connectionIndicator.style.backgroundColor = "#e74c3c";
            connectionIndicator.style.boxShadow = "0 0 10px rgba(231, 76, 60, 0.6)";
            connectionStatus.textContent = "Butler Offline";
        }
    }

    async function fetchSystemDiagnostics() {
        try {
            const res = await fetch("/api/system");
            if (!res.ok) throw new Error("Stats request failed");
            
            const stats = await res.json();
            setOnlineStatus(true);
            
            // Update gauges & values
            if (cpuGauge) cpuGauge.style.width = `${stats.cpu_percent}%`;
            if (cpuValue) cpuValue.textContent = `${stats.cpu_percent}%`;
            if (cpuCores) cpuCores.textContent = `Logical cores: ${stats.cpu_count}`;
            
            if (quickCpu) {
                quickCpu.textContent = `${stats.cpu_percent}%`;
                quickCpu.style.color = stats.cpu_percent > 85 ? "#e74c3c" : "var(--accent-gold)";
            }

            if (memGauge) memGauge.style.width = `${stats.memory.percent_used}%`;
            if (memValue) memValue.textContent = `${stats.memory.percent_used}%`;
            if (memMeta) memMeta.textContent = `Available: ${stats.memory.available_gb} GB / Total: ${stats.memory.total_gb} GB`;
            
            if (quickRam) {
                quickRam.textContent = `${stats.memory.percent_used}%`;
                quickRam.style.color = stats.memory.percent_used > 85 ? "#e74c3c" : "var(--accent-gold)";
            }

            if (quickUptime) {
                quickUptime.textContent = formatUptime(stats.uptime);
            }

            if (diskGauge) diskGauge.style.width = `${stats.disk.percent_used}%`;
            if (diskValue) diskValue.textContent = `${stats.disk.percent_used}%`;
            if (diskMeta) diskMeta.textContent = `Free: ${stats.disk.free_gb} GB / Total: ${stats.disk.total_gb} GB`;

            // Update process list
            if (processTableBody) {
                processTableBody.innerHTML = "";
                if (stats.processes.length === 0) {
                    processTableBody.innerHTML = `<tr><td colspan="4" class="table-placeholder">No active processes captured.</td></tr>`;
                } else {
                    stats.processes.forEach(proc => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td>${proc.pid}</td>
                            <td>${proc.name}</td>
                            <td>${proc.cpu}%</td>
                            <td>${proc.mem}%</td>
                        `;
                        processTableBody.appendChild(tr);
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch diagnostics:", err);
            setOnlineStatus(false);
            if (processTableBody) {
                processTableBody.innerHTML = `<tr><td colspan="4" class="table-placeholder">System diagnostics failed to load. Check server.</td></tr>`;
            }
        }
    }

    if (refreshSystemBtn) {
        refreshSystemBtn.addEventListener("click", fetchSystemDiagnostics);
    }

    // Auto poll diagnostics every 4 seconds when online
    setInterval(() => {
        // Only fetch if diagnostics section is visible
        const systemSection = document.getElementById("section-system");
        if (systemSection && systemSection.classList.contains("active")) {
            fetchSystemDiagnostics();
        } else {
            // Otherwise just update header stats quietly
            fetchHeaderStatsQuietly();
        }
    }, 4000);

    async function fetchHeaderStatsQuietly() {
        try {
            const res = await fetch("/api/system");
            if (res.ok) {
                const stats = await res.json();
                setOnlineStatus(true);
                if (quickCpu) {
                    quickCpu.textContent = `${stats.cpu_percent}%`;
                    quickCpu.style.color = stats.cpu_percent > 85 ? "#e74c3c" : "var(--accent-gold)";
                }
                if (quickRam) {
                    quickRam.textContent = `${stats.memory.percent_used}%`;
                    quickRam.style.color = stats.memory.percent_used > 85 ? "#e74c3c" : "var(--accent-gold)";
                }
                if (quickUptime) {
                    quickUptime.textContent = formatUptime(stats.uptime);
                }
            } else {
                setOnlineStatus(false);
            }
        } catch (e) {
            setOnlineStatus(false);
        }
    }

    // Initialize header stats immediately
    fetchHeaderStatsQuietly();


    // 4. Research Bureau Module
    const researchForm = document.getElementById("research-form");
    const researchInput = document.getElementById("research-input");
    const researchOutputBox = document.getElementById("research-output-box");
    const researchOutputText = document.getElementById("research-output-text");
    const briefingTimestamp = document.getElementById("briefing-timestamp");
    const researchBtn = document.getElementById("research-btn");

    if (researchForm) {
        researchForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const query = researchInput.value.trim();
            if (!query) return;

            // Update UI state to loading
            researchBtn.disabled = true;
            researchBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Researching...`;
            researchOutputBox.classList.remove("hidden");
            researchOutputText.innerHTML = `<p class="timeline-empty">I am gathering sources and drafting your briefing, sir. This will take just a moment...</p>`;

            try {
                const response = await fetch("/api/research", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: query })
                });

                if (response.ok) {
                    const data = await response.json();
                    briefingTimestamp.textContent = `Compiled at ${new Date().toLocaleTimeString()}`;
                    researchOutputText.innerHTML = parseMarkdown(data.briefing);
                } else {
                    researchOutputText.innerHTML = `<p class="timeline-empty">I apologize, sir. I was unable to retrieve search results at this time.</p>`;
                }
            } catch (err) {
                console.error("Research error:", err);
                researchOutputText.innerHTML = `<p class="timeline-empty">An error occurred while compiling your dossier, sir.</p>`;
            } finally {
                researchBtn.disabled = false;
                researchBtn.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> Compile Briefing`;
            }
        });
    }

    // Basic regex markdown parser to render headings, lists, bold text and link targets cleanly
    function parseMarkdown(md) {
        if (!md) return "";
        let html = md;
        
        // Escape HTML tags to prevent XSS
        html = html.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        // Headings
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        // Italic
        html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
        
        // Links
        html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Bullets (line starting with * or -)
        html = html.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li>$1</li>');
        // Wrap <li> blocks in <ul>
        // Match consecutive <li> groups and wrap them
        html = html.replace(/(<li>.*<\/li>)+/gim, '<ul>$&</ul>');
        
        // Handle paragraphs: replace double newlines with p tags
        // Skip splitting if lines contain headers or lists
        const lines = html.split(/\n\n+/);
        const processedLines = lines.map(line => {
            if (line.trim().startsWith("<h") || line.trim().startsWith("<ul") || line.trim().startsWith("<li")) {
                return line;
            }
            return `<p>${line.replace(/\n/g, "<br>")}</p>`;
        });
        
        return processedLines.join("");
    }


    // 5. Schedule & Mail Module
    const calendarTimeline = document.getElementById("calendar-timeline");
    const emailInbox = document.getElementById("email-inbox");
    
    // Modal controls
    const itemModal = document.getElementById("item-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalForm = document.getElementById("modal-form");
    const modalCategory = document.getElementById("modal-category");
    const formGroupSender = document.getElementById("form-group-sender");
    const labelTitle = document.getElementById("label-title");
    const modalTitleInput = document.getElementById("modal-title-input");
    
    const openAddEventBtn = document.getElementById("open-add-event-btn");
    const openAddMailBtn = document.getElementById("open-add-mail-btn");
    const modalCloseBtn = document.getElementById("modal-close-btn");

    async function fetchScheduleData() {
        try {
            const res = await fetch("/api/schedule");
            if (!res.ok) throw new Error("Schedule query failed");
            
            const data = await res.json();
            
            // Render calendar timeline
            if (calendarTimeline) {
                calendarTimeline.innerHTML = "";
                if (data.events.length === 0) {
                    calendarTimeline.innerHTML = `<p class="timeline-empty">Your schedule is currently clear, sir.</p>`;
                } else {
                    data.events.forEach(evt => {
                        const itemDiv = document.createElement("div");
                        itemDiv.classList.add("timeline-item");
                        itemDiv.innerHTML = `
                            <span class="timeline-time">${evt.time}</span>
                            <span class="timeline-title">${evt.title}</span>
                        `;
                        calendarTimeline.appendChild(itemDiv);
                    });
                }
            }

            // Render email list
            if (emailInbox) {
                emailInbox.innerHTML = "";
                if (data.emails.length === 0) {
                    emailInbox.innerHTML = `<p class="mail-empty">No unread letters at this moment, sir.</p>`;
                } else {
                    data.emails.forEach(mail => {
                        const mailDiv = document.createElement("div");
                        mailDiv.classList.add("mail-item");
                        mailDiv.innerHTML = `
                            <div class="mail-item-header">
                                <span class="mail-sender">${mail.sender}</span>
                                <span class="mail-time">${mail.time}</span>
                            </div>
                            <div class="mail-title">${mail.title}</div>
                        `;
                        emailInbox.appendChild(mailDiv);
                    });
                }
            }
        } catch (err) {
            console.error("Failed to load schedule data:", err);
        }
    }

    // Modal Triggers
    if (openAddEventBtn) {
        openAddEventBtn.addEventListener("click", () => {
            modalTitle.textContent = "Schedule a Calendar Event";
            modalCategory.value = "calendar";
            formGroupSender.classList.add("hidden");
            labelTitle.textContent = "Event Title";
            modalTitleInput.placeholder = "e.g. Study SAT Math";
            itemModal.classList.remove("hidden");
        });
    }

    if (openAddMailBtn) {
        openAddMailBtn.addEventListener("click", () => {
            modalTitle.textContent = "Register Incoming Mail";
            modalCategory.value = "email";
            formGroupSender.classList.remove("hidden");
            labelTitle.textContent = "Subject / Details";
            modalTitleInput.placeholder = "e.g. Admissions update";
            itemModal.classList.remove("hidden");
        });
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener("click", () => {
            itemModal.classList.add("hidden");
            modalForm.reset();
        });
    }

    if (modalForm) {
        modalForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const category = modalCategory.value;
            const time = document.getElementById("modal-time").value.trim();
            const title = modalTitleInput.value.trim();
            const sender = document.getElementById("modal-sender").value.trim();

            const payload = {
                category: category,
                time: time,
                title: title,
                sender: sender || null
            };

            try {
                const res = await fetch("/api/schedule", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    itemModal.classList.add("hidden");
                    modalForm.reset();
                    // Reload data
                    fetchScheduleData();
                } else {
                    alert("I apologize, sir. I was unable to record the item.");
                }
            } catch (err) {
                console.error("Error saving item:", err);
                alert("An error occurred. The item could not be registered.");
            }
        });
    }

    // Load initial schedule on load
    fetchScheduleData();

    // Helper: format standard display date
    function updateDateDisplay() {
        const dateDisplay = document.getElementById("current-date-display");
        if (dateDisplay) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
        }
    }
});
