/**
 * The Chumley website form, as a script tag.
 *
 * Two decisions worth knowing before changing anything in here.
 *
 * NO IFRAME. An iframe needs a height, and a height is either guessed or
 * negotiated over postMessage forever. Guessing is what the old embed did,
 * with a hardcoded 620px that clipped the form on some sites and left a
 * dead gap under it on others. This renders into the page, so it is exactly
 * as tall as it needs to be and it reflows on a phone for free.
 *
 * SHADOW DOM. Which buys back the one good thing an iframe gave: the
 * customer's stylesheet cannot reach inside and break this, and nothing in
 * here leaks out onto their page. A WordPress theme with an opinion about
 * `input { width: 100% !important }` is not a hypothetical.
 *
 * The tradeoff, stated because it is real: password managers and a few
 * older screen readers are occasionally odd inside a shadow root, and the
 * host page's analytics cannot see the submit without the event we
 * dispatch below. For a five field lead form that is a fair trade for never
 * having to think about height again.
 *
 * The whole point of shipping a script rather than markup is that this file
 * can change. Add a field, fix a bug, restyle it, and every site that has
 * ever pasted the snippet gets it on their next page load, without anybody
 * being asked to do anything.
 */
(function () {
  "use strict";

  var current = document.currentScript;
  if (!current) return;

  var token = current.getAttribute("data-form");
  if (!token) {
    console.error("[chumley] the embed needs a data-form attribute");
    return;
  }

  // Derive the API origin from where this script was served, so a staging
  // copy talks to staging without anybody editing a snippet.
  var origin = new URL(current.src, window.location.href).origin;

  var accent = current.getAttribute("data-accent") || "#f16522";
  // data-heading wins where a customer sets it; otherwise the words come
  // from the server, so the owner edits them in Settings and every site
  // that ever pasted the snippet shows the new ones on its next load.
  var heading = current.getAttribute("data-heading");
  var button = current.getAttribute("data-button") || "Send";
  var thanks =
    current.getAttribute("data-thanks") ||
    "Thanks. We will be in touch shortly.";

  // Render where the tag sits, so the customer controls placement by moving
  // one line rather than by learning an API.
  var mount = document.createElement("div");
  mount.className = "chumley-form";
  current.parentNode.insertBefore(mount, current.nextSibling);

  var root = mount.attachShadow ? mount.attachShadow({ mode: "open" }) : mount;

  var style = document.createElement("style");
  style.textContent = [
    ":host{all:initial}",
    "*{box-sizing:border-box;font-family:inherit}",
    ".w{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;",
    "max-width:520px;color:#231f20;font-size:16px;line-height:1.5}",
    "h3{margin:0 0 14px;font-size:20px;font-weight:700;letter-spacing:-.01em}",
    ".r{display:flex;gap:10px}",
    "@media (max-width:420px){.r{flex-direction:column;gap:12px}}",
    ".f{display:flex;flex-direction:column;gap:12px}",
    "label{display:block;font-size:13px;font-weight:600;margin-bottom:5px;color:#55504f}",
    ".fl{flex:1;min-width:0}",
    "input{width:100%;padding:11px 13px;font-size:16px;color:#231f20;",
    "border:1px solid #d9d4d1;border-radius:9px;background:#fff;outline:none}",
    "input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(0,0,0,.06)}",
    "button{padding:12px 22px;font-size:16px;font-weight:700;color:#fff;",
    "background:var(--accent);border:0;border-radius:9px;cursor:pointer;align-self:flex-start}",
    "button:hover{filter:brightness(.94)}",
    "button:disabled{opacity:.6;cursor:default}",
    ".hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}",
    ".err{margin:0;font-size:14px;font-weight:600;color:#b3261e}",
    ".ok{padding:18px 20px;border:1px solid #e7e2e0;border-radius:12px;",
    "background:#faf8f7;font-size:16px;font-weight:600}",
    ".req{color:var(--accent)}",
  ].join("");
  root.appendChild(style);

  var wrap = document.createElement("div");
  wrap.className = "w";
  wrap.style.setProperty("--accent", accent);
  root.appendChild(wrap);

  function field(name, label, type, required) {
    return (
      '<div class="fl"><label for="c-' + name + '">' + label +
      (required ? ' <span class="req">*</span>' : "") +
      '</label><input id="c-' + name + '" name="' + name + '" type="' + type +
      '"' + (required ? " required" : "") +
      ' autocomplete="' + (type === "email" ? "email" : "on") + '"></div>'
    );
  }

  function render() {
    wrap.innerHTML =
      (heading ? "<h3>" + escapeHtml(heading) + "</h3>" : "") +
      '<form class="f" novalidate>' +
      '<div class="r">' +
      field("firstName", "First name", "text", true) +
      field("lastName", "Last name", "text", true) +
      "</div>" +
      field("company", "Company", "text", false) +
      field("email", "Email", "email", true) +
      field("phone", "Phone", "tel", false) +
      '<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<p class="err" hidden></p>' +
      "<button type=submit>" + escapeHtml(button) + "</button>" +
      "</form>";
    wire();
  }

  if (heading) {
    render();
  } else {
    // Ask the server for the owner's words first, so the heading never
    // pops in above an already-painted form. One small same-server round
    // trip; on any failure the form still renders, just untitled.
    fetch(origin + "/api/forms/" + encodeURIComponent(token))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.ok && res.heading) heading = res.heading;
      })
      .catch(function () {})
      .then(render);
  }

  function wire() {
  var form = wrap.querySelector("form");
  var err = wrap.querySelector(".err");
  var btn = wrap.querySelector("button");
  var label = btn.textContent;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    err.hidden = true;
    btn.disabled = true;
    btn.textContent = "Sending…";

    var body = {};
    new FormData(form).forEach(function (v, k) {
      body[k] = v;
    });

    fetch(origin + "/api/forms/" + encodeURIComponent(token), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (r) {
        return r.json().catch(function () {
          return { ok: false, error: "Something went wrong. Try again?" };
        });
      })
      .then(function (res) {
        if (res && res.ok) {
          wrap.innerHTML = '<div class="ok">' + escapeHtml(thanks) + "</div>";
          // The host page cannot see inside a shadow root, so hand it an
          // event it can hang a conversion pixel on.
          mount.dispatchEvent(
            new CustomEvent("chumley:submitted", { bubbles: true }),
          );
          return;
        }
        err.textContent =
          (res && res.error) || "Something went wrong. Try again?";
        err.hidden = false;
      })
      .catch(function () {
        err.textContent = "Could not send that. Check your connection?";
        err.hidden = false;
      })
      .then(function () {
        btn.disabled = false;
        btn.textContent = label;
      });
  });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }
})();
