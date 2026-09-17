import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when user has scrolled down past 350px
      if (window.scrollY > 350) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      title="Scroll to top"
      className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#ff4d4f] text-white shadow-[0_4px_18px_rgba(255,77,79,0.38)] transition-all duration-300 hover:bg-[#e03b40] hover:shadow-[0_6px_24px_rgba(255,77,79,0.5)] active:scale-95 cursor-pointer group ${
        visible
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : "opacity-0 scale-75 translate-y-4 pointer-events-none"
      }`}
    >
      <ChevronUp size={22} strokeWidth={2.6} className="transition-transform duration-200 group-hover:-translate-y-0.5" />
    </button>
  );
}



