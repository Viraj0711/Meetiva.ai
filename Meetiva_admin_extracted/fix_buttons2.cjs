const fs = require('fs');
let src = fs.readFileSync('/workspaces/default/code/src/app/App.tsx', 'utf8');

// ── TopBar Bell (line ~1127) ─────────────────────────────────────────────────
src = src.replace(
  `<button className="relative w-9 h-9 bg-white rounded-xl border border-[#E5F4F7] shadow-sm flex items-center justify-center hover:border-[#C8E8F2] transition-colors cursor-pointer">
              <Bell size={15} className="text-[#64748B]"/>`,
  `<button onClick={() => toast.info("You have 4 unread notifications")} className="relative w-9 h-9 bg-white rounded-xl border border-[#E5F4F7] shadow-sm flex items-center justify-center hover:border-[#C8E8F2] transition-colors cursor-pointer">
              <Bell size={15} className="text-[#64748B]"/>`
);

// ── Users Add User (line ~1434) ──────────────────────────────────────────────
src = src.replace(
  `<button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex-shrink-0 shadow-sm">
            <Plus size={14} /> Add User`,
  `<button onClick={() => toast.success("Add User form coming soon")} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex-shrink-0 shadow-sm">
            <Plus size={14} /> Add User`
);

// ── Users Export (line ~1516) ────────────────────────────────────────────────
src = src.replace(
  `<button className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E5F4F7] bg-white text-[13px] font-medium text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer">
              <Download size={13} /> Export`,
  `<button onClick={() => toast.success("Exporting users as CSV…")} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E5F4F7] bg-white text-[13px] font-medium text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer">
              <Download size={13} /> Export`
);

// ── AI Refresh (line ~2830) ──────────────────────────────────────────────────
src = src.replace(
  `<button className="flex items-center gap-1.5 text-[11.5px] font-mono text-[#94A3B8] hover:text-[#06B6D4] transition-colors cursor-pointer">
                <RefreshCw size={11} /> Refresh`,
  `<button onClick={() => toast.success("Model requests refreshed")} className="flex items-center gap-1.5 text-[11.5px] font-mono text-[#94A3B8] hover:text-[#06B6D4] transition-colors cursor-pointer">
                <RefreshCw size={11} /> Refresh`
);

// ── Logs Export Logs (line ~2961) ────────────────────────────────────────────
src = src.replace(
  `<button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12.5px] font-medium text-[#374151] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer shadow-sm">
              <Upload size={13} />Export Logs`,
  `<button onClick={() => toast.success("Exporting logs as CSV…")} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12.5px] font-medium text-[#374151] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer shadow-sm">
              <Upload size={13} />Export Logs`
);

// ── Logs Columns (line ~3065) ────────────────────────────────────────────────
src = src.replace(
  `<button className="flex items-center gap-1.5 mr-3 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[#475569] hover:bg-[#F5FEFF] hover:text-[#06B6D4] cursor-pointer flex-shrink-0 transition-colors">
                  <Hash size={12}/>Columns`,
  `<button onClick={() => toast.info("Column customisation coming soon")} className="flex items-center gap-1.5 mr-3 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[#475569] hover:bg-[#F5FEFF] hover:text-[#06B6D4] cursor-pointer flex-shrink-0 transition-colors">
                  <Hash size={12}/>Columns`
);

// ── Logs View Full Report (line ~3229) ───────────────────────────────────────
src = src.replace(
  `<button className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors flex items-center gap-0.5">
                    View Full Report<ArrowRight size={10}/>`,
  `<button onClick={() => toast.info("Full hours report coming soon")} className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors flex items-center gap-0.5">
                    View Full Report<ArrowRight size={10}/>`
);

// ── Settings Save Changes (Platform Identity) — line ~3461 ───────────────────
// First Save Changes
src = src.replace(
  `              <Btn>Save Changes</Btn>
            </div>
          </Card>
          <Card className="p-6">
            <SectionHeader title="Localization"`,
  `              <Btn onClick={() => toast.success("Platform settings saved")}>Save Changes</Btn>
            </div>
          </Card>
          <Card className="p-6">
            <SectionHeader title="Localization"`
);
// Second Save Changes (Localization)
src = src.replace(
  `              <Btn>Save Changes</Btn>
            </div>
          </Card>
        </div>`,
  `              <Btn onClick={() => toast.success("Localisation settings saved")}>Save Changes</Btn>
            </div>
          </Card>
        </div>`
);

// ── Settings Save Upload Settings ────────────────────────────────────────────
src = src.replace(
  `<Btn icon={Upload}>Save Upload Settings</Btn>`,
  `<Btn icon={Upload} onClick={() => toast.success("Upload settings saved")}>Save Upload Settings</Btn>`
);

// ── Settings Save Billing Settings ───────────────────────────────────────────
src = src.replace(
  `<Btn icon={CreditCard}>Save Billing Settings</Btn>`,
  `<Btn icon={CreditCard} onClick={() => toast.success("Billing settings saved")}>Save Billing Settings</Btn>`
);

// ── Settings Danger Zone buttons ─────────────────────────────────────────────
src = src.replace(
  `<Btn icon={Wrench} variant="secondary" danger>Rebuild Search Indexes</Btn>`,
  `<Btn icon={Wrench} variant="secondary" danger onClick={() => toast.success("Rebuilding search indexes…")}>Rebuild Search Indexes</Btn>`
);
src = src.replace(
  `<Btn icon={Database} variant="secondary" danger>Flush Cache</Btn>`,
  `<Btn icon={Database} variant="secondary" danger onClick={() => toast.success("Cache flushed successfully")}>Flush Cache</Btn>`
);
src = src.replace(
  `<Btn icon={RefreshCw} variant="secondary" danger>Force Sync Storage</Btn>`,
  `<Btn icon={RefreshCw} variant="secondary" danger onClick={() => toast.success("Storage sync initiated")}>Force Sync Storage</Btn>`
);

// ── Make sure Btn accepts icon prop ──────────────────────────────────────────
// Check if icon prop already in Btn signature
if (!src.includes('icon?: React.ElementType')) {
  src = src.replace(
    `  children: React.ReactNode; variant?: "primary"|"secondary"|"ghost"; size?: "sm"|"md"; danger?: boolean; onClick?: () => void`,
    `  children: React.ReactNode; variant?: "primary"|"secondary"|"ghost"; size?: "sm"|"md"; danger?: boolean; onClick?: () => void; icon?: React.ElementType`
  );
  src = src.replace(
    `function Btn({ children, variant = "primary", size = "sm", danger = false, onClick }: {`,
    `function Btn({ children, variant = "primary", size = "sm", danger = false, onClick, icon: Icon }: {`
  );
  // Render icon inside button if present
  src = src.replace(
    `  return <button className={cls} onClick={onClick}>`,
    `  return <button className={cls} onClick={onClick}>{Icon && <Icon size={13} />}`
  );
  // But we need to keep children too - let's do it properly
  src = src.replace(
    `  return <button className={cls} onClick={onClick}>{Icon && <Icon size={13} />}`,
    `  return <button className={cls} onClick={onClick}>{Icon && <Icon size={13} className="mr-1.5 -ml-0.5 inline" />}`
  );
}

fs.writeFileSync('/workspaces/default/code/src/app/App.tsx', src, 'utf8');

const open = (src.match(/{/g)||[]).length;
const close = (src.match(/}/g)||[]).length;
const toastCount = (src.match(/toast\.(success|info|error)/g)||[]).length;
console.log('Done. Lines:', src.split('\n').length);
console.log('Brace diff:', open - close, open === close ? '✓' : '✗');
console.log('Toast calls total:', toastCount);
