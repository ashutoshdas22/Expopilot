import { THEME_STORAGE_KEY } from "./theme-provider";

export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
