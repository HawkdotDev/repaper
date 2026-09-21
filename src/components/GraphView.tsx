import React from 'react'

export interface GraphViewProps {
  workspacePath?: string
  onNodeClick?: (nodeId: string) => void
  onClose?: () => void
}

function GraphViewComponent(props: GraphViewProps): React.JSX.Element {
  void props
  return (
    <div className="graph-coming-soon-view">
      <span className="graph-coming-soon-text">Coming Soon</span>
    </div>
  )
}

export default React.memo(GraphViewComponent)
