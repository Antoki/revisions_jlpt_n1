export const THEME_STORAGE_KEY = "jlpt-theme";

export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var d=window.matchMedia("(prefers-color-scheme: dark)").matches;if(t==="dark"||(!t&&d))document.documentElement.classList.add("dark");}catch(e){}})();`;
