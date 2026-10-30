import { WorkspaceHomeButton } from "./workspace-home-button"
import { WorkspaceIsland } from "./workspace-island"

import "./workspace.css"

/** Верхняя шапка рабочего экрана. Пластина отдельно от кнопок, чтобы её рост их не растягивал. */
function WorkspaceHeader() {
  return (
    <header className="workspace-header">
      <div className="workspace-header-plate" aria-hidden="true" />
      <WorkspaceHomeButton />
      <WorkspaceIsland />
    </header>
  )
}

export { WorkspaceHeader }
