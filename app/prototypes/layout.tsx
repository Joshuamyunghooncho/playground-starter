// Prototypes render full-window inside `ToolShell`, whose toolbar holds the
// back-to-gallery link and theme toggle. /p/<slug> renders the same component
// (the shell hides the back link there).
export default function PrototypesLayout({ children }: LayoutProps<"/prototypes">) {
  return children
}
