import { cp, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

// Copy the desktop-mode Vite renderer into the Electron app's packaged files.
const desktop = path.resolve(import.meta.dir, "..");
const source = path.resolve(desktop, "../web/dist");
const destination = path.join(desktop, "web-dist");
const html = await readFile(path.join(source, "index.html"), "utf8");
if (!html.includes("./assets/")) throw new Error("Renderer must use relative assets; build with --mode desktop.");
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
console.log("Packaged local renderer:", destination);