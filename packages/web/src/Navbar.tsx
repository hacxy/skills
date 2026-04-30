import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const LANG_OPTIONS = [
  { value: "zh-CN", label: "中文" },
  { value: "en", label: "English" },
];

interface NavbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLogoClick: () => void;
  showBack?: boolean;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}

export function Navbar({ theme, onToggleTheme, onLogoClick, showBack, onBack, rightSlot }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLang = LANG_OPTIONS.find((o) => o.value === i18n.language) ?? LANG_OPTIONS[0];

  function selectLang(value: string) {
    i18n.changeLanguage(value);
    setOpen(false);
  }

  return (
    <nav className="app-nav">
      <button className="app-nav-logo" onClick={onLogoClick}>
        <Icon icon="lucide:zap" width="18" height="18" color="#6366f1" />
        <span>Skills</span>
      </button>

      {showBack && (
        <motion.button
          className="back-btn"
          onClick={onBack}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Icon icon="lucide:arrow-left" width="15" height="15" />
          {t("nav.backToList")}
        </motion.button>
      )}

      <div className="app-nav-right">
        {rightSlot}

        {/* Language dropdown */}
        <div className="lang-dropdown" ref={menuRef}>
          <button className="lang-toggle" onClick={() => setOpen((v) => !v)}>
            <Icon icon="lucide:globe" width="14" height="14" />
            <span>{currentLang.label}</span>
            <Icon icon="lucide:chevron-down" width="12" height="12" className={open ? "chevron-open" : ""} />
          </button>
          {open && (
            <>
              <div className="lang-backdrop" onClick={() => setOpen(false)} />
              <div className="lang-menu">
                {LANG_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`lang-menu-item${opt.value === i18n.language ? " active" : ""}`}
                    onClick={() => selectLang(opt.value)}
                  >
                    {opt.value === i18n.language && (
                      <Icon icon="lucide:check" width="13" height="13" className="lang-check" />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={theme === "dark" ? t("nav.toggleLight") : t("nav.toggleDark")}
        >
          <Icon icon={theme === "dark" ? "lucide:sun" : "lucide:moon"} width="16" height="16" />
        </button>
        <a
          href="https://github.com/hacxy/skills"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link"
        >
          <Icon icon="mdi:github" width="18" height="18" />
        </a>
      </div>
    </nav>
  );
}
