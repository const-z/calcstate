export interface Node {
  id: string | number;
  type: string;
  label: string;
  level?: number;
  state?: number;
  x?: number;
  y?: number;
}

export interface ArangoNode extends Node {
  _id: string;
  _key: string;
  _rev: string;
}

export interface Link {
  id: number;
  from: number;
  to: number;
  weight?: number;
  cluster?: string | null;
}

export interface ArangoLink extends Link {
  _id: string;
  _from: string;
  _key: string;
  _rev: string;
  _to: string;
}
export interface DataScheme {
  nodes: Node[];
  links: Link[];
}

export interface AffectsNode extends Node {
  weight: number;
  link: Link;
  threshold?: number;
}

export class CalcStateService {
  static calcNode(node: Node, data: DataScheme): number {
    if (node.type === 'incident') {
      return node.level;
    } else if (node.type === 'asset') {
      if (node.state) {
        return node.state;
      }
      const linksToNode = data.links.filter((l) => l.to === node.id);
      const states = [];
      for (const link of linksToNode) {
        const fromNode = data.nodes.find((n) => n.id === link.from);
        const nodeState = this.calcNode(fromNode, data);
        states.push({
          state: nodeState,
          weight: link.weight === undefined ? 1 : link.weight,
        });
      }
      return (
        1 - states.reduce((p, { state, weight }) => p * (1 - state * weight), 1)
      );
    }
  }
}
