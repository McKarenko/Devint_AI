import { WorkspaceHomeButton } from "./workspace-home-button"
import { WorkspaceIsland } from "./workspace-island"

import "./workspace.css"

/**
 * Верхняя шапка рабочего экрана на всю ширину.
 * Три зоны: слева действия, в центре место под выступ (и под вырез телефона), справа резерв.
 * Левая зона отдана только нашим кнопкам.
 */
function WorkspaceHeader() {
  return (
    <header className="workspace-header">
      <div className="workspace-header-plate" aria-hidden="true">
        <WorkspaceIsland />
      </div>
      <div className="workspace-header-actions">
        <WorkspaceHomeButton />
      </div>
      <div className="workspace-header-center" aria-hidden="true" />
      <div className="workspace-header-reserve" aria-hidden="true" />
    </header>
  )
}

export { WorkspaceHeader }
