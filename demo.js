/*
 * Demo mode for the Dealership IT Dashboard.
 *
 * In production the dashboard runs inside Claude and reads live data through connectors
 * (Atera RMM for tickets, device status and domain checks; Microsoft 365 for the calendar
 * and the help desk inbox) and asks Claude questions about what it shows.
 *
 * This file stands in for all of that with a fictional company, "Demo Auto Group".
 * It provides the same runtime the page expects (use("mcp" | "db" | "sample")) as window.DEMO_RUNTIME,
 * answering every connector call with generated sample data in the same shape the real
 * connectors return. Every name, store, ticket, email address and domain here is made up.
 */
(function () {
  "use strict";
  window.DEMO_MODE = true;

  var NOW = Date.now(), H = 36e5, D = 864e5, MIN = 6e4;
  function iso(ms) { return new Date(ms).toISOString(); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(ms) { var d = new Date(ms); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function local(ms) { var d = new Date(ms); return ymd(ms) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":00"; }   // calendar times are wall-clock
  function today(h, m) { var d = new Date(); d.setHours(h, m || 0, 0, 0); return +d; }
  function dayStart(offset) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); return +d; }

  // ---- the fictional company ----
  var ORG = "demoauto.test";
  var STORE = {
    harbor: { name: "Harbor Point Kia & Buick GMC", domain: "harborkia.test" },
    ridge: { name: "Ridgeview Nissan & Infiniti", domain: "ridgeview.test" },
    maple: { name: "Maplewood Kia", domain: "maplekia.test" },
    meadow: { name: "Meadowbrook Kia", domain: "meadowkia.test" },
    sea: { name: "Seaview Ford", domain: "seaviewford.test" }
  };
  var TECH = { mr: ["Michael Riveira", "michael.riveira@" + ORG], ac: ["Alex Chen", "alex.chen@" + ORG] };

  // ---- Atera tickets (same fields the Atera API returns) ----
  var TICKETS = [];
  function ticket(id, o) {
    var st = STORE[o.store] || {}, user = (o.user || "Help Desk").split(" "), tech = o.tech ? TECH[o.tech] : null;
    var created = NOW - o.created;
    TICKETS.push({
      TicketID: id, TicketTitle: o.title, TicketStatus: o.status || "Open", TicketPriority: o.pri || "Medium",
      TicketCreatedDate: iso(created),
      LastEndUserCommentTimestamp: o.userAt != null ? iso(NOW - o.userAt) : iso(created),
      LastTechnicianCommentTimestamp: o.techAt != null ? iso(NOW - o.techAt) : null,
      TechnicianFirstCommentDate: o.techAt != null ? iso(NOW - (o.firstAt != null ? o.firstAt : o.techAt)) : null,
      TicketResolvedDate: o.resolved != null ? iso(NOW - o.resolved) : null,
      TechnicianFullName: tech ? tech[0] : null, TechnicianEmail: tech ? tech[1] : null,
      CustomerName: st.name || "Unassigned",
      EndUserFirstName: user[0], EndUserLastName: user.slice(1).join(" "),
      EndUserEmail: o.email || (user.join(".").toLowerCase() + "@" + (st.domain || ORG)),
      FirstComment: o.body || "", LastEndUserComment: o.last || o.body || ""
    });
  }
  function hr(fields, logins) {
    var s = Object.keys(fields).map(function (k) { return k + ": " + fields[k]; }).join("\n");
    if (logins) s += "\nAccount Log Ins needed\n" + Object.keys(logins).map(function (k) { return k + ": " + logins[k]; }).join("\n") + "\n\nSubmitted by HR";
    return s;
  }
  var HR = { user: "HR Notifications", email: "hr@" + ORG };

  // open and pending work
  ticket(2041, { store: "meadow", user: "Dana Brooks", title: "Printer in the service drive won't print", created: 3 * H, techAt: 2.5 * H, userAt: 1 * H, tech: "ac", last: "Still jammed after the restart. Customers are waiting on repair orders." });
  ticket(2043, { store: "harbor", user: "Chris Alvarez", title: "Outlook keeps asking for my password", created: 30 * H, pri: "High", last: "It pops up every few minutes since this morning." });
  ticket(2044, { store: "ridge", user: "Priya Shah", title: "Second monitor for the F&I office", created: 52 * H, status: "Pending", techAt: 20 * H, firstAt: 47 * H, tech: "mr", pri: "Low" });
  ticket(2045, { store: "sea", user: "Marcus Hill", title: "Can't open the DMS on the loaner desk PC", created: 50 * MIN, pri: "High" });
  ticket(2046, { store: "maple", user: "Elena Rossi", title: "Wi-Fi drops in the customer lounge", created: 6 * H, techAt: 5 * H, tech: "mr", userAt: 6 * H });
  ticket(2047, { store: "harbor", user: "Sam Ortiz", title: "Scanner not sending to email", created: 4 * H, techAt: 3 * H, userAt: 40 * MIN, tech: "ac", last: "Tried the new settings, still nothing arrives." });

  // HR system tickets: a termination, a new hire sent twice, and a new hire starting tomorrow
  ticket(2048, { store: "ridge", user: HR.user, email: HR.email, title: "Employee Termination", created: 26 * H, techAt: 25 * H, tech: "mr", pri: "High",
    body: hr({ "Employee Name": "MORGAN, CASEY", "Termination Date": ymd(dayStart(-1)), "Dealership": "RIDGEVIEW NISSAN & INFINITI", "Job Title": "Sales Consultant", "Manager": "PATEL, RAVI" }) });
  ticket(1874, { store: "ridge", user: HR.user, email: HR.email, title: "New Hire | Ridgeview Nissan & Infiniti", created: 120 * D, status: "Closed", techAt: 119 * D, resolved: 118 * D, tech: "mr",
    body: hr({ "Employee Name": "MORGAN, CASEY", "Start Date": ymd(dayStart(-117)), "Dealership": "RIDGEVIEW NISSAN & INFINITI", "Job Title": "Sales Consultant", "Manager to send credentials to": "PATEL, RAVI" },
      { "Microsoft Outlook": "Yes", "DMS": "Yes", "CRM": "Yes", "Dealer portal": "Yes", "Parts catalog": "No" }) });
  var rivers = { "Employee Name": "RIVERS, JAMIE", "Start Date": ymd(dayStart(4)), "Dealership": "MEADOWBROOK KIA", "Job Title": "Service Advisor", "Manager to send credentials to": "NGUYEN, TARA" };
  ticket(2050, { store: "meadow", user: HR.user, email: HR.email, title: "New Hire | Meadowbrook Kia", created: 22 * H,
    body: hr(rivers, { "Microsoft Outlook": "", "DMS": "", "CRM": "", "Parts catalog": "" }) });
  ticket(2051, { store: "meadow", user: HR.user, email: HR.email, title: "New Hire | Meadowbrook Kia", created: 21 * H, techAt: 18 * H, tech: "ac",
    body: hr(rivers, { "Microsoft Outlook": "Yes", "DMS": "Yes", "CRM": "Yes", "Parts catalog": "No", "Phone extension": "214" }) });
  ticket(2052, { store: "harbor", user: HR.user, email: HR.email, title: "New Hire | Harbor Point Kia & Buick GMC", created: 2 * D, techAt: 40 * H, tech: "mr",
    body: hr({ "Employee Name": "OKAFOR, DEVON", "Start Date": ymd(dayStart(1)), "Dealership": "HARBOR POINT KIA & BUICK GMC", "Job Title": "Sales Consultant", "Manager to send credentials to": "BAKER, LEE" },
      { "Microsoft Outlook": "Yes", "DMS": "Yes", "Key machine": "Yes", "CRM": "No" }) });
  ticket(2030, { store: "sea", user: HR.user, email: HR.email, title: "Employee Termination", created: 5 * D, status: "Resolved", techAt: 4.8 * D, resolved: 3 * D, tech: "mr",
    body: hr({ "Employee Name": "LANE, TAYLOR", "Termination Date": ymd(dayStart(-4)), "Dealership": "SEAVIEW FORD", "Job Title": "Finance Manager", "Manager": "GRANT, MORGAN" }) });

  // resolved and closed history: feeds the completed list, the 14-day chart and the averages
  var HISTORY = [
    ["Reset MFA after phone upgrade", "harbor", "Kim Lee"], ["Label printer offline in parts", "maple", "Tony Russo"],
    ["Add user to the service shared mailbox", "meadow", "Grace Park"], ["Replace dead keyboard at front desk", "sea", "Omar Haddad"],
    ["VPN access for the controller", "ridge", "Laura King"], ["DMS slow on sales floor", "harbor", "Chris Alvarez"],
    ["Teams camera not detected", "maple", "Elena Rossi"], ["Phone extension forwarding to cell", "sea", "Marcus Hill"],
    ["Install Adobe for the title clerk", "ridge", "Priya Shah"], ["Shared drive permissions for BDC", "meadow", "Dana Brooks"],
    ["Toner low in the showroom printer", "harbor", "Sam Ortiz"], ["New laptop setup for sales manager", "sea", "Omar Haddad"],
    ["Email bouncing from a lender", "ridge", "Laura King"], ["Badge printer won't feed cards", "maple", "Tony Russo"],
    ["Password reset for service tech", "meadow", "Grace Park"], ["Monitor flickering in accounting", "harbor", "Kim Lee"],
    ["Wi-Fi password for vendor visit", "sea", "Marcus Hill"], ["Calendar sharing for the GM", "ridge", "Priya Shah"],
    ["Webcam for remote deliveries", "maple", "Elena Rossi"], ["Map network drive after rebuild", "meadow", "Dana Brooks"],
    ["Outlook rules not running", "harbor", "Chris Alvarez"], ["Desk phone has no dial tone", "sea", "Omar Haddad"]
  ];
  HISTORY.forEach(function (h, i) {
    var created = (i * 0.62 + 0.15) * D + (i % 3) * 2 * H, first = created - (0.5 + (i % 4) * 0.6) * H, done = created - (3 + (i % 5) * 4) * H;
    ticket(2000 + i, { store: h[1], user: h[2], title: h[0], created: created, techAt: Math.max(done, 10 * MIN), firstAt: first, resolved: Math.max(done, 5 * MIN),
      status: i % 3 ? "Resolved" : "Closed", tech: i % 2 ? "ac" : "mr", pri: ["Low", "Medium", "Medium", "High"][i % 4] });
  });

  // ---- Microsoft 365: today's calendar and the help desk inbox ----
  var EVENTS = [
    [8, 30, 9, 0, "IT stand-up", "Teams"], [10, 0, 10, 30, "Managed print vendor check-in", "Phone"],
    [11, 30, 12, 0, "Firewall change window review", "IT office"], [14, 0, 14, 30, "New hire onboarding sync with HR", "Teams"],
    [15, 30, 16, 15, "AI assistant rollout planning", "Main conference room"], [16, 30, 17, 0, "Weekly IT review", "Teams"]
  ].map(function (e, i) {
    var s = today(e[0], e[1]), en = today(e[2], e[3]);
    return { id: "evt" + i, subject: e[4], location: e[5], isAllDay: false, isCancelled: false, start: { dateTime: local(s) }, end: { dateTime: local(en) } };
  });
  var MAIL = [
    [2041, 1 * H], [2047, 40 * MIN], [2045, 50 * MIN], [2043, 30 * H], [2006, 3 * D]
  ].map(function (m, i) {
    var t = TICKETS.filter(function (x) { return x.TicketID === m[0]; })[0];
    return { id: "msg" + i, subject: (i === 1 ? "RE: " : "") + t.TicketTitle, sender: t.EndUserEmail, receivedDateTime: iso(NOW - m[1]), recipients: ["help@" + ORG] };
  });
  MAIL.splice(2, 0, { id: "msgv", subject: "Quote: replacement switches for Seaview Ford", sender: "sales@networkvendor.example", receivedDateTime: iso(NOW - 2 * H), recipients: ["help@" + ORG] });
  MAIL.sort(function (a, b) { return a.receivedDateTime < b.receivedDateTime ? 1 : -1; });

  // ---- Atera device status by site: 300+ endpoints across five stores ----
  function devices(prefix, total, offline) {
    var out = [];
    for (var i = 1; i <= total; i++) out.push({ name: prefix + "-" + (i < 10 ? "0" : "") + i, online: offline.indexOf(i) < 0 });
    return out;
  }
  var SITES = [
    ["harbor", "HPK-PC", 74, []], ["ridge", "RVN-PC", 68, [41]], ["maple", "MPW-PC", 52, [7, 19, 33]],
    ["meadow", "MBK-PC", 61, []], ["sea", "SVF-PC", 57, [12]]
  ].map(function (s) {
    var dv = devices(s[1], s[2], s[3]);
    return { customer: STORE[s[0]].name, total: dv.length, online: dv.filter(function (d) { return d.online; }).length, lastSeen: iso(NOW - (2 + s[2] % 5) * MIN), devices: dv };
  });

  // ---- domain checks: public DNS, website certificate and registration ----
  function dom(name, o) {
    o = o || {};
    return {
      domain: name, microsoft365: true, mx: [name.replace(/\./g, "-") + ".mail.protection.outlook.com"],
      spf: [o.spf || "v=spf1 include:spf.protection.outlook.com -all"], dmarc: [o.dmarc || "v=DMARC1; p=quarantine; rua=mailto:dmarc@" + name],
      dkim: { selector1: true, selector2: o.dkim !== false },
      cert: { valid: true, host: "www." + name, expires: iso(NOW + (o.certDays || 210) * D) },
      registrationExpires: iso(NOW + (o.regDays || 400) * D)
    };
  }
  var DOMAINS = [
    dom(ORG), dom(STORE.harbor.domain), dom(STORE.meadow.domain, { dmarc: "v=DMARC1; p=none" }),
    dom(STORE.ridge.domain, { regDays: 38 }), dom(STORE.maple.domain), dom(STORE.sea.domain, { certDays: 9.5 })
  ];

  // ---- the connector stand-in ----
  function result(payload) { return { payload: JSON.stringify(payload), cache: { storedAt: NOW } }; }
  function answer(server, tool, input) {
    input = input || {};
    if (tool === "outlook_calendar_search") {
      var from = input.afterDateTime || "", to = input.beforeDateTime || "9999";
      return { structuredContent: { value: EVENTS.filter(function (e) { return e.start.dateTime >= from && e.start.dateTime < to; }) } };
    }
    if (tool === "outlook_email_search") return { structuredContent: { value: MAIL } };
    if (tool === "atera_list_tickets") return result({ items: TICKETS.filter(function (t) { return !input.status || t.TicketStatus === input.status; }) });
    if (tool === "atera_site_status") return result({ sites: SITES });
    if (tool === "domain_check") return result({ checkedAt: iso(NOW - 25 * MIN), domains: DOMAINS });
    return null;
  }
  var mcp = {
    callTool: function (server, tool, input) {
      var r = answer(server, tool, input);
      return new Promise(function (ok, fail) { setTimeout(function () { r ? ok(r) : fail({ code: "upstream_error", message: "Not available in the demo" }); }, 250); });
    },
    watchTool: function (server, tool, input, cb) {
      var live = true, r = answer(server, tool, input);
      setTimeout(function () { if (live) cb(r ? { type: "data", result: r } : { type: "error", error: { code: "upstream_error" } }); }, 300 + Math.random() * 500);
      return function () { live = false; };
    }
  };

  // ---- the shared database stand-in (XP and checklist ticks), kept in this browser only ----
  var STORE_KEY = "demo-dashboard-db", data = {};
  try { data = JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {}; } catch (e) {}
  if (!data["xp/state"]) data["xp/state"] = { since: NOW, tech: TECH.mr[1], base: 1340, awarded: {} };
  var listeners = {};
  function persist() { try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) {} }
  function emit(path) { (listeners[path] || []).forEach(function (f) { f(); }); var col = path.split("/")[0]; (listeners[col + "/*"] || []).forEach(function (f) { f(); }); }
  function on(path, f) { (listeners[path] = listeners[path] || []).push(f); setTimeout(f, 0); }
  function docRef(path) {
    return {
      set: function (v) { data[path] = JSON.parse(JSON.stringify(v)); persist(); setTimeout(function () { emit(path); }, 0); return Promise.resolve(); },
      onSnapshot: function (cb) { on(path, function () { var v = data[path]; cb({ exists: !!v, metadata: {}, data: function () { return v; } }); }); return function () {}; }
    };
  }
  var db = {
    doc: docRef,
    collection: function (name) {
      return {
        doc: function (id) { return docRef(name + "/" + id); },
        onSnapshot: function (cb) {
          on(name + "/*", function () {
            cb({ docs: Object.keys(data).filter(function (k) { return k.indexOf(name + "/") === 0; }).map(function (k) { return { id: k.slice(name.length + 1), data: function () { return data[k]; } }; }) });
          });
          return function () {};
        }
      };
    }
  };

  // ---- the assistant stand-in: scripted answers built from the same sample data ----
  function clock(ms) { return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
  function brief() {
    var ahead = EVENTS.filter(function (e) { return new Date(e.end.dateTime) > new Date(); });
    var openT = TICKETS.filter(function (t) { return t.TicketStatus === "Open" || t.TicketStatus === "Pending"; }).length - 1;   // the HR duplicate counts once
    return [
      "Meetings: " + (ahead.length ? ahead.length + " left today; next is " + ahead[0].subject + " at " + clock(new Date(ahead[0].start.dateTime)) + "." : "none left today."),
      "Tickets: " + openT + " open. Most urgent is #2043, Outlook password prompts at Harbor Point, waiting over a day with no reply.",
      "Sites: all five are checking in. Maplewood Kia has 3 of 52 devices offline.",
      "Staff: Casey Morgan's access removal is 1 day overdue (0 of 4 done). Devon Okafor starts tomorrow and Jamie Rivers in 4 days.",
      "Domains: seaviewford.test's website certificate expires in 9 days."
    ].join("\n");
  }
  function needsReply() {
    return [
      "#2043 Outlook keeps asking for my password (Harbor Point): new, no reply in over a day.",
      "#2045 Can't open the DMS on the loaner desk PC (Seaview Ford): new, high priority.",
      "#2047 Scanner not sending to email (Harbor Point): user replied 40 minutes ago.",
      "#2041 Printer in the service drive won't print (Meadowbrook): user replied an hour ago."
    ].join("\n");
  }
  function freeTime() {
    var now = Date.now(), cur = Math.max(now, today(8, 0)), gaps = [];
    EVENTS.forEach(function (e) {
      var s = +new Date(e.start.dateTime), en = +new Date(e.end.dateTime);
      if (s - cur >= 30 * MIN) gaps.push(clock(cur) + " to " + clock(s));
      cur = Math.max(cur, en);
    });
    if (today(18, 0) - cur >= 30 * MIN) gaps.push(clock(cur) + " to 6:00 PM");
    return gaps.length ? "You're free " + gaps.join(", ") + "." : "No free blocks of 30 minutes or more left today.";
  }
  function reply(q) {
    if (/brief/i.test(q)) return brief();
    if (/need a response|tickets? need/i.test(q)) return needsReply();
    if (/free/i.test(q)) return freeTime();
    if (/offline|site/i.test(q)) return "Maplewood Kia has 3 devices offline: MPW-PC-07, MPW-PC-19 and MPW-PC-33. Ridgeview and Seaview each have 1. Everything else is checking in.";
    if (/domain|dns|ssl|cert/i.test(q)) return "seaviewford.test: certificate expires in 9 days (problem).\nridgeview.test: registration expires in 38 days (check).\nmeadowkia.test: DMARC is p=none, monitor only (check).\nThe other three are all good.";
    if (/hire|termination|staff|crew/i.test(q)) return "Leaving: Casey Morgan (Ridgeview), overdue by a day, 4 accounts to remove.\nJoining: Devon Okafor (Harbor Point) tomorrow, Jamie Rivers (Meadowbrook) in 4 days.";
    return "This is the demo, so I can only answer the built-in questions (try Brief me, or ask about tickets, sites, domains, new hires or free time). In the real dashboard every question goes to Claude with a snapshot of the live data.";
  }
  function sample(messages, opts) {
    opts = opts || {};
    var q = String(messages[messages.length - 1].content || ""), text = reply(q), i = 0;
    return new Promise(function (ok, fail) {
      var t = setInterval(function () {
        if (opts.signal && opts.signal.aborted) { clearInterval(t); fail({ code: "cancelled", text: text.slice(0, i) }); return; }
        i = Math.min(text.length, i + 6);
        if (opts.onText) opts.onText({ text: text.slice(0, i) });
        if (i >= text.length) { clearInterval(t); ok({ text: text, truncated: false }); }
      }, 18);
    });
  }

  window.DEMO_RUNTIME = {
    use: function (cap) {
      return Promise.resolve(cap === "mcp" ? mcp : cap === "db" ? db : cap === "sample" ? sample : null);
    }
  };
})();
