(function(){
  const $ = (id) => document.getElementById(id);
  const statusEl = $("status");
  const pdfStatus = $("pdfStatus");

  let S = {
    brandName: $("brandName").value,
    brandColor: $("brandColor").value,
    buildingSqft: +$("buildingSqft").value,
    ratePerSf: +$("ratePerSf").value,
    savingsPct: +$("savingsPct").value,
    modeHVAC: document.querySelector('input[name="modeHVAC"]:checked').value,
    hvacPerSfYr: +$("hvacPerSfYr").value,
    annualHvacCustom: +$("annualHvacCustom").value,
    modeGlass: document.querySelector('input[name="modeGlass"]:checked').value,
    glassRatio: +$("glassRatio").value,
    glassSqftCustom: +$("glassSqftCustom").value
  };

  const clamp = (n, min, max) => Math.min(Math.max(Number(n)||0, min), max);
  const money0 = (n) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const pct = (n) => Math.round(n*100) + "%";

  function compute() {
    const glassSqft = S.modeGlass === "custom" && S.glassSqftCustom > 0 ? S.glassSqftCustom : Math.round(S.buildingSqft * S.glassRatio);
    const installCost = glassSqft * S.ratePerSf;
    const annualHvacUsed = S.modeHVAC === "custom" ? S.annualHvacCustom : S.buildingSqft * S.hvacPerSfYr;
    const annualSavings = annualHvacUsed * S.savingsPct;
    const paybackYears = annualSavings > 0 ? (installCost / annualSavings) : 0;
    const fiveYearNet = annualSavings * 5 - installCost;

    $("kpiGlassArea").textContent = glassSqft.toLocaleString() + " sf";
    $("kpiGlassSub").textContent = S.modeGlass === "ratio" ? ("@ " + pct(S.glassRatio) + " glazing") : "custom value";
    $("kpiInstalled").textContent = money0(installCost);
    $("kpiRate").textContent = "$" + (S.ratePerSf||0).toFixed(2);
    $("kpiSavings").textContent = money0(annualSavings);
    $("kpiSavingsPct").textContent = pct(S.savingsPct);
    $("kpiPayback").textContent = (annualSavings>0 ? paybackYears.toFixed(1) : "–") + " yrs";
    $("kpiFiveYear").textContent = money0(fiveYearNet);

    $("printContent").innerHTML = `
      <div><b>Brand:</b> ${S.brandName}</div>
      <div><b>Building Size:</b> ${S.buildingSqft.toLocaleString()} sf</div>
      <div><b>Estimated Glass Area:</b> ${glassSqft.toLocaleString()} sf ${S.modeGlass==="ratio" ? "(at " + pct(S.glassRatio) + ")" : "(custom)"} </div>
      <div><b>Installed Cost:</b> ${money0(installCost)}</div>
      <div><b>Annual HVAC Spend:</b> ${money0(annualHvacUsed)}</div>
      <div><b>Annual Savings:</b> ${money0(annualSavings)}</div>
      <div><b>Payback:</b> ${(annualSavings>0 ? paybackYears.toFixed(1) : "–")} yrs</div>
      <div><b>5-Year Net:</b> ${money0(fiveYearNet)}</div>
      <div class="divider"></div>
      <div style="color:#6b7280;">Estimates are directional. Final ROI depends on verified glass area, film specification, installation conditions, and actual utility rates.</div>
    `;
  }

  function bind() {
    const update = () => {
      S.brandName = $("brandName").value;
      S.brandColor = $("brandColor").value; document.documentElement.style.setProperty("--brand", S.brandColor);
      S.buildingSqft = clamp($("buildingSqft").value, 1500, 50000);
      S.ratePerSf = Math.max(0, +$("ratePerSf").value || 0);
      S.savingsPct = clamp($("savingsPct").value, 0.05, 0.6);
      S.modeHVAC = document.querySelector('input[name="modeHVAC"]:checked').value;
      S.hvacPerSfYr = Math.max(0, +$("hvacPerSfYr").value || 0);
      S.annualHvacCustom = Math.max(0, +$("annualHvacCustom").value || 0);
      S.modeGlass = document.querySelector('input[name="modeGlass"]:checked').value;
      S.glassRatio = clamp($("glassRatio").value, 0.05, 0.6);
      S.glassSqftCustom = Math.max(0, +$("glassSqftCustom").value || 0);
      $("hvacPerSfYr").style.display = S.modeHVAC === "perSf" ? "block" : "none";
      $("annualHvacCustom").style.display = S.modeHVAC === "custom" ? "block" : "none";
      $("ratioBlock").style.display = S.modeGlass === "ratio" ? "block" : "none";
      $("customBlock").style.display = S.modeGlass === "custom" ? "block" : "none";
      compute();
      statusEl.textContent = "Status: Ready";
    };
    document.querySelectorAll("input").forEach(el => el.addEventListener("input", update));
    document.querySelectorAll('input[name="modeHVAC"]').forEach(el => el.addEventListener("change", update));
    document.querySelectorAll('input[name="modeGlass"]').forEach(el => el.addEventListener("change", update));
    update();
  }

  const KEY_MAP = "energyFilmEstimator:scenarios";
  const KEY_LAST = "energyFilmEstimator:last";
  function loadAll() { try { return JSON.parse(localStorage.getItem(KEY_MAP) || "{}"); } catch { return {}; } }
  function saveAll(m) { localStorage.setItem(KEY_MAP, JSON.stringify(m)); }

  $("btnSave").onclick = () => { const name = ($("scenarioName").value || ("Scenario " + new Date().toLocaleString())).trim(); const m = loadAll(); m[name] = S; saveAll(m); localStorage.setItem(KEY_LAST, name); statusEl.textContent = "Status: Saved " + name; };
  $("btnLoad").onclick = () => { const name = prompt("Load which scenario?", localStorage.getItem(KEY_LAST) || ""); if (!name) return; const m = loadAll(); const s = m[name]; if (!s) return statusEl.textContent = "Status: Scenario not found"; S = Object.assign(S, s);
    $("brandName").value = S.brandName; $("brandColor").value = S.brandColor; document.documentElement.style.setProperty("--brand", S.brandColor);
    $("buildingSqft").value = S.buildingSqft; $("ratePerSf").value = S.ratePerSf; $("savingsPct").value = S.savingsPct;
    document.querySelectorAll('input[name="modeHVAC"]').forEach(el => { el.checked = (el.value === S.modeHVAC); });
    $("hvacPerSfYr").value = S.hvacPerSfYr; $("annualHvacCustom").value = S.annualHvacCustom;
    document.querySelectorAll('input[name="modeGlass"]').forEach(el => { el.checked = (el.value === S.modeGlass); });
    $("glassRatio").value = S.glassRatio; $("glassSqftCustom").value = S.glassSqftCustom;
    compute(); statusEl.textContent = "Status: Loaded " + name; };
  $("btnDelete").onclick = () => { const name = prompt("Delete which scenario?"); if (!name) return; const m = loadAll(); if (!m[name]) return statusEl.textContent = "Status: Scenario not found"; delete m[name]; saveAll(m); statusEl.textContent = "Status: Deleted " + name; };
  $("btnList").onclick = () => { const keys = Object.keys(loadAll()); alert(keys.length ? "Saved scenarios:\n\n" + keys.join("\n") : "No saved scenarios yet."); };

  // Load jsPDF via service worker cache (first online visit)
  let jsPDFRef = null;
  (function loadJsPDF(){
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
    s.async = true;
    s.onload = () => { jsPDFRef = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : null; pdfStatus.textContent = jsPDFRef ? "Ready" : "Unavailable"; };
    s.onerror = () => { pdfStatus.textContent = "Unavailable (offline)"; };
    document.body.appendChild(s);
  })();

  $("btnGenerate").onclick = () => {
    if (!jsPDFRef) { alert("PDF engine unavailable offline. Use 'Print / Save as PDF' instead."); return; }
    const doc = new jsPDFRef({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth(); const M = 40; let y = 48;
    try { doc.addImage(document.getElementById("logo").src, "PNG", (W-160)/2, y, 160, 56); y += 70; } catch (e){}
    doc.setDrawColor(0,229,234); doc.setFillColor(0,229,234); doc.roundedRect(M, y, W - M*2, 36, 8, 8, "F");
    doc.setTextColor(0,0,0); doc.setFontSize(14); doc.setFont("helvetica","bold"); const title = "Energy Film ROI Proposal"; const tw = doc.getTextWidth(title); doc.text(title, (W - tw)/2, y+24); y += 56;
    const glassSqft = S.modeGlass === "custom" && S.glassSqftCustom > 0 ? S.glassSqftCustom : Math.round(S.buildingSqft * S.glassRatio);
    const installCost = glassSqft * S.ratePerSf; const annualHvacUsed = S.modeHVAC === "custom" ? S.annualHvacCustom : S.buildingSqft * S.hvacPerSfYr; const annualSavings = annualHvacUsed * S.savingsPct; const fiveYearNet = annualSavings*5 - installCost;
    const money0 = (n) => n.toLocaleString(undefined, { style:'currency', currency:'USD', maximumFractionDigits:0 });
    const pct = (n) => Math.round(n*100) + '%';
    const left = M, right = W/2 + 10; doc.setFontSize(11);
    function row(k,v,col){ const x = col==='right'? right : left; doc.setTextColor(110,110,110); doc.text(k, x, y); doc.setTextColor(20,20,20); doc.setFont('helvetica','bold'); doc.text(String(v), x+180, y); doc.setFont('helvetica','normal'); y+=20; }
    row('Building Size', S.buildingSqft.toLocaleString()+' sf','left');
    row('Estimated Glass Area', glassSqft.toLocaleString()+' sf '+(S.modeGlass==='ratio'? '(at '+pct(S.glassRatio)+')':'(custom)'), 'left');
    row('Installed Cost', money0(installCost), 'left');
    const top = y-60; y = top; row('Annual HVAC Spend', money0(annualHvacUsed), 'right'); row('Annual Savings', money0(annualSavings), 'right'); row('5-Year Net', money0(fiveYearNet), 'right'); y = Math.max(y, top+60)+14;
    doc.setDrawColor(229,231,235); doc.line(M,y,W-M,y); y+=18;
    doc.setTextColor(130,130,130); doc.setFontSize(10); const d = 'Estimates are directional. Final ROI depends on verified glass area, film specification, installation conditions, and utility rates.'; doc.text(doc.splitTextToSize(d, W-M*2), M, y);
    const blob = doc.output('blob'); const url = URL.createObjectURL(blob); window.open(url,'_blank'); setTimeout(()=>URL.revokeObjectURL(url),15000);
  };

  $("btnPrint").onclick = () => { window.print(); };

  bind(); compute();
})();