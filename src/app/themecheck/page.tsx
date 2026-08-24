// TEMPORARY. Renders the board preview on its own so the theme can be
// screenshotted without signing in. Delete once the palette is settled.
import { BoardPreview } from "../(marketing)/_components/board-preview";

export default function ThemeCheck() {
  return (
    <div className="min-h-screen bg-[var(--nav-bg)] p-10">
      <BoardPreview />
    </div>
  );
}
